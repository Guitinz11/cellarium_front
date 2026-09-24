<!-- BEGIN:nextjs-agent-rules -->

AGENTS.md
Sobre o projeto

Front-end de um sistema de gestão de almoxarifado industrial. Apenas interface visual (Next.js + Tailwind CSS), sem backend real — usar mocks/placeholders para dados. Público-alvo: operadores de chão de fábrica e almoxarifes, muitas vezes usando tablet. Prioridade: simplicidade, legibilidade e rapidez de uso, não estética decorativa.

Stack
Next.js (App Router)
Tailwind CSS (sem bibliotecas de UI pesadas — componentes próprios)
lucide-react para ícones (outline)
Sem backend/autenticação real nesta fase — tudo mockado
Identidade visual
#0F172A — fundo escuro / sidebar
#0B57D0 — cor primária (botões, links ativos, destaques)
#F8FAFC — fundo claro / cards / texto claro
Tipografia: Inter (ou similar), sem serifa
Evitar excesso de sombras, gradientes ou animações — visual industrial, direto ao ponto
Estrutura de pastas esperada
/app
  /(requisitante)
    login/
    pedido/
    acompanhar/
  /(almoxarife)
    login/
    painel/
    fila/
    separacao/
    qrcode/
    historico/
    inventario/
/components
  ui/          → Card, Badge, Button, Table, Sidebar, Topbar
  layout/
/lib
  mock-data.ts
Convenções de código
Componentes funcionais, TypeScript sempre que possível
Um componente por arquivo, nomes em PascalCase
Classes Tailwind direto no JSX; evitar CSS customizado salvo exceções (ex: cores fora da paleta padrão do Tailwind → usar tailwind.config com as cores do projeto nomeadas, ex: bg-brand-dark, bg-brand-primary, bg-brand-light)
Componentizar qualquer elemento repetido mais de 2x (cards de KPI, badges de status, linhas de tabela)
Dados mockados centralizados em /lib/mock-data.ts, nunca hardcoded espalhado pelas telas
Status e badges (usar cores de apoio, sem fugir da paleta base)
Pendente → laranja/amber
Em andamento / Em separação → azul (
#0B57D0)
Concluído → verde
Crítico / Atenção → vermelho
Responsividade
Mobile-first
Sidebar colapsa em menu hambúrguer abaixo de md
Tabelas com scroll horizontal em telas pequenas, nunca quebrar layout
Botões e áreas de toque grandes o suficiente para uso em tablet com luvas (min. 44px de altura)
O que NÃO fazer
Não usar bibliotecas de componentes prontos (Material UI, Chakra, shadcn) — o app deve ficar leve e com identidade própria
Não implementar lógica de negócio, API calls reais ou autenticação nesta fase
Não adicionar dados reais/sensíveis — tudo é mock
Não fugir da paleta de cores definida
Evitar gastar tokens/ciclos em polimento visual excessivo — o objetivo é uma base funcional e limpa, não um showcase
Fluxos principais a implementar

Requisitante: Login → Fazer pedido → Acompanhar pedido Almoxarife: Login → Painel (KPIs + prioridades do turno + estoque crítico) → Fila de pedidos (aceitar pedido) → Confirmar separação → Leitor de QR Code → Histórico → Baixar PDF (comprovante)

Referência visual

Seguir como base os elementos identificados no Figma do projeto (a ser fornecido) e no wireframe de cards já validado com o cliente (ver estrutura de sidebar e dashboard do painel do almoxarife).
<!-- END:nextjs-agent-rules -->
