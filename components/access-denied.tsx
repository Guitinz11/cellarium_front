"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import { Button } from "@/components/ui";
import { clearApiSession } from "@/lib/warehouse-api";

export default function AccessDenied({ unavailable = false }: { unavailable?: boolean }) {
  const router = useRouter();
  return (
    <main className="access-denied-shell">
      <div className="access-denied-top"><Link href="/login" aria-label="Marcon, tela de acesso"><BrandLogo className="w-[132px]" priority/></Link></div>
      <section className="access-denied-content" aria-labelledby="access-denied-title">
        <span className="access-denied-icon" aria-hidden="true"><ShieldAlert size={24} strokeWidth={1.7}/></span>
        <p className="access-denied-eyebrow">Acesso ao sistema</p>
        <h1 id="access-denied-title">{unavailable ? "Não foi possível validar seu acesso" : "Você não tem credenciais para esta página"}</h1>
        <p className="access-denied-description">
          {unavailable
            ? "Não conseguimos confirmar suas credenciais agora. Verifique a conexão com o sistema e tente entrar novamente."
            : "Entre com uma conta válida e com o perfil autorizado para continuar."}
        </p>
        <Button onClick={() => { clearApiSession(); window.sessionStorage.removeItem("cellarium-admin-token"); window.sessionStorage.removeItem("cellarium-admin-user"); router.replace("/login"); }} className="access-denied-action">
          <ArrowLeft size={16} aria-hidden="true"/> Voltar para o login
        </Button>
        <p className="access-denied-footnote">Se você acredita que deveria ter acesso, fale com o administrador do sistema.</p>
      </section>
      <footer className="access-denied-footer"><span>Marcon <span aria-hidden="true">/</span> Gestão de materiais</span><span>Til Marcon</span></footer>
    </main>
  );
}
