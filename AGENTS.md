<!-- BEGIN:nextjs-agent-rules -->
Stack
Framework: Next.js (App Router)
Linguagem: TypeScript (sempre, nunca .jsx/.js puro)
Estilização: Tailwind CSS
Animações: Framer Motion (motion / AnimatePresence) como padrão. Usar CSS puro apenas para transições simples de hover/focus.
Ícones: lucide-react
Componentes de UI base: shadcn/ui como fundação, customizados — nunca deixar com a "cara padrão" do shadcn
Fontes: next/font (nunca <link> externo pra fontes)
Gerenciamento de estado leve: React state/hooks; Zustand se for algo global mais complexo
Estrutura de pastas
app/                 # rotas (App Router)
components/
  ui/                # componentes base (botão, input, card...)
  sections/          # blocos maiores de página (Hero, Features...)
  animations/         # wrappers de animação reutilizáveis
lib/                 # utils, hooks, helpers
styles/              # globals.css, tokens
Princípios de design
Nunca usar o "look" default de UI genérica (Bootstrap-like, cinza sem graça). Ter uma direção visual clara: paleta definida, tipografia com hierarquia forte, espaçamento generoso.
Tipografia com personalidade: título grande e ousado, peso variando (400/600/800), não deixar tudo font-normal.
Paleta consistente: definir tokens de cor no globals.css via CSS variables e reutilizar em todo lugar — nunca hardcodar hex solto no meio do componente.
Dark mode obrigatório via prefers-color-scheme + toggle manual, usando as CSS variables.
Microinterações em tudo que é clicável: botões, cards, links devem reagir a hover/tap com transição suave (scale, shadow, cor).
Espaço em branco é parte do design. Evitar layouts apertados.
Padrão de animações (Framer Motion)
Toda seção que entra na viewport deve animar com whileInView (fade + slide sutil, ex: opacity 0→1, y: 20→0), com viewport={{ once: true }}.
Transições de página/rota usam AnimatePresence no layout.
Duração padrão: 0.3s–0.6s. Easing padrão: [0.16, 1, 0.3, 1] (ease-out suave) ou easeInOut.
Listas/grids animam os filhos em stagger (staggerChildren: 0.05–0.1).
Hover em cards/botões: whileHover={{ scale: 1.02 }}, whileTap={{ scale: 0.98 }}.
Nunca animar width/height/top/left diretamente — sempre preferir transform e opacity (performance).
Criar wrappers reutilizáveis em components/animations/ (ex: <FadeIn>, <StaggerContainer>) em vez de repetir as mesmas props de motion em todo componente.
Respeitar prefers-reduced-motion: reduzir ou remover animações quando o usuário sinalizar essa preferência.
Componentização
Componentes pequenos e focados (uma responsabilidade cada).
Nomes em PascalCase, arquivos NomeDoComponente.tsx.
Props tipadas com interface, nunca any.
Extrair lógica repetida em hooks (useX) dentro de lib/hooks/.
Client Components ("use client") apenas onde há interatividade/estado/animação; o resto fica Server Component por padrão (performance).
Responsividade
Mobile-first sempre: escrever a classe base pensando em mobile, depois sm: md: lg: xl:.
Testar breakpoints principais: 375px, 768px, 1024px, 1440px.
Imagens sempre com next/image, nunca <img> puro.
Acessibilidade
Todo elemento interativo precisa ser navegável por teclado e ter aria-label quando o texto não for autoexplicativo.
Contraste mínimo AA (4.5:1 para texto normal).
Foco visível (focus-visible:ring-2) — nunca outline-none sem substituto.
Performance
next/image com sizes corretos e priority só na imagem above-the-fold.
Lazy-load seções pesadas com dynamic() quando fizer sentido.
Evitar re-renders desnecessários: useMemo/useCallback onde há custo real, não em tudo.
Qualidade de código
ESLint + Prettier configurados; código deve passar no lint antes de considerar a tarefa concluída.
Sem estilos inline soltos (style={{...}}) exceto para valores dinâmicos (ex: posição calculada em runtime).
Sem console.log esquecido no código final.
Commits/PRs pequenos e descritivos.
<!-- END:nextjs-agent-rules -->
