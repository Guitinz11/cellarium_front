"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { ArrowRight, ClipboardList, Package, RefreshCw } from "lucide-react";
import { Button, EmptyState, Metric, StatusBadge } from "@/components/ui";
import { ApiError, listMyRequests, listStock, type ApiRequestSummary, type ApiStockItem } from "@/lib/warehouse-api";

function labelStatus(status: string) {
  const labels: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_SEPARACAO: "Em separação",
    SEPARADA: "Separada",
    ATENDIDA: "Atendida",
    CANCELADA: "Cancelada",
  };
  return labels[status] ?? status;
}

export default function OperationsDashboardLive() {
  const [requests, setRequests] = useState<ApiRequestSummary[]>([]);
  const [stock, setStock] = useState<ApiStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const [requestResult, stockResult] = await Promise.all([listMyRequests(), listStock({ limit: 100 })]);
      setRequests(requestResult.dados);
      setStock(stockResult.dados);
    } catch (cause) {
      setRequests([]);
      setStock([]);
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar os dados do painel.");
    } finally {
      setLoading(false);
    }
  }

  const reloadEvent = useEffectEvent(reload);
  useEffect(() => {
    const timer = window.setTimeout(() => void reloadEvent(), 0);
    const interval = window.setInterval(() => void reloadEvent(), 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void reloadEvent();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const pending = requests.filter((request) => ["PENDENTE", "EM_SEPARACAO", "SEPARADA"].includes(request.status));
  const completed = requests.filter((request) => request.status === "ATENDIDA").length;
  const critical = stock.filter((item) => item.estoque_atual <= item.estoque_minimo);
  const sectorCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const request of requests) counts.set(request.setor.nome, (counts.get(request.setor.nome) ?? 0) + 1);
    return [...counts.entries()].sort((first, second) => second[1] - first[1]);
  }, [requests]);
  const latest = [...requests]
    .filter((request) => ["PENDENTE", "EM_SEPARACAO", "SEPARADA"].includes(request.status))
    .sort((first, second) => second.data_solicitacao.localeCompare(first.data_solicitacao))
    .slice(0, 5);

  return <>
    <header className="operations-hero" aria-labelledby="dashboard-title"><div><p className="ui-eyebrow">Centro de operações · dados do banco</p><h1 id="dashboard-title">Visão do almoxarifado</h1><p>Requisições e saldos carregados da API.</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => void reload()} loading={loading}><RefreshCw size={15}/>Atualizar</Button><Link href="/fila" className="ui-button"><ClipboardList size={16}/>Abrir fila<ArrowRight size={15}/></Link></div></header>
    {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    <div className="metrics-strip"><Metric label="Requisições abertas" value={pending.length} note="Pendente ou em atendimento" icon={<ClipboardList/>} tone="warning"/><Metric label="Requisições atendidas" value={completed} note="Registradas pelo backend"/><Metric label="Materiais críticos" value={critical.length} note="Saldo no mínimo ou abaixo" icon={<Package/>} tone="warning"/></div>
    <div className="dashboard-grid"><section className="min-w-0 rounded-lg border border-slate-200 bg-white"><div className="panel-heading"><div><h2>Requisições recentes</h2><p>Registros retornados pelo backend</p></div><Link href="/fila" className="ui-text-link">Fila<ArrowRight size={14}/></Link></div>{loading ? <p role="status" className="p-5 text-sm text-slate-500">Carregando…</p> : latest.length ? latest.map((request) => <Link key={request.id} href={`/separacao?request=${request.id}`} className="priority-row card-interactive"><div className="priority-row-body"><div className="priority-row-title"><strong>{request.numero}</strong><span>{request.quantidade_itens} {request.quantidade_itens === 1 ? "item" : "itens"}</span></div><p>{request.solicitante} · {request.setor.nome}</p></div><StatusBadge status={labelStatus(request.status)}/><ArrowRight size={15} className="text-slate-400"/></Link>) : <div className="p-5"><EmptyState title={requests.length ? "Tudo em dia" : "Nenhuma requisição retornada"} description={error ? "Verifique a conexão da API e sua sessão." : requests.length ? "Não há requisições abertas no momento." : "As requisições cadastradas no banco aparecerão aqui."}/></div>}</section>
      <section className="min-w-0 rounded-lg border border-slate-200 bg-white"><div className="panel-heading"><div><h2>Requisições por setor</h2><p>Agrupadas a partir dos registros retornados</p></div></div>{loading ? <p role="status" className="p-5 text-sm text-slate-500">Carregando…</p> : sectorCounts.length ? <ul className="divide-y divide-slate-100 px-5">{sectorCounts.map(([sector, count]) => <li key={sector} className="flex justify-between gap-3 py-3 text-xs"><span className="text-slate-700">{sector}</span><strong className="tabular-nums text-slate-900">{count}</strong></li>)}</ul> : <p className="p-5 text-sm text-slate-500">Sem dados por setor.</p>}{critical.length > 0 && <div className="border-t border-slate-100 p-5"><h3 className="text-xs font-semibold text-slate-800">Saldos críticos</h3><ul className="mt-2 space-y-2">{critical.slice(0, 5).map((item) => <li key={item.estoque_id} className="flex justify-between gap-3 text-xs"><span className="truncate text-slate-600">{item.material}</span><strong className="shrink-0 text-amber-800">{item.estoque_atual} {item.unidade_sigla}</strong></li>)}</ul></div>}</section></div>
  </>;
}
