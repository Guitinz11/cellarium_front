"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import WarehouseScreen from "@/components/warehouse";

const warehouseRoutes = new Set([
  "/", "/login", "/materiais", "/pedido", "/acompanhar", "/chat", "/notificacoes", "/meu-estoque",
  "/painel", "/analises", "/fila", "/separacao", "/historico", "/inventario", "/qrcode", "/perfil",
  "/estoque-setor", "/compras", "/conversas",
]);

export default function AppRouteView({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Keep the client app mounted across App Router page segment changes. Its route
  // pages are dispatched by pathname, so Next's per-page loading fallbacks do
  // not replace the visible shell during ordinary in-app navigation.
  if (pathname && warehouseRoutes.has(pathname)) return <WarehouseScreen/>;

  // Standalone screens keep their existing route implementation.
  return <>{children}</>;
}
