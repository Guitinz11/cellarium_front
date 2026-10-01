<!-- BEGIN:nextjs-agent-rules -->
# AGENTS.md

## FRONTEND ENGINEERING & DESIGN DIRECTIVE

Este projeto deve ser tratado como um produto digital profissional.

O objetivo não é apenas fazer o código funcionar.

O objetivo é construir uma experiência de frontend que seja:

* moderna;
* sofisticada;
* consistente;
* rápida;
* responsiva;
* acessível;
* visualmente memorável;
* intuitiva;
* tecnicamente bem estruturada;
* agradável de usar.

Sempre que uma alteração de frontend for solicitada, pense como:

**Senior Frontend Engineer + Senior UI/UX Designer + Product Designer.**

Não entregue uma solução apenas "funcional".

Entregue uma solução refinada.

---

# 1. REGRA PRINCIPAL

Antes de modificar o projeto:

1. Entenda a estrutura existente.
2. Entenda o fluxo da aplicação.
3. Identifique o design system existente.
4. Identifique os componentes reutilizáveis.
5. Identifique as dependências.
6. Identifique as funcionalidades existentes.
7. Identifique possíveis efeitos colaterais.
8. Só então implemente.

Nunca reescreva partes importantes do projeto sem necessidade.

**Preserve funcionalidades existentes.**

Uma melhoria visual nunca deve quebrar:

* rotas;
* autenticação;
* APIs;
* formulários;
* estados;
* dados;
* regras de negócio;
* integrações;
* navegação;
* persistência.

---

# 2. FILOSOFIA DE DESIGN

O frontend deve evitar completamente aparência de template genérico.

Evite:

* dashboards genéricos;
* excesso de cards;
* excesso de gradientes;
* excesso de glassmorphism;
* sombras exageradas;
* bordas em todos os elementos;
* cores aleatórias;
* tipografia inconsistente;
* espaçamento inconsistente;
* animações sem propósito;
* componentes visualmente desconectados;
* excesso de elementos na tela.

Priorize:

* hierarquia visual;
* espaço negativo;
* tipografia forte;
* composição;
* contraste;
* ritmo visual;
* consistência;
* simplicidade;
* detalhes refinados.

Uma interface sofisticada não precisa ser complexa.

---

# 3. REFERÊNCIAS VISUAIS

Use estas referências como inspiração de qualidade.

## Fey / Mobbin

https://mobbin.com/apps/fey-web-043aa73f-17b4-4a91-a33c-14b5c09bea47/00a9e00e-0d44-4873-8059-7558fc7bc406/screens

Referência para:

* interfaces de produto;
* hierarquia;
* cards;
* navegação;
* composição;
* espaçamento;
* organização de informações.

---

## Shopify Editions

https://www.shopify.com/editions/winter2026

Referência para:

* storytelling;
* composição de páginas;
* apresentação de produto;
* seções;
* transições;
* interação;
* ritmo visual.

---

## Paper

https://paper.design/

Referência para:

* direção artística;
* minimalismo;
* tipografia;
* espaço negativo;
* composição;
* sensação premium.

---

## Shopify Design

https://shopify.design/

Referência para:

* design systems;
* consistência;
* componentização;
* tipografia;
* UX;
* organização visual.

---

## Wise

https://wise.com/

Referência para:

* clareza;
* confiança;
* UX;
* CTAs;
* hierarquia;
* simplicidade.

---

## Coinbase

https://www.coinbase.com/pt-br

Referência para:

* interfaces de produto;
* dados;
* dashboards;
* gráficos;
* cards;
* estados;
* informações financeiras.

---

## Mixpanel

https://mixpanel.com/

https://mixpanel.com/home/

Referência para:

* SaaS;
* dashboards;
* analytics;
* visualização de dados;
* navegação;
* storytelling de produto;
* animações;
* interfaces modernas.

### IMPORTANTE

As referências são apenas inspiração.

Nunca copie literalmente:

* layouts;
* textos;
* imagens;
* identidade visual;
* componentes exclusivos;
* branding;
* código.

Extraia padrões e crie uma identidade própria para este projeto.

---

# 4. DESIGN SYSTEM

Sempre que possível, mantenha um sistema visual centralizado.

Componentes diferentes devem parecer pertencer ao mesmo produto.

Padronize:

* cores;
* tipografia;
* tamanhos;
* espaçamentos;
* border radius;
* sombras;
* bordas;
* containers;
* grids;
* breakpoints;
* botões;
* inputs;
* cards;
* badges;
* modais;
* dropdowns;
* tooltips;
* tabelas.

Não invente valores diferentes para componentes semelhantes.

Se existir um design token ou variável equivalente no projeto, reutilize-o.

---

# 5. TIPOGRAFIA

A tipografia deve possuir hierarquia clara.

Utilize uma escala consistente para:

* display;
* headings;
* subtitles;
* body;
* captions;
* labels.

Evite dezenas de tamanhos diferentes sem necessidade.

Priorize:

* legibilidade;
* contraste;
* line-height adequado;
* largura de linha confortável;
* pesos consistentes.

Títulos importantes podem ter maior personalidade.

Textos secundários devem ser discretos.

---

# 6. ESPAÇAMENTO

Espaçamento é parte fundamental do design.

Não coloque elementos simplesmente "um embaixo do outro".

Crie ritmo visual.

Use espaçamentos consistentes entre:

* título e descrição;
* descrição e CTA;
* cards;
* seções;
* grupos;
* elementos de navegação.

Prefira um sistema de espaçamento consistente em vez de valores aleatórios.

---

# 7. COMPONENTIZAÇÃO

Crie componentes reutilizáveis quando houver repetição real.

Exemplos:

* Navbar;
* Sidebar;
* Header;
* Footer;
* Button;
* Input;
* Select;
* Card;
* Modal;
* Dropdown;
* Tabs;
* Badge;
* Toast;
* Tooltip;
* Table;
* Pagination;
* EmptyState;
* LoadingState;
* ErrorState.

Não componentize excessivamente elementos que só aparecem uma vez e não possuem responsabilidade própria.

A arquitetura deve permanecer simples de entender.

---

# 8. MICROINTERAÇÕES

Interações devem fornecer feedback.

## Botões

Adicionar:

* hover;
* focus;
* active;
* disabled;
* loading.

Utilizar pequenas mudanças de:

* posição;
* escala;
* sombra;
* ícone;
* brilho;
* cor.

Movimentos devem ser sutis.

Evite efeitos exagerados.

---

# 9. CARDS

Cards importantes podem possuir hover inteligente.

Possibilidades:

* elevação sutil;
* mudança de sombra;
* borda destacada;
* imagem com pequeno zoom;
* CTA aparecendo;
* ícone se movimentando;
* conteúdo secundário ganhando destaque.

Não aplique efeitos fortes em todos os cards.

A interação deve indicar que o elemento é clicável ou importante.

---

# 10. COUNT-UP

Quando houver métricas relevantes, utilizar animação de count-up.

Exemplo:

```text
0 → 100 → 1.000 → 10.000
```

O contador deve:

* iniciar quando entrar no viewport;
* terminar no valor real;
* executar de maneira suave;
* não reiniciar constantemente.

Não transforme números comuns da interface em animações.

---

# 11. BACKGROUND VIVO

Utilize backgrounds dinâmicos apenas onde agregarem valor.

Possibilidades:

* gradients;
* blobs;
* glow;
* partículas discretas;
* formas abstratas;
* iluminação;
* movimentos lentos.

Prioridade:

1. Hero
2. Seções de destaque
3. CTA
4. Áreas especiais

Nunca prejudique:

* legibilidade;
* contraste;
* performance;
* acessibilidade.

O background deve complementar o conteúdo.

Nunca competir com ele.

---

# 12. SCROLL ANIMATIONS

Quando apropriado, utilize:

* Scroll Reveal;
* Fade In;
* Slide Up;
* Staggered Reveal;
* Image Reveal;
* Scroll-driven animations.

Um padrão comum:

```text
opacity: 0
transform: translateY(20px)
        ↓
opacity: 1
transform: translateY(0)
```

As animações devem ser:

* suaves;
* rápidas;
* naturais;
* discretas.

Evite animar absolutamente tudo.

---

# 13. RESPONSIVIDADE

O projeto deve funcionar corretamente em:

* mobile;
* tablet;
* notebook;
* desktop;
* telas grandes.

Não trate mobile como uma versão reduzida do desktop.

Adapte:

* layout;
* grid;
* navegação;
* tipografia;
* espaçamento;
* cards;
* imagens;
* formulários;
* tabelas;
* CTAs.

Nunca permita:

* overflow horizontal acidental;
* textos cortados;
* botões impossíveis de tocar;
* elementos sobrepostos;
* menus quebrados.

---

# 14. MOBILE

Mobile deve possuir experiência própria.

Verifique:

* tamanho dos alvos de toque;
* navegação;
* hierarquia;
* ordem dos elementos;
* quantidade de conteúdo;
* menus;
* espaçamentos;
* performance.

Não simplesmente esconda elementos importantes para fazer a página caber.

---

# 15. ACESSIBILIDADE

Sempre considerar:

* contraste;
* foco;
* navegação por teclado;
* labels;
* aria quando necessário;
* HTML semântico;
* headings corretos;
* alt text;
* estados de erro;
* estados de sucesso.

Respeite:

```css
prefers-reduced-motion
```

Usuários que optarem por reduzir animações devem receber uma experiência adequada.

---

# 16. PERFORMANCE

Não adicione complexidade sem motivo.

Evite:

* bibliotecas desnecessárias;
* animações pesadas;
* imagens gigantes;
* JavaScript desnecessário;
* renderizações desnecessárias;
* componentes duplicados.

Prefira:

* CSS;
* APIs nativas;
* lazy loading;
* otimização de imagens;
* componentes eficientes.

Se uma biblioteca já existente resolve o problema, prefira reutilizá-la.

---

# 17. UX

Sempre pense:

### O usuário sabe onde está?

### O usuário sabe o que pode fazer?

### O usuário entende o CTA?

### O usuário recebe feedback depois de uma ação?

### O usuário consegue desfazer ou corrigir um erro?

### O próximo passo está claro?

Uma interface bonita que gera confusão é uma interface ruim.

---

# 18. ESTADOS

Componentes interativos devem considerar estados relevantes.

Exemplos:

```text
default
hover
focus
active
disabled
loading
success
error
empty
```

Não entregue uma interface que só funciona no estado "perfeito".

---

# 19. FEEDBACK VISUAL

Toda ação importante deve possuir feedback adequado.

Exemplos:

* loading;
* skeleton;
* toast;
* mudança de estado;
* animação;
* confirmação;
* erro.

Evite deixar o usuário sem saber se uma ação foi executada.

---

# 20. IMAGENS

Quando houver imagens:

* utilize proporções consistentes;
* evite distorção;
* utilize object-fit adequadamente;
* considere lazy loading;
* mantenha qualidade visual;
* utilize máscaras e reveals quando fizer sentido.

Para imagens importantes, considere:

**Image Reveal / Clip-path Reveal**

como recurso visual.

---

# 21. NAVBAR

A navbar deve ser refinada.

Quando fizer sentido:

* sticky;
* blur;
* mudança de background ao scroll;
* redução de altura;
* transição suave;
* estado ativo;
* menu mobile bem elaborado.

Não faça a navbar desaparecer de maneira inesperada.

---

# 22. HIERARQUIA DE INTERAÇÃO

Nem todos os elementos devem chamar atenção igualmente.

Prioridade visual:

```text
AÇÃO PRINCIPAL
      ↓
AÇÃO SECUNDÁRIA
      ↓
INFORMAÇÃO IMPORTANTE
      ↓
INFORMAÇÃO AUXILIAR
```

Use tamanho, contraste, espaço e posição para estabelecer prioridade.

---

# 23. EVITE "AI SLOP"

O frontend não deve parecer automaticamente gerado.

Evite padrões previsíveis como:

* três cards idênticos para tudo;
* gradiente roxo/azul em todos os lugares;
* excesso de glassmorphism;
* textos centralizados sem necessidade;
* ícones aleatórios;
* sombras excessivas;
* enormes headings genéricos;
* excesso de rounded corners;
* seções repetitivas.

Cada seção deve possuir uma razão de existir.

---

# 24. DECISÕES DE DESIGN

Quando existirem várias soluções possíveis, escolha a que:

1. melhora a experiência;
2. mantém consistência;
3. reduz complexidade;
4. preserva performance;
5. mantém acessibilidade;
6. combina com o restante do produto.

Não adicione uma feature visual apenas porque ela parece interessante.

---

# 25. IMPLEMENTAÇÃO

Antes de implementar uma mudança relevante:

```text
ANALISAR
   ↓
PLANEJAR
   ↓
IMPLEMENTAR
   ↓
TESTAR
   ↓
REVISAR
   ↓
REFINAR
```

Não pare na primeira implementação.

Sempre faça uma segunda análise visual.

---

# 26. AUTO-REVIEW

Depois de terminar qualquer alteração significativa de frontend, revise:

### Visual

* alinhamento;
* espaçamento;
* tipografia;
* cores;
* contraste;
* proporções;
* consistência.

### UX

* fluxo;
* clareza;
* feedback;
* estados;
* navegação.

### Responsividade

* mobile;
* tablet;
* desktop;
* telas grandes.

### Código

* duplicação;
* complexidade;
* componentes;
* imports;
* dependências;
* possíveis regressões.

### Performance

* animações;
* imagens;
* renderizações;
* JavaScript.

---

# 27. REGRA DE OURO

Não pergunte:

> "Como faço isso funcionar?"

Pergunte:

> "Como faço isso funcionar e parecer um produto excepcional?"

O código deve funcionar.

A interface deve fazer sentido.

A experiência deve ser agradável.

Os detalhes devem parecer intencionais.

---

# 28. PADRÃO FINAL DE QUALIDADE

Antes de considerar uma tarefa concluída, o resultado deve passar por estas perguntas:

```text
[ ] Funciona?
[ ] Está visualmente refinado?
[ ] Está consistente com o design system?
[ ] É responsivo?
[ ] É acessível?
[ ] Possui estados adequados?
[ ] Possui feedback visual?
[ ] As animações têm propósito?
[ ] Está performático?
[ ] Não parece um template genérico?
[ ] Não quebrou funcionalidades existentes?
[ ] O código continua organizado?
[ ] Foi feita uma segunda rodada de refinamento?
```

Se alguma resposta for "não", corrija antes de considerar a tarefa concluída.

---

# 29. PRINCÍPIO FINAL

Este projeto não deve buscar simplesmente:

**"um frontend bonito."**

Deve buscar:

**"um produto que pareça ter sido projetado por uma equipe profissional de produto, design e engenharia."**

Priorize qualidade sobre quantidade.

Priorize consistência sobre efeitos.

Priorize UX sobre decoração.

Priorize performance sobre complexidade.

Priorize detalhes intencionais sobre elementos chamativos.

Quando houver dúvida, escolha a solução mais simples que entregue a melhor experiência.

**BUILD IT. POLISH IT. REVIEW IT. MAKE IT EXCELLENT.**

<!-- END:nextjs-agent-rules -->
