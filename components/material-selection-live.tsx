"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { ArrowRight, Package, Search } from "lucide-react";
import { ApiError, listMaterials, listStock, type ApiMaterial, type ApiStockItem } from "@/lib/warehouse-api";

 type CatalogRow = ApiMaterial & { saldo: number; minimo: number; unidade: string; categoria: string };

export default function MaterialSelectionLive() {
  const [materials, setMaterials] = useState<ApiMaterial[]>([]);
  const [stock, setStock] = useState<ApiStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const [materialRows, stockResult] = await Promise.all([
        listMaterials({ limit: 200 }),
        listStock({ limit: 100 }),
      ]);
      setMaterials(materialRows);
      setStock(stockResult.dados);
    } catch (cause) {
      setMaterials([]);
      setStock([]);
      setError(cause instanceof ApiError ? cause.message : "Não foi possível consultar o catálogo do banco.");
    } finally {
      setLoading(false);
    }
  }

  const reloadEvent = useEffectEvent(reload);
  useEffect(() => {
    const timer = window.setTimeout(() => void reloadEvent(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const catalog = useMemo<CatalogRow[]>(() => materials.map((material) => {
    const balance = stock.find((entry) => entry.material_id === material.id);
    return {
      ...material,
      saldo: balance?.estoque_atual ?? 0,
      minimo: balance?.estoque_minimo ?? 0,
      unidade: balance?.unidade ?? "",
      categoria: balance?.categoria ?? "",
    };
  }), [materials, stock]);

  const categories = [...new Set(catalog.map((item) => item.categoria).filter(Boolean))];
  const normalizedQuery = search.trim().toLocaleLowerCase("pt-BR");
  const visible = catalog.filter((item) => `${item.descricao} ${item.codigo} ${item.categoria}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  const selected = Object.entries(quantities).filter(([id, quantity]) => Number(quantity) > 0 && catalog.some((item) => item.id === Number(id)));
  const requestParams = new URLSearchParams();
  selected.forEach(([id, quantity]) => { requestParams.append("material", id); requestParams.append("qty", String(quantity)); });

  return <div className="space-y-5">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="ui-eyebrow">Requisição · Materiais</p><h1 className="text-2xl font-semibold text-slate-900">Catálogo do almoxarifado</h1><p className="mt-2 text-sm text-slate-500">Materiais e saldos consultados diretamente no banco.</p></div><span className="text-xs text-slate-500">{catalog.length} materiais</span></header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><span>{error}</span><button type="button" onClick={() => void reload()} className="font-semibold underline">Tentar novamente</button></div>}
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5"><div><h2 className="text-sm font-semibold text-slate-900">Materiais cadastrados</h2><p className="mt-1 text-xs text-slate-500">{categories.length} categorias no resultado atual</p></div><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar materiais" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs text-slate-700 outline-none sm:w-64" placeholder="Nome ou código"/></label></div>
      {loading ? <p role="status" className="border-t border-slate-100 p-6 text-sm text-slate-500">Carregando materiais e saldos…</p> : visible.length ? <ul className="divide-y divide-slate-100">{visible.map((item) => {
        const selectedQuantity = quantities[item.id] ?? 0;
        const available = item.saldo > 0;
        return <li key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-600"><Package size={17}/></span><div className="min-w-0"><p className="text-sm font-semibold text-slate-900">{item.descricao}</p><p className="mt-1 text-[11px] text-slate-500">{item.codigo}{item.categoria ? ` · ${item.categoria}` : ""}</p><p className="mt-1 text-xs text-slate-600">Saldo: {item.saldo} {item.unidade} · Mínimo: {item.minimo} {item.unidade}</p></div></div><div className="flex items-center justify-between gap-3 pl-12 sm:justify-end sm:pl-0"><span className={`text-[11px] font-semibold ${available ? "text-emerald-700" : "text-slate-500"}`}>{available ? "Disponível" : "Sem saldo"}</span>{selectedQuantity ? <div className="flex h-10 items-center rounded-md border border-slate-300"><button type="button" aria-label={`Diminuir ${item.descricao}`} onClick={() => setQuantities((current) => ({ ...current, [item.id]: Math.max(0, selectedQuantity - 1) }))} className="h-10 w-10 text-lg text-slate-700">−</button><output className="min-w-8 text-center text-sm font-semibold tabular-nums">{selectedQuantity}</output><button type="button" aria-label={`Aumentar ${item.descricao}`} disabled={selectedQuantity >= item.saldo} onClick={() => setQuantities((current) => ({ ...current, [item.id]: Math.min(item.saldo, selectedQuantity + 1) }))} className="h-10 w-10 text-lg text-slate-700 disabled:opacity-40">+</button></div> : <button type="button" disabled={!available} onClick={() => setQuantities((current) => ({ ...current, [item.id]: 1 }))} className="min-h-10 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Selecionar</button>}</div></li>;
      })}</ul> : <div className="border-t border-slate-100 p-8 text-center"><Package size={25} className="mx-auto text-slate-400"/><p className="mt-3 text-sm font-semibold text-slate-800">{error ? "Catálogo indisponível" : "Nenhum material encontrado"}</p><p className="mt-1 text-xs text-slate-500">{error ? "Confira a API, sua sessão e o banco de dados." : "O banco não retornou materiais para esta busca."}</p></div>}
    </section>
    {selected.length > 0 && <aside className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-lg"><p className="text-sm text-slate-700"><strong>{selected.length}</strong> {selected.length === 1 ? "material selecionado" : "materiais selecionados"}</p><Link href={`/pedido?${requestParams.toString()}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Continuar<ArrowRight size={15}/></Link></aside>}
  </div>;
}
