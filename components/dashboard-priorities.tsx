"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { getAllRequests, getServerRequests, subscribeToRequests, updateRequestStatus } from "@/lib/request-storage";

export default function DashboardPriorities() {
  const router = useRouter();
  const requests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const priorities = requests.filter((request) => request.status === "Pendente").slice(0, 4);

  if (!priorities.length) return <EmptyState title="Nenhum pedido aguardando" description="As novas solicitações aparecerão aqui, prontas para atendimento." icon={<ClipboardList size={24}/>}/>;
  return <div>{priorities.map((request) => <div key={request.id} className="priority-row"><div className="priority-row-body"><div className="priority-row-title"><strong>{request.id}</strong><span>{request.order}</span></div><p>{request.requester} · {request.shift ?? "Turno não informado"}<br/>{request.sector} · entrega {request.date}</p></div><Button onClick={() => { updateRequestStatus(request.id, "Em andamento"); router.push(`/separacao?request=${encodeURIComponent(request.id)}`); }}>Aceitar<ArrowRight size={13}/></Button></div>)}</div>;
}
