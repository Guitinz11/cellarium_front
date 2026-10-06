export type MaterialRecord = {
  name: string;
  code: string;
  quantity: number;
  minimum: number;
  unit: string;
  category: string;
  specification: string;
};

export type LocalRequestRecord = {
  id: string;
  order: string;
  requester: string;
  sector: string;
  date: string;
  status: string;
  items: string;
};

export const requests: LocalRequestRecord[] = [];
export const sectors: string[] = [];
export const seededMaterials: MaterialRecord[] = [];
export const stock: MaterialRecord[] = [];
export const materialsCatalog: MaterialRecord[] = [];

export const navItems = [
  { label: "Painel Geral", href: "/painel", icon: "layout" },
  { label: "Requisições", href: "/fila", icon: "requests" },
  { label: "Conversas", href: "/conversas", icon: "messages" },
  { label: "Separação", href: "/separacao", icon: "checkSquare" },
  { label: "Estoque por setor", href: "/estoque-setor", icon: "boxes" },
  { label: "Carrinho de compras", href: "/compras", icon: "shoppingCart" },
  { label: "Histórico", href: "/historico", icon: "history" },
  { label: "Inventário", href: "/inventario", icon: "inventory" },
  { label: "Análises", href: "/analises", icon: "analytics" },
];
