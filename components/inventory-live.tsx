"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { Button, EmptyState, Metric, PageHeading, Pagination, StatusBadge } from "@/components/ui";
import { ApiError, listStock, type ApiStockItem } from "@/lib/warehouse-api";

type InventoryStatus = "Todos" | "Disponível" | "Crítico" | "Sem estoque";

function statusFor(item: ApiStockItem): Exclude<InventoryStatus, "Todos"> {
  if (item.estoque_atual <= 0) return "Sem estoque";
  if (item.estoque_atual <= item.estoque_minimo) return "Crítico";
  return "Disponível";
}

export default function InventoryLive() {
  const [items, setItems] = useState<ApiStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InventoryStatus>("Todos");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const result = await listStock({ limit: 100 });
      setItems(result.dados);
    } catch (cause) {
      setItems([]);
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar o estoque do banco.");
    } finally {
      setLoading(false);
    }
  }

  const reloadEvent = useEffectEvent(reload);
  useEffect(() => {
    const timer = window.setTimeout(() => void reloadEvent(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return `${item.material} ${item.codigo} ${item.categoria}`.toLocaleLowerCase("pt-BR").includes(query)
      && (status === "Todos" || statusFor(item) === status);
  }), [items, search, status]);
  const critical = items.filter((item) => statusFor(item) === "Crítico").length;
  const outOfStock = items.filter((item) => statusFor(item) === "Sem estoque").length;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const statuses: InventoryStatus[] = ["Todos", "Disponível", "Crítico", "Sem estoque"];

  return <>
    <PageHeading eyebrow="Controle de materiais" title="Inventário" description="Saldos e níveis mínimos consultados no estoque do banco de dados." action={<Button variant="secondary" onClick={() => void reload()} loading={loading}><RefreshCw size={15}/>Atualizar</Button>} />
    {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    <div className="metrics-strip"><Metric label="Materiais em estoque" value={items.length} note="Registros retornados pelo banco"/><Metric label="Abaixo do mínimo" value={critical} note="Saldo positivo no nível crítico" tone="warning"/><Metric label="Sem saldo" value={outOfStock} note="Materiais sem quantidade disponível" tone="warning"/></div>
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold text-slate-900">Materiais e saldos</h2><p className="mt-1 text-xs text-slate-500">{filtered.length} registros no banco</p></div><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar material" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="w-full bg-transparent text-xs text-slate-700 outline-none sm:w-56" placeholder="Material ou código"/></label></div>
      <div className="flex flex-wrap gap-2 border-y border-slate-100 px-5 py-3" role="group" aria-label="Filtrar materiais por situação">{statuses.map((option) => <button key={option} type="button" aria-pressed={status === option} onClick={() => { setStatus(option); setPage(1); }} className={`min-h-9 rounded-md border px-3 text-xs font-semibold ${status === option ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{option}</button>)}</div>
      {loading ? <p role="status" className="p-6 text-sm text-slate-500">Carregando saldos do banco…</p> : visibleItems.length ? <div className="overflow-x-auto"><table className="responsive-table w-full min-w-[700px] text-left"><thead><tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase text-slate-500"><th className="px-5 py-3">Material</th><th className="px-4 py-3">Código</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Saldo</th><th className="px-4 py-3">Mínimo</th><th className="px-4 py-3">Situação</th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.estoque_id} className="border-b border-slate-100 last:border-0"><td data-label="Material" className="px-5 py-4 text-xs font-semibold text-slate-800">{item.material}</td><td data-label="Código" className="px-4 py-4 font-mono text-xs text-slate-500">{item.codigo}</td><td data-label="Categoria" className="px-4 py-4 text-xs text-slate-600">{item.categoria}</td><td data-label="Saldo" className="px-4 py-4 text-xs font-semibold text-slate-800">{item.estoque_atual} {item.unidade_sigla}</td><td data-label="Mínimo" className="px-4 py-4 text-xs text-slate-600">{item.estoque_minimo} {item.unidade_sigla}</td><td data-label="Situação" className="px-4 py-4"><StatusBadge status={statusFor(item)}/></td></tr>)}</tbody></table></div> : <div className="border-t border-slate-100 p-6"><EmptyState title={error ? "Estoque indisponível" : "Nenhum material encontrado"} description={error ? "Verifique a API, o banco e sua sessão; atualize para tentar novamente." : "Não há registros correspondentes no estoque do banco."} action={error ? <Button variant="secondary" onClick={() => void reload()}><RefreshCw size={15}/>Tentar novamente</Button> : undefined}/></div>}
      {!loading && filtered.length > pageSize && <Pagination page={currentPage} total={filtered.length} pageSize={pageSize} onPageChange={setPage}/>}
    </section>
  </>;
}
