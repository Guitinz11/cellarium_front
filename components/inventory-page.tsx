"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Check, Package, PackageCheck, Search, ShoppingCart, Truck } from "lucide-react";
import { stock } from "@/lib/mock-data";
import { getInventoryItems, type InventoryItem } from "@/lib/inventory-storage";
import { getPurchaseRequests, receivePurchaseBatch, type PurchaseRequestRecord } from "@/lib/purchase-storage";

type StockFilter = "Todos" | "Disponível" | "Crítico" | "Indisponível";

function getStockStatus(item: InventoryItem): Exclude<StockFilter, "Todos"> {
  if (item.quantity <= 0) return "Indisponível";
  if (item.quantity < item.minimum) return "Crítico";
  return "Disponível";
}

export default function InventoryScreen() {
  const [materials, setMaterials] = useState<InventoryItem[]>(stock);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequestRecord[]>([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("Todos");
  const [view, setView] = useState<"inventory" | "incoming">("inventory");
  const [receiptMessage, setReceiptMessage] = useState("");

  useEffect(() => {
    const syncLocalData = () => {
      setMaterials(getInventoryItems());
      setPurchaseRequests(getPurchaseRequests());
    };
    syncLocalData();
    window.addEventListener("storage", syncLocalData);
    window.addEventListener("cellarium-inventory-updated", syncLocalData);
    window.addEventListener("cellarium-purchase-requests-updated", syncLocalData);
    return () => {
      window.removeEventListener("storage", syncLocalData);
      window.removeEventListener("cellarium-inventory-updated", syncLocalData);
      window.removeEventListener("cellarium-purchase-requests-updated", syncLocalData);
    };
  }, []);

  const incomingBatches = [...purchaseRequests.filter((request) => request.status === "Pendente")
    .reduce((batches, request) => batches.set(request.batchId, [...(batches.get(request.batchId) ?? []), request]), new Map<string, PurchaseRequestRecord[]>())]
    .map(([batchId, items]) => ({ batchId, items }));
  const filteredStock = materials.filter((item) => {
    const matchesSearch = `${item.name} ${item.code}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"));
    return matchesSearch && (stockFilter === "Todos" || getStockStatus(item) === stockFilter);
  });
  const criticalCount = materials.filter((item) => getStockStatus(item) === "Crítico").length;
  const catalogCount = materials.length;
  const stockFilters: StockFilter[] = ["Todos", "Disponível", "Crítico", "Indisponível"];

  return <>
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.13em] text-[#0B57D0]">Controle de materiais</p>
        <h1 className="text-[27px] font-semibold text-slate-900 sm:text-[30px]">Inventário</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Consulte saldos e níveis de reposição dos materiais.</p>
      </div>
      <Link href="/compras" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong"><ShoppingCart size={16}/>Montar carrinho para Compras</Link>
    </div>

    <div className="mb-5 grid gap-4 sm:grid-cols-3">
      <Kpi label="Itens cadastrados" value={String(catalogCount)} note="itens demonstrativos" icon={<Package size={19}/>} />
      <Kpi label="Estoque crítico" value={String(criticalCount).padStart(2, "0")} note="requer atenção" icon={<Activity size={19}/>} />
      <Kpi label="Movimentações hoje" value="18" note="entradas e saídas" icon={<Truck size={19}/>} />
    </div>

    <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200" role="tablist" aria-label="Inventário e recebimentos">
      <button type="button" role="tab" aria-selected={view === "inventory"} onClick={() => setView("inventory")} className={`inline-flex min-h-10 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition ${view === "inventory" ? "border-[#0B57D0] text-[#0B57D0]" : "border-transparent text-slate-500 hover:text-slate-800"}`}><Package size={15}/>Inventário</button>
      <button type="button" role="tab" aria-selected={view === "incoming"} onClick={() => { setView("incoming"); setReceiptMessage(""); }} className={`inline-flex min-h-10 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition ${view === "incoming" ? "border-[#0B57D0] text-[#0B57D0]" : "border-transparent text-slate-500 hover:text-slate-800"}`}><Truck size={15}/>A receber<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] tabular-nums text-slate-600">{incomingBatches.length}</span></button>
    </div>
    {receiptMessage && <p role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800"><Check size={15}/>{receiptMessage}</p>}

    {view === "inventory" ? <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
        <div><h2 className="text-sm font-bold text-slate-900">Materiais em estoque</h2><p className="mt-1 text-xs text-slate-500">Saldos demonstrativos</p></div>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar material" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar material..." className="w-full bg-transparent text-xs outline-none sm:w-48"/></label>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3" role="group" aria-label="Filtrar materiais por situação do estoque">
        {stockFilters.map((filter) => {
          const count = filter === "Todos" ? materials.length : materials.filter((item) => getStockStatus(item) === filter).length;
          const selected = stockFilter === filter;
          return <button key={filter} type="button" aria-pressed={selected} onClick={() => setStockFilter(filter)} className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${selected ? "border-[#0B57D0] bg-blue-50 text-[#0B57D0]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {filter}<span className={`rounded px-1.5 py-0.5 text-[10px] tabular-nums ${selected ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>{count}</span>
          </button>;
        })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left">
          <thead><tr className="border-y border-slate-100 bg-slate-50 text-[10px] uppercase text-slate-500"><th className="px-5 py-3">Material</th><th className="px-4 py-3">Código</th><th className="px-4 py-3">Disponível</th><th className="px-4 py-3">Estoque mínimo</th><th className="px-4 py-3">Situação</th></tr></thead>
          <tbody>{filteredStock.map((item) => {
            const status = getStockStatus(item);
            const badge = status === "Crítico" ? "bg-rose-50 text-rose-700" : status === "Indisponível" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700";
            return <tr key={item.code} className="border-b border-slate-100 last:border-0">
              <td className="px-5 py-4 text-xs font-semibold text-slate-800">{item.name}</td>
              <td className="px-4 py-4 font-mono text-xs text-slate-500">{item.code}</td>
              <td className="px-4 py-4 text-xs font-semibold text-slate-700">{item.quantity} {item.unit}</td>
              <td className="px-4 py-4 text-xs text-slate-500">{item.minimum} {item.unit}</td>
              <td className="px-4 py-4"><span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${badge}`}>{status}</span></td>
            </tr>;
          })}</tbody>
        </table>
        {filteredStock.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">Nenhum material encontrado.</p>}
      </div>
    </section> : <section aria-label="Compras a receber" className="space-y-3">
      {incomingBatches.length ? incomingBatches.map(({ batchId, items }) => <article key={batchId} className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="font-mono text-xs font-bold text-[#0B57D0]">{batchId}</p><h2 className="mt-1 text-sm font-bold text-slate-900">Compra aguardando recebimento</h2><p className="mt-1 text-xs text-slate-500">{items[0].requester || "Almoxarifado"} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(items[0].createdAt))}</p></div><button type="button" onClick={() => { if (receivePurchaseBatch(batchId)) setReceiptMessage(`Recebimento ${batchId} registrado. O inventário foi atualizado.`); }} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"><PackageCheck size={15}/>Registrar recebimento</button></div>
        <ul className="mt-4 divide-y divide-slate-100 border-y border-slate-100">{items.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs"><span className="font-semibold text-slate-800">{item.material}<span className="ml-2 font-mono font-normal text-slate-500">{item.code}</span></span><span className="font-semibold tabular-nums text-slate-700">{item.quantity} {item.unit}</span></li>)}</ul>
      </article>) : <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><PackageCheck size={25} className="mx-auto text-slate-400"/><p className="mt-3 text-sm font-semibold text-slate-800">Nenhuma compra aguardando recebimento</p><p className="mt-1 text-xs text-slate-500">Pedidos para Compras aparecerão aqui.</p></div>}
    </section>}

  </>;
}

function Kpi({ label, value, note, icon }: { label: string; value: string; note: string; icon: React.ReactNode }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-[13px] font-medium text-slate-500">{label}</p><p className="mt-4 text-[32px] font-semibold leading-none text-slate-900">{value}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#0B57D0]">{icon}</span></div><p className="mt-4 text-xs text-slate-400">{note}</p></section>;
}
