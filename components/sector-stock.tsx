"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Bell, Boxes, Check, Package, Search, Send } from "lucide-react";
import { sectors } from "@/lib/mock-data";

type SectorItem = {
  code: string;
  name: string;
  sector: string;
  quantity: number;
  minimum: number;
  unit: string;
};

type SectorMessage = {
  id: string;
  code: string;
  itemName: string;
  sector: string;
  text: string;
  createdAt: number;
};

type SectorStockData = { items: SectorItem[]; messages: SectorMessage[] };

const storageKey = "marcon-sector-stock-v1";
const initialData: SectorStockData = {
  items: [
    { code: "MAT-00482", name: "Rolamento 6204", sector: "Montagem e Pintura", quantity: 30, minimum: 8, unit: "un." },
    { code: "MAT-00136", name: "Filtro hidráulico HF-12", sector: "Montagem e Pintura", quantity: 4, minimum: 6, unit: "un." },
    { code: "MAT-00301", name: "Disco de corte 7″", sector: "Usinagem e Solda", quantity: 12, minimum: 5, unit: "un." },
    { code: "MAT-00620", name: "Fita isolante 20 m", sector: "Usinagem e Solda", quantity: 18, minimum: 10, unit: "un." },
  ],
  messages: [
    {
      id: "notice-initial",
      code: "MAT-00482",
      itemName: "Rolamento 6204",
      sector: "Montagem e Pintura",
      text: "O material já está disponível no estoque do seu setor.",
      createdAt: new Date("2026-09-25T11:30:00.000Z").getTime(),
    },
  ],
};

function parseSavedData(saved: string): SectorStockData {
  try {
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && "items" in parsed && "messages" in parsed && Array.isArray(parsed.items) && Array.isArray(parsed.messages)) {
        return parsed as SectorStockData;
      }
    }
  } catch {
    return initialData;
  }
  return initialData;
}

function subscribeToSectorStock(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("marcon-sector-stock-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("marcon-sector-stock-change", callback);
  };
}

function getSectorStockSnapshot() {
  return localStorage.getItem(storageKey) ?? "";
}

function getServerSectorStockSnapshot() {
  return "";
}

export default function SectorStockPage({ isWarehouse = false }: { isWarehouse?: boolean }) {
  const snapshot = useSyncExternalStore(subscribeToSectorStock, getSectorStockSnapshot, getServerSectorStockSnapshot);
  const [dataOverride, setDataOverride] = useState<SectorStockData | null>(null);
  const data = dataOverride ?? parseSavedData(snapshot);
  const [sector, setSector] = useState("Montagem e Pintura");
  const [search, setSearch] = useState("");
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [sentMessages, setSentMessages] = useState<string[]>([]);

  function updateData(update: (current: SectorStockData) => SectorStockData) {
    const next = update(data);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event("marcon-sector-stock-change"));
      setDataOverride(null);
    } catch {
      setDataOverride(next);
    }
  }

  const visibleItems = data.items.filter((item) => {
    const matchesSector = item.sector === sector;
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return matchesSector && `${item.name} ${item.code}`.toLocaleLowerCase("pt-BR").includes(query);
  });
  const sectorMessages = data.messages.filter((message) => message.sector === sector).slice().sort((a, b) => b.createdAt - a.createdAt);
  const totalUnits = visibleItems.reduce((total, item) => total + item.quantity, 0);
  const lowStockCount = visibleItems.filter((item) => item.quantity <= item.minimum).length;

  function adjustQuantity(code: string, change: number) {
    updateData((current) => ({
      ...current,
      items: current.items.map((item) => item.code === code
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item),
    }));
  }

  function sendAvailabilityMessage(item: SectorItem) {
    const message: SectorMessage = {
      id: `${item.code}-${Date.now()}`,
      code: item.code,
      itemName: item.name,
      sector: item.sector,
      text: `${item.name} já está disponível no estoque do setor. Saldo atual: ${item.quantity} ${item.unit}.`,
      createdAt: Date.now(),
    };
    updateData((current) => ({ ...current, messages: [message, ...current.messages] }));
    setSentMessages((current) => [...current, item.code]);
  }

  const heading = isWarehouse ? "Estoque dos setores" : "Estoque do meu setor";

  return (
    <>
      <div data-reveal className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-slate-500"><Boxes size={14} className="text-[#0B57D0]"/>Controle de materiais</p>
          <h1 className="text-3xl font-semibold text-slate-950">{heading}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Consulte os saldos locais, registre sobras e dê baixa nos materiais retirados.</p>
        </div>
        {isWarehouse && <label className="flex flex-col gap-1.5 text-[11px] font-semibold text-slate-500">Setor
          <select value={sector} onChange={(event) => setSector(event.target.value)} className="h-11 min-w-56 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800">
            {sectors.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>}
      </div>

      <div data-reveal-group className="mb-6 grid gap-4 border-y border-slate-200 py-4 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
        <div data-reveal-item className="px-3"><p className="text-xs font-medium text-slate-500">Materiais cadastrados</p><p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{visibleItems.length}</p></div>
        <div data-reveal-item className="px-3"><p className="text-xs font-medium text-slate-500">Unidades no setor</p><p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{totalUnits}</p></div>
        <div data-reveal-item className="px-3"><p className="text-xs font-medium text-slate-500">No nível mínimo ou abaixo</p><p className={`mt-1 text-2xl font-semibold tabular-nums ${lowStockCount ? "text-amber-800" : "text-emerald-800"}`}>{lowStockCount}</p></div>
      </div>

      <section aria-label="Avisos do almoxarifado" className="mb-7">
        <div className="mb-3 flex items-center gap-2"><Bell size={15} className="text-amber-700"/><h2 className="text-sm font-semibold text-slate-900">Avisos do almoxarifado</h2><span className="text-[11px] text-slate-400">{sectorMessages.length}</span></div>
        {sectorMessages.length ? <div className="divide-y divide-amber-200 border-y border-amber-200 bg-amber-50/70">
          {sectorMessages.slice(0, 3).map((message) => <div key={message.id} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800"><Package size={14}/></span>
            <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-900">{message.itemName} <span className="font-normal text-slate-500">· {message.code}</span></p><p className="mt-1 text-xs leading-5 text-slate-600">{message.text}</p></div>
            <time className="shrink-0 text-[10px] text-slate-500">{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(message.createdAt)}</time>
          </div>)}
        </div> : <p className="border-y border-slate-200 py-4 text-xs text-slate-500">Nenhum aviso para este setor.</p>}
      </section>

      <section aria-label="Materiais disponíveis no setor">
        <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><h2 className="text-sm font-semibold text-slate-900">Saldo por material</h2><p className="mt-1 text-xs text-slate-500">Ajuste o estoque conforme entradas e retiradas.</p></div>
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar material no estoque do setor" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar material" className="w-full bg-transparent text-xs text-slate-700 outline-none sm:w-48"/></label>
        </div>
        <div className="border-y border-slate-200">
          {visibleItems.length ? visibleItems.map((item) => {
            const amount = amounts[item.code] ?? 1;
            const low = item.quantity <= item.minimum;
            return <article key={item.code} className="grid gap-4 border-b border-slate-100 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="flex min-w-0 items-start gap-3 px-1">
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${low ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}><Package size={17}/></span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="text-sm font-semibold text-slate-900">{item.name}</h3><span className={`text-[10px] font-semibold ${low ? "text-amber-800" : "text-emerald-800"}`}>{low ? "Estoque baixo" : "Disponível"}</span></div><p className="mt-1 font-mono text-[10px] text-slate-500">{item.code} <span className="font-sans">· mínimo {item.minimum} {item.unit}</span></p></div>
                <p className="shrink-0 text-right"><span className="block text-xl font-semibold leading-none tabular-nums text-slate-950">{item.quantity}</span><span className="mt-1 block text-[10px] text-slate-500">{item.unit}</span></p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
                <label className="sr-only" htmlFor={`amount-${item.code}`}>Quantidade para ajuste de {item.name}</label>
                <input id={`amount-${item.code}`} type="number" min="1" max="9999" value={amount} onChange={(event) => setAmounts((current) => ({ ...current, [item.code]: Math.max(1, Number(event.target.value) || 1) }))} className="h-9 w-[72px] rounded-md border border-slate-200 bg-white px-2 text-center text-xs tabular-nums text-slate-800"/>
                <button type="button" onClick={() => adjustQuantity(item.code, amount)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-emerald-200 px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"><ArrowUpFromLine size={14}/><span>Registrar sobra</span></button>
                <button type="button" onClick={() => adjustQuantity(item.code, -amount)} disabled={item.quantity === 0} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ArrowDownToLine size={14}/><span>Dar baixa</span></button>
                {isWarehouse && item.quantity > 0 && <button type="button" onClick={() => sendAvailabilityMessage(item)} disabled={sentMessages.includes(item.code)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-[#0B57D0] transition hover:bg-blue-50 disabled:text-emerald-700"><span>{sentMessages.includes(item.code) ? <Check size={14}/> : <Send size={14}/>}</span><span>{sentMessages.includes(item.code) ? "Aviso enviado" : "Avisar setor"}</span></button>}
              </div>
            </article>;
          }) : <p className="py-10 text-center text-sm text-slate-500">Nenhum material encontrado neste setor.</p>}
        </div>
      </section>
      <p className="mt-4 text-[10px] leading-5 text-slate-400">Saldos demonstrativos, salvos neste navegador. A integração com a balança e o sistema central será necessária para atualização em tempo real.</p>
    </>
  );
}
