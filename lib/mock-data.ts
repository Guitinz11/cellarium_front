export const requests = [
  { id: "REQ-2048", order: "OS-821", requester: "José Alencar", sector: "Montagem e Pintura", date: "24/10/2024", status: "Pendente", items: "Rolamento 6204 · 4 un." },
  { id: "REQ-2045", order: "OS-819", requester: "Marcos Souza", sector: "Usinagem e Solda", date: "24/10/2024", status: "Em andamento", items: "Disco de corte · 12 un." },
  { id: "REQ-2041", order: "OS-812", requester: "Felipe Neto", sector: "Qualidade e Testes", date: "23/10/2024", status: "Concluído", items: "Fusível 10A · 6 un." },
  { id: "REQ-2039", order: "OS-809", requester: "José Alencar", sector: "Montagem e Pintura", date: "23/10/2024", status: "Concluído", items: "Óleo hidráulico · 2 un." },
];

export const stock = [
  { name: "Rolamento 6204", code: "MAT-00482", quantity: 3, minimum: 10, unit: "un." },
  { name: "Filtro hidráulico HF-12", code: "MAT-00136", quantity: 5, minimum: 8, unit: "un." },
  { name: "Disco de corte 7″", code: "MAT-00301", quantity: 8, minimum: 12, unit: "un." },
];

export const sectors = ["Montagem e Pintura", "Usinagem e Solda", "Corte e Dobra e Estamparia", "Assistência Técnica", "Projetos e Engenharia", "Setor Comercial", "Qualidade e Testes"];

export const navItems = [
  { label: "Painel Geral", href: "/painel", icon: "layout" },
  { label: "Requisições", href: "/fila", icon: "requests" },
  { label: "Separação", href: "/separacao", icon: "boxes" },
  { label: "Estoque por setor", href: "/estoque-setor", icon: "boxes" },
  { label: "Histórico", href: "/historico", icon: "history" },
  { label: "Inventário", href: "/inventario", icon: "inventory" },
  { label: "Análises", href: "/analises", icon: "analytics" },
];
