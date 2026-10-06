"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import LoginPage from "@/components/login-page";
import OperationsDashboard from "@/components/operations-dashboard-live";
import WarehouseQueue from "@/components/warehouse-queue-live";
import MaterialSelection from "@/components/material-selection-live";
import RequestForm from "@/components/request-form-live";
import RequestSearch from "@/components/request-search-live";
import WarehouseSeparation from "@/components/warehouse-separation";
import WarehouseHistory from "@/components/warehouse-history";
import WarehouseRequestQr from "@/components/warehouse-request-qr";
import WarehouseInventory from "@/components/inventory-live";
import WarehouseProfile from "@/components/warehouse-profile-live";
import BackendDataUnavailable from "@/components/backend-data-unavailable";
import SectorStockLive from "@/components/sector-stock-live";
import NotificationsLive from "@/components/employee-notifications-live";
import RequestConversationsLive from "@/components/request-conversations-live";
import AccessDenied from "@/components/access-denied";
import { RequesterLayout, Sidebar, Topbar } from "@/components/product-shell";
import { ApiError, ApiUnavailableError, clearApiSession, getAccessToken, getCurrentUser, normalizeUserProfile } from "@/lib/warehouse-api";

const requesterUnavailable: Record<string, ReactNode> = {
  "/chat": <RequestConversationsLive/>,
  "/notificacoes": <NotificationsLive/>,
  "/meu-estoque": <SectorStockLive/>,
};

const warehousePages: Record<string, ReactNode> = {
  "/painel": <OperationsDashboard/>,
  "/analises": <OperationsDashboard/>,
  "/fila": <WarehouseQueue/>,
  "/separacao": <WarehouseSeparation/>,
  "/historico": <WarehouseHistory/>,
  "/inventario": <WarehouseInventory/>,
  "/qrcode": <WarehouseRequestQr/>,
  "/perfil": <WarehouseProfile/>,
  "/estoque-setor": <SectorStockLive warehouse/>,
  "/compras": <BackendDataUnavailable title="Compras indisponÃ­veis" detail="O backend ainda nÃ£o oferece endpoints para pedidos de compra ou recebimento de materiais. Nenhuma compra local serÃ¡ tratada como registro real."/>,
  "/conversas": <RequestConversationsLive/>,
};

export default function WarehouseScreen() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [access, setAccess] = useState<{ pathname: string; state: "checking" | "allowed" | "unavailable" }>({ pathname: "", state: "checking" });

  useEffect(() => {
    if (pathname === "/" || pathname.startsWith("/login")) return;
    let active = true;
    const reject = (clearSession: boolean) => {
      if (clearSession) clearApiSession();
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
      const requesterRoute = ["/materiais", "/pedido", "/acompanhar", "/meu-estoque", "/chat", "/notificacoes"].includes(pathname);
      if (role === "desconhecido" || (requesterRoute && role !== "funcionario") || (!requesterRoute && role !== "almoxarife")) {
        reject(false);
        return;
      }
      setAccess({ pathname, state: "allowed" });
    }).catch((cause: unknown) => {
      if (!active) return;
      if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
        reject(true);
        return;
      }
      if (cause instanceof ApiUnavailableError) {
        setAccess({ pathname, state: "unavailable" });
        return;
      }
      setAccess({ pathname, state: "unavailable" });
    });
    return () => {
      active = false;
      window.removeEventListener("cellarium-session-invalid", onSessionInvalid);
    };
  }, [pathname, router]);

  if (pathname === "/" || pathname.startsWith("/login")) return <LoginPage/>;
  if (access.pathname !== pathname || access.state === "checking") {
    return <main className="access-checking" role="status" aria-live="polite"><span className="access-checking-mark" aria-hidden="true"/><p>Validando seu acessoâ€¦</p></main>;
  }
  if (access.state === "unavailable") return <AccessDenied unavailable/>;
  if (access.state !== "allowed") return null;
  if (pathname === "/materiais") return <RequesterLayout><MaterialSelection/></RequesterLayout>;
  if (pathname === "/pedido") return <RequesterLayout><RequestForm/></RequesterLayout>;
  if (pathname === "/acompanhar") return <RequesterLayout><RequestSearch/></RequesterLayout>;
  if (pathname === "/chat" || pathname === "/notificacoes" || pathname === "/meu-estoque") {
    return <RequesterLayout>{requesterUnavailable[pathname]}</RequesterLayout>;
  }

  return <div className="warehouse-app">
    <a href="#main-content" className="skip-link">Pular para o conteÃºdo</a>
    <Sidebar open={menuOpen} close={() => setMenuOpen(false)}/>
    <div className="shell-main" inert={menuOpen}>
      <Topbar menuOpen={menuOpen} onMenu={() => setMenuOpen(true)}/>
      <main id="main-content" tabIndex={-1} className="warehouse-content">
        {warehousePages[pathname] ?? <OperationsDashboard/>}
      </main>
      <footer className="product-footer"><span>Marcon <span aria-hidden="true">/</span> GestÃ£o de materiais</span><span>Til Marcon</span></footer>
    </div>
  </div>;
}

