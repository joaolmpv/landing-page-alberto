Você é um engenheiro front-end sênior e auditor de qualidade. Sua tarefa é fazer uma varredura completa e profunda deste projeto de landing page antes de ele ir para produção.

O projeto é uma landing page single-page para Dr. João Alberto Navarro Nazaré, fisioterapeuta especializado em dor crônica, reabilitação pós-operatória e fisioterapia esportiva. O objetivo do site é converter visitantes em agendamentos, transmitir autoridade médica, e ao mesmo tempo ser visualmente único, dinâmico e premium — diferente dos sites genéricos da área da saúde. O público são pacientes com dores complexas, atletas lesionados e pacientes pré e pós-cirúrgicos. A experiência do usuário é prioridade absoluta.

Stack do projeto: HTML5 semântico, Tailwind CSS via CDN, GSAP 3.12.5 com ScrollTrigger, JavaScript ES6 vanilla, CSS3 com animações avançadas, SVG inline, HTML5 Video API. Sem framework JavaScript. Hospedagem futura em Vercel ou Netlify.

Leia todos os arquivos do projeto agora: index.html, css/style.css e js/main.js. Leia também a estrutura completa da pasta assets/. Depois execute a seguinte auditoria completa em seis frentes, apresentando os resultados de forma clara com o problema encontrado, o impacto e a correção aplicada ou recomendada:

---

FRENTE 1 — PERFORMANCE E CARREGAMENTO

Analise cada ponto abaixo e corrija diretamente nos arquivos quando possível:

Verifique se todas as imagens da pasta assets/images/ têm o atributo loading="lazy", exceto a foto do hero que deve ter loading="eager". Corrija os que estiverem errados.

Verifique se o Tailwind CSS está sendo carregado via CDN com o script de produção ou com o script de desenvolvimento. O script de desenvolvimento (cdn.tailwindcss.com sem parâmetros) carrega mais de 300KB desnecessários em produção. Se estiver assim, adicione o atributo data-mode="production" ou instrua sobre a build correta para Vercel.

Verifique se os três vídeos na pasta assets/videos/ têm o atributo preload="none" no elemento video do HTML. Se não tiverem, corrija — vídeo com preload automático é o maior assassino de performance em mobile.

Verifique se o GSAP e o ScrollTrigger estão sendo carregados com o atributo defer ou async no final do body. Se estiverem no head sem defer, mova-os para o final do body ou adicione defer.

Verifique se há alguma fonte sendo carregada sem display=swap no link do Google Fonts. Se não tiver, adicione &display=swap para evitar FOIT (flash of invisible text).

Verifique se as imagens da pasta assets/images/ estão todas em formato .webp. Liste as que não estiverem e instrua a conversão.

Calcule e reporte o peso total estimado de todos os assets carregados na primeira dobra da página (above the fold): hero photo, fontes, CSS crítico. O ideal é abaixo de 200KB para a primeira renderização.

---

FRENTE 2 — QUALIDADE DAS ANIMAÇÕES GSAP E CSS

Leia o arquivo js/main.js inteiro e o css/style.css e analise:

Verifique se o gsap.registerPlugin(ScrollTrigger) está sendo chamado antes de qualquer uso do ScrollTrigger. Se não estiver, corrija.

Verifique se todos os ScrollTriggers têm a propriedade once: true nos casos onde a animação só precisa acontecer uma vez (fade-in de entrada, por exemplo). Animações que re-disparam toda vez que o elemento entra no viewport causam experiência ruim. Corrija os que precisarem.

Verifique se há animações GSAP sendo aplicadas em elementos que também têm transitions CSS no mesmo projeto. Conflito entre GSAP e CSS transition no mesmo elemento causa comportamento imprevisível. Liste os conflitos encontrados e resolva removendo a CSS transition do elemento e deixando apenas o GSAP, ou vice-versa conforme o caso.

Verifique se o preloader tem um timeout de segurança. Se o SVG da logo não carregar ou o getTotalLength() retornar zero (o que acontece quando o SVG está oculto com display:none durante o cálculo), a página pode ficar travada. Se não houver timeout, adicione um fallback de 4 segundos que força o preloader a fechar independente do estado da animação.

Verifique se as animações de hover nos mockups de iPhone (seletores CSS :has()) têm fallback para navegadores que não suportam :has(). O suporte ao :has() ainda não é universal em todos os navegadores em uso. Se não houver fallback, adicione uma classe .is-hovered via JavaScript como alternativa.

Verifique se o modal de vídeo (id="video-modal") limpa corretamente o src do vídeo ao fechar. Um vídeo com src definido continua consumindo memória e banda mesmo pausado. Se a limpeza não estiver implementada corretamente (source.src = "" seguido de player.load()), corrija.

Verifique se há algum addEventListener sem o correspondente removeEventListener em elementos que são criados e destruídos dinamicamente, causando memory leak. Reporte e corrija.

---

FRENTE 3 — RESPONSIVIDADE E EXPERIÊNCIA MOBILE

Redimensione mentalmente o layout para 375px (iPhone SE), 390px (iPhone 14), 768px (iPad) e 1440px (desktop padrão) e analise cada seção:

Hero: a foto e o texto ficam legíveis e bem proporcionados em 375px? O H1 com clamp() está funcionando corretamente? Verifique se o font-size mínimo não fica abaixo de 2rem no mobile.

Navbar: o drawer mobile está implementado? Verifique se o botão hamburguer existe no HTML e se a função initMobileMenu está implementada no main.js. Se o drawer não estiver implementado, implemente agora com GSAP x de 100% para 0.

Stats bar: em 375px as 4 colunas viram 2x2? Verifique o breakpoint e corrija se necessário.

Seção Sobre: em mobile a foto e o texto ficam empilhados verticalmente? A timeline fica legível em tela pequena?

Mockups iPhone 3D: em mobile os três iPhones devem empilhar verticalmente sem rotação 3D. Verifique se os seletores :has() de hover estão sendo desativados corretamente abaixo de 640px com pointer: none ou @media (hover: none).

Modal de vídeo: em mobile o modal de iPhone deve ocupar no máximo 85vw de largura e ser centralizado. Verifique e corrija.

Botões: todos os botões e links clicáveis têm área mínima de toque de 44x44px conforme diretrizes de acessibilidade mobile da Apple e Google? Verifique e corrija os que estiverem menores.

Verifique se existe a meta tag viewport correta no head: content="width=device-width, initial-scale=1.0". Se não existir, adicione.

---

FRENTE 4 — ACESSIBILIDADE

Analise o HTML completo e verifique:

Hierarquia de headings: existe exatamente um H1 na página? Os H2 são usados para títulos de seção? Os H3 para subtítulos dentro das seções? Reporte qualquer quebra de hierarquia.

Contraste de cores: verifique os seguintes pares críticos usando as variáveis CSS definidas no projeto e reporte se passam no mínimo AA do WCAG 2.1 (ratio 4.5:1 para texto normal, 3:1 para texto grande):
- Texto var(--text-muted) (#8892A4) sobre fundo var(--navy) (#0A192F)
- Texto var(--clay) (#A1887F) sobre fundo var(--navy) (#0A192F)
- Texto var(--text-dark) (#1A1A2E) sobre fundo var(--sand) (#F9F9F6)
- Texto branco (#FFFFFF) sobre botão var(--clay) (#A1887F)

Elementos interativos: todos os buttons têm type="button" declarado explicitamente? Buttons sem type podem submeter forms inesperadamente. Corrija os que estiverem sem.

Foco visível: existe algum reset CSS global que remove o outline de foco? Se sim, adicione um estilo de foco customizado visível usando outline: 2px solid var(--clay) com outline-offset: 3px em *:focus-visible.

Imagens decorativas: imagens puramente decorativas (fundos, texturas) têm alt="" e role="presentation"? Reporte e corrija.

Links externos: todos os links que abrem em _blank têm rel="noopener noreferrer"? Isso é tanto segurança quanto acessibilidade. Corrija os que não tiverem.

O modal de vídeo implementa corretamente o focus trap? Quando o modal abre, o foco deve ir para dentro do modal e não deve ser possível navegar por Tab para fora. Se não estiver implementado, adicione um focus trap simples.

---

FRENTE 5 — QUALIDADE DO CÓDIGO E PREPARAÇÃO PARA PRODUÇÃO

Analise o código nos três arquivos e reporte:

Verifique se há comentários TODO deixados no código marcando o número de WhatsApp como substituível. Se houver, liste-os claramente para o desenvolvedor.

Verifique se o CSS tem regras duplicadas ou conflitantes para os mesmos seletores. Liste as duplicatas encontradas e consolide.

Verifique se há variáveis CSS declaradas no :root que não estão sendo usadas em nenhum lugar do CSS. Liste as não utilizadas.

Verifique se o JavaScript tem console.log() deixados do processo de desenvolvimento. Se houver, remova todos.

Verifique se o HTML tem comentários de debug ou blocos comentados que não fazem parte da documentação. Remova.

Verifique se o arquivo index.html tem as seguintes meta tags de SEO: title descritivo, meta description, meta og:title, meta og:description, meta og:image, meta og:type, meta twitter:card. Se não tiver, adicione todas com conteúdo relevante para o Dr. João Alberto.

Verifique se há um arquivo favicon.ico ou link rel="icon" no head. Se não houver, adicione um SVG favicon inline simples com as iniciais JAN na cor clay.

Crie um arquivo robots.txt na raiz do projeto com conteúdo permissivo padrão (Allow: /).

Crie um arquivo .htaccess na raiz com as seguintes configurações: compressão gzip para HTML, CSS, JS e SVG; cache de 1 ano para imagens, vídeos e fontes; cache de 1 semana para CSS e JS; redirect de http para https quando em produção.

---

FRENTE 6 — BENCHMARK E RECOMENDAÇÕES FINAIS

Depois de todas as correções acima, faça uma avaliação comparativa respondendo objetivamente:

Compare este projeto com o padrão típico de sites de fisioterapeutas no Brasil. O padrão típico usa WordPress com tema genérico, cores azul claro e branco, sem animações, responsividade básica. Liste em que aspectos técnicos e de UX este projeto está acima desse padrão.

Avalie a escolha de não usar framework JavaScript (React, Vue) para este projeto. Foi a decisão correta para uma landing page de saúde? Justifique considerando performance, manutenção e o perfil do cliente.

Avalie o uso de GSAP vs CSS puro para as animações deste projeto. Onde o GSAP está agregando valor que CSS não conseguiria? Onde CSS puro seria suficiente e o GSAP é overhead desnecessário?

Liste as três melhorias de maior impacto na conversão (agendamentos) que ainda não foram implementadas e que seriam viáveis tecnicamente dentro da stack atual.

Liste os três maiores riscos técnicos do projeto antes do deploy em produção e como mitigá-los.

Dê uma nota técnica geral de 0 a 10 para o projeto nas seguintes dimensões: Performance, Design e UX, Acessibilidade, Qualidade de Código, Diferenciação de Mercado. Justifique cada nota em uma frase.

---

Ao final da auditoria, apresente um resumo executivo com: total de problemas encontrados por categoria (crítico, moderado, sugestão), lista de todos os arquivos que foram modificados e o que foi alterado em cada um, e os próximos passos recomendados em ordem de prioridade antes do deploy.
