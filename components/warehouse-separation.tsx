"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, RefreshCw, UserRound } from "lucide-react";
import { Button, PageHeading } from "@/components/ui";
import {
  ApiError,
  ApiUnavailableError,
  concludeRequest,
  getAccessToken,
  getRequestDetail,
  separateRequestItem,
  startRequestSeparation,
  type ApiRequestDetail,
} from "@/lib/warehouse-api";

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

function formatDate(value: string | null) {
  if (!value) return "Não informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Não informado"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default function WarehouseSeparation() {
  const searchParams = useSearchParams();
  const identifier = searchParams.get("request") ?? "";
  const [request, setRequest] = useState<ApiRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    if (!identifier) {
      setRequest(null);
      setError("Informe o código da requisição para abrir o detalhe.");
      setLoading(false);
      return;
    }
    try {
      if (!getAccessToken()) throw new ApiError("Entre no sistema para consultar requisições do banco.", 401);
      setRequest(await getRequestDetail(identifier));
    } catch (cause) {
      setRequest(null);
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar a requisição.");
    } finally {
      setLoading(false);
    }
  }

  const loadDetail = useEffectEvent(reload);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDetail(), 0);
    return () => window.clearTimeout(timer);
  }, [identifier]);

  async function confirmSeparation() {
    if (!request || submitting || request.status !== "SEPARADA") return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const concluded = await concludeRequest(request.id);
      setRequest(concluded);
      setNotice("Requisição finalizada e estoque atualizado.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : cause instanceof ApiUnavailableError ? cause.message : "Não foi possível confirmar a separação.");
      if (cause instanceof ApiError && cause.status === 409) {
        try {
          setRequest(await getRequestDetail(String(request.id)));
        } catch {
          // Mantém a resposta original; a próxima atualização da tela tentará novamente.
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function markItemSeparated(itemId: number) {
    if (!request || submitting) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      if (request.status === "PENDENTE") await startRequestSeparation(request.id);
      await separateRequestItem(request.id, itemId, `separacao:${request.id}:${itemId}:${crypto.randomUUID()}`);
      const updated = await getRequestDetail(String(request.id));
      setRequest(updated);
      setNotice("Item separado e baixado do estoque.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível marcar o item como separado.");
      try {
        setRequest(await getRequestDetail(String(request.id)));
      } catch {
        // A próxima atualização tentará carregar o estado persistido novamente.
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canFinalize = request?.status === "SEPARADA";
  const canSeparateItems = request && ["PENDENTE", "EM_SEPARACAO"].includes(request.status);

  return <>
    <PageHeading eyebrow="Operação · Almoxarifado" title="Separação da requisição" description="Confira os itens e registre a saída no estoque." action={<Link href="/fila" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800"><ArrowLeft size={15}/>Voltar à fila</Link>} />
    {error && <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertTriangle size={17} className="mt-0.5 shrink-0"/><span>{error}</span></div>}
    {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
    {loading ? <div role="status" className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando detalhe da requisição…</div> : request ? <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(250px,.8fr)]">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <header className="border-b border-slate-200 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-blue-800">{request.numero}</p><h2 className="mt-2 text-lg font-semibold text-slate-900">Itens para separar</h2></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">{statusLabel(request.status)}</span></div><p className="mt-2 text-xs text-slate-500">Solicitada em {formatDate(request.data_solicitacao)}</p></header>
        <ul className="divide-y divide-slate-100">{request.itens.map((item) => {
          const isSeparated = ["SEPARADO", "ATENDIDO"].includes(item.status);
          const isCancelled = item.status === "CANCELADO";
          return <li key={item.id} className={`p-5 transition-colors sm:p-6 ${isSeparated ? "bg-emerald-50/50" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-slate-900">{item.descricao}</p><p className="mt-1 font-mono text-[11px] text-slate-500">{item.codigo} · {item.unidade.sigla}</p></div><span className="shrink-0 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{item.quantidade_solicitada} {item.unidade.sigla}</span></div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <label className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-xs font-semibold ${isSeparated ? "border-emerald-200 bg-white text-emerald-800" : "border-slate-200 text-slate-700"}`}>
                <input type="checkbox" checked={isSeparated} disabled={!canSeparateItems || submitting || isSeparated || isCancelled} onChange={(event) => { if (event.target.checked) void markItemSeparated(item.id); }} className="h-4 w-4 accent-emerald-700"/>
                {isSeparated ? "Separado" : isCancelled ? "Cancelado" : "Marcar separado"}
              </label>
              <div className="grid min-w-[180px] grid-cols-2 gap-3 text-xs"><div><p className="text-slate-500">Quantidade separada</p><p className="mt-1 font-semibold text-slate-800">{item.quantidade_separada} {item.unidade.sigla}</p></div><div><p className="text-slate-500">Saldo atual</p><p className="mt-1 font-semibold text-slate-800">{item.estoque_atual ?? "Não informado"} {item.unidade.sigla}</p></div></div>
            </div>
            {item.observacao && <p className="mt-3 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">{item.observacao}</p>}
          </li>;
        })}</ul>
        {(canSeparateItems || canFinalize) && <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><p className="text-xs text-slate-500">{canFinalize ? "Todos os itens estão separados." : "Marque cada produto depois de concluir sua separação física."}</p><div className="flex flex-col-reverse gap-2 sm:flex-row"><Link href="/fila" className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Voltar</Link><Button onClick={() => void confirmSeparation()} loading={submitting && canFinalize} disabled={submitting || !canFinalize}><Check size={16}/>{canFinalize ? "Finalizar requisição" : "Separe todos os itens"}</Button></div></footer>}
      </section>
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-sm font-semibold text-slate-900">Dados da requisição</h2><div className="mt-4 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"><UserRound size={17}/></span><div><p className="text-xs font-semibold text-slate-800">{request.solicitante}</p><p className="mt-1 text-[11px] text-slate-500">Solicitante</p></div></div><dl className="mt-5 divide-y divide-slate-100 border-y border-slate-100 text-xs"><div className="flex justify-between gap-3 py-3"><dt className="text-slate-500">Setor</dt><dd className="text-right font-semibold text-slate-800">{request.setor.nome}</dd></div><div className="flex justify-between gap-3 py-3"><dt className="text-slate-500">Separador</dt><dd className="text-right font-semibold text-slate-800">{request.separador ?? "A definir"}</dd></div><div className="flex justify-between gap-3 py-3"><dt className="text-slate-500">Itens</dt><dd className="font-semibold text-slate-800">{request.itens.length}</dd></div></dl>{request.observacao && <p className="mt-4 text-xs leading-5 text-slate-600">{request.observacao}</p>}</aside>
    </div> : !error && <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Requisição não encontrada.</div>}
    {!request && error && !loading && <Button variant="secondary" onClick={() => void reload()}><RefreshCw size={15}/>Tentar novamente</Button>}
  </>;
}
