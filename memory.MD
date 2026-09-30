# Memory do projeto Cellarium / Marcon

## Resumo

- Projeto: portal demonstrativo de gestão de materiais e almoxarifado da Marcon, no repositório `cellarium_front`.
- Idioma da interface: português brasileiro.
- Usuário trabalha neste workspace: `C:\Temp\Joao Guilherme\Desafio_Ideias\cellarium_front`.
- O sistema tem perfis de requisitante (funcionário da fábrica) e almoxarife. A autenticação atual é apenas demonstrativa, sem validação real de credenciais ou backend.
- Persistência operacional atual é feita principalmente com `localStorage`; os dados iniciais vêm de `lib/mock-data.ts`. Não tratar dados demonstrativos como dados reais de produção.

## Stack e regras do repositório

- Next.js App Router, React 19, TypeScript e Tailwind CSS 4; ícones `lucide-react`.
- Sempre TypeScript (`.ts`/`.tsx`), sem JavaScript puro ou JSX em `.js`.
- Seguir as instruções completas em `AGENTS.md`: componentes pequenos, props tipadas, acessibilidade e teclado, mobile-first, foco visível, tokens de cor, dark mode manual e via `prefers-color-scheme`, next/font, imagens com `next/image`, e animações Framer Motion quando aplicáveis.
- Evitar visual genérico. A direção visual documentada abaixo é uma operação fabril clara, profissional e rápida de consultar.
- Manter Client Components somente para estado/interação; outras partes podem ser Server Components.
- ESLint é executado com `npm run lint`. Não adicionar testes ou executar testes sem solicitação explícita.
- `package.json` scripts: `dev`, `build`, `start`, `lint`. Não há biblioteca de planilhas instalada; o histórico exporta CSV UTF-8 com BOM e `;`, compatível com Excel.
- Ao ler/escrever arquivos via PowerShell, especificar UTF-8 (`-Encoding utf8`) para preservar acentos em português. Algumas leituras sem encoding explícito mostraram mojibake no terminal; evitar regravar arquivos inteiros com encoding implícito.

## Direção visual

- Centro de operações de fábrica; leitura rápida e profissional, menos cartões/sombras repetidos, dados/status em destaque e cores de sinalização reservadas para alertas.
- Requisitante: saldo do setor, nível mínimo, avisos de disponibilidade e histórico para contextualizar saldos.
- Almoxarife: visão por setor, setores críticos, avisos e separação clara entre estoque central e estoque local.
- O `memory.MD` anterior descrevia como próximo foco aplicar a direção primeiro ao estoque por setor e validar legibilidade, fluxo e responsividade antes de expandir.

## Estrutura e pontos de entrada

- `app/page.tsx` mostra `LoginPage`; rotas dinâmicas do portal são resolvidas pelo `WarehouseScreen` em `components/warehouse.tsx`.
- `components/warehouse.tsx` contém layouts, componentes e o roteamento do portal por `usePathname`. Rotas importantes:
  - `/login`: acesso demonstrativo; funcionário e almoxarife.
  - `/materiais`: seleção de materiais para uma OS.
  - `/pedido`: envio dos materiais selecionados.
  - `/acompanhar`: no portal do requisitante, mostra `RequestSearch` para localizar requisições/OS e ver abertas.
  - `/meu-estoque`: estoque do setor para requisitante.
  - `/painel`: painel geral.
  - `/fila`: usa `components/warehouse-queue.tsx` (`WarehouseQueue`); fila do almoxarife.
  - `/separacao`: separação da requisição selecionada, recebe `?request=ID`.
  - `/estoque-setor`: `SectorStockPage` com `isWarehouse`.
  - `/inventario`: a entrada final do mapa aponta para `InventoryScreen` em `components/inventory-page.tsx`.
  - `/historico`: histórico de requisições concluídas e exportação.
  - `/qrcode`: validação demonstrativa de QR/código de requisição; não é o fluxo de pedir material.
  - `/conversas`: chat do almoxarife; `/chat`: chat do requisitante.
- `components/warehouse.tsx` também mantém páginas antigas/duplicadas; a função `QueuePage` está sem uso e gera aviso ESLint. Confirmar o mapeamento de rota antes de editar uma implementação homônima antiga.
- Não existe `components/ui` apesar da orientação de usar shadcn como fundação. Vários controles são componentes locais em `warehouse.tsx`.

## Fluxos e comportamentos atuais

### Login e identidade

- `components/login-page.tsx` não autentica credenciais. Funcionário informa código e setor; almoxarife escolhe o perfil.
- O login guarda `cellarium-user-role` (`requisitante`/`almoxarife`); funcionário também grava código e setor.
- Nome de requisitante não é obtido de cadastro. O formulário usa o código de login como identificador exibido.
- OS em novas requisições é gerada em sequência a partir dos números já vistos nas requisições, com prefixo `OS-`.

### Requisições, fila e painel

- `lib/request-storage.ts` combina registros de `lib/mock-data.ts` com requisições enviadas, persiste novas requisições em `cellarium-submitted-requests`, permite atualizar status e notifica listeners via `cellarium-requests-updated`.
- Tipos de status comuns: `Pendente`, `Em andamento`, `Concluído`.
- Fila (`WarehouseQueue`) oculta concluídas, filtra por texto, ordena pela data desejada e oferece “Aceitar e abrir separação”; aceita = salva `Em andamento` e navega para `/separacao?request=...`.
- O painel geral usa `components/dashboard-priorities.tsx`: exibe pedidos pendentes, solicitante, turno, data e botão “Aceitar”; o botão também atualiza status e abre a separação.
- Pedidos antigos de demonstração podem não ter turno; a UI mostra “Não informado”.
- Há pelo menos uma OS de demonstração `OS-822` / `REQ-2049`, em andamento no setor Montagem e Pintura; `OS-819` / `REQ-2045` também está em andamento nos dados mock.

### Separação e compras

- `components/warehouse.tsx` renderiza a página de separação e carrega requisições vivas pelo storage. Confirmação de entrega e fechamento de OS são processos diferentes.
- Em separação, o almoxarife pode abrir “Requisitar material para Compras”. Essa requisição deve ficar vinculada à OS e ao setor atuais.
- `components/purchase-request.tsx` é o componente compartilhado do popup de Compras para inventário e separação. Alterações nesse componente afetam ambos os lugares.
- O popup é centralizado com React portal (`createPortal` para `document.body`), porque dentro do cabeçalho animado da separação um `position: fixed` poderia ficar preso ao ancestral transformado.
- Popup tem carrinho de vários produtos: nome, código opcional, unidade, quantidade, justificativa; agrega itens repetidos pelo código/nome, permite remover, depois envia todos juntos.
- As solicitações são salvas em `cellarium-purchase-requests` no `localStorage`, com status inicial Pendente, e incluem `requestId`/setor quando abertas na separação. Não existe backend ou tela de Compras para triagem ainda.
- O requisitante pode registrar sobras e fechar a OS no estoque do próprio setor. Almoxarife não pode fechar OS. O perfil é verificado no `SectorStockPage`; role é persistido em login.
- Não usar QR Code para o pedido de material: o usuário pediu para esquecer essa opção. `/qrcode` permanece para validar código de requisição/retirada.

### Inventário

- `components/inventory-page.tsx` é a tela realmente mapeada em `/inventario`; lista saldos demonstrativos e usa o popup compartilhado `PurchaseRequest` para pedir material a Compras.
- O botão do inventário e o botão da separação devem abrir exatamente o mesmo popup e compartilhar comportamento, campos e carrinho.
- O inventário é baseado no array `stock` mock; requisitar compra não deve criar/adicionar automaticamente o material ao saldo.

### Estoque por setor e fechamento de OS

- `components/sector-stock.tsx` é compartilhado entre `/meu-estoque` e `/estoque-setor` (`isWarehouse` true no segundo).
- Dados demonstrativos de saldos/notificações ficam em `marcon-sector-stock-v2`.
- Lista OS em andamento; apenas requisitante pode fechar e informar sobras por item. Almoxarife pode visualizar, mas não recebe ação nem modal de fechamento.
- Perfil do usuário em sessão está em `lib/requester-session.ts`; evento customizado `cellarium-requester-profile-updated` atualiza assinantes.

### Histórico e exportação

- Histórico apresenta somente requisições com status `Concluído`; pendentes e em andamento ficam fora.
- Exportação usa período: últimos 15, 30 ou 60 dias, intervalo customizado ou todo o histórico; o filtro de busca/status também afeta exportação.
- Download CSV UTF-8 BOM, delimitador ponto e vírgula, com colunas de requisição, OS, solicitante, setor, turno, data desejada, status e materiais. Excel brasileiro abre esse formato.
- Data da requisição (`date`) representa a data desejada da entrega no formulário novo e é formatada pt-BR. Mock antigo tem datas históricas; por isso presets recentes podem omiti-los.

### Chat e tema

- Chat usa `components/request-chat.tsx` e `lib/chat-storage.ts`; dados locais são compartilhados por requisição.
- Dark mode manual e `prefers-color-scheme` são definidos em `app/layout.tsx`, `components/theme-toggle.tsx` e `app/globals.css`.
- Chat recebeu classes dark explícitas para evitar faixas claras em cabeçalho, área de mensagens e balões.

## Chaves de armazenamento local conhecidas

- `cellarium-user-role`
- `cellarium-requester-code`
- `cellarium-requester-sector`
- `cellarium-submitted-requests`
- `cellarium-purchase-requests`
- `marcon-sector-stock-v2`
- `cellarium-theme`
- Mensagens: verificar `lib/chat-storage.ts` antes de alterar o nome da chave.

## Qualidade e cautelas de manutenção

- Lint atual termina sem erros, mas com aviso `QueuePage` definido e não utilizado em `components/warehouse.tsx`.
- `components/warehouse.tsx` tem JSX comprimido em linhas longas e muitas telas antigas; preferir mudanças cirúrgicas ou extrair componentes focados.
- O request store é demonstrativo/local. Alterações no `localStorage` não sincronizam entre usuários/navegadores e não fornecem concorrência ou autorização de servidor.
- `updateRequestStatus` persiste overrides de dados mock junto com requisições submetidas; `getAllRequests` deve deduplicar por ID favorecendo o registro persistido.
- Antes de concluir mudanças de interface, rodar `npm run lint` conforme orientação do repositório. Não afirmar que verificou visualmente sem abrir a aplicação.
