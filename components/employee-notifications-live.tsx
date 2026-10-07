"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button, Card, EmptyState, PageHeading } from "@/components/ui";
import { deleteAllNotifications, deleteNotification, listNotifications, markAllNotificationsRead, markNotificationRead, type ApiNotification } from "@/lib/warehouse-api";

const date = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function NotificationsLive() {
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const refresh = useCallback(async () => { try { setItems(await listNotifications()); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao carregar notificações."); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  async function markOne(id: number) { try { await markNotificationRead(id); setItems((current) => current.map((item) => item.id === id ? { ...item, lida: true } : item)); window.dispatchEvent(new Event("cellarium-notifications-updated")); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar a notificação."); } }
  async function markAll() { try { await markAllNotificationsRead(); setItems((current) => current.map((item) => ({ ...item, lida: true }))); window.dispatchEvent(new Event("cellarium-notifications-updated")); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar as notificações."); } }
  async function removeOne(id: number) {
    setDeletingId(id); setError(""); setNotice("");
    try {
      await deleteNotification(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setNotice("Notificação apagada.");
      window.dispatchEvent(new Event("cellarium-notifications-updated"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível apagar a notificação."); }
    finally { setDeletingId(null); }
  }
  async function removeAll() {
    if (!items.length || !window.confirm("Apagar todas as notificações? Esta ação não pode ser desfeita.")) return;
    setClearing(true); setError(""); setNotice("");
    try {
      const result = await deleteAllNotifications();
      setItems([]);
      setNotice(`${result.apagadas} ${result.apagadas === 1 ? "notificação apagada" : "notificações apagadas"}.`);
      window.dispatchEvent(new Event("cellarium-notifications-updated"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível apagar as notificações."); }
    finally { setClearing(false); }
  }
  return <div className="mx-auto max-w-5xl"><PageHeading eyebrow="Atualizações" title="Notificações" description="Acompanhe as mudanças nas suas requisições e mensagens do almoxarifado." action={items.length ? <div className="flex flex-wrap gap-2">{items.some((item) => !item.lida) && <Button variant="secondary" onClick={() => void markAll()}>Marcar todas como lidas</Button>}<Button variant="secondary" onClick={() => void removeAll()} loading={clearing} disabled={clearing}><Trash2 size={15}/>Apagar todas</Button></div> : undefined}/>
    {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
    <Card className="employee-notifications-panel p-5 sm:p-6"><div className="employee-notifications-heading mb-4 flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-slate-900">Recentes</h2><p className="mt-1 text-xs text-slate-500">{items.filter((item) => !item.lida).length} não lidas</p></div></div>
      {items.length ? <ul className="employee-notifications-list">{items.map((item) => <li key={item.id} className={`employee-notification-item ${item.lida ? "is-read" : "is-unread"}`}><div className="employee-notification-content"><h3 className="text-sm font-semibold text-slate-900">{item.titulo}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.mensagem}</p><time className="mt-2 block text-xs text-slate-500">{date(item.created_at)}</time>{item.requisicao_id && <Link href={`/chat?request=${item.requisicao_id}`} className="employee-notification-link mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-brand hover:underline">Abrir conversa</Link>}</div><div className="flex shrink-0 items-center gap-2">{!item.lida && <Button variant="secondary" className="employee-notification-action" onClick={() => void markOne(item.id)}>Marcar lida</Button>}<button type="button" aria-label={`Apagar notificação: ${item.titulo}`} title="Apagar notificação" disabled={deletingId === item.id || clearing} onClick={() => void removeOne(item.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50"><Trash2 size={16}/></button></div></li>)}</ul> : <EmptyState title="Você está em dia" description="As atualizações das suas requisições aparecerão aqui."/>}
    </Card>
  </div>;
}
