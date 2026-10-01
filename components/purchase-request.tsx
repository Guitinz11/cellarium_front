"use client";

import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Plus, ShoppingCart, Trash2, X } from "lucide-react";
import AutomaticPurchaseRequest from "@/components/automatic-purchase-request";
import { createPurchaseRequestBatch } from "@/lib/purchase-storage";
import { useDialogAccessibility } from "@/components/use-dialog-accessibility";

interface PurchaseRequestProps {
  requestId?: string;
  sector?: string;
}

interface CartItem {
  id: string;
  material: string;
  code: string;
  unit: string;
  quantity: number;
}

export default function PurchaseRequest({ requestId, sector }: PurchaseRequestProps) {
  const [open, setOpen] = useState(false);
  const [material, setMaterial] = useState("");
  const [code, setCode] = useState("");
  const [unit, setUnit] = useState("un.");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  useDialogAccessibility(open, close);

  function addToCart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const item = { material: material.trim(), code: code.trim(), unit: unit.trim(), quantity: Number(quantity) };
    const itemId = item.code.toLocaleLowerCase("pt-BR") || item.material.toLocaleLowerCase("pt-BR");
    setCart((current) => {
      const existingIndex = current.findIndex((entry) => (entry.code.toLocaleLowerCase("pt-BR") || entry.material.toLocaleLowerCase("pt-BR")) === itemId);
      if (existingIndex < 0) return [...current, { ...item, id: `${itemId}-${Date.now()}` }];
      return current.map((entry, index) => index === existingIndex ? { ...entry, quantity: entry.quantity + item.quantity } : entry);
    });
    setMaterial("");
    setCode("");
    setUnit("un.");
    setQuantity("1");
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.length) return;
    createPurchaseRequestBatch({ items: cart, requestId, sector, reason: reason.trim() });
    setSubmitted(true);
  }

  function close() {
    setOpen(false);
    if (submitted) {
      setSubmitted(false);
      setCart([]);
      setReason("");
    }
  }

  if (requestId) return <AutomaticPurchaseRequest requestId={requestId} sector={sector}/>;

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:ring-2"><ShoppingCart size={16}/>Requisitar material para Compras</button>
    {open && createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section role="dialog" aria-modal="true" aria-labelledby="purchase-request-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Setor de Compras{sector ? ` · ${sector}` : ""}</p><h2 id="purchase-request-title" className="mt-1 text-lg font-bold text-slate-900">Carrinho de requisição</h2>{requestId && <p className="mt-1 text-xs text-slate-500">Solicitação vinculada à OS {requestId}.</p>}</div><button type="button" aria-label="Fechar" onClick={close} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button></div>
      {submitted ? <div role="status" className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Requisição com {cart.length} {cart.length === 1 ? "produto enviada" : "produtos enviada"} ao setor de Compras.</div> : <>
        <form onSubmit={addToCart} className="mt-5 space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Nome do material</span><input required autoFocus value={material} onChange={(event) => setMaterial(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800" placeholder="Ex.: Parafuso sextavado"/></label>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_110px_110px]"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Código</span><input value={code} onChange={(event) => setCode(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" placeholder="Opcional"/></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Unidade</span><input required value={unit} onChange={(event) => setUnit(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" placeholder="un."/></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Quantidade</span><input required min="1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm"/></label><button type="submit" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-brand hover:bg-blue-50"><Plus size={16}/>Adicionar</button></div>
        </form>

        <section aria-label="Produtos no carrinho" className="mt-6"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><ShoppingCart size={16}/>Produtos no carrinho <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-brand">{cart.length}</span></h3>{cart.length ? <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">{cart.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{item.material}</p><p className="mt-1 text-xs text-slate-500">{item.code && `${item.code} · `}{item.quantity} {item.unit}</p></div><button type="button" aria-label={`Remover ${item.material} do carrinho`} onClick={() => setCart((current) => current.filter((entry) => entry.id !== item.id))} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={16}/></button></li>)}</ul> : <p className="mt-3 rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">Adicione um ou mais produtos à requisição.</p>}</section>

        <form onSubmit={submitRequest} className="mt-5 space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Justificativa da requisição</span><textarea required rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className="w-full rounded-lg border border-slate-200 p-3 text-sm" placeholder="Descreva por que esses materiais são necessários."/></label><div className="flex justify-end border-t border-slate-100 pt-4"><button type="submit" disabled={!cart.length} className="min-h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50">Enviar requisição ({cart.length})</button></div></form>
      </>}
      {submitted && <div className="mt-5 flex justify-end"><button type="button" onClick={close} className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Concluir</button></div>}
    </section></div>, document.body)}
  </>;
}
