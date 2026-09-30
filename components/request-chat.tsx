"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { MessageCircle, Send } from "lucide-react";
import { getAllRequests, type RequestRecord } from "@/lib/request-storage";
import { getRequestMessages, saveChatMessage, type ChatMessage, type ChatRole } from "@/lib/chat-storage";

export default function RequestChat({ role }: { role: ChatRole }) {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("request") ?? "";
  const [availableRequests, setAvailableRequests] = useState<RequestRecord[]>([]);
  const [selectedId, setSelectedId] = useState(requestedId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    function loadRequests() {
      const employeeCode = window.localStorage.getItem("cellarium-requester-code");
      const nextRequests = getAllRequests().filter((request) => role === "warehouse" || Boolean(employeeCode && request.employeeCode === employeeCode));
      setAvailableRequests(nextRequests);
      setSelectedId((current) => {
        if (requestedId && nextRequests.some((request) => request.id === requestedId)) return requestedId;
        return nextRequests.some((request) => request.id === current) ? current : nextRequests[0]?.id ?? "";
      });
    }

    loadRequests();
    window.addEventListener("storage", loadRequests);
    return () => window.removeEventListener("storage", loadRequests);
  }, [requestedId, role]);

  useEffect(() => {
    function loadMessages() {
      setMessages(getRequestMessages(selectedId));
    }

    loadMessages();
    window.addEventListener("storage", loadMessages);
    window.addEventListener("cellarium-chat-updated", loadMessages);
    return () => {
      window.removeEventListener("storage", loadMessages);
      window.removeEventListener("cellarium-chat-updated", loadMessages);
    };
  }, [selectedId]);

  const selectedRequest = availableRequests.find((request) => request.id === selectedId);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!selectedRequest || !text) return;

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      requestId: selectedRequest.id,
      role,
      author: role === "employee" ? selectedRequest.requester : "Carlos Silva · Almoxarife",
      text,
      sentAt: new Date().toISOString(),
    };
    saveChatMessage(message);
    setDraft("");
  }

  return <section className="mx-auto max-w-4xl">
    <div className="mb-6"><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.13em] text-[#0B57D0]">{role === "employee" ? "Portal do requisitante" : "Operação · Almoxarifado"}</p><h1 className="text-[27px] font-semibold text-slate-900 sm:text-[30px]">Conversas</h1><p className="mt-2 text-sm leading-6 text-slate-500">Mensagens vinculadas a cada requisição.</p></div>
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#0B57D0]"><MessageCircle size={19}/></span><div><h2 className="text-sm font-bold text-slate-900">Chat da requisição</h2><p className="mt-1 text-xs text-slate-500">{selectedRequest ? `${selectedRequest.requester} · ${selectedRequest.sector}` : "Selecione uma requisição"}</p></div></div>{availableRequests.length > 0 && <select aria-label="Selecionar requisição para conversar" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">{availableRequests.map((request) => <option key={request.id} value={request.id}>{request.id} · {request.requester}</option>)}</select>}</div>
      {selectedRequest ? <>
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-600"><span>Setor: <strong className="font-semibold text-slate-800">{selectedRequest.sector}</strong></span><span>Turno: <strong className="font-semibold text-slate-800">{selectedRequest.shift ?? "Não informado"}</strong></span><span>OS: <strong className="font-mono font-semibold text-slate-800">{selectedRequest.order}</strong></span></div>
        <div aria-live="polite" className="flex min-h-[280px] flex-col gap-3 overflow-y-auto bg-slate-50/60 p-4 sm:p-5">{messages.length ? messages.map((message) => <article key={message.id} className={`max-w-[88%] rounded-lg border px-3 py-2.5 sm:max-w-[75%] ${message.role === role ? "ml-auto border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><p className="text-[11px] font-bold text-slate-800">{message.author}</p><time className="text-[10px] text-slate-400">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(message.sentAt))}</time></div><p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-5 text-slate-700">{message.text}</p></article>) : <p className="m-auto text-center text-xs text-slate-500">Nenhuma mensagem nesta conversa.</p>}</div>
        <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 p-3 sm:p-4"><label className="sr-only" htmlFor="chat-message">Escreva uma mensagem</label><input id="chat-message" required value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escreva uma mensagem..." className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/><button type="submit" aria-label="Enviar mensagem" title="Enviar mensagem" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0B57D0] text-white transition hover:bg-blue-800"><Send size={17}/></button></form>
      </> : <div className="flex min-h-56 items-center justify-center px-5 text-center text-sm text-slate-500">{role === "employee" ? "Suas conversas aparecerão aqui após o envio de uma requisição." : "Nenhuma requisição disponível para conversa."}</div>}
    </div>
  </section>;
}