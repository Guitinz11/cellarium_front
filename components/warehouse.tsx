"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Activity, ArrowRight, Bell, Boxes, Building2, Check, CheckSquare, ChevronDown, Clock3, ClipboardList, Eye, FileText, LayoutDashboard, LogOut, Menu, Package, PackageCheck, Plus, QrCode, Search, ShieldCheck, Truck, UserRound, X } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import SectorStockPage from "@/components/sector-stock";
import { navItems, requests, sectors, stock } from "@/lib/mock-data";
import ThemeToggle from "@/components/theme-toggle";

const iconMap = { layout: LayoutDashboard, requests: ClipboardList, boxes: Boxes, history: Clock3, inventory: Package, analytics: Activity };

function subscribeToClock() {
  return () => {};
}

function getTodaySnapshot() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function getServerTodaySnapshot() {
  return "";
}

function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" }) {
  const style = variant === "primary" ? "bg-brand text-white hover:bg-brand-strong" : variant === "secondary" ? "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/50 hover:text-[#0B57D0]" : "text-slate-600 hover:bg-slate-100";
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition duration-180 ease-out hover:enabled:-translate-y-px hover:enabled:shadow-sm active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 ${style} ${className}`} {...props}>{children}</button>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section data-reveal data-reveal-item className={`card-interactive overflow-hidden rounded-[14px] border border-slate-200 bg-white ${className}`}>{children}</section>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { Pendente: "bg-amber-50 text-amber-700 ring-amber-200", "Em andamento": "bg-blue-50 text-blue-700 ring-blue-200", Concluido: "bg-emerald-50 text-emerald-700 ring-emerald-200", Critico: "bg-rose-50 text-rose-700 ring-rose-200" };
  const normalizedStatus = status.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[normalizedStatus] || styles.Pendente}`}><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  const pathname = usePathname();
  return <>
    {open && <button aria-label="Fechar menu" className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={close} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/5 bg-[#102238] text-slate-300 transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-[82px] items-center border-b border-white/[.08] px-5">
        <Link href="/painel" aria-label="Marcon, painel do almoxarifado" className="group flex min-w-0 flex-col gap-1 rounded-sm focus-visible:outline-offset-4">
          <BrandLogo className="w-[164px]" />
          <span className="text-[9px] font-medium uppercase tracking-[.16em] text-slate-400">Almoxarifado</span>
        </Link>
        <button aria-label="Fechar menu" onClick={close} className="ml-auto rounded p-2 lg:hidden"><X size={18} /></button>
      </div>
      <div className="px-3 pt-7">
        <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Operação</p>
        <nav className="space-y-1">{navItems.map((item) => { const Icon = iconMap[item.icon as keyof typeof iconMap]; const active = pathname === item.href || (pathname === "/" && item.href === "/painel"); return <Link onClick={close} key={item.href} href={item.href} className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition duration-200 ${active ? "bg-white/[.08] text-white ring-1 ring-inset ring-white/10" : "text-slate-400 hover:bg-white/[.06] hover:text-slate-100"}`}><Icon size={18} strokeWidth={1.8} className={active ? "text-sky-300" : "text-slate-500 transition group-hover:text-sky-200"} />{item.label}{item.label === "Requisições" && <span className="ml-auto rounded-full bg-sky-300/15 px-2 py-0.5 text-[10px] font-semibold text-sky-200">08</span>}</Link>; })}</nav>
      </div>
      <div className="mt-8 px-3"><p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Acesso rápido</p><nav className="space-y-1"><Link href="/qrcode" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white"><QrCode size={18} />Leitor QR Code</Link></nav></div>
      <div className="mt-auto border-t border-slate-700/70 p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">CS</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">Carlos Silva</p><p className="mt-0.5 truncate text-[11px] text-slate-400">Almoxarife - Planta 01</p></div><Link href="/login" aria-label="Sair da conta" title="Sair" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-white"><LogOut size={17} /></Link></div></div>
    </aside>
  </>;
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const today = useSyncExternalStore(subscribeToClock, getTodaySnapshot, getServerTodaySnapshot);
  const pendingRequest = requests.find((request) => request.status === "Pendente");
  const criticalItem = stock.find((item) => item.quantity < item.minimum);
  const notifications = [
    ...(pendingRequest ? [{ id: "pending-request", href: "/fila", title: "Pedido aguardando análise", detail: pendingRequest.id + " - " + pendingRequest.requester }] : []),
    ...(criticalItem ? [{ id: "critical-stock", href: "/inventario", title: "Estoque abaixo do mínimo", detail: criticalItem.name + " - " + criticalItem.quantity + " " + criticalItem.unit + " disponíveis" }] : []),
  ];
  const unreadCount = notifications.filter((notification) => !readIds.includes(notification.id)).length;

  return <header className="sticky top-0 z-20 flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
    <div className="flex items-center gap-3"><button aria-label="Abrir menu" onClick={onMenu} className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"><Menu size={19} /></button><div><p className="text-sm font-semibold text-slate-900">Bom dia, Carlos</p><p className="mt-0.5 hidden min-h-4 text-xs capitalize text-slate-500 sm:block">{today}</p></div></div>
    <div className="flex items-center gap-2 sm:gap-3"><label className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 sm:flex"><Building2 size={15} className="text-[#0B57D0]"/><span className="text-left"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">Setor atendido</span><select defaultValue={sectors[0]} aria-label="Setor atendido" className="w-[210px] bg-transparent text-xs font-semibold text-slate-700 outline-none">{sectors.map((sector) => <option key={sector}>{sector}</option>)}</select></span><ChevronDown size={14} className="text-slate-400"/></label><ThemeToggle/><div className="relative">
      <button type="button" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Notifica&#231;&#245;es" aria-expanded={notificationsOpen} aria-haspopup="dialog" className="relative rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-[#0B57D0]"><Bell size={18}/>{unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">{unreadCount}</span>}</button>
      {notificationsOpen && <section role="dialog" aria-label="Notifica&#231;&#245;es" className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h2 className="text-sm font-bold text-slate-900">Notifica&#231;&#245;es</h2><p className="mt-0.5 text-[11px] text-slate-500">Atualiza&#231;&#245;es da opera&#231;&#227;o</p></div><button type="button" aria-label="Fechar notifica&#231;&#245;es" onClick={() => setNotificationsOpen(false)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={16}/></button></div>{notifications.length ? <div className="divide-y divide-slate-100">{notifications.map((notification) => <Link key={notification.id} href={notification.href} onClick={() => { setReadIds((current) => current.includes(notification.id) ? current : [...current, notification.id]); setNotificationsOpen(false); }} className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50"><span className={"mt-1 h-2 w-2 shrink-0 rounded-full " + (readIds.includes(notification.id) ? "bg-slate-200" : "bg-blue-600")}/><span className="min-w-0"><span className="block text-xs font-semibold text-slate-800">{notification.title}</span><span className="mt-1 block text-[11px] text-slate-500">{notification.detail}</span></span><ArrowRight size={14} className="mt-1 shrink-0 text-slate-400"/></Link>)}</div> : <p className="px-4 py-6 text-center text-xs text-slate-500">Nenhuma notifica&#231;&#227;o no momento.</p>}{unreadCount > 0 && <button type="button" onClick={() => setReadIds(notifications.map((notification) => notification.id))} className="w-full border-t border-slate-100 px-4 py-3 text-xs font-semibold text-[#0B57D0] transition hover:bg-blue-50">Marcar todas como lidas</button>}</section>}
    </div><div className="hidden h-9 w-px bg-slate-200 sm:block"/><div className="hidden items-center gap-2 sm:flex"><div className="h-8 w-8 rounded-full bg-slate-200 text-center text-xs font-semibold leading-8 text-slate-700">CS</div><span className="text-xs font-semibold text-slate-700">Carlos Silva</span></div></div>
  </header>;
}
function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div data-reveal className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.13em] text-[#0B57D0]">{eyebrow}</p><h1 className="text-[27px] font-semibold tracking-[-.035em] text-slate-900 sm:text-[30px]">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>{action}</div>;
}

function KpiCard({ label, value, note, icon: Icon, accent, trend }: { label: string; value: string; note: string; icon: typeof Package; accent: string; trend?: string }) {
  return <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-[13px] font-medium text-slate-500">{label}</p><p className="mt-4 text-[32px] font-semibold leading-none tracking-[-.04em] text-slate-900">{value}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}><Icon size={19}/></span></div><div className="mt-4 flex items-center gap-1.5 text-xs"><span className="font-semibold text-emerald-700">{trend}</span><span className="text-slate-400">{note}</span></div></Card>;
}

function DemandAnalytics() {
  const sectorCounts = requests.reduce<Record<string, number>>((counts, request) => {
    counts[request.sector] = (counts[request.sector] ?? 0) + 1;
    return counts;
  }, {});
  const sectorsByDemand = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);
  const materialCounts = requests.reduce<Record<string, number>>((counts, request) => {
    const match = request.items.match(/^(.*?)\s*[·]+\s*(\d+)\s*un\.?$/);
    const material = match?.[1]?.trim() ?? request.items;
    const quantity = Number(match?.[2] ?? 1);
    counts[material] = (counts[material] ?? 0) + quantity;
    return counts;
  }, {});
  const materialsByDemand = Object.entries(materialCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxSector = Math.max(...sectorsByDemand.map(([, count]) => count), 1);
  const maxMaterial = Math.max(...materialsByDemand.map(([, count]) => count), 1);

  return <div data-reveal-group className="mt-5 grid gap-5 xl:grid-cols-2">
    <Card className="p-5 sm:p-6"><div className="mb-5"><h2 className="text-sm font-bold text-slate-900">Solicitações por setor</h2><p className="mt-1 text-xs text-slate-500">Setores com maior volume de requisições</p></div><div className="space-y-4" role="img" aria-label="Gráfico de solicitações agrupadas por setor">{sectorsByDemand.map(([sector, count]) => <div key={sector}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-xs font-medium text-slate-700">{sector}</span><span className="shrink-0 text-xs font-semibold tabular-nums text-slate-600">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0B57D0] transition-[width] duration-500" style={{ width: `${(count / maxSector) * 100}%` }}/></div></div>)}</div><p className="mt-5 border-t border-slate-100 pt-3 text-[11px] text-slate-400">Base demonstrativa · {requests.length} requisições</p></Card>
    <Card className="p-5 sm:p-6"><div className="mb-5"><h2 className="text-sm font-bold text-slate-900">Materiais mais solicitados</h2><p className="mt-1 text-xs text-slate-500">Quantidade total nas requisições registradas</p></div><div className="space-y-4" role="img" aria-label="Gráfico dos materiais mais solicitados">{materialsByDemand.map(([material, count]) => <div key={material}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-xs font-medium text-slate-700">{material}</span><span className="shrink-0 text-xs font-semibold tabular-nums text-slate-600">{count} un.</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500 transition-[width] duration-500" style={{ width: `${(count / maxMaterial) * 100}%` }}/></div></div>)}</div><p className="mt-5 border-t border-slate-100 pt-3 text-[11px] text-slate-400">Base demonstrativa · {requests.length} requisições</p></Card>
  </div>;
}

function AnalyticsPage() {
  const daily = Object.entries(requests.reduce<Record<string, number>>((counts, request) => {
    counts[request.date] = (counts[request.date] ?? 0) + 1;
    return counts;
  }, {})).sort(([first], [second]) => {
    const [firstDay, firstMonth, firstYear] = first.split("/").map(Number);
    const [secondDay, secondMonth, secondYear] = second.split("/").map(Number);
    return new Date(firstYear, firstMonth - 1, firstDay).getTime() - new Date(secondYear, secondMonth - 1, secondDay).getTime();
  });
  const statusList = [
    { name: "Pendente", color: "#d99a26" },
    { name: "Em andamento", color: "#0b57d0" },
    { name: "Concluído", color: "#16845b" },
  ].map((status) => ({ ...status, value: requests.filter((request) => request.status === status.name).length }));
  const total = Math.max(requests.length, 1);
  let offset = 0;
  const donut = statusList.map((status) => {
    const dash = status.value / total * 100;
    const segment = { ...status, dash, offset };
    offset += dash;
    return segment;
  });
  const pointX = (index: number) => 110 + index * (180 / Math.max(daily.length - 1, 1));
  const pointY = (count: number) => 142 - count * 22;

  return <>
    <PageHeading eyebrow="Inteligência operacional" title="Análises" description="Explore padrões de consumo, pedidos e níveis de estoque."/>
    <div data-reveal className="mb-5 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-900"><strong>Dados demonstrativos:</strong> os gráficos refletem somente as requisições de exemplo cadastradas no sistema.</div>
    <div data-reveal-group className="mb-5 grid gap-4 sm:grid-cols-3"><KpiCard label="Requisições analisadas" value={String(requests.length)} note="na amostra disponível" icon={ClipboardList} accent="bg-blue-50 text-[#0B57D0]"/><KpiCard label="Setores atendidos" value={String(new Set(requests.map((request) => request.sector)).size)} note="com pedidos registrados" icon={Building2} accent="bg-violet-50 text-violet-700"/><KpiCard label="Materiais no catálogo" value={String(stock.length)} note="itens demonstrativos" icon={Package} accent="bg-emerald-50 text-emerald-700"/></div>
    <div data-reveal-group className="mt-5 grid gap-5 xl:grid-cols-2">
      <Card data-reveal-item className="p-5 sm:p-6"><div className="mb-4"><h2 className="text-sm font-bold text-slate-900">Pedidos por dia</h2><p className="mt-1 text-xs text-slate-500">Contagem nas datas presentes no histórico</p></div><div role="img" aria-label={`Gráfico de linha: ${daily.map(([date, count]) => `${date}: ${count}`).join(", ")}`}><svg viewBox="0 0 400 180" className="mx-auto h-48 w-full max-w-[640px]" preserveAspectRatio="xMidYMid meet"><path d="M45 20V142H380" fill="none" stroke="#e8edf3"/><path d="M45 98H380M45 54H380" fill="none" stroke="#eef2f6" strokeDasharray="3 5"/><polyline className="analytics-line" points={daily.map(([, count], index) => `${pointX(index)},${pointY(count)}`).join(" ")} fill="none" stroke="#0b57d0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1"/>{daily.map(([date, count], index) => { const x = pointX(index); const y = pointY(count); return <g key={date}><circle cx={x} cy={y} r="5" fill="white" stroke="#0b57d0" strokeWidth="3"/><text x={x} y="165" textAnchor="middle" fill="#7b8796" fontSize="10">{date}</text><text x={x} y={y - 12} textAnchor="middle" fill="#344256" fontSize="10" fontWeight="600">{count}</text></g>; })}</svg></div><p className="mt-2 text-[11px] text-slate-400">Sem datas intermediárias no histórico de demonstração</p></Card>
      <Card data-reveal-item className="p-5 sm:p-6"><div className="mb-4"><h2 className="text-sm font-bold text-slate-900">Distribuição por status</h2><p className="mt-1 text-xs text-slate-500">Etapa atual das solicitações registradas</p></div><div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center"><div className="relative h-40 w-40 shrink-0" role="img" aria-label={`Gráfico de rosca com ${total} requisições`}><svg viewBox="0 0 120 120" className="h-full w-full -rotate-90"><circle cx="60" cy="60" r="43" fill="none" stroke="#eef2f6" strokeWidth="13"/>{donut.map((segment) => <circle key={segment.name} cx="60" cy="60" r="43" fill="none" stroke={segment.color} strokeWidth="13" strokeDasharray={`${segment.dash} ${100 - segment.dash}`} strokeDashoffset={-segment.offset} pathLength="100" className="analytics-donut-segment"/>)}</svg><div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl font-semibold text-slate-900">{total}</strong><span className="text-[10px] text-slate-500">pedidos</span></div></div><ul className="w-full max-w-[210px] space-y-3">{statusList.map((status) => <li key={status.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-slate-600"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: status.color }}/>{status.name}</span><strong className="tabular-nums text-slate-800">{status.value}</strong></li>)}</ul></div></Card>
      <Card data-reveal-item className="p-5 sm:p-6 xl:col-span-2"><div className="mb-5"><h2 className="text-sm font-bold text-slate-900">Disponível versus estoque mínimo</h2><p className="mt-1 text-xs text-slate-500">Comparação dos materiais sinalizados no inventário</p></div><div className="space-y-5" role="img" aria-label="Gráfico de barras comparando saldo atual e estoque mínimo">{stock.map((item, index) => { const max = Math.max(item.quantity, item.minimum, 1); return <div key={item.code} data-reveal-item><div className="mb-2 flex items-center justify-between gap-3"><span className="truncate text-xs font-medium text-slate-700">{item.name}</span><span className="shrink-0 font-mono text-[10px] text-slate-500">{item.code}</span></div><div className="grid grid-cols-[54px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-[10px] text-slate-500"><span>Atual · {item.quantity}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="analytics-bar h-full rounded-full bg-sky-500" style={{ "--bar-width": `${item.quantity / max * 100}%`, "--bar-delay": `${index * 90}ms` } as React.CSSProperties}/></div><span>Mínimo · {item.minimum}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="analytics-bar h-full rounded-full bg-slate-400" style={{ "--bar-width": `${item.minimum / max * 100}%`, "--bar-delay": `${index * 90 + 100}ms` } as React.CSSProperties}/></div></div></div>; })}</div><div className="mt-5 flex gap-5 border-t border-slate-100 pt-3 text-[11px] text-slate-500"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-sm bg-sky-500"/>Disponível</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-sm bg-slate-400"/>Estoque mínimo</span></div></Card>
    </div>
  </>;
}

function RequestsTable({ compact = false, onAccept, acceptedIds = [], onViewDetails, rows }: { compact?: boolean; onAccept?: (id: string) => void; acceptedIds?: string[]; onViewDetails?: (request: (typeof requests)[number]) => void; rows?: typeof requests }) {
  const displayedRows = rows ?? (compact ? requests.slice(0, 4) : requests);
  return <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-y border-slate-100 bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><th className="px-5 py-3">Requisi&#231;&#227;o</th><th className="px-4 py-3">Ordem serv.</th><th className="px-4 py-3">Solicitante</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">A&#231;&#245;es</th></tr></thead><tbody data-reveal-group>{displayedRows.map((row) => { const accepted = acceptedIds.includes(row.id); const status = accepted ? "Em andamento" : row.status; return <tr data-reveal-item key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"><td className="px-5 py-4 font-mono text-xs font-semibold text-slate-800">{row.id}</td><td className="px-4 py-4 font-mono text-xs text-slate-600">{row.order}</td><td className="px-4 py-4 text-xs font-medium text-slate-800">{row.requester}</td><td className="px-4 py-4 text-xs text-slate-500">{row.date}</td><td className="px-4 py-4"><StatusBadge status={status}/></td><td className="px-5 py-4 text-right">{onViewDetails && row.status === "Concluído" ? <Button variant="secondary" onClick={() => onViewDetails(row)} className="!min-h-9 !px-3 !text-xs"><Eye size={14}/>Ver detalhes</Button> : onAccept && row.status === "Pendente" ? <Button onClick={() => onAccept(row.id)} className="!min-h-9 !px-3 !text-xs" disabled={accepted}>{accepted ? <><Check size={14}/>Aceito</> : "Aceitar pedido"}</Button> : <Link href={row.status === "Pendente" ? "/fila" : "/separacao"} className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-[#0B57D0]">{row.status === "Pendente" ? "Aceitar pedido" : "Ver detalhes"}</Link>}</td></tr>; })}</tbody></table>{displayedRows.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-500">Nenhuma requisi&#231;&#227;o corresponde a sua busca.</p>}</div>;
}
function Dashboard() {
  const criticalItems = stock.filter((item) => item.quantity < item.minimum);

  return <>
    <div data-reveal className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Centro de operações</p>
        <h1 className="text-3xl font-semibold text-slate-950">Painel geral</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Acompanhe o ritmo do almoxarifado e as prioridades do turno.</p>
      </div>
      <Link href="/fila"><Button><ClipboardList size={17}/>Ver fila de pedidos</Button></Link>
    </div>
    <section data-reveal className="mb-7 flex flex-col justify-between gap-5 border-y border-amber-200 border-l-[3px] border-l-amber-500 bg-amber-50/70 px-4 py-5 sm:flex-row sm:items-center sm:px-6">
      <div className="flex items-start gap-4">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800"><Package size={19}/></span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-amber-800">Prioridade operacional</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">{criticalItems.length ? `${criticalItems.length} materiais abaixo do mínimo` : "Estoque dentro do nível definido"}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">{criticalItems.length ? "Revise os saldos críticos para evitar interrupções na operação." : "Não há materiais com saldo abaixo do mínimo neste momento."}</p>
        </div>
      </div>
      <Link href="/inventario"><Button variant="secondary" className="shrink-0 border-amber-300 bg-white text-amber-900 hover:border-amber-400 hover:bg-amber-100/60 hover:text-amber-950"><span>Revisar inventário</span><ArrowRight size={15}/></Button></Link>
    </section>
    <div data-reveal-group className="mb-8 grid grid-cols-1 divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <article data-reveal-item className="px-4 py-4 sm:pl-1"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><ClipboardList size={15} className="text-amber-700"/>Pedidos pendentes</div><div className="mt-2 flex items-baseline gap-2"><p className="text-[30px] font-semibold leading-none tabular-nums text-slate-950">08</p><span className="text-[11px] font-medium text-amber-800">2 novos neste turno</span></div></article>
      <article data-reveal-item className="px-4 py-4 sm:pl-6"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Boxes size={15} className="text-blue-700"/>Em separação</div><div className="mt-2 flex items-baseline gap-2"><p className="text-[30px] font-semibold leading-none tabular-nums text-slate-950">05</p><span className="text-[11px] font-medium text-slate-500">3 com prioridade alta</span></div></article>
      <article data-reveal-item className="px-4 py-4 sm:pl-6"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><PackageCheck size={15} className="text-emerald-700"/>Concluídos hoje</div><div className="mt-2 flex items-baseline gap-2"><p className="text-[30px] font-semibold leading-none tabular-nums text-slate-950">24</p><span className="text-[11px] font-medium text-emerald-800">vs. 19 ontem</span></div></article>
    </div>
    <div data-reveal-group className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_1fr]"><Card><div className="flex items-center justify-between p-5"><div><h2 className="text-sm font-bold text-slate-900">Prioridades do turno</h2><p className="mt-1 text-xs text-slate-500">Pedidos aguardando separação</p></div><Link href="/fila" className="text-xs font-semibold text-[#0B57D0] hover:underline">Ver fila <ArrowRight size={13} className="ml-1 inline"/></Link></div><RequestsTable compact/></Card>
    <Card><div className="flex items-center justify-between p-5"><div><h2 className="text-sm font-bold text-slate-900">Estoque crítico</h2><p className="mt-1 text-xs text-slate-500">Materiais abaixo do mínimo</p></div><Link href="/inventario" className="text-xs font-semibold text-[#0B57D0] hover:underline">Inventário <ArrowRight size={13} className="ml-1 inline"/></Link></div><div data-reveal-group className="divide-y divide-slate-100">{stock.map((item) => <div data-reveal-item key={item.code} className="flex items-center justify-between gap-3 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><Package size={17}/></div><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.code} - mínimo {item.minimum}</p></div></div><div className="shrink-0 text-right"><p className="text-sm font-bold text-rose-700">{item.quantity} <span className="text-[10px] font-medium">{item.unit}</span></p><StatusBadge status="Crítico"/></div></div>)}</div><div className="border-t border-slate-100 p-4"><Link href="/inventario" className="flex min-h-10 items-center justify-center rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Ver inventário completo <ArrowRight size={14} className="ml-2"/></Link></div></Card></div>
    <DemandAnalytics/>
    <Card className="mt-5"><div className="flex items-center justify-between p-5"><div><h2 className="text-sm font-bold text-slate-900">Requisições recentes</h2><p className="mt-1 text-xs text-slate-500">&#218;ltimas movimenta&#231;&#245;es do almoxarifado</p></div><Link href="/historico" className="text-xs font-semibold text-[#0B57D0] hover:underline">Ver histórico <ArrowRight size={13} className="ml-1 inline"/></Link></div><RequestsTable compact/></Card>
  </>;
}

function QueuePage() {
  const [accepted, setAccepted] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const filteredRows = requests.filter((request) => {
    const status = accepted.includes(request.id) ? "Em andamento" : request.status;
    const matchesSearch = [request.id, request.order, request.requester].join(" ").toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"));
    return matchesSearch && (statusFilter === "Todos" || status === statusFilter);
  });
  return <><PageHeading eyebrow="Opera&#231;&#227;o &#183; Almoxarifado" title="Fila de pedidos" description="Revise as solicita&#231;&#245;es e aceite as pr&#243;ximas separa&#231;&#245;es."/><Card><div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-bold text-slate-900">Solicita&#231;&#245;es recebidas <span className="ml-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{filteredRows.length}</span></h2><p className="mt-1 text-xs text-slate-500">Pedidos aguardando an&#225;lise</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar requisi&#231;&#227;o" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs text-slate-700 outline-none sm:w-48" placeholder="Buscar requisicao..."/></label><label className="sr-only" htmlFor="queue-status">Filtrar pelo status</label><select id="queue-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"><option>Todos</option><option>Pendente</option><option>Em andamento</option><option>Conclu&#237;do</option></select></div></div><RequestsTable rows={filteredRows} onAccept={(id) => setAccepted((current) => current.includes(id) ? current : [...current, id])} acceptedIds={accepted}/></Card></>;
}

function FormField({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) { return <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">{label}</span><input type={type} placeholder={placeholder} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/></label>; }

function MaterialSelection() {
  const [search, setSearch] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, number>>({});
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filteredMaterials = stock.filter((item) => `${item.name} ${item.code}`.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalizedSearch));
  const selectedEntries = Object.entries(selectedMaterials);
  const query = new URLSearchParams();
  selectedEntries.forEach(([code, quantity]) => { query.append("material", code); query.append("qty", String(quantity)); });

  function toggleMaterial(code: string, checked: boolean) {
    setSelectedMaterials((current) => {
      const next = { ...current };
      if (checked) next[code] = next[code] ?? 1;
      else delete next[code];
      return next;
    });
  }

  function updateQuantity(code: string, quantity: number) {
    setSelectedMaterials((current) => ({ ...current, [code]: Math.max(1, quantity || 1) }));
  }

  return <><PageHeading eyebrow="Requisitante &#183; Materiais" title="Selecione os materiais" description="Pesquise e adicione todos os produtos que deseja requisitar."/><Card className="mx-auto max-w-4xl"><div className="border-b border-slate-100 p-5 sm:p-6"><label className="mb-2 block text-xs font-semibold text-slate-700" htmlFor="material-search">Pesquisar material</label><div className="flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"><Search size={18} className="shrink-0 text-slate-400"/><input id="material-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Digite o nome ou c&oacute;digo do produto..." className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"/><span className="hidden text-[11px] text-slate-400 sm:inline">{filteredMaterials.length} resultados</span></div></div><div data-reveal-group className="divide-y divide-slate-100">{filteredMaterials.length ? filteredMaterials.map((item) => { const selected = selectedMaterials[item.code] !== undefined; return <div key={item.code} data-reveal data-reveal-item className={`grid min-h-[84px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-3 transition sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4 sm:px-6 ${selected ? "bg-blue-50/60" : "hover:bg-slate-50"}`}><label className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center" aria-label={`Selecionar ${item.name}`}><input type="checkbox" checked={selected} onChange={(event) => toggleMaterial(item.code, event.target.checked)} className="h-5 w-5 rounded accent-[#0B57D0]"/></label><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{item.name}</p><p className="mt-1 font-mono text-[11px] text-slate-500">{item.code} <span className="font-sans text-slate-400">? Dispon&iacute;vel: {item.quantity} {item.unit}</span></p></div>{selected && <label className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1 sm:col-start-3"><span className="text-xs font-medium text-slate-500">Quantidade</span><input aria-label={`Quantidade de ${item.name}`} type="number" min={1} value={selectedMaterials[item.code]} onChange={(event) => updateQuantity(item.code, Number(event.target.value))} className="h-11 w-20 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/></label>}</div>; }) : <div className="px-5 py-12 text-center"><Package size={25} className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-700">Nenhum material encontrado</p><p className="mt-1 text-xs text-slate-500">Tente pesquisar por outro nome ou c&oacute;digo.</p></div>}</div><div className="flex flex-col justify-between gap-3 border-t border-slate-100 bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:px-6"><p className="text-xs text-slate-500">{selectedEntries.length ? <><strong className="font-semibold text-slate-800">{selectedEntries.length}</strong> {selectedEntries.length === 1 ? "material selecionado" : "materiais selecionados"}</> : "Selecione um ou mais materiais e informe a quantidade de cada um."}</p><Link aria-disabled={!selectedEntries.length} tabIndex={selectedEntries.length ? 0 : -1} href={selectedEntries.length ? `/pedido?${query.toString()}` : "/materiais"} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold ${selectedEntries.length ? "bg-[#0B57D0] text-white hover:bg-blue-800" : "pointer-events-none bg-slate-200 text-slate-400"}`}>Continuar para o pedido <ArrowRight size={16}/></Link></div></Card><p className="mx-auto mt-3 max-w-4xl text-[11px] text-slate-400">Cat&aacute;logo de demonstra&ccedil;&atilde;o com 3 materiais. A busca est&aacute; pronta para consultar um cat&aacute;logo maior.</p></>;
}
function RequestForm() { const searchParams = useSearchParams(); const selectedCodes = searchParams.getAll("material"); const quantities = searchParams.getAll("qty"); const selectedItems = selectedCodes.map((code, index) => ({ item: stock.find((product) => product.code === code), quantity: Number(quantities[index]) || 1 })).filter((entry) => entry.item); return <><PageHeading eyebrow="Requisitante - Materiais" title="Nova requisição" description="Preencha os dados para solicitar materiais ao almoxarifado." action={<Link href="/materiais" className="text-xs font-semibold text-[#0B57D0] hover:underline">Trocar material</Link>}/><div data-reveal-group className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"><Card className="p-5 sm:p-7"><div className="mb-6 border-b border-slate-100 pb-4"><h2 className="text-sm font-bold text-slate-900">Dados da solicitação</h2><p className="mt-1 text-xs text-slate-500">Os campos com * são obrigatórios.</p></div><div className="grid gap-5 sm:grid-cols-2"><FormField label="Nome do solicitante *" placeholder="Ex.: José Alencar"/><FormField label="Ordem de serviço *" placeholder="Ex.: OS-821"/><label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Setor *</span><select defaultValue="" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="">Selecione o setor</option>{sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}</select></label><FormField label="Data necessária *" placeholder="dd/mm/aaaa" type="date"/></div><div className="mt-6"><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-bold text-slate-800">Material solicitado</h3><Link href="/materiais" className="text-xs font-semibold text-[#0B57D0] hover:underline">Escolher outro</Link></div><div className="space-y-2">{selectedItems.length ? selectedItems.map(({ item, quantity }) => item && <div key={item.code} className="grid grid-cols-[minmax(0,1fr)_100px] items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{item.name}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{item.code}</p></div><p className="text-right text-xs font-semibold text-slate-700">Qtd.: {quantity}</p></div>) : <div className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500">Nenhum material selecionado. <Link href="/materiais" className="font-semibold text-[#0B57D0]">Escolher materiais</Link></div>}</div></div><label className="mt-5 block"><span className="mb-2 block text-xs font-semibold text-slate-700">Observações</span><textarea rows={3} placeholder="Descreva a aplicação ou informações adicionais..." className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/></label><div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row"><Link href="/materiais"><Button variant="secondary" className="w-full sm:w-auto">Voltar à seleção</Button></Link><Link href="/acompanhar"><Button className="w-full sm:w-auto">Enviar requisição <ArrowRight size={16}/></Button></Link></div></Card><Card className="h-fit p-5"><div className="flex items-start gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#0B57D0]"><ShieldCheck size={18}/></div><div><h3 className="text-sm font-bold text-slate-900">Antes de solicitar</h3><p className="mt-1 text-xs leading-5 text-slate-500">Confira as informações para agilizar a separação dos materiais.</p></div></div><ul className="mt-5 space-y-4 text-xs text-slate-600"><li className="flex gap-2"><Check size={15} className="shrink-0 text-emerald-600"/>Tenha a ordem de serviço em mãos.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emerald-600"/>Informe a quantidade necessária para o serviço.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emerald-600"/>Acompanhe o andamento pela tela de acompanhamento.</li></ul></Card></div></> }

function TrackingPage() { return <><PageHeading eyebrow="Requisitante - Acompanhamento" title="Acompanhar pedido" description="Consulte o andamento da sua requisição." action={<Button variant="secondary"><Search size={15}/>Buscar pedido</Button>}/><div data-reveal-group className="grid gap-5 lg:grid-cols-[1.3fr_1fr]"><Card className="p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5"><div><p className="font-mono text-xs font-bold text-[#0B57D0]">REQ-2045</p><h2 className="mt-2 text-lg font-bold text-slate-900">Disco de corte - 12 un.</h2><p className="mt-1 text-xs text-slate-500">OS-819 - Usinagem e Solda - Solicitado em 24/10/2024</p></div><StatusBadge status="Em andamento"/></div><h3 className="mb-5 mt-6 text-xs font-bold text-slate-800">Etapas do pedido</h3><div data-reveal-group className="space-y-0">{[{ title: "Requisição enviada", time: "Hoje, 08:42 - José Alencar", done: true },{ title: "Pedido aceito pelo almoxarife", time: "Hoje, 09:15 - Carlos Silva", done: true },{ title: "Separação dos materiais", time: "Em andamento", active: true },{ title: "Retirada disponível", time: "Aguardando conclusão" }].map((step, i) => <div data-reveal-item key={step.title} className="relative flex gap-4 pb-7 last:pb-0"><div className="relative flex w-6 shrink-0 justify-center"><span className={`z-10 flex h-6 w-6 items-center justify-center rounded-full ${step.done ? "bg-emerald-100 text-emerald-700" : step.active ? "bg-blue-100 text-[#0B57D0]" : "bg-slate-100 text-slate-400"}`}>{step.done ? <Check size={13}/> : <span className="h-2 w-2 rounded-full bg-current"/>}</span>{i < 3 && <span className={`absolute top-6 h-full w-px ${step.done ? "bg-emerald-200" : "bg-slate-200"}`}/>}</div><div><p className={`text-xs font-semibold ${step.active ? "text-[#0B57D0]" : step.done ? "text-slate-800" : "text-slate-400"}`}>{step.title}</p><p className="mt-1 text-[11px] text-slate-400">{step.time}</p></div></div>)}</div></Card><Card className="h-fit p-5"><h2 className="text-sm font-bold text-slate-900">Resumo do pedido</h2><div className="mt-4 space-y-3 text-xs"><div className="flex justify-between"><span className="text-slate-500">Solicitante</span><span className="font-medium text-slate-800">José Alencar</span></div><div className="flex justify-between"><span className="text-slate-500">Setor</span><span className="font-medium text-slate-800">Usinagem e Solda</span></div><div className="flex justify-between"><span className="text-slate-500">Ordem de serviço</span><span className="font-mono font-medium text-slate-800">OS-819</span></div></div><div className="mt-5 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-800">Seu pedido está sendo separado. Você receberá uma atualização quando estiver disponível para retirada.</div></Card></div></> }

function SeparationPage() {
  const searchParams = useSearchParams();
  const [requestId, setRequestId] = useState(searchParams.get("request") ?? requests[1].id);
  const request = requests.find((item) => item.id === requestId) ?? requests[1];
  return <><PageHeading eyebrow="Opera&#231;&#227;o &#183; Almoxarifado" title="Confirmar separa&#231;&#227;o" description="Confira os itens e confirme a entrega ao solicitante." action={<Link href="/qrcode"><Button variant="secondary"><QrCode size={16}/>Ler QR Code</Button></Link>}/><div data-reveal-group className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"><Card><div className="border-b border-slate-100 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-bold text-slate-900">Pedidos em separa&#231;&#227;o</h2><p className="mt-1 text-xs text-slate-500">Escolha qual requisição está atendendo</p></div><select aria-label="Requisi&#231;&#227;o atendida" value={requestId} onChange={(event) => setRequestId(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">{requests.filter((item) => item.status !== "Concluído").map((item) => <option key={item.id} value={item.id}>{item.id} &#183; {item.requester}</option>)}</select></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">Ordem de servi&#231;o <strong className="font-mono text-slate-800">{request.order}</strong></p><StatusBadge status={request.status === "Pendente" ? "Em andamento" : request.status}/></div></div><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left"><thead><tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase text-slate-500"><th className="px-5 py-3">Material</th><th className="px-4 py-3">Localização</th><th className="px-4 py-3">Solicitado</th><th className="px-4 py-3">Separado</th></tr></thead><tbody><tr className="border-b border-slate-100"><td className="px-5 py-4"><p className="text-xs font-semibold text-slate-800">{request.items.split(/\s\u00b7\s/)[0]}</p><p className="mt-1 font-mono text-[10px] text-slate-400">MAT-00301</p></td><td className="px-4 py-4 text-xs text-slate-600">A-02-14</td><td className="px-4 py-4 text-xs font-medium text-slate-700">{request.items.split(/\s\u00b7\s/)[1] ?? "1 un."}</td><td className="px-4 py-4"><label className="flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" defaultChecked className="h-4 w-4 accent-[#0B57D0]"/>OK</label></td></tr></tbody></table></div><div className="flex flex-col-reverse justify-end gap-3 p-5 sm:flex-row"><Button variant="secondary">Salvar progresso</Button><Link href="/historico"><Button><CheckSquare size={16}/>Confirmar entrega</Button></Link></div></Card><Card className="h-fit p-5"><h3 className="text-sm font-bold text-slate-900">Dados do solicitante</h3><div className="mt-4 space-y-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"><UserRound size={17}/></div><div><p className="text-xs font-semibold text-slate-800">{request.requester}</p><p className="mt-1 text-[11px] text-slate-500">{request.sector} &#183; Turno A</p></div></div><div className="rounded-lg border border-slate-100 p-3"><p className="text-[10px] font-semibold uppercase text-slate-400">Requisição selecionada</p><p className="mt-1 font-mono text-xs text-slate-700">{request.id} &#183; {request.order}</p></div><Link href="/qrcode"><Button variant="secondary" className="w-full"><QrCode size={16}/>Validar retirada com QR</Button></Link></div></Card></div></>;
}
function QrPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function validateCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = requests.find((item) => item.id.toLocaleLowerCase("pt-BR") === code.trim().toLocaleLowerCase("pt-BR"));
    if (!request || request.status === "Conclu\u00eddo") {
      setError("Nao encontramos uma requisicao aberta com esse codigo.");
      return;
    }
    setError("");
    router.push("/separacao?request=" + encodeURIComponent(request.id));
  }

  return <><PageHeading eyebrow="Opera&#231;&#227;o &#183; Valida&#231;&#227;o" title="Leitor de QR Code" description="Aponte o leitor para o c&#243;digo do comprovante do requisitante."/><div className="mx-auto max-w-2xl"><Card className="p-5 sm:p-8"><div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center"><div className="relative flex h-44 w-44 items-center justify-center rounded-2xl border border-blue-100 bg-white text-[#0B57D0]" aria-hidden="true"><span className="absolute left-4 top-4 h-7 w-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-[#0B57D0]"/><span className="absolute right-4 top-4 h-7 w-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-[#0B57D0]"/><span className="absolute bottom-4 left-4 h-7 w-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-[#0B57D0]"/><span className="absolute bottom-4 right-4 h-7 w-7 rounded-br-lg border-b-[3px] border-r-[3px] border-[#0B57D0]"/><QrCode size={90} strokeWidth={1.1}/><span className="absolute left-5 right-5 top-1/2 h-px bg-blue-500/70"/></div><p className="mt-6 text-sm font-semibold text-slate-800">&#193;rea do leitor</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">A c&#226;mera ser&#225; ativada quando o leitor estiver dispon&#237;vel. Por enquanto, informe o c&#243;digo da requisi&#231;&#227;o.</p></div><form onSubmit={validateCode} className="mt-5"><label htmlFor="request-code" className="mb-2 block text-xs font-semibold text-slate-700">C&#243;digo da requisi&#231;&#227;o</label><div className="flex flex-col gap-2 sm:flex-row"><input id="request-code" required value={code} onChange={(event) => { setCode(event.target.value); setError(""); }} placeholder="Ex.: REQ-2045" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/><Button type="submit"><QrCode size={16}/>Validar c&#243;digo</Button></div>{error && <p role="alert" className="mt-2 text-xs font-medium text-rose-700">{error}</p>}</form></Card></div></>;
}

function InventoryPage() { const [search, setSearch] = useState(""); const filteredStock = stock.filter((item) => `${item.name} ${item.code}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))); return <><PageHeading eyebrow="Controle de materiais" title="Inventário" description="Consulte saldos e níveis de reposição dos materiais." action={<Button><Plus size={16}/>Adicionar material</Button>}/><div data-reveal-group className="mb-5 grid gap-4 sm:grid-cols-3"><KpiCard label="Itens cadastrados" value="248" note="no catálogo" icon={Package} accent="bg-blue-50 text-[#0B57D0]"/><KpiCard label="Estoque crítico" value="03" note="requer atenção" icon={Activity} accent="bg-rose-50 text-rose-700"/><KpiCard label="Movimentações hoje" value="18" note="entradas e saídas" icon={Truck} accent="bg-emerald-50 text-emerald-700"/></div><Card><div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-bold text-slate-900">Materiais em estoque</h2><p className="mt-1 text-xs text-slate-500">Saldos demonstrativos</p></div><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar material" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar material..." className="w-full bg-transparent text-xs outline-none sm:w-48"/></label></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="border-y border-slate-100 bg-slate-50 text-[10px] uppercase text-slate-500"><th className="px-5 py-3">Material</th><th className="px-4 py-3">Código</th><th className="px-4 py-3">Disponível</th><th className="px-4 py-3">Estoque mínimo</th><th className="px-4 py-3">Situação</th></tr></thead><tbody data-reveal-group>{filteredStock.map((item) => <tr data-reveal-item key={item.code} className="border-b border-slate-100"><td className="px-5 py-4 text-xs font-semibold text-slate-800">{item.name}</td><td className="px-4 py-4 font-mono text-xs text-slate-500">{item.code}</td><td className="px-4 py-4 text-xs font-semibold text-slate-700">{item.quantity} {item.unit}</td><td className="px-4 py-4 text-xs text-slate-500">{item.minimum} {item.unit}</td><td className="px-4 py-4"><StatusBadge status="Crítico"/></td></tr>)}</tbody></table>{filteredStock.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">Nenhum material encontrado.</p>}</div></Card></> }

function downloadRequestPdf(request: (typeof requests)[number]) {
  const ascii = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, " ");
  const escape = (value: string) => ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const lines = ["Comprovante de requisicao de materiais", `Requisicao: ${request.id}`, `Solicitante: ${request.requester}`, `Setor: ${request.sector}`, `Ordem de servico: ${request.order}`, `Data: ${request.date}`, `Status: ${request.status}`, `Material requisitado: ${request.items}`];
  const content = lines.map((line, index) => `BT /F1 ${index === 0 ? 18 : 12} Tf 52 ${790 - index * 34} Td (${escape(line)}) Tj ET`).join("\n");
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = `comprovante-${request.id}.pdf`; anchor.click(); URL.revokeObjectURL(url);
}

function HistoryPage() {
  const [selectedRequest, setSelectedRequest] = useState<(typeof requests)[number] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const filteredRows = requests.filter((request) => [request.id, request.order, request.requester, request.items].join(" ").toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")) && (statusFilter === "Todos" || request.status === statusFilter));
  return <><PageHeading eyebrow="Operação &#183; Registros" title="Histórico de requisições" description="Consulte pedidos anteriores e gere comprovantes."/><Card><div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-bold text-slate-900">Todas as requisições</h2><p className="mt-1 text-xs text-slate-500">Registros demonstrativos do almoxarifado</p></div><div className="flex flex-wrap gap-2"><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar historico" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." className="w-28 bg-transparent text-xs outline-none sm:w-40"/></label><label className="sr-only" htmlFor="history-status">Filtrar pelo status</label><select id="history-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"><option>Todos</option><option>Pendente</option><option>Em andamento</option><option value={"Conclu\u00eddo"}>Conclu&#237;do</option></select></div></div><RequestsTable rows={filteredRows} onViewDetails={setSelectedRequest}/></Card>
    {selectedRequest && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedRequest(null); }}><section role="dialog" aria-modal="true" aria-labelledby="request-detail-title" className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs font-bold text-[#0B57D0]">{selectedRequest.id}</p><h2 id="request-detail-title" className="mt-2 text-lg font-bold text-slate-900">Detalhes da requisição</h2></div><button aria-label="Fechar detalhes" onClick={() => setSelectedRequest(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button></div><div className="mt-5 grid gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Solicitante</p><p className="mt-1 text-sm font-semibold text-slate-800">{selectedRequest.requester}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Setor</p><p className="mt-1 text-sm font-semibold text-slate-800">{selectedRequest.sector}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ordem de serviço</p><p className="mt-1 font-mono text-sm font-semibold text-slate-800">{selectedRequest.order}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Data</p><p className="mt-1 text-sm font-semibold text-slate-800">{selectedRequest.date}</p></div></div><div className="mt-4 rounded-lg border border-slate-100 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Materiais requisitados</p><p className="mt-2 text-sm font-semibold text-slate-800">{selectedRequest.items}</p><div className="mt-3"><StatusBadge status={selectedRequest.status}/></div></div><div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row"><Button variant="secondary" onClick={() => setSelectedRequest(null)}>Fechar</Button><Button onClick={() => downloadRequestPdf(selectedRequest)}><FileText size={16}/>Baixar comprovante PDF</Button></div></section></div>}
  </>;
}
function LoginPage({ requester = false }: { requester?: boolean }) {
  const suffix = requester ? ".funcionario" : ".almoxarife";
  const target = requester ? "/materiais" : "/painel";
  return <main className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8"><ThemeToggle className="fixed right-4 top-4 z-40"/><div className="w-full max-w-[440px]">
    <Link href="/login" aria-label="Voltar ao acesso Marcon" className="mb-8 flex flex-col items-center gap-2"><BrandLogo className="w-[184px]"/><span className="text-[10px] font-medium uppercase tracking-[.16em] text-slate-400">Almoxarifado</span></Link>
    <Card className="p-6 sm:p-8"><div className="mb-7"><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.14em] text-[#0B57D0]">Acesso ao sistema</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">{requester ? "Acesso do funcion\u00e1rio" : "Acesso do almoxarife"}</h1><p className="mt-2 text-sm text-slate-500">{requester ? "Entre para solicitar e acompanhar materiais da f\u00e1brica." : "Entre para gerenciar pedidos e o estoque do almoxarifado."}</p></div>
    <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">C&#243;digo de acesso</span><input type="text" placeholder={requester ? "ex.: 123456.funcionario" : "ex.: 123456.almoxarife"} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/><span className="mt-2 block text-[11px] text-slate-500">Seu c&#243;digo deve terminar com <strong className="font-semibold text-slate-700">{suffix}</strong>.</span></label>
    <div className="mt-5"><FormField label="Senha" placeholder="Digite sua senha" type="password"/></div><div className="my-5 flex items-center justify-between"><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" className="h-4 w-4 rounded accent-[#0B57D0]"/>Manter conectado</label><a href="#" className="text-xs font-semibold text-[#0B57D0]">Esqueceu a senha?</a></div>
    <Link href={target}><Button className="w-full">Entrar <ArrowRight size={16}/></Button></Link><div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">{requester ? "Acesso do almoxarife?" : "\u00c9 usu\u00e1rio da f\u00e1brica?"} <Link className="font-semibold text-[#0B57D0]" href="/login">Voltar ao acesso</Link></div></Card>
    <p className="mt-5 text-center text-[11px] text-slate-400">Ambiente de demonstra&#231;&#227;o &#183; C&#243;digos de exemplo</p></div></main>;
}
function LoginChoice() {
  return <main className="relative flex min-h-screen items-center justify-center bg-[#F4F7FB] px-4 py-10"><ThemeToggle className="fixed right-4 top-4 z-40"/><div className="w-full max-w-3xl"><div className="mb-9 text-center"><BrandLogo className="mx-auto mb-3 w-[184px]"/><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Gestão de almoxarifado</p><h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Como você deseja acessar?</h1><p className="mt-2 text-sm text-slate-500">Escolha o perfil que corresponde à sua função.</p></div><div className="grid gap-4 md:grid-cols-2"><Link href="/login/requisitante" className="group"><Card className="h-full p-6 transition hover:border-blue-300 hover:ring-2 hover:ring-blue-50 sm:p-7"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-[#0B57D0]"><ClipboardList size={21}/></span><h2 className="mt-5 text-base font-bold text-slate-900">Usuário da fábrica</h2><p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">Solicite materiais para sua ordem de serviço e acompanhe o pedido.</p><span className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0B57D0] px-4 text-sm font-semibold text-white group-hover:bg-blue-800">Acessar como requisitante <ArrowRight size={16}/></span></Card></Link><Link href="/login/almoxarife" className="group"><Card className="h-full p-6 transition hover:border-blue-300 hover:ring-2 hover:ring-blue-50 sm:p-7"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Boxes size={21}/></span><h2 className="mt-5 text-base font-bold text-slate-900">Almoxarife</h2><p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">Gerencie fila, separação, inventário e histórico de requisições.</p><span className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 group-hover:bg-slate-50">Acessar como almoxarife <ArrowRight size={16}/></span></Card></Link></div><p className="mt-6 text-center text-[11px] text-slate-400">Acesso demonstrativo - Sem autenticação real</p></div></main>;
}

function RequesterLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const requesting = pathname === "/pedido" || pathname === "/materiais";
  const sectorStock = pathname === "/meu-estoque";
  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
          <Link href="/materiais" aria-label="Marcon, portal do requisitante" className="flex shrink-0 flex-col gap-1">
            <BrandLogo className="w-[112px] sm:w-[154px]"/>
            <span className="text-[8px] font-semibold uppercase tracking-[.13em] text-slate-400">Portal do requisitante</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link aria-label="Nova requisição" title="Nova requisição" className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold md:px-3 ${requesting ? "bg-blue-50 text-[#0B57D0]" : "text-slate-600 hover:bg-slate-50"}`} href="/materiais">
              <Plus size={15}/><span className="hidden md:inline">Nova requisição</span>
            </Link>
            <Link aria-label="Acompanhar pedido" title="Acompanhar pedido" className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold md:px-3 ${pathname === "/acompanhar" ? "bg-blue-50 text-[#0B57D0]" : "text-slate-600 hover:bg-slate-50"}`} href="/acompanhar">
              <Clock3 size={15}/><span className="hidden md:inline">Acompanhar pedido</span>
            </Link>
            <Link aria-label="Estoque do setor" title="Estoque do setor" className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold md:px-3 ${sectorStock ? "bg-blue-50 text-[#0B57D0]" : "text-slate-600 hover:bg-slate-50"}`} href="/meu-estoque">
              <Boxes size={15}/><span className="hidden md:inline">Meu estoque</span>
            </Link>
          </nav>
          <ThemeToggle className="h-9 w-9 shrink-0"/>
          <div className="hidden items-center gap-2 border-l border-slate-200 pl-4 lg:flex">
            <div className="h-8 w-8 rounded-full bg-slate-100 text-center text-xs font-semibold leading-8 text-slate-700">JA</div>
            <div><p className="text-xs font-semibold text-slate-800">José Alencar</p><p className="text-[10px] text-slate-400">Montagem e Pintura</p></div>
            <Link href="/login" className="ml-2 text-xs font-medium text-slate-500 hover:text-[#0B57D0]">Sair</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-6 text-[10px] text-slate-400 sm:px-6">TI Marcon | Portal do requisitante | Ambiente demonstrativo</footer>
    </div>
  );
}
export default function WarehouseScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/login") return <LoginChoice/>;
  if (pathname.startsWith("/login")) return <LoginPage requester={pathname.includes("requisitante")}/>;
  if (pathname === "/materiais" || pathname === "/pedido" || pathname === "/acompanhar" || pathname === "/meu-estoque") return <RequesterLayout>{pathname === "/materiais" ? <MaterialSelection/> : pathname === "/pedido" ? <RequestForm/> : pathname === "/acompanhar" ? <TrackingPage/> : <SectorStockPage/>}</RequesterLayout>;
  const content: Record<string, ReactNode> = { "/": <Dashboard/>, "/painel": <Dashboard/>, "/analises": <AnalyticsPage/>, "/fila": <QueuePage/>, "/pedido": <RequestForm/>, "/materiais": <MaterialSelection/>, "/acompanhar": <TrackingPage/>, "/separacao": <SeparationPage/>, "/estoque-setor": <SectorStockPage isWarehouse/>, "/qrcode": <QrPage/>, "/historico": <HistoryPage/>, "/inventario": <InventoryPage/> };
  return <div className="warehouse-app text-slate-900"><Sidebar open={menuOpen} close={() => setMenuOpen(false)}/><div className="min-h-screen lg:pl-[260px]"><Topbar onMenu={() => setMenuOpen(true)}/><main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 sm:py-9 lg:px-9">{content[pathname] || <Dashboard/>}</main><footer className="mx-auto max-w-[1500px] px-4 pb-6 text-[10px] text-slate-400 sm:px-6 lg:px-9">TI Marcon · Sistema de gestão de almoxarifado · Ambiente demonstrativo</footer></div></div>;
}


