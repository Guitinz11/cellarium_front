"use client";

import { useSyncExternalStore } from "react";
import { Bell, Check, Clock3, PackageCheck } from "lucide-react";
import { getRequesterCode, getRequesterSector, getServerRequesterValue, subscribeToRequesterSession } from "@/lib/requester-session";
import { getReadNotificationsSnapshot, getSectorNoticesSnapshot, getServerReadNotificationsSnapshot, getServerSectorNoticesSnapshot, markNotificationAsRead, parseReadNotificationIds, parseSectorNotices, subscribeToReadNotifications, subscribeToSectorNotices } from "@/lib/notification-storage";
import { getAllRequests, getServerRequests, subscribeToRequests } from "@/lib/request-storage";

export default function EmployeeNotifications() {
  const employeeCode = useSyncExternalStore(subscribeToRequesterSession, getRequesterCode, getServerRequesterValue);
  const employeeSector = useSyncExternalStore(subscribeToRequesterSession, getRequesterSector, getServerRequesterValue);
  const requests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const noticeSnapshot = useSyncExternalStore(subscribeToSectorNotices, getSectorNoticesSnapshot, getServerSectorNoticesSnapshot);
  const readScope = `employee:${employeeCode || employeeSector || "default"}`;
  const readSnapshot = useSyncExternalStore(subscribeToReadNotifications, () => getReadNotificationsSnapshot(readScope), getServerReadNotificationsSnapshot);
  const readIds = parseReadNotificationIds(readSnapshot);
  const unreadNotices = parseSectorNotices(noticeSnapshot)
    .filter((notice) => notice.sector === employeeSector && !readIds.includes(notice.id))
    .sort((first, second) => second.createdAt - first.createdAt);
  const requestUpdates = requests.filter((request) => request.employeeCode === employeeCode).flatMap((request) => [
    ...(request.status === "Em andamento" ? [{
      id: `${request.id}:in-progress`,
      title: "Requisição em andamento",
      detail: `${request.id} · ${request.order}: o almoxarife iniciou a separação.`,
      delivered: false,
    }] : []),
    ...(request.deliveryConfirmed ? [{
      id: `${request.id}:delivery-confirmed`,
      title: "Entrega confirmada pelo almoxarife",
      detail: `${request.id} · ${request.order}: os materiais foram entregues e a OS está aberta para uso.`,
      delivered: true,
    }] : []),
  ]).filter((notification) => !readIds.includes(notification.id));
  const unreadCount = unreadNotices.length + requestUpdates.length;

  return <section aria-labelledby="employee-notifications-title" className="mx-auto max-w-4xl">
    <div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#0B57D0]"><Bell size={19}/></span><div><p className="text-[11px] font-semibold uppercase tracking-wide text-[#0B57D0]">Portal do funcionário</p><h1 id="employee-notifications-title" className="text-2xl font-semibold text-slate-900">Notificações</h1></div><span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{unreadCount}</span></div>
    {unreadCount ? <div className="space-y-3">
      {requestUpdates.map((notification) => <article key={notification.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${notification.delivered ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-[#0B57D0]"}`}>{notification.delivered ? <PackageCheck size={15}/> : <Clock3 size={15}/>}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{notification.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{notification.detail}</p></div><button type="button" onClick={() => markNotificationAsRead(readScope, notification.id)} aria-label={`Marcar como lida: ${notification.title}`} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><Check size={14}/><span className="hidden sm:inline">Marcar como lida</span><span className="sm:hidden">Lida</span></button></article>)}
      {unreadNotices.map((notice) => <article key={notice.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700"><Bell size={15}/></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{notice.itemName} <span className="font-normal text-slate-500">· {notice.code}</span></p><p className="mt-1 text-sm leading-6 text-slate-600">{notice.text}</p><p className="mt-2 text-[11px] text-slate-400">{notice.sector} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(notice.createdAt)}</p></div><button type="button" onClick={() => markNotificationAsRead(readScope, notice.id)} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><Check size={14}/><span className="hidden sm:inline">Marcar como lida</span><span className="sm:hidden">Lida</span></button></article>)}
    </div> : <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><Check size={24} className="mx-auto text-emerald-600"/><p className="mt-3 text-sm font-semibold text-slate-800">Tudo em dia</p><p className="mt-1 text-xs text-slate-500">Não há notificações novas para {employeeSector || "seu setor"}.</p></div>}
  </section>;
}