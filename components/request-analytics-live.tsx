"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { Activity, ClipboardList, PackageCheck, RefreshCw } from "lucide-react";
import { Button, Card, EmptyState, Metric, PageHeading } from "@/components/ui";
import { ApiError, listAllMyRequests, type ApiRequestSummary } from "@/lib/warehouse-api";

const activeStatuses = new Set(["PENDENTE", "EM_SEPARACAO", "SEPARADA"]);
const statusLabels: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_SEPARACAO: "Em separação",
  SEPARADA: "Separada",
  ATENDIDA: "Atendida",
  CANCELADA: "Cancelada",
};
const colors: Record<string, string> = {
  PENDENTE: "bg-amber-500",
  EM_SEPARACAO: "bg-sky-600",
  SEPARADA: "bg-indigo-600",
  ATENDIDA: "bg-emerald-600",
  CANCELADA: "bg-rose-500",
};

function dateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export default function RequestAnalyticsLive() {
  const [requests, setRequests] = useState<ApiRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const result = await listAllMyRequests();
      setRequests(result.dados);
    } catch (cause) {
      setRequests([]);
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar as análises de requisições.");
    } finally {
      setLoading(false);
    }
  }

  const reloadEvent = useEffectEvent(reload);
  useEffect(() => {
    const timer = window.setTimeout(() => void reloadEvent(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const dailyCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (13 - index));
      return { date, key: dateKey(date), total: 0, open: 0, completed: 0, cancelled: 0 };
    });
    const byDate = new Map(days.map((day) => [day.key, day]));
    for (const request of requests) {
      const created = new Date(request.data_solicitacao);
      if (Number.isNaN(created.getTime())) continue;
      const bucket = byDate.get(dateKey(created));
      if (!bucket) continue;
      bucket.total += 1;
      if (activeStatuses.has(request.status)) bucket.open += 1;
      else if (request.status === "ATENDIDA") bucket.completed += 1;
      else if (request.status === "CANCELADA") bucket.cancelled += 1;
    }
    return days;
  }, [requests]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const request of requests) counts.set(request.status, (counts.get(request.status) ?? 0) + 1);
    return [...counts.entries()].sort((first, second) => second[1] - first[1]);
  }, [requests]);

  const sectorCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const request of requests) counts.set(request.setor.nome, (counts.get(request.setor.nome) ?? 0) + 1);
    return [...counts.entries()].sort((first, second) => second[1] - first[1]);
  }, [requests]);

  const openCount = requests.filter((request) => activeStatuses.has(request.status)).length;
  const completedCount = requests.filter((request) => request.status === "ATENDIDA").length;
  const dailyMax = Math.max(...dailyCounts.map((day) => day.total), 1);
  const statusMax = Math.max(...statusCounts.map(([, count]) => count), 1);
  const sectorMax = Math.max(...sectorCounts.map(([, count]) => count), 1);
  const range = `${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(dailyCounts[0].date)} a ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(dailyCounts[dailyCounts.length - 1].date)}`;

  return <div className="mx-auto max-w-6xl space-y-5">
    <PageHeading eyebrow="Operação · Indicadores" title="Análise de requisições" description="Volume, situação e distribuição das requisições registradas no sistema." action={<Button variant="secondary" onClick={() => void reload()} loading={loading}><RefreshCw size={15}/>Atualizar</Button>}/>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    <div className="metrics-strip"><Metric label="Requisições no total" value={requests.length} note="Todos os registros consultados" icon={<ClipboardList/>}/><Metric label="Em aberto" value={openCount} note="Aguardando ou em separação" icon={<Activity/>} tone="warning"/><Metric label="Atendidas" value={completedCount} note="Entrega concluída" icon={<PackageCheck/>} tone="success"/></div>

    <Card className="p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-sm font-semibold text-slate-900">Requisições por dia</h2><p className="mt-1 text-xs text-slate-500">Últimos 14 dias · {range}</p></div><div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-600"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-amber-500"/>Em aberto</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-600"/>Atendidas</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-rose-500"/>Canceladas</span></div></div>
      {loading ? <p role="status" className="py-12 text-center text-sm text-slate-500">Carregando histórico diário…</p> : requests.length ? <div className="grid grid-cols-7 gap-2 border-b border-slate-100 pb-3 sm:grid-cols-[repeat(14,minmax(0,1fr))] sm:gap-3">{dailyCounts.map((day) => {
        const barHeight = (count: number) => `${count ? Math.max(count / dailyMax * 100, 5) : 0}%`;
        return <div key={day.key} className="flex min-w-0 flex-col items-center gap-2" title={`${day.total} requisições em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(day.date)}`}><span className="text-[10px] font-semibold tabular-nums text-slate-700">{day.total || "·"}</span><div className="flex h-32 w-full max-w-8 items-end overflow-hidden rounded-sm bg-slate-100"><div className="flex h-full w-full flex-col justify-end"><span className="block w-full bg-rose-500" style={{ height: barHeight(day.cancelled) }}/><span className="block w-full bg-emerald-600" style={{ height: barHeight(day.completed) }}/><span className="block w-full bg-amber-500" style={{ height: barHeight(day.open) }}/></div></div><span className="truncate text-[9px] text-slate-500">{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(day.date)}</span></div>;
      })}</div> : <EmptyState title="Sem requisições no período" description="Os registros dos últimos 14 dias aparecerão neste gráfico."/>}
    </Card>

    <div className="grid gap-5 lg:grid-cols-2"><Card className="p-5 sm:p-6"><div className="mb-4"><h2 className="text-sm font-semibold text-slate-900">Situação das requisições</h2><p className="mt-1 text-xs text-slate-500">Distribuição de todos os registros</p></div>{loading ? <p role="status" className="py-8 text-sm text-slate-500">Carregando…</p> : statusCounts.length ? <ul className="space-y-4">{statusCounts.map(([status, count]) => <li key={status}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="text-slate-700">{statusLabels[status] ?? status}</span><strong className="tabular-nums text-slate-900">{count}</strong></div><div className="h-2 overflow-hidden rounded-sm bg-slate-100"><div className={`h-full ${colors[status] ?? "bg-slate-500"}`} style={{ width: `${count / statusMax * 100}%` }}/></div></li>)}</ul> : <EmptyState title="Sem dados de status" description="Ainda não há requisições para comparar."/>}</Card>
      <Card className="p-5 sm:p-6"><div className="mb-4"><h2 className="text-sm font-semibold text-slate-900">Demanda por setor</h2><p className="mt-1 text-xs text-slate-500">Requisições agrupadas pelo setor solicitante</p></div>{loading ? <p role="status" className="py-8 text-sm text-slate-500">Carregando…</p> : sectorCounts.length ? <ul className="space-y-4">{sectorCounts.map(([sector, count]) => <li key={sector}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate text-slate-700">{sector}</span><strong className="tabular-nums text-slate-900">{count}</strong></div><div className="h-2 overflow-hidden rounded-sm bg-slate-100"><div className="h-full bg-blue-800" style={{ width: `${count / sectorMax * 100}%` }}/></div></li>)}</ul> : <EmptyState title="Sem dados por setor" description="Os setores aparecerão quando houver requisições."/>}</Card></div>
  </div>;
}
