"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button, Card, EmptyState, PageHeading } from "@/components/ui";
import {
  ApiError,
  getStoredApiUser,
  listMyRequests,
  listRequestMessages,
  sendRequestMessage,
  type ApiMessage,
  type ApiRequestSummary,
} from "@/lib/warehouse-api";

const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

export default function RequestConversationsLive() {
  const [requests, setRequests] = useState<ApiRequestSummary[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const currentUserId = getStoredApiUser()?.id;

  const refreshRequests = useCallback(async () => {
    try {
      const result = await listMyRequests();
      setRequests(result.dados);
      setSelected((current) => {
        if (
          current !== null &&
          result.dados.some((item) => item.id === current)
        )
          return current;
        const requestId =
          typeof window === "undefined"
            ? null
            : Number(
                new URLSearchParams(window.location.search).get("request"),
              );
        return result.dados.some((item) => item.id === requestId)
          ? requestId
          : (result.dados[0]?.id ?? null);
      });
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar as conversas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    if (selected === null) {
      setMessages([]);
      return;
    }
    try {
      setMessages(await listRequestMessages(selected));
      setError("");
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível carregar as mensagens.",
      );
    }
  }, [selected]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshRequests(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshRequests]);
  useEffect(() => {
    const initial = window.setTimeout(() => void refreshMessages(), 0);
    const interval = window.setInterval(() => void refreshMessages(), 7000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [refreshMessages]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected === null || !draft.trim()) return;
    setSending(true);
    setError("");
    try {
      const created = await sendRequestMessage(selected, draft.trim());
      setMessages((current) => [...current, created]);
      setDraft("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível enviar a mensagem.",
      );
    } finally {
      setSending(false);
    }
  }

  const active = requests.find((request) => request.id === selected);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        eyebrow="Suporte à requisição"
        title="Conversas"
        description="Converse com o almoxarifado dentro do contexto de cada requisição."
      />
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </p>
      )}
      <Card className="grid min-h-[28rem] overflow-hidden p-0 md:grid-cols-[minmax(13rem,0.34fr)_1fr]">
        <aside className="border-b border-slate-200 md:border-b-0 md:border-r">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Requisições
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Selecione uma conversa
            </p>
          </div>
          <div className="space-y-1 p-2">
            {requests.map((request) => (
              <button
                type="button"
                key={request.id}
                onClick={() => setSelected(request.id)}
                aria-pressed={selected === request.id}
                className={`block w-full rounded-lg border-2 px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${selected === request.id ? "border-brand bg-blue-50 shadow-sm" : "border-transparent hover:bg-slate-50"}`}
              >
                <strong className="block text-sm text-slate-900">
                  {request.numero}
                </strong>
                <span className="mt-1 block text-xs text-slate-500">
                  {request.setor.nome} · {request.status.replaceAll("_", " ")}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-600">
                  {request.solicitante}
                </span>
              </button>
            ))}
          </div>
        </aside>
        <section className="flex min-h-[28rem] min-w-0 flex-col">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              {active
                ? `${active.numero} · ${active.setor.nome}`
                : "Selecione uma conversa"}
            </h2>
            <p className="text-xs text-slate-500">
              {active
                ? `Solicitante: ${active.solicitante} · ${active.status.replaceAll("_", " ")}`
                : "As mensagens ficam vinculadas à requisição."}
            </p>
          </div>
          <div
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto p-4"
          >
            {loading ? (
              <p className="text-sm text-slate-500">Carregando conversas…</p>
            ) : !requests.length ? (
              <EmptyState
                title="Nenhuma requisição"
                description="Crie uma requisição para iniciar uma conversa com o almoxarifado."
              />
            ) : messages.length ? (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`max-w-[88%] rounded-xl px-3 py-2 ${message.usuario_id === currentUserId ? "ml-auto bg-brand text-white" : "bg-slate-100 text-slate-800"}`}
                >
                  <div className="flex flex-wrap justify-between gap-3 text-xs opacity-75">
                    <strong>{message.usuario}</strong>
                    <time>{date(message.created_at)}</time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                    {message.texto}
                  </p>
                </article>
              ))
            ) : (
              <EmptyState
                title="Conversa iniciada"
                description="Ainda não há mensagens. Escreva para iniciar a conversa."
              />
            )}
          </div>
          <form
            onSubmit={(event) => void submit(event)}
            className="flex items-end gap-2 border-t border-slate-200 p-3"
          >
            <label className="sr-only" htmlFor="request-message">
              Mensagem
            </label>
            <textarea
              id="request-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={4000}
              disabled={!active || sending}
              placeholder={
                active ? "Escreva uma mensagem…" : "Selecione uma requisição"
              }
              rows={2}
              className="min-h-12 flex-1 resize-y border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <Button
              type="submit"
              disabled={!active || sending || !draft.trim()}
              className="min-h-12"
            >
              {sending ? "Enviando…" : "Enviar"}
            </Button>
          </form>
        </section>
      </Card>
    </div>
  );
}
