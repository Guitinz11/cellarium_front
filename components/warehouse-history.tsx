"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { Button, PageHeading } from "@/components/ui";
import {
  ApiError,
  getAccessToken,
  listMovements,
  type ApiMovement,
} from "@/lib/warehouse-api";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function movementType(value: string) {
  if (value === "SAIDA") return "Saída";
  if (value === "ENTRADA") return "Entrada";
  if (value === "DEVOLUCAO") return "Devolução";
  return "Ajuste";
}

export default function WarehouseHistory() {
  const [movements, setMovements] = useState<ApiMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try {
      if (!getAccessToken()) throw new ApiError("Entre no sistema para consultar movimentações do banco.", 401);
      const result = await listMovements();
      setMovements(result.dados);
    } catch (cause) {
      setMovements([]);
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as movimentações.");
    } finally {
      setLoading(false);
    }
  }

  const initialize = useEffectEvent(reload);

  useEffect(() => {
    const timer = window.setTimeout(() => void initialize(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return movements.filter((movement) => [
      movement.material,
      movement.usuario,
      movement.setor ?? "",
      movement.tipo,
      movement.requisicao_id ? `req-${movement.requisicao_id}` : "",
    ].join(" ").toLocaleLowerCase("pt-BR").includes(query));
  }, [movements, search]);

  return <>
    <PageHeading eyebrow="Operação · Auditoria" title="Histórico de movimentações" description="Saídas e ajustes registrados, com responsável, setor e saldo do estoque." />
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{error}</span><Button variant="secondary" onClick={() => void reload()}><RefreshCw size={15}/>Tentar novamente</Button></div>}
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold text-slate-900">Movimentações registradas</h2><p className="mt-1 text-xs text-slate-500">{filtered.length} registros</p></div><div className="flex gap-2"><label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar movimentação" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs text-slate-700 outline-none sm:w-52" placeholder="Material, pessoa ou setor"/></label><Button variant="secondary" aria-label="Atualizar histórico" title="Atualizar histórico" onClick={() => void reload()}><RefreshCw size={15}/></Button></div></div>
      {loading ? <p role="status" className="border-t border-slate-100 p-6 text-sm text-slate-500">Carregando histórico…</p> : filtered.length ? <ul className="divide-y divide-slate-100">{filtered.map((movement) => <li key={movement.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(140px,.7fr)_minmax(160px,.8fr)] sm:items-center">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-slate-900">{movement.material}</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-800">{movementType(movement.tipo)}</span></div><p className="mt-1 text-xs text-slate-500">{movement.usuario} · {movement.setor ?? "Setor não informado"}{movement.requisicao_id ? ` · REQ-${movement.requisicao_id}` : ""}</p></div>
        <div className="flex gap-4 text-xs sm:block"><p className="text-slate-500">Quantidade</p><p className="font-semibold text-slate-800 sm:mt-1">{movement.quantidade}</p></div>
        <div className="text-xs"><p className="text-slate-500">Estoque {movement.estoque_anterior} → {movement.estoque_posterior}</p><p className="mt-1 font-medium text-slate-700">{formatDate(movement.data)}</p></div>
      </li>)}</ul> : <p className="border-t border-slate-100 px-5 py-12 text-center text-sm text-slate-500">Nenhuma movimentação encontrada.</p>}
    </section>
  </>;
}
