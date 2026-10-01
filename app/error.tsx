"use client";

import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-[100svh] items-center justify-center bg-background px-6"><section role="alert" className="max-w-md text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><CircleAlert size={24}/></span><h1 className="mt-6 text-2xl font-semibold tracking-tight">Não foi possível abrir esta página</h1><p className="mt-3 text-sm leading-6 text-slate-500">Tente novamente para continuar sua operação.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button onClick={reset}><RotateCcw size={16}/>Tentar novamente</Button><Link href="/login" className="ui-button ui-button--secondary">Voltar ao acesso</Link></div></section></main>;
}
