"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Building2, UserRound } from "lucide-react";
import { Button, PageHeading } from "@/components/ui";
import { ApiError, getCurrentUser, type ApiUser } from "@/lib/warehouse-api";

type CurrentUser = ApiUser & { setor: string | null; atendimento_atual: { setor: string | null } | null };

export default function WarehouseProfileLive() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    setError("");
    try {
      setUser(await getCurrentUser());
    } catch (cause) {
      setUser(null);
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar o perfil do backend.");
    } finally {
      setLoading(false);
    }
  }

  const reloadEvent = useEffectEvent(reload);
  useEffect(() => {
    const timer = window.setTimeout(() => void reloadEvent(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return <>
    <PageHeading eyebrow="Conta conectada" title="Meu perfil" description="Identidade e setor retornados pelo backend." />
    {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {loading ? <p role="status" className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">Carregando perfil…</p> : user ? <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-5 sm:p-7"><div className="flex items-center gap-4 border-b border-slate-100 pb-5"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700"><UserRound size={22}/></span><div><h2 className="text-base font-semibold text-slate-900">{user.nome}</h2><p className="mt-1 text-xs text-slate-500">{user.login}</p></div></div><dl className="grid gap-4 pt-5 sm:grid-cols-2"><div><dt className="text-[10px] font-semibold uppercase text-slate-400">Perfil</dt><dd className="mt-1 text-sm font-medium text-slate-800">{user.perfil}</dd></div><div><dt className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400"><Building2 size={13}/>Setor</dt><dd className="mt-1 text-sm font-medium text-slate-800">{user.atendimento_atual?.setor ?? user.setor ?? "Não cadastrado"}</dd></div><div><dt className="text-[10px] font-semibold uppercase text-slate-400">Conta</dt><dd className="mt-1 text-sm font-medium text-slate-800">{user.ativo ? "Ativa" : "Inativa"}</dd></div></dl></section> : <Button variant="secondary" onClick={() => void reload()}>Tentar novamente</Button>}
  </>;
}
