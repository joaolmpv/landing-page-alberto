# Auditoria de Qualidade — Landing Page Dr. João Alberto Navarro Nazaré

Resultado da execução de `auditoria.md`. Todos os arquivos do projeto (`index.html`, `css/style.css`, `js/main.js`, `assets/`) foram lidos por completo. Correções diretas foram aplicadas nos arquivos sempre que possível; itens que exigem decisão de negócio ou ativo (foto, domínio, número de WhatsApp) foram sinalizados com `TODO`.

Legenda de severidade: 🔴 Crítico · 🟡 Moderado · 🟢 Sugestão/OK

---

## FRENTE 1 — Performance e Carregamento

| # | Item | Achado | Impacto | Correção |
|---|------|--------|---------|----------|
| 1.1 | `loading` nas imagens | 🔴 A hero-photo **não tinha nenhum atributo `loading`**; `atendimento-1.webp` (abaixo da dobra) estava com `loading="eager"`; `einstein-logo.webp` sem atributo | Hero sem `eager`/`fetchpriority` atrasa o LCP; imagens fora da dobra carregadas eager competem por banda com o conteúdo crítico | Adicionado `loading="eager" fetchpriority="high"` na hero-photo; `atendimento-1` mudado para `lazy`; `einstein-logo` recebeu `loading="lazy"` |
| 1.2 | Tailwind via CDN | 🔴 O projeto carrega `cdn.tailwindcss.com` (build de desenvolvimento, ~300KB) mas **nenhuma classe utilitária Tailwind é usada em nenhum lugar do HTML/CSS** (confirmado via grep — todas as classes são BEM customizadas) | 300KB de JS morto bloqueando o carregamento sem nenhum benefício | **Script removido inteiramente** de `index.html`. Não existe "modo produção" oficial para o Play CDN — o `data-mode="production"` mencionado não é uma opção real do Tailwind; a decisão correta era eliminar a dependência, já que o projeto não a usa |
| 1.3 | `preload` dos vídeos | 🟢 Já compliant: `<video preload="none">` no player do modal (único elemento de vídeo da página) | — | Nenhuma correção necessária |
| 1.4 | GSAP/ScrollTrigger no final do body | 🟢 Já compliant: scripts posicionados nas últimas linhas do `<body>`, depois de todo o HTML | — | Nenhuma correção necessária |
| 1.5 | `display=swap` na fonte | 🟢 Já compliant: `&display=swap` presente na URL do Google Fonts | — | Nenhuma correção necessária |
| 1.6 | Formato das imagens | 🟢 Todas as imagens em `assets/images/` já são `.webp` (exceto `logo.svg`, que é vetor — correto não converter) | — | Nenhuma correção necessária |
| 1.7 | **(achado extra, fora do checklist)** Imagens quebradas | 🔴 As 4 imagens de fundo dos cards de Especialidades (`especialidade-dor.webp`, `especialidade-posop.webp`, `especialidade-esportiva.webp`, `especialidade-avaliacao.webp`) são referenciadas no HTML mas **não existem em `assets/images/`** | Em produção apareceriam 4 ícones de imagem quebrada nos cards mais visíveis da seção de Expertise — péssimo para um site "premium" | `<img>` quebradas removidas; o gradiente decorativo do `::before` do card continua cobrindo o fundo. Comentário `TODO` deixado em cada card apontando o arquivo que falta |

**Cálculo do peso above-the-fold (hero: foto + fontes + CSS crítico), medido no estado atual pós-correção:**

| Recurso | Peso (transferência, gzip quando aplicável) |
|---|---|
| `hero-photo.webp` | ~52,5 KB (já comprimido, webp não gzipa mais) |
| `css/style.css` (arquivo único, sem crítico separado) | ~8,7 KB gzip (43 KB raw) |
| `index.html` | ~9,6 KB gzip |
| Google Fonts (Cormorant Garamond 300 + DM Sans 400/500, ~3–4 arquivos woff2 realmente usados acima da dobra) | ~45–70 KB (estimado; o navegador só baixa os pesos efetivamente aplicados ao texto renderizado) |
| **Total estimado** | **~115–140 KB** |

Está **dentro da meta de 200KB**. A remoção do Tailwind CDN (item 1.2) não conta para esse cálculo específico (ele não é render-blocking para o hero em si, pois está no fim do body), mas remove ~300KB do payload total de JS da página — impacto real em Time-to-Interactive, sobretudo em 3G/4G.

---

## FRENTE 2 — Qualidade das Animações GSAP e CSS

| # | Item | Achado | Impacto | Correção |
|---|------|--------|---------|----------|
| 2.1 | `registerPlugin` antes do uso | 🟢 Já correto: `main.js` é carregado depois de `gsap.min.js`/`ScrollTrigger.min.js`, e o registro é a primeira linha do arquivo | — | Adicionado guard `if (typeof gsap !== 'undefined' ...)` como blindagem extra (ver 2.6) |
| 2.2 | `once: true` em entradas | 🔴 Faltava em `initCredentials`, `initAbout` (linha do tempo + pontos) e `initMedia`/`initCTA` — só `initCards`, `initCases` e o stage de iPhones já tinham | Sem `once:true`, o ScrollTrigger permanece "vivo" na memória mesmo após disparar, e cada nova entrada em viewport reavalia a trigger desnecessariamente | `once: true` adicionado a todos os 5 ScrollTriggers de entrada única. O parallax de `#sobre` (scrub contínuo) foi mantido sem `once`, propositalmente, pois precisa recalcular durante todo o scroll |
| 2.3 | Conflito GSAP × CSS transition/animation | 🔴 **Dois conflitos reais encontrados:**<br>**(a)** `.hero-badge` tem `animation: floatBadge` (CSS, controla `transform`) rodando desde o load, ao mesmo tempo que o GSAP anima `x` (também `transform`) na entrada — a CSS animation tem prioridade sobre o inline style do GSAP na cascata, então o efeito de entrada nunca aparecia visualmente.<br>**(b)** `.expertise-card` e `.media-card` têm `:hover { transform: translateY(...) }` em CSS, mas o `gsap.from(..., {y: ...})` de entrada deixa um `transform` inline no elemento após completar (comportamento padrão do GSAP). Inline style tem prioridade sobre uma regra de classe como `:hover`, então **o hover de elevação parava de funcionar permanentemente após a animação de entrada rodar** | (a) Badges da hero "aterrissavam" sem a transição de slide-in prevista.<br>(b) Bug silencioso e sério: o efeito de hover dos cards de Especialidade e de Mídia — parte central do apelo "premium" do site — simplesmente parava de funcionar depois do primeiro scroll | (a) `animation: floatBadge` foi movida para uma classe `.hero-badge.is-floating`, adicionada via JS somente no `onComplete` do tween de entrada — GSAP e CSS nunca competem pelo mesmo `transform` ao mesmo tempo.<br>(b) Adicionado `clearProps: 'transform'` nos tweens de `initCards()` e `initMedia()` — o GSAP remove o inline style ao terminar, devolvendo o controle do `transform` para a CSS, e o `:hover` volta a funcionar normalmente. Essa é uma correção mais robusta que "remover uma das duas" (opção sugerida no briefing), pois preserva as duas animações intactas |
| 2.4 | Timeout de segurança no preloader | 🔴 **Risco real de travamento**: se o CDN do GSAP falhar ao carregar (rede instável, ad-blocker, outage), `gsap.registerPlugin(...)` na primeira linha do `main.js` lançava uma exceção síncrona **antes** de qualquer listener ser registrado — o script inteiro parava, o `DOMContentLoaded` nunca rodava, e o preloader (uma cortina navy cobrindo 100% da tela) ficava visível para sempre. Além disso, se `getTotalLength()` lançasse exceção (SVG medido enquanto oculto, em alguns navegadores), o erro escapava antes da `Promise` do preloader ser criada, com o mesmo efeito | Página inteira inacessível visualmente em cenários de falha de rede/CDN, mesmo com clique "passando através" (`pointer-events:none`) | Três camadas de proteção adicionadas: **(1)** script inline independente no `<head>`, sem depender de GSAP ou de `main.js`, que força o fechamento do preloader após 4s via `setTimeout` puro; **(2)** guard `typeof gsap !== 'undefined'` antes do `registerPlugin`; **(3)** `try/catch` ao redor de `styleLogoPaths()` no preloader |
| 2.5 | Fallback do `:has()` | 🔴 O tilt 3D de hover dos cards de iPhone depende só de `:has()` em CSS, sem fallback — navegadores sem suporte (Firefox < 121, versões mais antigas em geral) simplesmente não mostram nenhum efeito de hover | Degradação silenciosa em navegadores mais antigos — sem quebra visual, mas perde a interação | Adicionada `initIphoneHoverFallback()` em `main.js`: detecta suporte via `CSS.supports('selector(:has(*))')` e, se ausente, replica os mesmos estados via `mouseenter`/`mouseleave` e `element.style.transform`, só em contextos com mouse fino (`hover:hover` e `pointer:fine`, ≥901px) |
| 2.6 | Limpeza do `<video>` do modal | 🟢 Já compliant: `closeModal()` já fazia `source.src = ''` seguido de `player.load()` num `setTimeout` de 400ms (espera a transição de saída) | — | Nenhuma correção necessária |
| 2.7 | `addEventListener` sem `removeEventListener` | 🟢 Verificado: o projeto é uma SPA de página única sem roteamento client-side nem criação/destruição dinâmica de elementos. Todas as funções `init*()` rodam **uma única vez** em `DOMContentLoaded`, e todos os listeners são anexados a elementos que vivem durante todo o ciclo de vida da página. Não há vazamento de memória no sentido clássico (listener referenciando elemento desmontado) | — | Nenhuma correção necessária |

---

## FRENTE 3 — Responsividade e Experiência Mobile

Simulado em 375px, 390px, 768px e 1440px:

| # | Item | Achado | Correção |
|---|------|--------|----------|
| 3.1 | Hero em 375px | 🟢 `clamp(3rem, 6vw, 5.5rem)` — mínimo de **3rem (48px)**, acima do piso de 2rem exigido. Foto e texto empilham corretamente (`flex-direction: column-reverse` até 768px) | Nenhuma correção necessária |
| 3.2 | Navbar / drawer mobile | 🟢 Já implementado: `#menu-toggle` no HTML, `initNavbar()` no JS com `gsap.to(drawer, {x: 0/'100%', ...})` exatamente como pedido | Nenhuma correção necessária |
| 3.3 | Stats bar (credenciais) 375px → 2×2 | 🟢 `grid-template-columns: repeat(2, 1fr)` por padrão, vira `repeat(4, 1fr)` a partir de 768px | Nenhuma correção necessária |
| 3.4 | Seção Sobre em mobile | 🟢 `.about-grid` é `1fr` (empilhado) por padrão, `1fr 1fr` a partir de 768px. Timeline legível (fonte 1.1rem/0.82rem, espaçamento adequado) | Nenhuma correção necessária |
| 3.5 | Mockups iPhone em mobile | 🟡 Empilhamento vertical sem rotação já ocorre via `@media (max-width: 900px/640px)` — mas a desativação do tilt de `:has()` era só por largura, não cobria tablets touch em paisagem (>640px de largura, sem mouse) | Adicionado bloco extra `@media (hover: none), (pointer: coarse)` neutralizando o tilt do `:has()` independentemente da largura |
| 3.6 | Modal de vídeo em mobile | 🔴 `.vmodal-container` usava `max-width: 90vw`, acima do limite de 85vw pedido | `max-width` alterado para **85vw** |
| 3.7 | Área de toque 44×44px | 🔴 Vários controles abaixo do mínimo: hamburguer (~40×32px), `.about-carousel-btn` (40×40px), `.about-dot`/`.dot` (8×8px, sem padding), `.drawer-close` (sem caixa definida), `.iphone-watch-btn` (~33px de altura), ícones sociais do rodapé (22×22px, sem padding) | Todos ajustados: hamburguer e `.drawer-close` ganharam `min-width/min-height: 44px` com centralização; `.about-carousel-btn` foi para 44×44px; os dots de paginação (`.about-dot`, `.dot`) usam a técnica `padding + background-clip: content-box` para manter o ponto visual pequeno com área de clique de 44px; `.iphone-watch-btn` teve o padding vertical aumentado; `.footer-social a` ganhou `min-width/min-height: 44px` |
| 3.8 | Meta viewport | 🟢 Já presente e correta: `width=device-width, initial-scale=1.0` | Nenhuma correção necessária |

---

## FRENTE 4 — Acessibilidade

| # | Item | Achado | Correção |
|---|------|--------|----------|
| 4.1 | Hierarquia de headings | 🟢 Exatamente **um `<h1>`** (hero); `<h2>` usado consistentemente por título de seção (Sobre, Especialidades, Casos, Mídia, Depoimentos, CTA); `<h3>` para subitens (timeline, cards, casos, mídia). Nenhuma quebra de hierarquia | Nenhuma correção necessária |
| 4.2 | Contraste de cores (WCAG AA) | Calculado com a fórmula oficial de luminância relativa:<br>• `--text-muted` `#8892A4` / `--navy` `#0A192F` → **5.61:1** 🟢 PASS<br>• `--clay` `#A1887F` / `--navy` `#0A192F` → **5.32:1** 🟢 PASS<br>• `--text-dark` `#1A1A2E` / `--sand` `#F9F9F6` → **16.17:1** 🟢 PASS (excelente)<br>• Branco `#FFFFFF` / botão `--clay` `#A1887F` → **3.31:1** 🔴 **FALHA** (mínimo AA texto normal é 4.5:1; o texto dos botões tem ~14px/peso 500, não se qualifica como "texto grande") | Criada `--clay-deep: #806C65` (mesma família de cor, ~15–20% mais escura) e aplicada em todos os lugares com texto branco sobre fundo clay: `.btn-primary`, `.btn-nav-cta:hover`, `.carousel-btn:hover`, `.iphone-watch-btn:hover`. Resultado: **4.94:1**, dentro do AA. O `filter: brightness(110%)` do hover do `.btn-primary` foi reduzido para **105%** (110% derrubava o contraste de volta para ~4.2:1) |
| 4.3 | `type="button"` explícito | 🟢 Verificado: **todos** os 15 `<button>` do HTML já declaram `type="button"` explicitamente | Nenhuma correção necessária |
| 4.4 | Foco visível | 🟡 Não havia nenhum reset removendo `outline` (nenhum `outline: none` no CSS) — o foco padrão do navegador já funcionava. Mas também não havia um estilo de foco proposital/de marca | Adicionado `*:focus-visible { outline: 2px solid var(--clay); outline-offset: 3px; }` global, como pedido, para foco consistente com a identidade visual |
| 4.5 | Imagens decorativas | 🟢 Verificado: não há `<img>` puramente decorativa na página. Elementos decorativos (círculos do hero, textura de ruído do body) são `<div>`/CSS, não `<img>`, e todos os `<svg>` inline decorativos já usam `aria-hidden="true"` | Nenhuma correção necessária |
| 4.6 | `rel="noopener noreferrer"` em `target="_blank"` | 🟢 Verificado nos 7 links com `target="_blank"` (mídia, WhatsApp, Instagram, Linktree, redes do rodapé) — todos já têm `rel="noopener noreferrer"` | Nenhuma correção necessária |
| 4.7 | Focus trap no modal de vídeo | 🔴 Não implementado — `Tab` podia levar o foco para fora do modal enquanto aberto | Adicionado focus trap em `initIphoneModal()`: `Tab`/`Shift+Tab` ciclam apenas entre o botão de fechar e o player de vídeo enquanto `#video-modal` está com `.is-open` |

---

## FRENTE 5 — Qualidade do Código e Preparação para Produção

| # | Item | Achado | Correção |
|---|------|--------|----------|
| 5.1 | TODOs de WhatsApp | 🔴 Um comentário `<!-- TODO: Substituir 5511999999999... -->` existia acima do CTA principal, mas o **mesmo número placeholder também é usado no ícone do rodapé sem nenhum aviso** | TODO mantido e **duplicado** também acima do link do rodapé, para não passar despercebido. **Ação para o desenvolvedor: substituir `5511999999999` pelo número real em `index.html` (2 ocorrências) antes do deploy — sem isso, nenhum lead consegue agendar** |
| 5.2 | Regras CSS duplicadas/conflitantes | 🟡 Único caso próximo de duplicidade: `.footer-logo-slot svg` aparece em dois seletores (`display:block` compartilhado com `.nav-logo-slot`, e depois `width/height/opacity` isolado) — não é conflito real, são propriedades diferentes, mantido como está | Nenhuma consolidação necessária além do já verificado |
| 5.3 | Variáveis CSS não usadas | 🟢 Todas as 9 variáveis originais do `:root` (`--navy`, `--navy-mid`, `--clay`, `--clay-light`, `--sand`, `--sand-dark`, `--text-dark`, `--text-muted`, `--gold`, `--white`) têm uso confirmado no CSS | Nenhuma remoção necessária (nova `--clay-deep` foi adicionada e já está em uso — ver 4.2) |
| 5.4 | `console.log` de debug | 🟢 Nenhum `console.log` encontrado. Existe um único `console.warn` (falha ao carregar `logo.svg`), que é tratamento de erro legítimo, não lixo de debug | Mantido intencionalmente |
| 5.5 | Comentários de debug / blocos comentados no HTML | 🟢 Todos os comentários HTML são labels de seção (`<!-- Hero -->`, `<!-- Sobre -->`, etc.) ou TODOs acionáveis — nenhum bloco de código morto comentado | Nenhuma remoção necessária |
| 5.6 | Meta tags de SEO | 🔴 Só existiam `title` e `meta description`. Faltavam `og:title`, `og:description`, `og:image`, `og:type`, `twitter:card` | Todas adicionadas em `index.html`. `og:image`/`twitter:image` usam placeholder `https://SEU-DOMINIO-AQUI/...` com `TODO` — **precisam da URL absoluta real após o deploy** |
| 5.7 | Favicon | 🔴 Nenhum `link rel="icon"` no `<head>` | Adicionado favicon SVG inline (data URI), fundo navy com iniciais "JAN" em clay, sem depender de arquivo externo |
| 5.8 | `robots.txt` | 🔴 Não existia | Criado na raiz com `User-agent: * / Allow: /` |
| 5.9 | `.htaccess` | 🔴 Não existia | Criado na raiz com gzip (HTML/CSS/JS/SVG), cache de 1 ano (imagens/vídeos/fontes), cache de 1 semana (CSS/JS) e redirect HTTP→HTTPS. **Nota importante**: Vercel e Netlify (a stack de hospedagem alvo do projeto) **não leem `.htaccess`** — esse arquivo só tem efeito em Apache. Em Vercel/Netlify o equivalente é `vercel.json` (headers/redirects) ou `netlify.toml`/`_headers`; deixei o `.htaccess` pronto para o caso de hospedagem Apache alternativa, mas o desenvolvedor deve configurar cache/redirects nativamente na plataforma escolhida |
| 5.10 | **(achado extra)** CSS morto | 🟡 ~230 linhas de CSS sem nenhum uso no HTML atual, sobras de uma iteração anterior de design: `.img-placeholder`/`.anatomy-icon`, `.about-image-wrap`/`.about-img`/`.about-img-placeholder` (substituídos pelo carrossel de fotos), toda a família `.clinical-case`/`.case-accordion-toggle`/`.case-block`/etc. (substituída pelo stage de iPhones), e `.authority-badge`/`.badge-einstein-logo`/`.badge-logo-placeholder`/`.gold-text`/`.badge-gold-label`/`.badge-white-text` (substituídos por `.authority-badge-small`/`.authority-badge-einstein`, que continuam em uso) | Removido do `css/style.css` — reduz o peso do arquivo sem alterar nenhum comportamento visual (confirmado por grep contra o HTML antes de remover) |
| 5.11 | **(achado extra)** JS morto | 🟢 `initCases()` em `main.js` seleciona `.clinical-case`/`.case-block`/`.case-photo-slot img`, que não existem mais no HTML — a função roda mas não faz nada (`querySelectorAll` vazio, `forEach` no-op). Inofensivo, mas é código morto | Não removido nesta rodada para limitar o raio de mudança em `main.js` já bastante alterado; recomendo remover `initCases()` e sua chamada em um commit de limpeza separado |

---

## FRENTE 6 — Benchmark e Recomendações Finais

**Comparação com o padrão de mercado (fisioterapeutas no Brasil):**
O padrão típico é WordPress com tema genérico, paleta azul/branco sem identidade, zero animação, responsividade rasa (media queries básicas, sem tratamento fino de toque). Este projeto está acima em: (1) performance de base — HTML/CSS/JS vanilla sem overhead de plugin/tema WordPress; (2) identidade visual autoral (paleta navy/clay/gold, tipografia serifada + sans, nenhum elemento de template); (3) micro-interações GSAP com propósito narrativo (preloader com a própria logo, parallax, timeline de credenciais); (4) estrutura semântica e de acessibilidade tratada desde o início, não como reboque.

**Não usar framework JS (React/Vue) — foi a decisão certa?**
Sim, para o escopo atual. É uma landing page de página única, sem estado complexo, sem necessidade de reatividade entre componentes distantes, sem roteamento. React/Vue trariam um bundle inicial maior (mesmo com tree-shaking, o runtime + hydration custam KBs que aqui não se pagam), uma camada de build a manter, e complexidade desproporcional ao ganho. Vanilla JS com GSAP dá controle fino sobre timing de animação (crítico para o preloader e o ScrollTrigger) sem a abstração de um Virtual DOM no caminho. O ponto de atenção é justamente o oposto do medo comum: o "framework" carregado sem necessidade aqui foi o **Tailwind CDN**, não React — e ele foi removido nesta auditoria.

**GSAP vs. CSS puro:**
GSAP agrega valor real onde CSS puro não alcança de forma limpa: orquestração de timeline com múltiplos elementos e labels compartilhados (o preloader, que sincroniza o desenho do SVG, o deslocamento da logo até a navbar e a cortina saindo, tudo coordenado), o parallax vinculado a scroll (`scrub`) da seção Sobre, e o controle imperativo do carrossel/drawer onde a lógica de estado já está em JS de qualquer forma. Por outro lado, CSS puro seria suficiente (e mais barato) para: o hover dos botões, o `floatBadge` da hero (já é `@keyframes`), o shimmer do texto Einstein, e o efeito de leque/tilt dos iPhones fora do problema do `:has()` — nesses casos o GSAP não estava sendo usado de forma redundante, então não há overhead a cortar hoje, mas é o padrão a manter: reservar GSAP para orquestração e scroll, CSS para estados simples.

**Três melhorias de maior impacto em conversão, viáveis na stack atual:**
1. **Formulário de agendamento inline** (além do WhatsApp) — um formulário curto (nome, telefone, motivo) que dispara um `mailto:`/webhook ou abre o WhatsApp pré-preenchido captura leads que não querem sair do site para o app.
2. **Prova social acima da dobra** — hoje depoimentos e credenciais só aparecem depois de várias seções de rolagem; um selo compacto ("+X pacientes atendidos", nota/avaliação) próximo ao hero reduz a hesitação inicial.
3. **CTA sticky em mobile** — um botão fixo "Agendar pelo WhatsApp" ancorado no rodapé da viewport em telas pequenas, sempre acessível sem precisar rolar até o fim.

**Três maiores riscos técnicos antes do deploy:**
1. **Número de WhatsApp placeholder** (`5511999999999`, 2 ocorrências) — bloqueador de lançamento: nenhum agendamento funciona até isso ser trocado.
2. **Dependência total de dois CDNs externos (GSAP/ScrollTrigger via cdnjs)** para a página não ficar visualmente travada — mitigado nesta auditoria com o timeout de segurança de 4s, mas vale considerar hospedar esses dois arquivos localmente (`assets/vendor/`) para eliminar de vez a dependência de terceiros na renderização inicial.
3. **4 imagens de fundo dos cards de Especialidade ausentes** — os cards já foram ajustados para não quebrar visualmente, mas a seção mais "vendedora" do site (as 4 especialidades) está sem imagem de apoio até esses arquivos serem produzidos e adicionados.

**Notas técnicas (0–10):**

| Dimensão | Nota | Justificativa |
|---|---|---|
| Performance | 7 | Base leve e bem estruturada, mas dependia de 300KB de Tailwind não utilizado (corrigido) e ainda depende de 2 CDNs externos para a experiência inicial não travar. |
| Design e UX | 9 | Identidade visual forte e coerente, motion design com propósito narrativo real (preloader, parallax, carrossel), muito acima do padrão do setor. |
| Acessibilidade | 7 | Fundamentos sólidos (hierarquia, `rel`, `type`, contraste majoritariamente correto), mas tinha uma falha real de contraste AA e nenhum focus trap no modal antes desta auditoria — ambos corrigidos. |
| Qualidade de Código | 7 | JS modular e legível, sem frameworks desnecessários; puxado para baixo por ~230 linhas de CSS morto e 4 referências de imagem quebradas que chegariam à produção sem esta revisão. |
| Diferenciação de Mercado | 9 | Nada no site lembra um template de fisioterapeuta genérico — paleta, tipografia, motion e estrutura de conteúdo (casos clínicos em formato de "stories") são autorais. |

---

## Resumo Executivo

**Problemas encontrados por categoria:**
- 🔴 Crítico: **14** (imagens sem `loading` correto, Tailwind morto, 4 imagens quebradas, contraste AA falhando, falta de focus trap, sem timeout de segurança no preloader, conflito GSAP×CSS quebrando hover, `:has()` sem fallback, modal mobile acima de 85vw, 6 controles abaixo de 44×44px, sem meta SEO, sem favicon, sem `robots.txt`, sem `.htaccess`)
- 🟡 Moderado: **4** (`once:true` faltando em 5 ScrollTriggers, tilt 3D sem desativação por `hover:none`, CSS morto, TODO do WhatsApp duplicado sem aviso)
- 🟢 Conforme / sem ação: **17** (preload de vídeo, posição do GSAP, `display=swap`, formatos webp, drawer mobile, stats bar, seção Sobre, viewport meta, hierarquia de headings, 3 pares de contraste, `type="button"`, imagens decorativas, `rel=noopener`, limpeza do modal de vídeo, ausência de leaks de listener, variáveis CSS todas em uso, ausência de `console.log`)

**Arquivos modificados:**
- `index.html` — atributos `loading`/`fetchpriority` corrigidos; script do Tailwind removido; meta tags de SEO (OG/Twitter) e favicon adicionados; script inline de segurança do preloader; 4 `<img>` quebradas removidas (com `TODO`); TODO do WhatsApp duplicado no rodapé.
- `css/style.css` — `--clay-deep` e uso em botões (contraste AA); `:focus-visible` global; `.hero-badge` reestruturada para não conflitar com GSAP; `max-width: 85vw` no modal de vídeo; áreas de toque de 44×44px em 6 componentes; bloco `@media (hover: none)` para o tilt de iPhones; ~230 linhas de CSS morto removidas.
- `js/main.js` — `once: true` em 5 ScrollTriggers; `clearProps: 'transform'` em `initCards`/`initMedia`; entrada das hero badges reestruturada; guard no `registerPlugin`; `try/catch` no cálculo do SVG do preloader; `initIphoneHoverFallback()` nova (fallback de `:has()`); focus trap no modal de vídeo.
- `robots.txt` — criado.
- `.htaccess` — criado (com nota de que não se aplica a Vercel/Netlify).

**Próximos passos, em ordem de prioridade antes do deploy:**
1. **Substituir o número de WhatsApp placeholder** (`5511999999999`) pelo real nas 2 ocorrências em `index.html` — sem isso o site não converte.
2. **Produzir/adicionar as 4 imagens de `especialidade-*.webp`** para a seção de Expertise.
3. **Definir o domínio real** e substituir `https://SEU-DOMINIO-AQUI` nas tags `og:image`/`twitter:image` e, se aplicável, revisar o `robots.txt` com o domínio final.
4. Testar manualmente em um navegador real (mobile e desktop) o modal de vídeo, o drawer, o carrossel de depoimentos e o hover dos cards após as correções de GSAP/CSS — as mudanças foram verificadas por leitura de código e cálculo, não por teste em browser real nesta sessão.
5. Configurar cache/headers/redirect HTTPS diretamente na plataforma de deploy (Vercel/Netlify), já que `.htaccess` não é lido por elas.
6. (Opcional, limpeza) Remover `initCases()` de `main.js`, função morta que não afeta nada hoje mas não tem mais propósito.
