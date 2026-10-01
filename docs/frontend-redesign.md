# Evolução do frontend — 01/10/2026

## Auditoria e escopo

O projeto existente usa Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Geist e Lucide. As páginas operacionais continuam entrando por `components/warehouse.tsx`, com componentes próprios para inventário, requisição, compras, chat, notificações, perfil e estoque setorial.

A autenticação é demonstrativa. Requisições, mensagens, compras, recebimentos, sobras, notificações e identidade continuam usando os stores e as chaves de `localStorage` existentes. Os módulos de persistência em `lib/`, o catálogo e os contratos operacionais não foram substituídos. O backend não foi alterado.

O estado inicial atual tem 55 materiais e nenhuma requisição em `lib/mock-data.ts`. Os antigos indicadores fixos do painel e de movimentações não refletiam os registros do navegador. Agora as métricas do painel, inventário e análises acompanham as fontes locais correspondentes.

Os problemas principais eram estilos globais sobrepostos, ações escondidas no cabeçalho, excesso de sombra e superfícies repetidas, tabelas dependentes de rolagem horizontal e pouca distinção entre os portais. A composição foi revista antes de adicionar efeitos.

## Sistema visual

- `components/design-system.css`: tokens, superfícies, cores de status, tipografia, controles, tabelas, navegação, breakpoints e movimento reduzido. `app/globals.css` importa esse sistema.
- `components/ui.tsx`: botões, painéis, títulos, badges, métricas, estados vazios, skeletons e paginação compartilhados.
- `components/product-shell.tsx`: sidebar agrupada e cabeçalho do almoxarife; identidade e navegação do requisitante, com barra inferior no celular.
- `components/operations-dashboard.tsx`: prioridades, estoque abaixo do mínimo, últimas requisições e demanda por setor.

A direção visual usa azul institucional, superfícies neutras, bordas leves e tipografia com hierarquia clara. Alertas usam cor somente quando o estado exige atenção. O tema escuro possui tokens próprios, mantendo a marca legível. As referências fornecidas orientaram clareza, composição e organização, sem reprodução literal de layouts.

Em telas pequenas, filtros do catálogo podem ser expandidos, métricas viram linhas compactas e tabelas apresentam cada registro com seus rótulos. O inventário tem paginação de 12 materiais; mudar a busca ou o filtro retorna à primeira página. Os dados e quantidades selecionados permanecem ao filtrar.

## Interações e acessibilidade

Botões têm estados de foco, hover, pressão, loading e disabled. Somente superfícies com ação recebem elevação de hover. O brilho lento fica restrito ao login e ao destaque do painel.

`CountUp` anima métricas uma vez ao entrar no viewport, reserva espaço para o valor final e atualiza mudanças posteriores imediatamente. Leitores de tela recebem o número final. `useScrollReveal` usa Intersection Observer e Web Animations, sem alterar classes ou atributos do HTML gerenciado pelo React. Isso elimina os avisos de hidratação produzidos pelo antigo observer global.

`useDialogAccessibility` concentra foco, trata Tab e Escape, bloqueia rolagem e devolve foco ao acionador. O foco inicial preserva o campo que o usuário já selecionou antes do próximo frame, evitando tomar o foco durante a digitação. O menu móvel deixa o conteúdo de fundo inerte. Existem links para pular a navegação, nomes acessíveis nos controles e estados de sucesso/erro. `prefers-reduced-motion` cancela efeitos, contadores e reprodução do vídeo de fundo.

As telas têm estados vazios e fallback de carregamento. `app/error.tsx` permite tentar novamente após um erro inesperado. A separação lista todos os materiais da requisição; o validador de código de requisição consulta os pedidos persistidos.

## Comportamentos preservados

- Setor do funcionário reutilizado a partir do login; OS gerada em sequência.
- Pedido enviado permanece pendente; chat continua vinculado à requisição.
- Aceite pelo painel, atendimento e confirmação de entrega continuam separados do fechamento da OS.
- Fechamento com sobras continua disponível somente após entrega confirmada, com proteção existente contra duplicação.
- Compras mantêm justificativa, lotes, leitura de produto e recebimento sem duplicar estoque.
- Notificações mantêm leitura por funcionário e avisos por setor.
- Histórico mantém filtros, CSV compatível com Excel e comprovante PDF.

## Verificação

Foram executados `npm run lint`, `tsc --noEmit` e `npm run build`. Lint e TypeScript passaram; a build gerou as rotas existentes. O Next.js informa que ignora um `package-lock.json` externo em `C:\Temp`; isso não impede a build.

A revisão no Chrome cobriu 18 telas em 360, 390, 768 e 1440 px. Foram inspecionadas capturas desktop/mobile e dos temas claro/escuro, com uma segunda rodada de ajustes. Foram verificados overflow, conteúdo visível, console e regras WCAG A/AA do axe-core. A rodada final de acessibilidade terminou sem violações nas 18 telas nos dois temas. Os últimos ajustes corrigiram contraste no link QR, semântica da lista do perfil, hidratação das animações, aproveitamento do espaço do painel e altura da conversa no celular.

O fluxo de navegador exercitou login de ambos os perfis, QR por código manual, seleção de vários materiais, quantidades, envio, chat, aceite, confirmação de entrega, compras, recebimento, leitura de notificações, fechamento com sobras, persistência após recarga, CSV, PDF, menu móvel, teclado, tema e movimento reduzido. As verificações de duplicação de recebimento e sobras passaram.

Também passaram verificações de métricas vazias, busca sem resultados, reset de paginação ao filtrar, falta de sessão/material, expansão de filtros mobile, pesquisa com acentos, QR de produto indisponível, código de requisição inválido, consulta de pedido recém-salvo, separação com vários itens, contador que não reinicia ao rolar, tema inicial do sistema, vídeo pausado e larguras corretas dos gráficos com movimento reduzido.

Uma passagem final revelou uma falha intermitente no teste de sobras. Foi adicionada uma proteção contra o foco inicial tomar um campo já selecionado. Após esse ajuste, 16 execuções isoladas de fechamento verificaram foco e saldo, e o fluxo operacional completo passou em cinco execuções consecutivas.

Playwright e axe-core foram usados em uma pasta temporária de revisão, sem adicionar dependências ao aplicativo. O teste usou contextos de navegador isolados com dados demonstrativos; não modificou dados do navegador do usuário. A leitura por câmera física requer validação em um dispositivo com câmera e permissão concedida. A revisão automatizada de acessibilidade complementa os testes de teclado; não equivale a uma auditoria completa com todos os leitores de tela.

## Manutenção

Reutilize os tokens e componentes compartilhados ao evoluir telas. Preserve os eventos e chaves dos stores. Não vincule o fechamento da OS ao botão de confirmação de entrega.

`next.config.ts` define `agentRules: false`: nesta versão do Next.js, `next dev` sobrescrevia as diretivas personalizadas que estavam dentro do bloco gerenciado de `AGENTS.md`. O arquivo original foi restaurado, e a configuração evita nova sobrescrita.

Para revisar uma build local: `npm run build`, seguido de `npm run start -- --port 3002`.

## Ajustes posteriores: login e devolução de sobras

O login apresenta primeiro o vídeo sem cobertura por dois segundos. O degradê azul sobe e recua até a metade inferior do vídeo; os textos entram em sequência durante a transição. O azul é mais suave, com a metade superior clara. A introdução termina uma única vez, preservando os textos ao redimensionar a janela. Com movimento reduzido, o vídeo pausa e o estado final aparece imediatamente.

Em “Meu estoque”, a seção “Fechar OS e devolver sobras” aparece antes dos indicadores. Tanto `Aprovado` (aprovação pela fila) quanto `Em andamento` (aprovação pelo painel) são incluídos. A ação fica disponível após a entrega confirmada. O formulário rejeita quantidades negativas ou superiores à quantidade do item, salva as sobras no estoque do setor e conclui a OS; o controle persistido de IDs evita crédito duplicado.

Foram verificados o fluxo pela fila, os limites de quantidade, a persistência após recarregar e o bloqueio antes da entrega. A animação foi conferida em quatro larguras, com movimento reduzido e após redimensionar. A verificação automatizada de acessibilidade passou para login, estoque e modal em ambos os temas. Lint e build com TypeScript passaram.
