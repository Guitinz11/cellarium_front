"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, Search } from "lucide-react";
import { Button, EmptyState, PageHeading, StatusBadge } from "@/components/ui";
import { ApiError, listMyRequests, type ApiRequestSummary } from "@/lib/warehouse-api";

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_SEPARACAO: "Em separação",
    SEPARADA: "Separada",
    ATENDIDA: "Atendida",
    CANCELADA: "Cancelada",
  };
  return labels[status] ?? status;
}

export default function RequestSearchLive() {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<ApiRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(searchParams.get("request") ?? "");
  const [searched, setSearched] = useState(searchParams.get("request") ?? "");

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const result = await listMyRequests();
      setRequests(result.dados);
    } catch (cause) {
      setRequests([]);
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar suas requisições do banco.");
    } finally {
      setLoading(false);
    }
  }

  const loadEvent = useEffectEvent(reload);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvent(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = useMemo(() => {
    const normalized = searched.trim().toLocaleLowerCase("pt-BR");
    return requests.filter((request) => !normalized
      || request.numero.toLocaleLowerCase("pt-BR").includes(normalized)
      || String(request.id) === normalized);
  }, [requests, searched]);

  return <>
    <PageHeading eyebrow="Portal do requisitante" title="Acompanhar pedidos" description="Status consultado diretamente nas suas requisições do backend." action={<Button variant="secondary" onClick={() => void reload()} loading={loading}><RefreshCw size={15}/>Atualizar</Button>} />
    {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <form onSubmit={(event) => { event.preventDefault(); setSearched(query); }} className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:p-5"><label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={16}/><span className="sr-only">Número da requisição</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: REQ-2048" className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"/></label><Button type="submit"><Search size={16}/>Pesquisar</Button></form>
      {loading ? <p role="status" className="p-6 text-sm text-slate-500">Carregando suas requisições…</p> : visible.length ? <ul className="divide-y divide-slate-100">{visible.map((request) => <li key={request.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-xs font-semibold text-blue-800">{request.numero}</p><p className="mt-1 text-sm font-semibold text-slate-900">{request.setor.nome}</p><p className="mt-1 text-xs text-slate-500">{request.quantidade_itens} {request.quantidade_itens === 1 ? "item" : "itens"} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(request.data_solicitacao))}</p></div><StatusBadge status={statusLabel(request.status)}/></li>)}</ul> : <div className="border-t border-slate-100 p-6"><EmptyState title={error ? "Requisições indisponíveis" : "Nenhuma requisição encontrada"} description={error ? "Confira sua sessão, a API e o banco de dados." : searched ? "Não encontramos esse número entre as suas requisições." : "As solicitações criadas pela sua conta aparecerão aqui."}/></div>}
    </section>
  </>;
}
