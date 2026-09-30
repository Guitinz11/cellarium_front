"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { MessageCircle, Search } from "lucide-react";
import { getAllRequests, getServerRequests, subscribeToRequests } from "@/lib/request-storage";

export default function WarehouseQueue() {
  const requests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filteredRequests = requests.filter((request) => {
    const status = accepted.includes(request.id) ? "Em andamento" : request.status;
    const searchable = [request.id, request.order, request.requester, request.sector, request.shift ?? ""].join(" ").toLocaleLowerCase("pt-BR");
    return searchable.includes(search.trim().toLocaleLowerCase("pt-BR")) && (statusFilter === "Todos" || status === statusFilter);
  });

  return <>
    <div className="mb-8"><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.13em] text-[#0B57D0]">Operação · Almoxarifado</p><h1 className="text-[27px] font-semibold text-slate-900 sm:text-[30px]">Fila de pedidos</h1><p className="mt-2 text-sm leading-6 text-slate-500">Setor e turno informados pelo funcionário em cada requisição.</p></div>
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-bold text-slate-900">Solicitações recebidas <span className="ml-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{filteredRequests.length}</span></h2><p className="mt-1 text-xs text-slate-500">Pedidos aguardando análise</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar requisição" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs text-slate-700 outline-none sm:w-48" placeholder="Buscar pedido..."/></label><label className="sr-only" htmlFor="warehouse-queue-status">Filtrar pelo status</label><select id="warehouse-queue-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"><option>Todos</option><option>Pendente</option><option>Em andamento</option><option>Concluído</option></select></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left"><thead><tr className="border-y border-slate-100 bg-slate-50/70 text-[10px] font-medium uppercase tracking-wide text-slate-500"><th className="px-5 py-3">Requisição</th><th className="px-4 py-3">Ordem</th><th className="px-4 py-3">Solicitante</th><th className="px-4 py-3">Setor</th><th className="px-4 py-3">Turno</th><th className="px-4 py-3">Data necessária</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody>{filteredRequests.map((request) => {
        const status = accepted.includes(request.id) ? "Em andamento" : request.status;
        const statusColors = status === "Concluído" ? "bg-emerald-50 text-emerald-700" : status === "Em andamento" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700";
        return <tr key={request.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"><td className="px-5 py-4 font-mono text-xs font-semibold text-slate-800">{request.id}</td><td className="px-4 py-4 font-mono text-xs text-slate-600">{request.order}</td><td className="px-4 py-4 text-xs font-medium text-slate-800">{request.requester}{request.employeeCode && <span className="mt-1 block font-mono text-[10px] text-slate-400">Cód. {request.employeeCode}</span>}</td><td className="px-4 py-4 text-xs font-medium text-slate-700">{request.sector}</td><td className="px-4 py-4 text-xs text-slate-600">{request.shift ?? "Não informado"}</td><td className="px-4 py-4 text-xs text-slate-500">{request.date}</td><td className="px-4 py-4"><span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusColors}`}>{status}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2">{request.status === "Pendente" && <button type="button" onClick={() => setAccepted((current) => current.includes(request.id) ? current : [...current, request.id])} disabled={accepted.includes(request.id)} className="min-h-9 rounded-md bg-[#0B57D0] px-3 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{accepted.includes(request.id) ? "Aceito" : "Aceitar"}</button>}<Link href={`/conversas?request=${encodeURIComponent(request.id)}`} aria-label={`Conversar sobre ${request.id}`} title="Abrir conversa" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-[#0B57D0]"><MessageCircle size={16}/></Link></div></td></tr>;
      })}</tbody></table>{filteredRequests.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-500">Nenhuma requisição encontrada.</p>}</div>
    </section>
  </>;
}