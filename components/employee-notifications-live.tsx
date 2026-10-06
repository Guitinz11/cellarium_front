"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, EmptyState, PageHeading } from "@/components/ui";
import { listNotifications, markAllNotificationsRead, markNotificationRead, type ApiNotification } from "@/lib/warehouse-api";

const date = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function NotificationsLive() {
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => { try { setItems(await listNotifications()); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao carregar notificações."); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  async function markOne(id: number) { try { await markNotificationRead(id); setItems((current) => current.map((item) => item.id === id ? { ...item, lida: true } : item)); window.dispatchEvent(new Event("cellarium-notifications-updated")); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar a notificação."); } }
  async function markAll() { try { await markAllNotificationsRead(); setItems((current) => current.map((item) => ({ ...item, lida: true }))); window.dispatchEvent(new Event("cellarium-notifications-updated")); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar as notificações."); } }
  return <div className="mx-auto max-w-5xl"><PageHeading eyebrow="Atualizações" title="Notificações" description="Acompanhe as mudanças nas suas requisições e mensagens do almoxarifado." action={items.some((item) => !item.lida) ? <Button variant="secondary" onClick={() => void markAll()}>Marcar todas como lidas</Button> : undefined}/>
    {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    <Card className="p-5 sm:p-6"><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-slate-900">Recentes</h2><p className="mt-1 text-xs text-slate-500">{items.filter((item) => !item.lida).length} não lidas</p></div></div>
      {items.length ? <ul className="divide-y divide-slate-100">{items.map((item) => <li key={item.id} className={`flex items-start justify-between gap-4 py-4 ${item.lida ? "opacity-70" : ""}`}><div><h3 className="text-sm font-semibold text-slate-900">{item.titulo}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.mensagem}</p><time className="mt-2 block text-xs text-slate-500">{date(item.created_at)}</time>{item.requisicao_id && <Link href={`/chat?request=${item.requisicao_id}`} className="mt-2 inline-block text-sm font-semibold text-brand hover:underline">Abrir conversa</Link>}</div>{!item.lida && <Button variant="secondary" className="shrink-0" onClick={() => void markOne(item.id)}>Marcar lida</Button>}</li>)}</ul> : <EmptyState title="Você está em dia" description="As atualizações das suas requisições aparecerão aqui."/>}
    </Card>
  </div>;
}
