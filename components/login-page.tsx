"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

type Profile = "funcionario" | "almoxarife";

export default function LoginPage() {
  const [profile, setProfile] = useState<Profile>("funcionario");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="login-shell grid min-h-screen lg:grid-cols-[1.06fr_.94fr]">
      <section className="login-showcase relative min-h-[300px] overflow-hidden lg:min-h-screen" aria-label="Apresentação Marcon">
        <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline poster="/logo.png" aria-label="Vídeo institucional da Marcon">
          <source src="/video_tela_login.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-slate-950/30" />
        <div className="relative z-10 flex h-full min-h-[300px] flex-col justify-between p-6 sm:p-10 lg:min-h-screen lg:p-14">
          <Link href="/login" className="inline-flex w-fit items-center rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur transition hover:scale-[1.02]" aria-label="Marcon, página inicial de acesso">
            <Image src="/logo.png" alt="Marcon" width={178} height={88} priority className="h-9 w-auto object-contain sm:h-11" />
          </Link>
          <div className="max-w-xl pb-2 text-white [text-shadow:0_2px_18px_rgba(0,0,0,.55)]">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/40 bg-slate-950/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-white backdrop-blur-md sm:text-xs"><span className="h-1.5 w-1.5 rounded-full bg-sky-300" />Portal interno Marcon</span>
            <h1 className="max-w-lg text-3xl font-bold leading-[1.06] tracking-[-.04em] sm:text-5xl lg:text-[3.5rem]">Tudo em movimento. <span className="text-sky-300">Do seu jeito.</span></h1>
            <p className="mt-4 max-w-md text-sm font-medium leading-6 text-white sm:mt-5 sm:text-base sm:leading-7">Acesse o portal de materiais e acompanhe a operação com praticidade, onde estiver.</p>
            <div className="mt-7 hidden items-center gap-2 text-xs font-semibold text-white sm:flex"><ShieldCheck size={16} className="text-sky-300" />Acesso seguro para equipe Marcon</div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 rounded-full bg-sky-400/20 blur-3xl" />
      </section>

      <section className="login-form-side relative flex min-h-[610px] items-center justify-center px-5 py-12 sm:px-10 lg:min-h-screen lg:px-12 xl:px-20">
        <ThemeToggle className="absolute right-5 top-5 !border-slate-200/80 !bg-white/70 !text-slate-600 sm:right-8 sm:top-8" />
        <div className="w-full max-w-[430px]">
          <div className="mb-9 lg:mb-11">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#0b57d0]">Bem-vindo(a)</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-.04em] text-slate-950 sm:text-[2.6rem]">Acesse sua conta</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Entre com suas credenciais para continuar no portal Marcon.</p>
          </div>

          <div className="mb-7 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100/80 p-1" role="tablist" aria-label="Tipo de acesso">
            {(["funcionario", "almoxarife"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={profile === item} onClick={() => setProfile(item)} className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition duration-200 ${profile === item ? "bg-white text-[#0b57d0] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{item === "funcionario" ? "Funcionário" : "Almoxarife"}</button>)}
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">E-mail ou código de acesso</span>
              <span className="flex h-[50px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10"><Mail size={18} className="shrink-0 text-slate-400" /><input autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@marcon.com.br" className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" /></span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Senha</span>
              <span className="flex h-[50px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10"><LockKeyhole size={18} className="shrink-0 text-slate-400" /><input autoComplete="current-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="rounded-md p-1 text-slate-400 transition hover:text-slate-700">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
            </label>
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600"><input type="checkbox" className="h-4 w-4 rounded accent-[#0b57d0]" />Manter conectado</label>
              <a href="mailto:ti@marcon.com.br?subject=Recuperar%20acesso" className="rounded text-sm font-semibold text-[#0b57d0] transition hover:text-blue-800">Esqueceu a senha?</a>
            </div>
            <Link href={profile === "funcionario" ? "/materiais" : "/painel"} className="group mt-2 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b57d0] px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(11,87,208,.2)] transition duration-200 hover:scale-[1.01] hover:bg-blue-800 hover:shadow-[0_14px_30px_rgba(11,87,208,.27)] active:scale-[.99]">Entrar no portal <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></Link>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 text-center">
            <p className="text-xs leading-5 text-slate-500">Precisa de ajuda para acessar?</p>
            <a href="mailto:ti@marcon.com.br" className="mt-1 inline-block rounded text-sm font-semibold text-[#0b57d0] transition hover:text-blue-800">Fale com o suporte de TI</a>
          </div>
          <p className="mt-9 text-center text-[11px] font-medium tracking-wide text-slate-400">© {new Date().getFullYear()} Marcon · Acesso restrito</p>
        </div>
      </section>
    </main>
  );
}
