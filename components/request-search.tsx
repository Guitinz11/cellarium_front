"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Check, PackageSearch, Search } from "lucide-react";
import { getAllRequests, getServerRequests, subscribeToRequests } from "@/lib/request-storage";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

import { EmptyState, PageHeading, StatusBadge } from "@/components/ui";

export default function RequestSearch() {
  const requests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [error, setError] = useState("");
  const matchingRequests = searchedQuery
    ? requests.filter((request) => {
      const searchValue = normalize(searchedQuery);
      return [request.id, request.order].some((value) => normalize(value) === searchValue);
    })
    : requests.filter((request) => request.status !== "Concluído");

  function searchRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    setSearchedQuery(value);
    setError(value ? "Nenhuma requisição encontrada com esse código." : "Informe o código da requisição ou da ordem de serviço.");
  }

  return <section className="mx-auto max-w-4xl">
    <PageHeading eyebrow="Portal do requisitante" title="Acompanhar pedidos" description="Consulte as etapas de atendimento pela requisição ou ordem de serviço."/>
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <form onSubmit={searchRequest} className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:p-5"><label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"><Search size={16}/><span className="sr-only">Código da requisição ou ordem de serviço</span><input required value={query} onChange={(event) => { setQuery(event.target.value); setError(""); }} placeholder="Ex.: REQ-2048 ou OS-821" className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"/></label><button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-strong"><Search size={16}/>Pesquisar</button></form>
      <div aria-live="polite" className="space-y-3 bg-slate-50 p-3 sm:p-4">
        {matchingRequests.map((request) => {

          return <article key={request.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-brand">{request.id}</p><h2 className="mt-1 text-base font-bold text-slate-900">Ordem de serviço {request.order}</h2></div><StatusBadge status={request.status}/></div>{request.deliveryConfirmed && <p className="mt-4 flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><Check size={15}/>Entrega confirmada pelo almoxarife</p>}<dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Solicitante</dt><dd className="mt-1 text-sm font-medium text-slate-800">{request.requester}</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Setor · turno</dt><dd className="mt-1 text-sm font-medium text-slate-800">{request.sector} · {request.shift ?? "Não informado"}</dd></div><div className="sm:col-span-2"><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Materiais solicitados</dt><dd className="mt-1 text-sm leading-6 text-slate-700">{request.items}</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Data</dt><dd className="mt-1 text-sm text-slate-700">{request.date}</dd></div></dl></article>;
        })}
        {searchedQuery && matchingRequests.length === 0 && <div className="px-5 py-12 text-center"><PackageSearch size={28} className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-700">{error || "Requisição não encontrada."}</p><p className="mt-1 text-xs text-slate-500">Confira o código informado e tente novamente.</p></div>}
        {!searchedQuery && matchingRequests.length === 0 && <EmptyState title="Nenhum pedido aberto" description="Quando você enviar uma requisição, acompanhe o atendimento por aqui."/>}
      </div>
    </section>
  </section>;
}
