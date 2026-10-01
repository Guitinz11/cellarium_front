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

## Progresso adicional (2026-10-01)

### Persistência sem backend

- O usuário pediu que o site funcione sem APIs, backend ou banco de dados. Manter o comportamento no navegador via `localStorage`; funciona entre abas no mesmo navegador/origem, não entre dispositivos ou perfis diferentes.
- `lib/request-storage.ts` persiste requisições em `cellarium-submitted-requests`, combina dados mock e enviados, e emite `cellarium-requests-updated`. `components/warehouse-queue.tsx` acompanha a mesma fonte; o fluxo foi testado entre funcionário e almoxarife.
- A tela de Compras persiste lotes em `cellarium-purchase-requests`. `lib/inventory-storage.ts` guarda os saldos recebidos em `cellarium-inventory-state`; `components/inventory-page.tsx` tem a aba **A receber**, que registra o lote e soma quantidades ao inventário sem duplicar um lote já recebido.

### Estado da OS e confirmação de entrega

- A confirmação do almoxarife não deve concluir a OS. `deliveryConfirmed?: boolean` é independente de `status`; confirmar a entrega em `components/warehouse.tsx` chama `confirmRequestDelivery` em `lib/request-storage.ts`, preservando `Em andamento`.
- O funcionário só pode fechar a OS depois de `deliveryConfirmed === true`. Em `components/sector-stock.tsx`, o modal de fechamento registra sobras, incrementa os saldos por código de material e setor e então muda o status para `Concluído`.
- `marcon-sector-stock-v2.closedRequestIds` protege contra somar as mesmas sobras novamente após reabrir a tela. O setor da tela do funcionário deriva de `getRequesterSector`; o almoxarife continua usando seu seletor de setor.
- `components/request-search.tsx` mostra “Entrega confirmada pelo almoxarife”. `components/sector-stock.tsx` mostra estado de espera/confirmado e só apresenta “Fechar OS e registrar sobras” após a confirmação.
- Testes de navegador confirmaram: sem confirmação não há ação de fechar; após confirmar, o acompanhamento mostra o aviso e Meu estoque libera o modal; fechar com sobra alterou `CS-001` de 30 para 31 e permaneceu após recarga.

### Notificações do funcionário

- `/notificacoes` usa `components/employee-notifications.tsx`; além dos avisos setoriais, acompanha `getAllRequests` e mostra, por `employeeCode`, notificações de `Em andamento` e `deliveryConfirmed`.
- IDs de status são `${request.id}:in-progress` e `${request.id}:delivery-confirmed`; leitura é guardada com o escopo `employee:<código>` em `cellarium-read-notifications:<scope>`. Marcar como lida remove o cartão e reduz o contador.
- O fluxo foi testado com `REQ-2051`: após o almoxarife aceitar, o funcionário recebeu “Requisição em andamento”; após confirmar entrega, recebeu “Entrega confirmada pelo almoxarife”. Marcar a primeira como lida a removeu.
- Ao enviar uma requisição, `components/request-form.tsx` redireciona ao chat com `submitted=1`; `components/request-chat.tsx` informa que está aguardando aprovação e depois troca a mensagem para aprovada/em andamento, sem afirmar aprovação prematura.

### Catálogo e leitores QR

- Os códigos de produto nas etiquetas das imagens são numéricos. `lib/mock-data.ts` contém os 14 produtos/códigos transcritos; conferir o nome impresso se os dados forem revisados.
- `lib/product-code.ts` identifica código simples, URL ou JSON. `components/product-qr-picker.tsx` é compartilhado: no perfil do funcionário bloqueia material com saldo zero, adiciona o disponível à requisição e oferece “Escanear outro produto” sem perder seleção; no modo `purchase`, permite pedir reposição de item indisponível.
- `/qrcode` preserva validação de requisição e também gera compra por QR com justificativa genérica. Existe ainda QR para compras durante separação em `components/automatic-purchase-request.tsx`.
- Observação importante: depois que o usuário pediu para habilitar QR por produto, a antiga nota “não usar QR Code para o pedido de material” ficou obsoleta. O fluxo atual está implementado e validado; conservar a observação histórica, mas seguir este estado mais recente.

### Outras alterações recentes

- `components/purchase-cart.tsx` tem “Preencher sugestão” para o motivo genérico editável.
- Em `components/request-form.tsx`, as opções de turno são Manhã, Tarde e Noite.
- `components/request-chat.tsx` mostra status de envio/aprovação e usa fundo sólido na área de mensagens para evitar a aparência de overlay escuro.
- No catálogo do funcionário, o atalho de rolagem e o avanço para o pedido são ações distintas; o botão flutuante sobreposto foi removido.
- Em `components/warehouse.tsx`, “Confirmar entrega” agora persiste o estado e mostra “Entrega confirmada”, sem navegar para o histórico nem concluir a OS.

### Validação e ambiente

- O fluxo local completo foi validado na build de produção: funcionário envia requisição, almoxarife aceita/confirma, notificações aparecem e o funcionário fecha a OS com sobras.
- Porta `3000` já estava ocupada por um processo Next.js e a tentativa de `npm run dev` falhou ao detectar outro servidor. Para testes, a build foi servida em `http://localhost:3002` usando `$env:PORT = '3002'; npm run start`. Reiniciar esse servidor após `npm run build` para testar alterações novas.
- `npm run build` passou nas últimas alterações verificadas. O lint global mantém avisos de código não utilizado em `QueuePage` (`components/warehouse.tsx`) e `processProductCodeInput` (`components/automatic-purchase-request.tsx`); não remover sem avaliar mudanças locais do usuário.
- Antes de editar `components/automatic-purchase-request.tsx`, reler seu conteúdo: o usuário avisou que houve alterações externas nesse arquivo.

## Redesign completo do frontend (2026-10-01)

- O frontend foi evoluído mantendo Next.js, TypeScript, Tailwind, rotas, stores, chaves de `localStorage` e os fluxos demonstrativos existentes. O backend permaneceu sem alterações.
- Sistema visual centralizado em `components/design-system.css`, importado por `app/globals.css`; componentes compartilhados em `components/ui.tsx`. Shells dos dois perfis extraídos para `components/product-shell.tsx` e painel para `components/operations-dashboard.tsx`.
- A auditoria confirmou o estado atual: 55 materiais e `requests = []` em `lib/mock-data.ts`. Métricas de painel/inventário/análises agora derivam dos registros locais; notas históricas sobre números mock fixos estão superadas.
- Catálogo usa linhas de seleção, busca sem acentos e filtros expansíveis no celular. Inventário tem paginação de 12 itens. Tabelas apresentam rótulos por campo no mobile; navegação inferior do requisitante tem texto e estado ativo.
- `CountUp` anima métricas uma vez no viewport, mantém valor final para leitores de tela e respeita movimento reduzido. `useScrollReveal` passou a usar Web Animations para não alterar atributos antes da hidratação. Background animado fica restrito ao login e ao destaque do painel.
- Modais compartilham foco, Tab, Escape e retorno ao acionador via `useDialogAccessibility`. Foram adicionados estados de carregamento e erro em `app/loading.tsx` e `app/error.tsx`.
- Separação mostra todos os materiais, mantém confirmação de entrega independente da conclusão da OS e consulta a requisição da URL. Validação por código usa o store de requisições persistidas.
- Avisos anteriores de `QueuePage` e `processProductCodeInput` foram resolvidos; lint passou sem avisos. TypeScript e build de produção passaram.
- Revisão no Chrome cobriu 18 telas em quatro larguras, temas claro/escuro e uma rodada de refinamento. A verificação final pelo axe-core terminou sem violações nas telas testadas. Fluxo completo, estados vazios/erros, paginação, CSV/PDF, persistência, teclado e movimento reduzido foram testados com dados isolados. Leitura por câmera física não foi exercitada.
- `next dev` desta versão sobrescrevia o bloco gerenciado que continha as diretivas personalizadas de `AGENTS.md`. O original foi restaurado; `next.config.ts` usa `agentRules: false` para preservá-lo.
- Detalhes de auditoria, decisões e validação em `docs/frontend-redesign.md`.

### Ajuste do vídeo de login

- A pedido do usuário, o vídeo de login passou a usar opacidade integral. A camada escura que cobria toda a apresentação foi removida; o gradiente agora acompanha `login-copy`, com transição para transparência acima e à direita do texto. No celular, a proteção de contraste se limita à legenda inferior; “Desde 1988” tem fundo próprio discreto.
- Resultado conferido no navegador em 390, 768, 1440 e 1920 px, sem overflow. O comportamento de reprodução e de movimento reduzido foi preservado.

### Nova sequência do login e fechamento pela fila (2026-10-01)

- O pedido seguinte substituiu o gradiente localizado anterior: agora o vídeo aparece livre por dois segundos após iniciar a reprodução. Uma camada azul mais suave sobe, recua e termina na metade inferior da área do vídeo, deixando a metade superior clara. Os textos entram em sequência durante a transição. A divisão horizontal foi a interpretação adotada enquanto as perguntas opcionais sobre a direção/divisão final ficaram sem resposta.
- A sequência não se repete no loop do vídeo nem após redimensionar a janela quando a introdução termina. Movimento reduzido apresenta o estado final imediatamente e pausa o vídeo.
- Em `components/sector-stock.tsx`, OS com status `Aprovado` também aparecem para fechamento: a aprovação pela fila usava esse status, enquanto a aprovação pelo painel usava `Em andamento`. A seção “Fechar OS e devolver sobras” foi posicionada acima dos indicadores.
- Fechar a OS continua exigindo entrega confirmada. O formulário valida sobras entre zero e a quantidade de cada item; o registro local mantém `closedRequestIds` para evitar crédito duplicado. A conclusão e a confirmação de sucesso aparecem após salvar as sobras no estoque do setor.
- Validados: aprovação pela fila → confirmação de entrega → fechamento pelo funcionário; rejeição de quantidade excedente; persistência sem duplicação ao recarregar; bloqueio antes da entrega. Sequência visual conferida em 390, 768, 1440 e 1920 px e com movimento reduzido. Axe-core passou para login, estoque e modal em 390/768/1440 px nos dois temas; lint e build com TypeScript passaram.
