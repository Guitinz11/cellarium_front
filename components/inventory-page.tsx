"use client";

import { useState } from "react";
import { Activity, Package, Plus, Search, Truck, X } from "lucide-react";
import { stock } from "@/lib/mock-data";

type InventoryItem = {
  name: string;
  code: string;
  quantity: number;
  minimum: number;
  unit: string;
};

type StockFilter = "Todos" | "Disponível" | "Crítico" | "Indisponível";

function getStockStatus(item: InventoryItem): Exclude<StockFilter, "Todos"> {
  if (item.quantity <= 0) return "Indisponível";
  if (item.quantity < item.minimum) return "Crítico";
  return "Disponível";
}

const inputClass = "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export default function InventoryScreen() {
  const [materials, setMaterials] = useState<InventoryItem[]>(stock);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("Todos");
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", quantity: "0", minimum: "0", unit: "un." });
  const [error, setError] = useState("");
  const filteredStock = materials.filter((item) => {
    const matchesSearch = `${item.name} ${item.code}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"));
    return matchesSearch && (stockFilter === "Todos" || getStockStatus(item) === stockFilter);
  });
  const criticalCount = materials.filter((item) => getStockStatus(item) === "Crítico").length;
  const catalogCount = materials.length;
  const stockFilters: StockFilter[] = ["Todos", "Disponível", "Crítico", "Indisponível"];

  function addMaterial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = form.code.trim().toLocaleUpperCase("pt-BR");
    if (materials.some((item) => item.code.toLocaleUpperCase("pt-BR") === code)) {
      setError("Já existe um material com esse código.");
      return;
    }

    setMaterials((current) => [...current, {
      name: form.name.trim(),
      code,
      quantity: Number(form.quantity),
      minimum: Number(form.minimum),
      unit: form.unit.trim(),
    }]);
    setSearch("");
    setForm({ name: "", code: "", quantity: "0", minimum: "0", unit: "un." });
    setError("");
    setIsAdding(false);
  }

  return <>
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.13em] text-[#0B57D0]">Controle de materiais</p>
        <h1 className="text-[27px] font-semibold text-slate-900 sm:text-[30px]">Inventário</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Consulte saldos e níveis de reposição dos materiais.</p>
      </div>
      <button type="button" onClick={() => { setError(""); setIsAdding(true); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:ring-2">
        <Plus size={16}/>Adicionar material
      </button>
    </div>

    <div className="mb-5 grid gap-4 sm:grid-cols-3">
      <Kpi label="Itens cadastrados" value={String(catalogCount)} note="itens demonstrativos" icon={<Package size={19}/>} />
      <Kpi label="Estoque crítico" value={String(criticalCount).padStart(2, "0")} note="requer atenção" icon={<Activity size={19}/>} />
      <Kpi label="Movimentações hoje" value="18" note="entradas e saídas" icon={<Truck size={19}/>} />
    </div>

    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
    </section>

    {isAdding && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsAdding(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="add-material-title" className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-[#0B57D0]">Inventário</p><h2 id="add-material-title" className="mt-1 text-lg font-bold text-slate-900">Adicionar material</h2></div><button type="button" aria-label="Fechar" onClick={() => setIsAdding(false)} className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100"><X size={18}/></button></div>
        <form onSubmit={addMaterial} className="mt-5 space-y-4">
          <Field label="Nome do material" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Ex.: Parafuso sextavado" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Código" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value }))} placeholder="Ex.: MAT-00483" required />
            <Field label="Unidade" value={form.unit} onChange={(value) => setForm((current) => ({ ...current, unit: value }))} placeholder="un." required />
            <Field label="Quantidade disponível" value={form.quantity} onChange={(value) => setForm((current) => ({ ...current, quantity: value }))} type="number" min="0" required />
            <Field label="Estoque mínimo" value={form.minimum} onChange={(value) => setForm((current) => ({ ...current, minimum: value }))} type="number" min="0" required />
          </div>
          {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setIsAdding(false)} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancelar</button><button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong"><Plus size={15}/>Adicionar</button></div>
        </form>
      </section>
    </div>}
  </>;
}

function Kpi({ label, value, note, icon }: { label: string; value: string; note: string; icon: React.ReactNode }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-[13px] font-medium text-slate-500">{label}</p><p className="mt-4 text-[32px] font-semibold leading-none text-slate-900">{value}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#0B57D0]">{icon}</span></div><p className="mt-4 text-xs text-slate-400">{note}</p></section>;
}

function Field({ label, value, onChange, placeholder, type = "text", min, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; min?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span><input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} min={min} required={required}/></label>;
}
