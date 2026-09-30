"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { getAllRequests, getServerRequests, subscribeToRequests, updateRequestStatus } from "@/lib/request-storage";

export default function DashboardPriorities() {
  const router = useRouter();
  const requests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const priorities = requests.filter((request) => request.status === "Pendente").slice(0, 4);

  return <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-y border-slate-100 bg-slate-50/70 text-[10px] font-medium uppercase tracking-wide text-slate-500"><th className="px-5 py-3">Requisição</th><th className="px-4 py-3">OS</th><th className="px-4 py-3">Solicitante</th><th className="px-4 py-3">Turno</th><th className="px-4 py-3">Data desejada</th><th className="px-5 py-3 text-right">Ação</th></tr></thead><tbody>{priorities.map((request) => <tr key={request.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"><td className="px-5 py-3 font-mono text-xs font-semibold text-slate-800">{request.id}</td><td className="px-4 py-3 font-mono text-xs text-slate-600">{request.order}</td><td className="px-4 py-3 text-xs font-medium text-slate-800">{request.requester}</td><td className="px-4 py-3 text-xs text-slate-600">{request.shift ?? "Não informado"}</td><td className="px-4 py-3 text-xs text-slate-500">{request.date}</td><td className="px-5 py-3 text-right"><button type="button" onClick={() => { updateRequestStatus(request.id, "Em andamento"); router.push(`/separacao?request=${encodeURIComponent(request.id)}`); }} className="min-h-8 rounded-md bg-[#0B57D0] px-3 text-xs font-semibold text-white transition hover:bg-blue-800">Aceitar</button></td></tr>)}</tbody></table>{priorities.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">Nenhum pedido aguardando separação.</p>}</div>;
}
