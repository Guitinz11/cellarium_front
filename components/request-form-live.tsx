"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, RefreshCw } from "lucide-react";
import { Button, PageHeading } from "@/components/ui";
import { ApiError, createRequest, getCurrentUser, listMaterials, type ApiMaterial, type ApiUser } from "@/lib/warehouse-api";

export default function RequestFormLive() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [materials, setMaterials] = useState<ApiMaterial[]>([]);
  const [user, setUser] = useState<(ApiUser & { setor: string | null }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const selectedIds = searchParams.getAll("material");
  const quantities = searchParams.getAll("qty");

  async function loadFormData() {
    setLoading(true);
    setError("");
    try {
      const [currentUser, materialRows] = await Promise.all([getCurrentUser(), listMaterials({ limit: 200 })]);
      setUser(currentUser);
      setMaterials(materialRows);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar seus dados do backend.");
    } finally {
      setLoading(false);
    }
  }

  const loadEvent = useEffectEvent(loadFormData);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvent(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const selected = useMemo(() => selectedIds.flatMap((id, index) => {
    const material = materials.find((item) => item.id === Number(id));
    const quantity = Number(quantities[index]);
    return material && Number.isFinite(quantity) && quantity > 0 ? [{ material, quantity }] : [];
  }), [materials, quantities, selectedIds]);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !selected.length) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await createRequest({
        observacao: notes.trim() || undefined,
        itens: selected.map(({ material, quantity }) => ({ material_id: material.id, quantidade_solicitada: quantity })),
      });
      router.push(`/acompanhar?request=${encodeURIComponent(result.numero)}`);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível enviar a requisição ao backend.");
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <PageHeading eyebrow="Requisitante · Solicitação" title="Confirmar requisição" description="Os itens serão enviados ao backend e vinculados ao setor cadastrado na sua conta." action={<Link href="/materiais" className="text-xs font-semibold text-blue-800">Voltar ao catálogo</Link>} />
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><span>{error}</span><Button variant="secondary" onClick={() => void loadFormData()}><RefreshCw size={15}/>Tentar novamente</Button></div>}
    {loading ? <p role="status" className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">Carregando conta e materiais…</p> : <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(250px,.7fr)]">
      <form onSubmit={submitRequest} className="rounded-lg border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-sm font-semibold text-slate-900">Itens selecionados</h2><p className="mt-1 text-xs text-slate-500">Confira os materiais antes de enviar.</p>
        {selected.length ? <ul className="mt-4 divide-y divide-slate-100 border-y border-slate-100">{selected.map(({ material, quantity }) => <li key={material.id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="text-sm font-semibold text-slate-800">{material.descricao}</p><p className="mt-1 font-mono text-[11px] text-slate-500">{material.codigo}</p></div><span className="shrink-0 text-sm font-semibold text-slate-700">{quantity}</span></li>)}</ul> : <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-600">Nenhum material válido selecionado. <Link href="/materiais" className="font-semibold text-blue-800">Voltar ao catálogo</Link></p>}
        <label className="mt-5 block text-xs font-semibold text-slate-700" htmlFor="request-notes">Observação para o almoxarife</label><textarea id="request-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Instruções ou contexto da solicitação"/>
        <Button type="submit" className="mt-5 w-full sm:w-auto" loading={submitting} disabled={!selected.length || !user || submitting}><Check size={16}/>Enviar ao backend<ArrowRight size={15}/></Button>
      </form>
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-semibold text-slate-900">Conta autenticada</h2><dl className="mt-4 divide-y divide-slate-100 border-y border-slate-100 text-xs"><div className="py-3"><dt className="text-slate-500">Solicitante</dt><dd className="mt-1 font-semibold text-slate-800">{user?.nome ?? "Não disponível"}</dd></div><div className="py-3"><dt className="text-slate-500">Setor cadastrado</dt><dd className="mt-1 font-semibold text-slate-800">{user?.setor ?? "Não cadastrado"}</dd></div></dl></aside>
    </div>}
  </>;
}
