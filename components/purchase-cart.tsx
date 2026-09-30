"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Package, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { materialsCatalog } from "@/lib/mock-data";
import { createPurchaseRequestBatch } from "@/lib/purchase-storage";

const missingMaterials = materialsCatalog.filter((item) => item.quantity < item.minimum);

export default function PurchaseCart() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState<{ batchId: string; items: string[] } | null>(null);
  const categories = [...new Set(missingMaterials.map((item) => item.category))].sort((first, second) => first.localeCompare(second, "pt-BR"));
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filteredMaterials = missingMaterials.filter((item) => {
    const searchable = `${item.name} ${item.code} ${item.category} ${item.specification}`.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return searchable.includes(normalizedSearch) && (category === "Todas" || item.category === category);
  });
  const cartItems = Object.entries(cart).flatMap(([code, quantity]) => {
    const item = missingMaterials.find((material) => material.code === code);
    return item ? [{ item, quantity }] : [];
  });
  const totalUnits = cartItems.reduce((total, entry) => total + entry.quantity, 0);

  function addToCart(code: string) {
    const item = missingMaterials.find((material) => material.code === code);
    if (!item) return;
    setCart((current) => ({ ...current, [code]: current[code] ?? Math.max(item.minimum - item.quantity, 1) }));
  }

  function removeFromCart(code: string) {
    setCart((current) => {
      const next = { ...current };
      delete next[code];
      return next;
    });
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cartItems.length) return;
    const items = cartItems.map(({ item, quantity }) => ({ material: item.name, code: item.code, quantity, unit: item.unit }));
    const batchId = createPurchaseRequestBatch({
      items,
      requester: "Carlos Silva",
      sector: "Almoxarifado - Planta 01",
      reason: reason.trim(),
    });
    setSubmitted({ batchId, items: items.map((item) => `${item.material} · ${item.quantity} ${item.unit}`) });
  }

  if (submitted) return <section className="mx-auto max-w-3xl rounded-lg border border-emerald-200 bg-white p-6 shadow-sm sm:p-9">
    <div className="flex flex-col items-center text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Check size={24}/></span><p className="mt-4 text-[11px] font-bold uppercase tracking-[.14em] text-emerald-700">Setor de Compras</p><h1 className="mt-2 text-2xl font-bold text-slate-900">Pedido de reposição enviado</h1><p className="mt-2 text-sm text-slate-500">{submitted.items.length} {submitted.items.length === 1 ? "produto incluído" : "produtos incluídos"} no mesmo pedido.</p><p className="mt-4 rounded-md bg-slate-50 px-3 py-2 font-mono text-xs font-semibold text-slate-700">{submitted.batchId}</p></div>
    <ul className="mt-6 divide-y divide-slate-100 border-y border-slate-100">{submitted.items.map((item) => <li key={item} className="py-3 text-sm text-slate-700">{item}</li>)}</ul>
    <div className="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row"><Link href="/inventario" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Voltar ao inventário</Link><button type="button" onClick={() => { setSubmitted(null); setCart({}); setReason(""); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">Novo carrinho <ShoppingCart size={16}/></button></div>
  </section>;

  return <>
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.13em] text-emerald-700">Operação · Almoxarifado</p><h1 className="text-[27px] font-semibold text-slate-900 sm:text-[30px]">Carrinho de compras</h1><p className="mt-2 text-sm leading-6 text-slate-500">Reúna produtos faltantes do estoque em um pedido para o setor de Compras.</p></div><Link href="/inventario" className="text-xs font-semibold text-[#0B57D0] hover:underline">Ver inventário completo</Link></div>
    <form onSubmit={submitRequest} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.8fr)]">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-[#102238] p-5 text-white sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-bold">Produtos para reposição</h2><p className="mt-1 text-xs text-slate-300">Itens abaixo do estoque mínimo, incluindo os sem saldo.</p></div><span className="inline-flex items-center gap-2 rounded-full bg-amber-300/15 px-3 py-1.5 text-xs font-bold text-amber-100"><AlertTriangle size={14}/>{missingMaterials.length} {missingMaterials.length === 1 ? "produto crítico" : "produtos críticos"}</span></div><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(190px,.7fr)]"><label className="flex h-11 items-center gap-2 rounded-lg border border-white/20 bg-white px-3 text-slate-500"><Search size={16}/><span className="sr-only">Buscar produto faltante</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou código" className="min-w-0 flex-1 bg-transparent text-xs text-slate-900 outline-none"/></label><select aria-label="Filtrar por categoria" value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"><option>Todas</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div></div>
        <div className="space-y-2 bg-slate-100/70 p-3">{filteredMaterials.length ? filteredMaterials.map((item) => {
          const quantity = cart[item.code];
          const status = item.quantity <= 0 ? "Sem saldo" : "Abaixo do mínimo";
          return <article key={item.code} className={`grid gap-3 rounded-lg border p-4 transition sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${quantity ? "border-emerald-300 bg-emerald-50/70" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-900">{item.name}</p><span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${item.quantity <= 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>{status}</span></div><p className="mt-1 text-xs text-slate-500">{item.code} · {item.category}</p><p className="mt-2 text-xs text-slate-600">Disponível: <strong>{item.quantity} {item.unit}</strong><span className="mx-2 text-slate-300">|</span>Mínimo: <strong>{item.minimum} {item.unit}</strong></p></div>
            <button type="button" onClick={() => quantity === undefined ? addToCart(item.code) : removeFromCart(item.code)} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition ${quantity ? "border border-emerald-200 bg-white text-emerald-800 hover:bg-rose-50 hover:text-rose-700" : "bg-emerald-700 text-white hover:bg-emerald-800"}`}>{quantity ? <><Check size={15}/>No carrinho</> : <><Plus size={15}/>Adicionar</>}</button>
          </article>;
        }) : <div className="py-12 text-center text-sm text-slate-500"><Package size={24} className="mx-auto mb-2 text-slate-400"/>{missingMaterials.length ? "Nenhum produto encontrado com esses filtros." : "Não há produtos abaixo do estoque mínimo."}</div>}</div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><ShoppingCart size={18}/></span><div><h2 className="text-sm font-bold text-slate-900">Seu carrinho</h2><p className="mt-1 text-xs text-slate-500">{cartItems.length} {cartItems.length === 1 ? "produto" : "produtos"} · {totalUnits} unidades</p></div></div><span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-emerald-50 px-2 text-xs font-bold text-emerald-800">{cartItems.length}</span></div>
        {cartItems.length ? <ul className="mt-4 divide-y divide-slate-100">{cartItems.map(({ item, quantity }) => <li key={item.code} className="flex items-start justify-between gap-3 py-3"><div className="min-w-0"><p className="text-xs font-semibold leading-5 text-slate-800">{item.name}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{item.code} · saldo {item.quantity} {item.unit}</p><label className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-slate-600">Quantidade para compra<input aria-label={`Quantidade de ${item.name}`} type="number" min={1} value={quantity} onChange={(event) => setCart((current) => ({ ...current, [item.code]: Math.max(1, Number(event.target.value) || 1) }))} className="h-9 w-20 rounded-md border border-slate-300 bg-white px-2 text-center text-sm text-slate-900"/></label></div><button type="button" aria-label={`Remover ${item.name}`} onClick={() => removeFromCart(item.code)} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={16}/></button></li>)}</ul> : <div className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center"><ShoppingCart size={23} className="mx-auto text-slate-300"/><p className="mt-3 text-xs font-semibold text-slate-700">Carrinho vazio</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Adicione produtos críticos da lista para montar a reposição.</p></div>}
        <label className="mt-4 block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Motivo da compra *</span><textarea required rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex.: reposição de estoque para manter a operação." className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm text-slate-800"/></label>
        <div className="mt-4 border-t border-slate-100 pt-4"><button type="submit" disabled={!cartItems.length} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"><ShoppingCart size={16}/>Enviar pedido para Compras</button><p className="mt-3 text-center text-[11px] text-slate-400">Solicitante: Carlos Silva · Almoxarifado</p></div>
      </section>
    </form>
  </>;
}