import Link from "next/link";
import { ArrowLeft, Building2, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";

import { PageHeading } from "@/components/ui";

const profileDetails = [
  { label: "Nome completo", value: "Carlos Silva", icon: UserRound },
  { label: "Função", value: "Almoxarife", icon: ShieldCheck },
  { label: "Unidade", value: "Planta 01", icon: Building2 },
  { label: "Setor", value: "Almoxarifado", icon: Building2 },
  { label: "E-mail", value: "Não informado", icon: Mail },
  { label: "Telefone", value: "Não informado", icon: Phone },
];

export default function WarehouseProfileScreen() {
  return <>
    <Link href="/painel" className="mb-6 inline-flex min-h-9 items-center gap-2 rounded-md text-sm font-semibold text-slate-600 transition hover:text-brand"><ArrowLeft size={16}/>Voltar ao painel</Link>
    <PageHeading eyebrow="Conta do almoxarifado" title="Meu perfil" description="Informações da pessoa responsável por esta operação."/>
    <section className="max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/70 p-5 sm:p-7"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#102238] text-lg font-semibold text-white">CS</div><div><h2 className="text-base font-bold text-slate-900">Carlos Silva</h2><p className="mt-1 text-sm text-slate-500">Almoxarife · Planta 01</p></div><span className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600"/>Ativo</span></div>
      <dl className="grid gap-x-8 sm:grid-cols-2">{profileDetails.map(({ label, value, icon: Icon }) => <div key={label} className="border-b border-slate-100 px-5 py-4 last:border-0 sm:px-7"><dt className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400"><Icon size={17} aria-hidden="true"/>{label}</dt><dd className="ml-7 mt-1 text-sm font-medium text-slate-800">{value}</dd></div>)}</dl>
    </section>
  </>;
}
