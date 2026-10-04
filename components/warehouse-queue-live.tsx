"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import { ArrowRight, Check, Clock3, RefreshCw } from "lucide-react";
import { Button, PageHeading } from "@/components/ui";
import {
  ApiError,
  getAccessToken,
  getActiveAttendance,
  listPendingRequests,
  listSectors,
  startAttendance,
  type ApiAttendance,
  type ApiPendingRequest,
  type ApiSector,
} from "@/lib/warehouse-api";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function requestStatus(status: string) {
  if (status === "EM_SEPARACAO") return "Em separação";
  if (status === "SEPARADA") return "Separada";
  return status === "PENDENTE" ? "Pendente" : status;
}

export default function WarehouseQueueLive() {
  const [sectors, setSectors] = useState<ApiSector[]>([]);
  const [sectorId, setSectorId] = useState("");
  const [attendance, setAttendance] = useState<ApiAttendance | null>(null);
  const [requests, setRequests] = useState<ApiPendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try {
      if (!getAccessToken()) throw new ApiError("Entre com seu usuário do almoxarifado para carregar o banco.", 401);
      const [availableSectors, activeAttendance] = await Promise.all([
        listSectors(),
        getActiveAttendance(),
      ]);
      setSectors(availableSectors);
      setAttendance(activeAttendance);
      if (activeAttendance) {
        const pending = await listPendingRequests();
        setRequests(pending.dados.filter((request) => request.setor_id === activeAttendance.setor_id));
      } else {
        setRequests([]);
      }
    } catch (cause) {
      setSectors([]);
      setAttendance(null);
      setRequests([]);
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar a fila.");
    } finally {
      setLoading(false);
    }
  }

  const initialize = useEffectEvent(reload);

  useEffect(() => {
    const timer = window.setTimeout(() => void initialize(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function beginShift() {
    const selectedId = Number(sectorId);
    if (!selectedId) return;
    setStarting(true);
    setError("");
    const selectedSector = sectors.find((sector) => sector.id === selectedId);
    if (!selectedSector) {
      setStarting(false);
      setError("Selecione um setor válido.");
      return;
    }
    try {
      const nextAttendance = await startAttendance(selectedId);
      setAttendance(nextAttendance);
      const pending = await listPendingRequests();
      setRequests(pending.dados.filter((request) => request.setor_id === selectedId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar o turno.");
    } finally {
      setStarting(false);
    }
  }

  const filteredRequests = requests.filter((request) =>
    [request.numero, request.setor, request.status].join(" ").toLocaleLowerCase("pt-BR")
      .includes(search.trim().toLocaleLowerCase("pt-BR")),
  );

  return <>
    <PageHeading eyebrow="Operação · Almoxarifado" title="Fila de requisições" description="Atenda as solicitações do setor ativo neste turno." />
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{error}</span><Button variant="secondary" onClick={() => void reload()}><RefreshCw size={15}/>Tentar novamente</Button></div>}
    {loading ? <div role="status" className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando setor e requisições…</div> : !attendance ? <section className="max-w-xl rounded-lg border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-800"><Clock3 size={19}/></div>
      <h2 className="mt-4 text-base font-semibold text-slate-900">Inicie o atendimento do turno</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">Escolha o setor uma vez. A fila continuará vinculada a ele durante este atendimento.</p>
      <label className="mt-5 block text-xs font-semibold text-slate-700" htmlFor="active-sector">Setor do turno</label>
      <select id="active-sector" value={sectorId} onChange={(event) => setSectorId(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
        <option value="">Selecione o setor</option>
        {sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.nome}</option>)}
      </select>
      <Button className="mt-4 w-full sm:w-auto" onClick={() => void beginShift()} loading={starting} disabled={!sectorId || starting}><Check size={16}/>Iniciar atendimento</Button>
    </section> : <>
      <section className="mb-4 flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[10px] font-semibold uppercase text-blue-700">Setor ativo neste turno</p><p className="mt-1 text-sm font-semibold text-slate-900">{attendance.setor}</p><p className="mt-1 text-xs text-slate-600">Iniciado {formatDate(attendance.data_inicio)}</p></div>
        <span className="inline-flex min-h-8 items-center gap-2 self-start rounded-full bg-white px-3 text-xs font-semibold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Atendimento aberto</span>
      </section>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-bold text-slate-900">Pendentes do setor <span className="ml-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{filteredRequests.length}</span></h2></div><div className="flex gap-2"><input aria-label="Buscar requisição" value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-blue-400 sm:w-52" placeholder="Buscar requisição…"/><Button variant="secondary" aria-label="Atualizar fila" title="Atualizar fila" onClick={() => void reload()}><RefreshCw size={15}/></Button></div></div>
        {filteredRequests.length ? <ul className="divide-y divide-slate-100">{filteredRequests.map((request) => <li key={request.requisicao_id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-slate-900">{request.numero}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{requestStatus(request.status)}</span></div><p className="mt-1 text-xs text-slate-500">{request.setor} · {request.quantidade_itens} {request.quantidade_itens === 1 ? "item" : "itens"} · {formatDate(request.data)}</p></div>
          <Link href={`/separacao?request=${encodeURIComponent(request.requisicao_id)}`} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50">{request.status === "PENDENTE" ? "Abrir requisição" : "Continuar separação"}<ArrowRight size={15}/></Link>
        </li>)}</ul> : <div className="border-t border-slate-100 px-5 py-12 text-center"><p className="text-sm font-semibold text-slate-800">Nenhuma requisição pendente para {attendance.setor}.</p><p className="mt-1 text-xs text-slate-500">Atualize a fila para buscar novas solicitações.</p></div>}
      </section>
    </>}
  </>;
}
