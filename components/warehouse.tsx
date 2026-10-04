"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
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
import { RequesterLayout, Sidebar, Topbar } from "@/components/product-shell";

const requesterUnavailable: Record<string, ReactNode> = {
  "/chat": <BackendDataUnavailable title="Conversas indisponíveis" detail="O backend ainda não oferece um endpoint de conversas. Nenhuma mensagem local será exibida como dado real."/>,
  "/notificacoes": <BackendDataUnavailable title="Notificações indisponíveis" detail="O backend ainda não oferece uma consulta de notificações para este portal."/>,
  "/meu-estoque": <BackendDataUnavailable title="Estoque do setor indisponível" detail="A API atual não fornece saldo segregado por setor. Nenhum saldo local será apresentado como se viesse do banco."/>,
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
  "/estoque-setor": <BackendDataUnavailable title="Estoque por setor indisponível" detail="O backend ainda não modela saldo segregado por setor. Esta tela não usará saldos locais."/>,
  "/compras": <BackendDataUnavailable title="Compras indisponíveis" detail="O backend ainda não oferece endpoints para pedidos de compra ou recebimento de materiais. Nenhuma compra local será tratada como registro real."/>,
  "/conversas": <BackendDataUnavailable title="Conversas indisponíveis" detail="O backend ainda não oferece um endpoint de conversas para o almoxarifado."/>,
};

export default function WarehouseScreen() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/" || pathname.startsWith("/login")) return <LoginPage/>;
  if (pathname === "/materiais") return <RequesterLayout><MaterialSelection/></RequesterLayout>;
  if (pathname === "/pedido") return <RequesterLayout><RequestForm/></RequesterLayout>;
  if (pathname === "/acompanhar") return <RequesterLayout><RequestSearch/></RequesterLayout>;
  if (pathname === "/chat" || pathname === "/notificacoes" || pathname === "/meu-estoque") {
    return <RequesterLayout>{requesterUnavailable[pathname]}</RequesterLayout>;
  }

  return <div className="warehouse-app">
    <a href="#main-content" className="skip-link">Pular para o conteúdo</a>
    <Sidebar open={menuOpen} close={() => setMenuOpen(false)}/>
    <div className="shell-main" inert={menuOpen}>
      <Topbar menuOpen={menuOpen} onMenu={() => setMenuOpen(true)}/>
      <main id="main-content" tabIndex={-1} className="warehouse-content">
        {warehousePages[pathname] ?? <OperationsDashboard/>}
      </main>
      <footer className="product-footer"><span>Marcon <span aria-hidden="true">/</span> Gestão de materiais</span><span>Til Marcon</span></footer>
    </div>
  </div>;
}
