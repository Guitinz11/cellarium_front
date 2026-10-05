"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Boxes, ClipboardList, Eye, EyeOff, LockKeyhole, PackageCheck, UserRound } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui";
import { ApiError, login, listSectors, normalizeUserProfile, storeApiSession } from "@/lib/warehouse-api";

type Profile = "funcionario" | "almoxarife";

export default function LoginPage() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [profile, setProfile] = useState<Profile>("funcionario");
  const [showPassword, setShowPassword] = useState(false);
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [introReady, setIntroReady] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    if (!introReady) return;
    const completion = window.setTimeout(() => setIntroComplete(true), 4600);
    return () => window.clearTimeout(completion);
  }, [introReady]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (motion.matches) { video.current?.pause(); setIntroReady(true); }
      else void video.current?.play().catch(() => setIntroReady(true));
    };
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!loginValue.trim()) { setError("Informe seu login cadastrado."); return; }
    setError("");
    setSubmitting(true);
    try {
      const session = await login(loginValue.trim(), password);
      const actualProfile = normalizeUserProfile(session.usuario.perfil);
      const isRequester = actualProfile === "funcionario";
      if (profile === "funcionario" && !isRequester) {
        setSubmitting(false);
        setError("Este usuário não está cadastrado como funcionário/solicitante no backend.");
        return;
      }
      if (profile === "almoxarife" && actualProfile !== "almoxarife") {
        setSubmitting(false);
        setError("Este usuário não está cadastrado para acessar o almoxarifado.");
        return;
      }
      storeApiSession(session.access_token, session.usuario);
      if (isRequester) {
        const availableSectors = await listSectors();
        const requesterSector = availableSectors.find((item) => item.id === session.usuario.setor_id)?.nome;
        if (!requesterSector) {
          setSubmitting(false);
          setError("O usuário autenticado não possui um setor válido cadastrado.");
          return;
        }
        window.localStorage.setItem("cellarium-requester-code", session.usuario.login);
        window.localStorage.setItem("cellarium-requester-sector", requesterSector);
        window.dispatchEvent(new Event("cellarium-requester-profile-updated"));
        router.push("/materiais");
      } else {
        router.push("/fila");
      }
    } catch (cause) {
      setSubmitting(false);
      setError(cause instanceof ApiError ? cause.message : "Não foi possível entrar. Verifique a API e tente novamente.");
    }
  }

  return <main className="login-shell grid min-h-[100svh] lg:grid-cols-[1.05fr_1fr]">
    <section className={`login-showcase relative overflow-hidden ${introReady ? "intro-ready" : ""} ${introComplete ? "intro-complete" : ""}`} aria-label="Apresentação Marcon">
      <video ref={video} onPlaying={() => setIntroReady(true)} onError={() => setIntroReady(true)} className="absolute inset-0 h-full w-full object-cover" muted loop playsInline preload="metadata" poster="/logo.png" aria-hidden="true"><source src="/video_tela_login.mp4" type="video/mp4"/></video>
      <div className="login-video-wash" aria-hidden="true"/>
      <div className="login-showcase-content relative z-10 flex h-full flex-col justify-between p-6 sm:p-10 lg:p-14">
        <div className="relative z-10 flex items-center justify-between gap-4"><Link href="/login" className="login-logo" aria-label="Marcon, página de acesso"><BrandLogo className="w-[146px]" priority/></Link><span className="login-kicker login-year hidden sm:block">Desde 1988</span></div>
        <div className="login-copy max-w-xl py-3 lg:pb-4"><p className="login-kicker login-reveal login-reveal-1 mb-5 hidden sm:block">Pessoas, materiais e produção.</p><h1><span className="login-title-line login-reveal login-reveal-2">Precisão em cada</span><span className="login-title-accent login-reveal login-reveal-3">movimento.</span></h1><p className="login-reveal login-reveal-4 mt-6 hidden max-w-md text-sm leading-7 text-[#d0dced] sm:block">Da requisição à entrega, uma operação mais simples. Tudo o que sua equipe precisa, no lugar certo.</p><div className="login-feature-list"><div className="login-reveal login-reveal-5"><ClipboardList size={20}/><strong>Solicite materiais</strong></div><div className="login-reveal login-reveal-6"><Boxes size={20}/><strong>Organize o estoque</strong></div><div className="login-reveal login-reveal-7"><PackageCheck size={20}/><strong>Acompanhe a entrega</strong></div></div></div>
        <p className="login-kicker login-mobile-caption login-reveal login-reveal-1 mt-4 text-[9px] sm:hidden">Gestão de materiais · Portal Marcon</p>
      </div>
    </section>
    <section className="login-form-side relative flex items-center justify-center px-6 py-14 sm:px-10 lg:min-h-[100svh] lg:px-14">
      <ThemeToggle className="absolute right-6 top-5 sm:right-8 sm:top-7"/>
      <div className="w-full max-w-[400px]">
        <div className="mb-8"><p className="ui-eyebrow">Bem-vindo ao portal Marcon</p><h2>Acesse sua operação.</h2><p className="mt-3 text-[13px] leading-6 text-slate-500">Escolha seu perfil para solicitar materiais ou gerenciar o almoxarifado.</p></div>
        <div className="login-profile-switch mb-7" role="group" aria-label="Tipo de acesso">{(["funcionario", "almoxarife"] as const).map((item) => <button key={item} type="button" aria-pressed={profile === item} onClick={() => { setProfile(item); setError(""); }}>{item === "funcionario" ? <UserRound size={16}/> : <Boxes size={16}/>} {item === "funcionario" ? "Funcionário" : "Almoxarife"}</button>)}</div>
        <form onSubmit={handleLogin} className="space-y-5">
          <label className="block" htmlFor="login-identifier"><span className="mb-2 block text-xs font-medium text-slate-700">Login cadastrado</span><span className="flex h-12 items-center gap-3 rounded-lg border border-slate-300 px-3.5"><UserRound size={17} className="shrink-0 text-slate-400"/><input id="login-identifier" required autoComplete="username" value={loginValue} onChange={(event) => { setLoginValue(event.target.value); setError(""); }} placeholder="Informe seu login" className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800"/></span><span className="mt-1.5 block text-[10px] text-slate-500">Use o valor cadastrado em usuarios.login.</span></label>
          {profile === "funcionario" && <p className="-mt-2 text-[11px] text-slate-500">Seu setor será carregado do cadastro vinculado à sua conta.</p>}
          <label className="block" htmlFor="login-password"><span className="mb-2 block text-xs font-medium text-slate-700">Senha</span><span className="flex h-12 items-center gap-3 rounded-lg border border-slate-300 px-3.5"><LockKeyhole size={17} className="shrink-0 text-slate-400"/><input id="login-password" autoComplete="current-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800"/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword} className="shell-icon-button -mr-2">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label>
          <div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" className="h-4 w-4"/>Manter conectado</label><a href="mailto:ti@marcon.com.br?subject=Recuperar%20acesso" className="text-xs font-medium text-brand">Esqueceu a senha?</a></div>
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs leading-5 text-rose-700">{error}</p>}
          <Button type="submit" loading={submitting} className="login-submit">{submitting ? "Abrindo seu portal…" : "Entrar no portal"}{!submitting && <ArrowRight size={16}/>}</Button>
        </form>
        <div className="mt-7 border-t border-slate-200 pt-5 text-center"><p className="text-[11px] text-slate-500">Precisa de ajuda? <a href="mailto:ti@marcon.com.br" className="font-medium text-brand">Fale com o suporte de TI</a></p></div>
      </div>
    </section>
  </main>;
}
