"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { materialsCatalog, sectors } from "@/lib/mock-data";
import { getAllRequests, getServerRequests, saveSubmittedRequest, subscribeToRequests, type RequestRecord } from "@/lib/request-storage";
import { getRequesterCode, getRequesterSector, getServerRequesterValue, subscribeToRequesterSession } from "@/lib/requester-session";

import { Button, PageHeading } from "@/components/ui";

export default function RequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCodes = searchParams.getAll("material");
  const quantities = searchParams.getAll("qty");
  const selectedItems = selectedCodes.flatMap((code, index) => {
    const item = materialsCatalog.find((product) => product.code === code);
    return item ? [{ item, quantity: Number(quantities[index]) || 1 }] : [];
  });
  const requesterCode = useSyncExternalStore(subscribeToRequesterSession, getRequesterCode, getServerRequesterValue);
  const requester = requesterCode;
  const allRequests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const nextOrderNumber = Math.max(820, ...allRequests.map((request) => Number(request.order.match(/\d+/)?.[0] ?? 0))) + 1;
  const order = `OS-${nextOrderNumber}`;
  const sector = useSyncExternalStore(subscribeToRequesterSession, getRequesterSector, getServerRequesterValue);
  const [shift, setShift] = useState("");
  const [neededDate, setNeededDate] = useState("");
  const [notes, setNotes] = useState("");

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const matchingIds = getAllRequests().map((request) => Number(request.id.replace("REQ-", ""))).filter(Number.isFinite);
    const nextId = Math.max(2048, ...matchingIds) + 1;
    const request: RequestRecord = {
      id: `REQ-${nextId}`,
      order,
      requester,
      sector,
      shift,
      employeeCode: window.localStorage.getItem("cellarium-requester-code") ?? undefined,
      notes: notes.trim() || undefined,
      date: new Intl.DateTimeFormat("pt-BR").format(new Date(`${neededDate}T12:00:00`)),
      status: "Pendente",
      items: selectedItems.map(({ item, quantity }) => `${item.name} · ${quantity} ${item.unit}`).join("; "),
    };
    saveSubmittedRequest(request);
    router.push("/chat?request=" + encodeURIComponent(request.id) + "&submitted=1");
  }

  return <>
    <PageHeading eyebrow="Requisitante · Materiais" title="Nova requisição" description="Revise os materiais e informe quando precisa da entrega." action={<Link href="/materiais" className="ui-button ui-button--secondary">Trocar materiais</Link>}/>
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"><section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-7"><div className="mb-6 border-b border-slate-100 pb-4"><h2 className="text-sm font-bold text-slate-900">Dados da solicitação</h2><p className="mt-1 text-xs text-slate-500">Os campos com * são obrigatórios.</p></div>
      <form onSubmit={submitRequest}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Código do solicitante</span><input readOnly value={requester} placeholder="Identificado pelo login" className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800"/></label>
          <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Ordem de serviço</span><input readOnly value={order} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-800"/></label>
          <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Setor *</span><select required value={sector} disabled className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:opacity-80"><option value="">Selecione seu setor no acesso</option>{sectors.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Turno *</span><select required value={shift} onChange={(event) => setShift(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="">Selecione o turno</option><option>Manhã</option><option>Tarde</option><option>Noite</option></select></label>
          <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Data desejada da entrega *</span><input required type="date" value={neededDate} onChange={(event) => setNeededDate(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/></label>
        </div>
        <div className="mt-6"><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-bold text-slate-800">Material solicitado</h3><Link href="/materiais" className="text-xs font-semibold text-brand hover:underline">Escolher outro</Link></div><div className="space-y-2">{selectedItems.length ? selectedItems.map(({ item, quantity }) => <div key={item.code} className="grid grid-cols-[minmax(0,1fr)_100px] items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{item.name}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{item.code}</p></div><p className="text-right text-xs font-semibold text-slate-700">Qtd.: {quantity}</p></div>) : <div className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500">Nenhum material selecionado. <Link href="/materiais" className="font-semibold text-brand">Escolher materiais</Link></div>}</div></div>
        <label className="mt-5 block"><span className="mb-2 block text-xs font-semibold text-slate-700">Observações</span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Descreva a aplicação ou informações adicionais..." className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/></label>
        <div id="confirmar-requisicao" className="mt-6 scroll-mt-24 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row"><Link href="/materiais" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Voltar à seleção</Link><Button type="submit" disabled={!selectedItems.length || !sector || !requester}>Enviar requisição<ArrowRight size={16}/></Button></div>
      </form>
    </section><section className="h-fit rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-start gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-brand"><ShieldCheck size={18}/></div><div><h3 className="text-sm font-bold text-slate-900">Antes de solicitar</h3><p className="mt-1 text-xs leading-5 text-slate-500">Confira as informações para agilizar a separação dos materiais.</p></div></div><ul className="mt-5 space-y-4 text-xs text-slate-600"><li className="flex gap-2"><Check size={15} className="shrink-0 text-emerald-600"/>Sua ordem de serviço é gerada automaticamente.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emerald-600"/>Informe a quantidade necessária para o serviço.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emerald-600"/>Acompanhe o andamento pela tela de acompanhamento.</li></ul></section></div>
  </>;
}
