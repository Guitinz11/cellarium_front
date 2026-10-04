"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Activity, ArrowRight, Bell, Boxes, Building2, Check, CheckSquare, ChevronRight, ClipboardList, Clock3, LayoutDashboard, LogOut, Menu, MessageCircle, Package, Plus, QrCode, ShoppingCart, UserRound, X } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import ThemeToggle from "@/components/theme-toggle";
import { EmptyState } from "@/components/ui";
import { useDialogAccessibility } from "@/components/use-dialog-accessibility";
import { useInventoryItems } from "@/components/use-inventory-items";
import { navItems } from "@/lib/mock-data";
import { getAllRequests, getServerRequests, subscribeToRequests } from "@/lib/request-storage";
import { getReadNotificationsSnapshot, getServerReadNotificationsSnapshot, markNotificationAsRead, parseReadNotificationIds, subscribeToReadNotifications, getSectorNoticesSnapshot, getServerSectorNoticesSnapshot, parseSectorNotices, subscribeToSectorNotices } from "@/lib/notification-storage";
import { getRequesterCode, getRequesterSector, getServerRequesterValue, subscribeToRequesterSession } from "@/lib/requester-session";
import { clearApiSession, getStoredApiUser, listPendingRequests, type ApiPendingRequest, type ApiUser } from "@/lib/warehouse-api";

const iconMap = { layout: LayoutDashboard, requests: ClipboardList, messages: MessageCircle, boxes: Boxes, checkSquare: CheckSquare, history: Clock3, inventory: Package, analytics: Activity, user: UserRound, shoppingCart: ShoppingCart };
const warehouseTitles: Record<string, string> = { "/painel": "Painel geral", "/fila": "Requisições", "/separacao": "Separação", "/estoque-setor": "Estoque por setor", "/inventario": "Inventário", "/compras": "Compras", "/historico": "Histórico", "/analises": "Análises", "/conversas": "Conversas", "/perfil": "Meu perfil", "/qrcode": "Leitor QR Code" };
const requesterNav = [
  { href: "/materiais", label: "Nova requisição", mobileLabel: "Materiais", icon: Plus },
  { href: "/acompanhar", label: "Acompanhar pedidos", mobileLabel: "Pedidos", icon: Clock3 },
  { href: "/meu-estoque", label: "Meu estoque", mobileLabel: "Estoque", icon: Boxes },
  { href: "/chat", label: "Conversas", mobileLabel: "Conversas", icon: MessageCircle },
  { href: "/notificacoes", label: "Notificações", mobileLabel: "Avisos", icon: Bell },
];

function useToday() {
  const [today, setToday] = useState("");
  useEffect(() => {
    const update = () => setToday(new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date()));
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);
  return today;
}

export function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  const pathname = usePathname();
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const syncAccount = useEffectEvent(() => setApiUser(getStoredApiUser()));
  const syncPending = useEffectEvent(async () => {
    try {
      const result = await listPendingRequests();
      setPendingCount(result.dados.length);
    } catch {
      setPendingCount(0);
    }
  });
  useEffect(() => {
    const timer = window.setTimeout(() => {
      syncAccount();
      void syncPending();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useDialogAccessibility(open, close);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches && open) close(); };
    desktop.addEventListener("change", onResize);
    return () => desktop.removeEventListener("change", onResize);
  }, [open, close]);

  const navigation = (items: typeof navItems) => items.map((item) => {
    const Icon = iconMap[item.icon as keyof typeof iconMap];
    const active = pathname === item.href;
    return <Link key={item.href} onClick={close} href={item.href} aria-current={active ? "page" : undefined} className={`shell-nav-link ${active ? "is-active" : ""}`}><Icon size={19} strokeWidth={1.7} aria-hidden="true"/><span>{item.label}</span>{item.href === "/fila" && pendingCount > 0 && <span className="shell-nav-count">{pendingCount}</span>}{active && <ChevronRight size={14} className="ml-auto" aria-hidden="true"/>}</Link>;
  });

  return <>
    {open && <button tabIndex={-1} aria-label="Fechar menu" className="shell-backdrop" onClick={close}/>}
    <aside id="warehouse-navigation" role={open ? "dialog" : undefined} aria-modal={open ? true : undefined} aria-label="Navegação do almoxarifado" className={`shell-sidebar ${open ? "is-open" : ""}`}>
      <div className="shell-brand"><Link href="/painel" onClick={close} aria-label="Marcon, painel do almoxarifado"><BrandLogo className="w-[148px]"/><span>Gestão de materiais</span></Link><button type="button" onClick={close} aria-label="Fechar menu" className="shell-icon-button shell-mobile-only"><X size={19}/></button></div>
      <div className="shell-workspace"><span className="shell-workspace-icon"><Building2 size={19}/></span><div><strong>Almoxarifado</strong><span>Marcon · Planta 01</span></div><span className="shell-status-dot" role="img" aria-label="Unidade ativa"/></div>
      <div className="shell-sidebar-scroll"><p className="shell-nav-label">Operação</p><nav aria-label="Operação">{navigation(navItems.filter((item) => ["/painel", "/fila", "/separacao", "/conversas"].includes(item.href)))}</nav><p className="shell-nav-label">Gestão de materiais</p><nav aria-label="Gestão de materiais">{navigation(navItems.filter((item) => !["/painel", "/fila", "/separacao", "/conversas"].includes(item.href)))}</nav><Link href="/qrcode" onClick={close} aria-current={pathname === "/qrcode" ? "page" : undefined} className={`shell-qr-link ${pathname === "/qrcode" ? "is-active" : ""}`}><QrCode size={19}/><span>Leitor de etiquetas<span>Acesse pelo QR Code</span></span><ArrowRight size={15}/></Link></div>
      <div className="shell-account"><Link href="/perfil" onClick={close} className="shell-account-profile"><span className="shell-avatar">{apiUser?.nome.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toLocaleUpperCase("pt-BR") || "US"}</span><span><strong>{apiUser?.nome ?? "Conta autenticada"}</strong><small>{apiUser?.perfil ?? "Sessão do backend"}</small></span></Link><Link href="/login" onClick={clearApiSession} aria-label="Sair da conta" title="Sair da conta" className="shell-icon-button"><LogOut size={18}/></Link></div>
    </aside>
  </>;
}

export function Topbar({ onMenu, menuOpen }: { onMenu: () => void; menuOpen: boolean }) {
  const pathname = usePathname();
  const today = useToday();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationArea = useRef<HTMLDivElement>(null);
  const [pendingRequests, setPendingRequests] = useState<ApiPendingRequest[]>([]);
  const inventory = useInventoryItems();
  const readSnapshot = useSyncExternalStore(subscribeToReadNotifications, () => getReadNotificationsSnapshot("warehouse"), getServerReadNotificationsSnapshot);
  const readIds = parseReadNotificationIds(readSnapshot);
  const loadPending = useEffectEvent(async () => {
    try {
      const result = await listPendingRequests();
      setPendingRequests(result.dados.filter((request) => request.status === "PENDENTE"));
    } catch {
      setPendingRequests([]);
    }
  });

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPending(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const pending = pendingRequests;
  const critical = inventory.filter((item) => item.quantity < item.minimum);
  const notifications = [
    ...pending.slice(0, 4).map((request) => ({ id: `pending-request-${request.requisicao_id}`, href: "/fila", title: "Nova requisição", detail: `${request.numero} · ${request.setor}` })),
    ...(critical.length ? [{ id: `critical-stock-${critical.map((item) => `${item.code}-${item.quantity}`).join("-")}`, href: "/inventario", title: "Estoque para revisar", detail: `${critical.length} materiais abaixo do mínimo` }] : []),
  ].filter((notification) => !readIds.includes(notification.id));

  useEffect(() => {
    if (!notificationsOpen) return;
    const outside = (event: PointerEvent) => { if (!notificationArea.current?.contains(event.target as Node)) setNotificationsOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setNotificationsOpen(false); notificationArea.current?.querySelector<HTMLButtonElement>("button")?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [notificationsOpen]);

  return <header className="shell-topbar"><div className="flex min-w-0 items-center gap-3"><button type="button" aria-label="Abrir menu" aria-expanded={menuOpen} aria-controls="warehouse-navigation" onClick={onMenu} className="shell-icon-button shell-mobile-only"><Menu size={21}/></button><div className="shell-breadcrumb"><span>Almoxarifado</span><ChevronRight size={13} aria-hidden="true"/><strong>{warehouseTitles[pathname] ?? "Painel geral"}</strong></div></div><div className="flex items-center gap-2 sm:gap-3"><time className="shell-date">{today}</time><ThemeToggle/><div ref={notificationArea} className="relative"><button type="button" onClick={() => setNotificationsOpen((current) => !current)} aria-label={`Notificações${notifications.length ? `, ${notifications.length} novas` : ""}`} aria-expanded={notificationsOpen} aria-controls="warehouse-notifications" className="shell-icon-button relative"><Bell size={19}/>{notifications.length > 0 && <span className="shell-notification-dot"/>}</button>{notificationsOpen && <section id="warehouse-notifications" aria-label="Notificações da operação" className="shell-notifications"><div className="shell-notifications-heading"><div><h2>Notificações</h2><p>Atualizações da operação</p></div><button type="button" aria-label="Fechar notificações" className="shell-icon-button" onClick={() => setNotificationsOpen(false)}><X size={17}/></button></div>{notifications.length ? <div>{notifications.map((notification) => <div key={notification.id} className="shell-notification"><Link href={notification.href} onClick={() => { markNotificationAsRead("warehouse", notification.id); setNotificationsOpen(false); }}><span className="shell-status-dot"/><span><strong>{notification.title}</strong><small>{notification.detail}</small></span></Link><button type="button" aria-label={`Marcar como lida: ${notification.title}`} title="Marcar como lida" className="shell-icon-button" onClick={() => markNotificationAsRead("warehouse", notification.id)}><Check size={16}/></button></div>)}</div> : <EmptyState title="Tudo em dia" description="Você já conferiu as atualizações." icon={<Check size={22}/>}/>}</section>}</div><Link href="/perfil" className="shell-avatar shell-topbar-avatar" aria-label="Ver meu perfil">CS</Link></div></header>;
}

export function RequesterLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const employeeCode = useSyncExternalStore(subscribeToRequesterSession, getRequesterCode, getServerRequesterValue);
  const employeeSector = useSyncExternalStore(subscribeToRequesterSession, getRequesterSector, getServerRequesterValue);
  const requests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const noticeSnapshot = useSyncExternalStore(subscribeToSectorNotices, getSectorNoticesSnapshot, getServerSectorNoticesSnapshot);
  const readScope = `employee:${employeeCode || employeeSector || "default"}`;
  const readSnapshot = useSyncExternalStore(subscribeToReadNotifications, () => getReadNotificationsSnapshot(readScope), getServerReadNotificationsSnapshot);
  const readIds = parseReadNotificationIds(readSnapshot);
  const requestNoticeIds = requests.filter((request) => employeeCode && request.employeeCode === employeeCode).flatMap((request) => [...(request.status === "Em andamento" ? [`${request.id}:in-progress`] : []), ...(request.deliveryConfirmed ? [`${request.id}:delivery-confirmed`] : [])]);
  const unread = [...requestNoticeIds, ...parseSectorNotices(noticeSnapshot).filter((notice) => notice.sector === employeeSector).map((notice) => notice.id)].filter((id) => !readIds.includes(id)).length;

  return <div className="requester-app"><a href="#main-content" className="skip-link">Pular para o conteúdo</a><header className="requester-header"><div className="requester-header-inner"><Link href="/materiais" aria-label="Marcon, portal do requisitante" className="requester-brand"><BrandLogo className="w-[126px] sm:w-[152px]"/><span>Portal de materiais</span></Link><div className="requester-identity"><Building2 size={16} aria-hidden="true"/><span><strong>{employeeSector || "Seu setor"}</strong><small>{employeeCode ? `Funcionário ${employeeCode}` : "Portal do requisitante"}</small></span></div><div className="flex items-center gap-1 sm:gap-3"><ThemeToggle/><Link href="/login" aria-label="Sair da conta" title="Sair da conta" className="shell-icon-button"><LogOut size={18}/></Link></div></div><nav aria-label="Portal do requisitante" className="requester-nav">{requesterNav.map(({ href, label, mobileLabel, icon: Icon }) => { const active = pathname === href || (href === "/materiais" && pathname === "/pedido"); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={active ? "is-active" : ""}><Icon size={18} aria-hidden="true"/><span className="requester-nav-desktop-label">{label}</span><span className="requester-nav-mobile-label">{mobileLabel}</span>{href === "/notificacoes" && unread > 0 && <span className="requester-unread">{unread}</span>}</Link>; })}</nav></header><main id="main-content" tabIndex={-1} className="requester-content">{children}</main><footer className="product-footer"><span>Marcon <span aria-hidden="true">/</span> Gestão de materiais</span><span>Til Marcon</span></footer></div>;
}
