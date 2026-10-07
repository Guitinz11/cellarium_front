"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import LoginPage from "@/components/login-page";
import OperationsDashboard from "@/components/operations-dashboard-live";
import RequestAnalytics from "@/components/request-analytics-live";
import WarehouseQueue from "@/components/warehouse-queue-live";
import MaterialSelection from "@/components/material-selection-live";
import RequestForm from "@/components/request-form-live";
import RequestSearch from "@/components/request-search-live";
import WarehouseSeparation from "@/components/warehouse-separation";
import WarehouseHistory from "@/components/warehouse-history";
import WarehouseRequestQr from "@/components/warehouse-request-qr";
import WarehouseInventory from "@/components/inventory-live";
import PurchasesLive from "@/components/purchases-live";
import WarehouseProfile from "@/components/warehouse-profile-live";
import SectorStockLive from "@/components/sector-stock-live";
import NotificationsLive from "@/components/employee-notifications-live";
import RequestConversationsLive from "@/components/request-conversations-live";
import AccessDenied from "@/components/access-denied";
import { RequesterLayout, Sidebar, Topbar } from "@/components/product-shell";
import { ApiError, ApiUnavailableError, clearApiSession, getAccessToken, getCurrentUser, normalizeUserProfile, type NormalizedUserRole } from "@/lib/warehouse-api";

const requesterUnavailable: Record<string, ReactNode> = {
  "/chat": <RequestConversationsLive/>,
  "/notificacoes": <NotificationsLive/>,
  "/meu-estoque": <SectorStockLive/>,
};

const warehousePages: Record<string, ReactNode> = {
  "/painel": <OperationsDashboard/>,
  "/analises": <RequestAnalytics/>,
  "/fila": <WarehouseQueue/>,
  "/separacao": <WarehouseSeparation/>,
  "/historico": <WarehouseHistory/>,
  "/inventario": <WarehouseInventory/>,
  "/qrcode": <WarehouseRequestQr/>,
  "/perfil": <WarehouseProfile/>,
  "/estoque-setor": <SectorStockLive warehouse/>,
  "/compras": <PurchasesLive/>,
  "/conversas": <RequestConversationsLive/>,
};

const requesterRoutes = new Set(["/materiais", "/pedido", "/acompanhar", "/meu-estoque", "/chat", "/notificacoes"]);
let validatedSession: { token: string; role: NormalizedUserRole } | null = null;

function roleCanAccessPath(role: NormalizedUserRole, pathname: string) {
  return role !== "desconhecido" && (requesterRoutes.has(pathname) ? role === "funcionario" : role === "almoxarife");
}

export default function WarehouseScreen() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [access, setAccess] = useState<{ pathname: string; state: "checking" | "allowed" | "unavailable"; role: NormalizedUserRole | null }>(() => {
    const token = getAccessToken();
    const role = validatedSession?.token === token ? validatedSession.role : null;
    return role && roleCanAccessPath(role, pathname)
      ? { pathname, state: "allowed", role }
      : { pathname: "", state: "checking", role: null };
  });

  useEffect(() => {
    if (pathname === "/" || pathname.startsWith("/login")) return;
    let active = true;
    const reject = (clearSession: boolean) => {
      if (clearSession) {
        validatedSession = null;
        clearApiSession();
      }
      router.replace("/acesso-negado");
    };
    const token = getAccessToken();
    if (!token) {
      reject(false);
      return;
    }
    const onSessionInvalid = () => reject(true);
    window.addEventListener("cellarium-session-invalid", onSessionInvalid);
    void getCurrentUser().then((user) => {
      if (!active) return;
      const role = normalizeUserProfile(user.perfil);
      if (!roleCanAccessPath(role, pathname)) {
        reject(false);
        return;
      }
      validatedSession = { token, role };
      setAccess({ pathname, state: "allowed", role });
    }).catch((cause: unknown) => {
      if (!active) return;
      if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
        validatedSession = null;
        reject(true);
        return;
      }
      if (cause instanceof ApiUnavailableError) {
        setAccess({ pathname, state: "unavailable", role: null });
        return;
      }
      setAccess({ pathname, state: "unavailable", role: null });
    });
    return () => {
      active = false;
      window.removeEventListener("cellarium-session-invalid", onSessionInvalid);
    };
  }, [pathname, router]);

  if (pathname === "/" || pathname.startsWith("/login")) return <LoginPage/>;
  const cachedRoutePermission = access.state === "allowed" && access.role !== null && Boolean(getAccessToken()) && roleCanAccessPath(access.role, pathname);
  if ((access.pathname !== pathname || access.state === "checking") && !cachedRoutePermission) {
    return <main className="access-checking" role="status" aria-live="polite"><span className="access-checking-mark" aria-hidden="true"/><p>Validando seu acessoâ€¦</p></main>;
  }
  if (access.pathname === pathname && access.state === "unavailable") return <AccessDenied unavailable/>;
  if (access.state !== "allowed" && !cachedRoutePermission) return null;
  if (pathname === "/materiais") return <RequesterLayout><div key={pathname} className="route-page-transition"><MaterialSelection/></div></RequesterLayout>;
  if (pathname === "/pedido") return <RequesterLayout><div key={pathname} className="route-page-transition"><RequestForm/></div></RequesterLayout>;
  if (pathname === "/acompanhar") return <RequesterLayout><div key={pathname} className="route-page-transition"><RequestSearch/></div></RequesterLayout>;
  if (pathname === "/chat" || pathname === "/notificacoes" || pathname === "/meu-estoque") {
    return <RequesterLayout><div key={pathname} className="route-page-transition">{requesterUnavailable[pathname]}</div></RequesterLayout>;
  }

  return <div className="warehouse-app">
    <a href="#main-content" className="skip-link">Pular para o conteÃºdo</a>
    <Sidebar open={menuOpen} close={() => setMenuOpen(false)}/>
    <div className="shell-main" inert={menuOpen}>
      <Topbar menuOpen={menuOpen} onMenu={() => setMenuOpen(true)}/>
      <main id="main-content" tabIndex={-1} className="warehouse-content">
        <div key={pathname} className="route-page-transition">{warehousePages[pathname] ?? <OperationsDashboard/>}</div>
      </main>
      <footer className="product-footer"><span>Marcon <span aria-hidden="true">/</span> GestÃ£o de materiais</span><span>Til Marcon</span></footer>
    </div>
  </div>;
}

