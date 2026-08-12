if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
  gsap.registerPlugin(ScrollToPlugin);
}

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

window.scrollTo(0, 0);

const LOGO_COLOR = '#F9F9F6';
const LOGO_STROKE_ANIM = 10;
const LOGO_STROKE_STATIC = 22;
const PRELOADER_LOGO_PX = 160;
const NAV_LOGO_PX = 48;
const FOOTER_LOGO_PX = 42;

/* ============================================
   initPreloader
   ============================================ */
async function loadLogoSvg() {
  try {
    const response = await fetch('assets/images/logo.svg');
    if (!response.ok) throw new Error('fetch failed');
    const svgText = await response.text();
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg || doc.querySelector('parsererror')) throw new Error('invalid svg');
    return document.importNode(svg, true);
  } catch (error) {
    console.warn('Logo SVG:', error);
    return null;
  }
}

function styleLogoPaths(svgRoot, { animated = false } = {}) {
  const paths = svgRoot.querySelectorAll('path, circle, ellipse, line, polyline, polygon, rect');
  const drawPaths = [];
  const strokeWidth = animated ? LOGO_STROKE_ANIM : LOGO_STROKE_STATIC;

  paths.forEach((el) => {
    if (typeof el.getTotalLength !== 'function') return;
    const length = el.getTotalLength();
    if (!length || length < 2) return;

    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', LOGO_COLOR);
    el.setAttribute('stroke-width', String(strokeWidth));
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');

    if (animated) {
      el.classList.add('logo-stroke');
      el.setAttribute('stroke-dasharray', String(length));
      el.setAttribute('stroke-dashoffset', String(length));
      el.style.strokeDasharray = String(length);
      el.style.strokeDashoffset = String(length);
      drawPaths.push(el);
    } else {
      el.removeAttribute('stroke-dasharray');
      el.removeAttribute('stroke-dashoffset');
    }
  });

  return drawPaths;
}

function mountStaticLogo(svg, slot, size) {
  if (!svg || !slot) return;
  const clone = svg.cloneNode(true);
  clone.removeAttribute('width');
  clone.removeAttribute('height');
  clone.classList.add('site-logo-svg');
  clone.style.width = `${size}px`;
  clone.style.height = `${size}px`;
  styleLogoPaths(clone, { animated: false });
  slot.innerHTML = '';
  slot.appendChild(clone);
  slot.removeAttribute('aria-hidden');
}

async function initPreloader() {
  const preloader = document.getElementById('preloader');
  const curtain = preloader?.querySelector('.preloader-curtain');
  const mount = document.getElementById('preloader-logo-mount');
  const logoWrap = mount?.closest('.preloader-logo-wrap') || mount;
  const navSlot = document.getElementById('nav-logo-slot');
  const footerSlot = document.getElementById('footer-logo-slot');
  const navAnchor = document.querySelector('.navbar-logo');

  document.body.classList.add('preloader-active');

  if (!preloader || !curtain || !mount || !logoWrap) {
    document.body.classList.add('page-revealed', 'page-ready');
    document.body.classList.remove('preloader-active');
    initHeroAnimations();
    initPageEffects();
    return;
  }

  const svgSource = await loadLogoSvg();
  if (!svgSource) {
    preloader.style.display = 'none';
    document.body.classList.remove('preloader-active');
    document.body.classList.add('page-revealed', 'page-ready');
    initHeroAnimations();
    initPageEffects();
    return;
  }

  const svg = svgSource.cloneNode(true);
  svg.classList.add('preloader-logo');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Logo Dr. João Alberto');
  svg.style.width = `${PRELOADER_LOGO_PX}px`;
  svg.style.height = `${PRELOADER_LOGO_PX}px`;
  mount.innerHTML = '';
  mount.appendChild(svg);

  // getTotalLength() pode lançar exceção em alguns navegadores quando o SVG
  // é medido enquanto ainda está oculto/fora do layout. Sem o try/catch, essa
  // exceção interrompe initPreloader() antes da Promise ser criada e o
  // preloader nunca fecha (a página trava). O setTimeout de 4s no <head> é a
  // rede de segurança final para qualquer outro cenário de falha.
  let drawPaths = [];
  try {
    drawPaths = styleLogoPaths(svg, { animated: true });
  } catch (error) {
    console.warn('Logo path measurement failed:', error);
  }

  gsap.set(logoWrap, {
    position: 'fixed',
    left: '50%',
    top: '50%',
    xPercent: -50,
    yPercent: -50,
    zIndex: 10002,
  });

  const getNavTarget = () => {
    const rect = navAnchor?.getBoundingClientRect();
    if (!rect) {
      return { left: 32, top: 32, scale: NAV_LOGO_PX / PRELOADER_LOGO_PX };
    }
    return {
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height / 2,
      scale: NAV_LOGO_PX / PRELOADER_LOGO_PX,
    };
  };

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        mountStaticLogo(svgSource, navSlot, NAV_LOGO_PX);
        mountStaticLogo(svgSource, footerSlot, FOOTER_LOGO_PX);
        preloader.style.display = 'none';
        document.body.classList.remove('preloader-active');
        document.body.classList.add('page-revealed', 'page-ready');
        gsap.set(logoWrap, { clearProps: 'all' });
        mount.innerHTML = '';
        window.scrollTo(0, 0);
        resolve();
      },
    });

    if (drawPaths.length) {
      tl.to(drawPaths, {
        strokeDashoffset: 0,
        duration: 1.8,
        ease: 'power2.inOut',
        stagger: 0.025,
      });
      tl.to(
        drawPaths,
        {
          attr: { 'stroke-width': LOGO_STROKE_STATIC },
          duration: 0.35,
          ease: 'power2.out',
        },
        '-=0.15'
      );
    }

    tl.addLabel('reveal');

    tl.call(() => {
      document.body.classList.add('page-revealed');
      initHeroAnimations();
    }, null, 'reveal');

    tl.to(
      logoWrap,
      {
        left: () => getNavTarget().left,
        top: () => getNavTarget().top,
        xPercent: -50,
        yPercent: -50,
        scale: () => getNavTarget().scale,
        duration: 0.8,
        ease: 'power2.inOut',
      },
      'reveal'
    );

    tl.to(
      curtain,
      {
        scaleY: 0,
        transformOrigin: 'top center',
        duration: 1,
        ease: 'power4.inOut',
      },
      'reveal'
    );
  });
}

function initPageEffects() {
  safeInit('initAbout', initAbout);
  safeInit('initCards', initCards);
  safeInit('initMedia', initMedia);
  safeInit('initCTA', initCTA);
  safeInit('initCredentials', initCredentials);
}

/* ============================================
   initNavbar
   ============================================ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menu-toggle');
  const menuClose = document.getElementById('menu-close');
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('drawer-overlay');

  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  const hasGsap = typeof gsap !== 'undefined';

  const openDrawer = () => {
    if (!drawer) return;
    if (hasGsap) {
      gsap.to(drawer, { x: 0, duration: 0.4, ease: 'power3.out' });
    } else {
      drawer.style.transform = 'translateX(0)';
    }
    overlay?.classList.add('active');
    menuToggle?.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
  };

  const closeDrawer = () => {
    if (!drawer) return;
    if (hasGsap) {
      gsap.to(drawer, { x: '100%', duration: 0.4, ease: 'power3.in' });
    } else {
      drawer.style.transform = 'translateX(100%)';
    }
    overlay?.classList.remove('active');
    menuToggle?.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
  };

  menuToggle?.addEventListener('click', openDrawer);
  menuClose?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);

  drawer?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  if (drawer) {
    if (hasGsap) {
      gsap.set(drawer, { x: '100%' });
    } else {
      drawer.style.transform = 'translateX(100%)';
    }
  }
}

/* ============================================
   initHeroAnimations
   ============================================ */
function initHeroAnimations() {
  const label = document.querySelector('.hero-label');
  const title = document.querySelector('.hero-title');
  const desc = document.querySelector('.hero-desc');
  const buttons = document.querySelector('.hero-buttons');
  const socialProof = document.querySelector('.hero-social-proof');
  const photo = document.querySelector('.hero-photo-wrap');
  const badges = document.querySelectorAll('.hero-badge');

  if (label) {
    gsap.from(label, { opacity: 0, y: 20, duration: 0.6, delay: 0.2 });
  }
  if (title) {
    gsap.from(title, { opacity: 0, y: 40, duration: 0.8, delay: 0.4 });
  }
  if (desc) {
    gsap.from(desc, { opacity: 0, y: 30, duration: 0.7, delay: 0.6 });
  }
  if (buttons) {
    gsap.from(buttons, { opacity: 0, y: 20, duration: 0.6, delay: 0.8 });
  }
  if (socialProof) {
    gsap.from(socialProof, { opacity: 0, y: 20, duration: 0.6, delay: 0.95, clearProps: 'transform' });
  }
  if (photo) {
    gsap.from(photo, {
      opacity: 0,
      scale: 0.9,
      duration: 1,
      delay: 0.5,
      ease: 'power3.out',
    });
  }
  // As badges usam animation:floatBadge em CSS (transform). Rodar o tween de
  // entrada do GSAP (também em transform) ao mesmo tempo causa conflito: a
  // CSS animation tem prioridade sobre o transform inline do GSAP e o efeito
  // de entrada nunca aparece. Por isso a classe .is-floating (que liga o
  // floatBadge) só é adicionada depois que o GSAP termina a entrada.
  if (badges[0]) {
    gsap.from(badges[0], {
      opacity: 0,
      x: 30,
      duration: 0.7,
      delay: 1.2,
      clearProps: 'transform',
      onComplete: () => badges[0].classList.add('is-floating'),
    });
  }
  if (badges[1]) {
    gsap.from(badges[1], {
      opacity: 0,
      x: -30,
      duration: 0.7,
      delay: 1.4,
      clearProps: 'transform',
      onComplete: () => badges[1].classList.add('is-floating'),
    });
  }

  // Parallax do texto do hero: sobe e esmaece levemente enquanto o usuário
  // rola para além da seção.
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    gsap.to(heroContent, {
      yPercent: -8,
      opacity: 0.6,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }
  // Nota: parallax nos .hero-badge foi propositalmente omitido — eles usam
  // animation:floatBadge em CSS (ver comentário acima sobre .is-floating),
  // que tem prioridade sobre qualquer transform inline do GSAP enquanto
  // está rodando. Um scrub de scroll nas mesmas propriedades seria
  // constantemente sobrescrito pelo floatBadge e não teria efeito visual.
}

/* ============================================
   initHeroFlip
   ============================================ */
function initHeroFlip() {
  const container = document.querySelector('.hero-flip-container');
  const card = document.querySelector('.hero-flip-card');
  const hint = document.querySelector('.flip-hint');
  const tapHint = document.querySelector('.tap-hint-mobile');
  if (!container || !card) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 0.01 : 0.7;
  const isTouch = window.matchMedia('(hover: none)').matches;
  let isFlipped = false;
  let hintDismissed = false;
  let tapHintDismissed = false;

  const dismissHint = () => {
    if (hintDismissed || !hint) return;
    hintDismissed = true;
    gsap.to(hint, { opacity: 0, duration: 0.3 });
  };

  const dismissTapHint = () => {
    if (tapHintDismissed || !tapHint) return;
    tapHintDismissed = true;
    gsap.to(tapHint, { opacity: 0, duration: 0.3 });
  };

  const setFlipped = (state) => {
    isFlipped = state;
    card.classList.toggle('is-flipped', isFlipped);
    gsap.to(card, { rotationY: isFlipped ? 180 : 0, duration, ease: 'power3.inOut' });
  };

  if (isTouch) {
    container.addEventListener(
      'touchstart',
      (event) => {
        event.preventDefault();
        dismissHint();
        dismissTapHint();
        setFlipped(!isFlipped);
      },
      { passive: false }
    );
  } else {
    container.addEventListener('mouseenter', () => {
      dismissHint();
      setFlipped(true);
    });
    container.addEventListener('mouseleave', () => setFlipped(false));
  }
}

/* ============================================
   initCredentials (ScrollTrigger)
   ============================================ */
function initCredentials() {
  const items = document.querySelectorAll('.credential-item');
  if (!items.length) return;

  gsap.from(items, {
    scrollTrigger: {
      trigger: '#credenciais',
      start: 'top 85%',
      toggleActions: 'play none none none',
      once: true,
    },
    opacity: 0,
    y: 30,
    stagger: 0.15,
    duration: 0.7,
    ease: 'power2.out',
  });

  // As 4 credenciais (UEPA, Einstein, FIFA, CREFITO) são todas texto, sem
  // nenhum valor numérico real disponível para animar como contador — em
  // vez de inventar estatísticas, aplica-se um blur-in a todas.
  const values = document.querySelectorAll('.credential-value');
  if (values.length) {
    gsap.set(values, { filter: 'blur(8px)', opacity: 0 });
    ScrollTrigger.create({
      trigger: '#credenciais',
      start: 'top 80%',
      once: true,
      onEnter: () => {
        values.forEach((value, index) => {
          gsap.to(value, {
            filter: 'blur(0px)',
            opacity: 1,
            duration: 0.8,
            delay: index * 0.15,
            ease: 'power2.out',
          });
        });
      },
    });
  }
}

/* ============================================
   initAbout
   ============================================ */
function initAbout() {
  // O parallax (y/rotation/scale) é só no álbum de fotos — quando estava
  // no wrapper inteiro (.about-visual), a mesma rotação de scroll também
  // girava os badges "UEPA"/"Hospital Einstein" abaixo dele, deixando-os
  // tortos e com o texto borrado (browsers anti-aliasam texto rotacionado).
  const parallaxGroup = document.getElementById('about-carousel');
  const badgeRow = document.querySelector('.about-badge-row');
  const timelineLine = document.getElementById('timeline-line');
  const timelinePoints = document.querySelectorAll('.timeline-point');

  if (parallaxGroup) {
    gsap.fromTo(
      parallaxGroup,
      { y: -54, rotation: 0, scale: 1 },
      {
        y: 72,
        rotation: -2,
        scale: 1.06,
        ease: 'none',
        scrollTrigger: {
          trigger: '#sobre',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      }
    );
  }

  if (badgeRow) {
    gsap.from(badgeRow.children, {
      opacity: 0,
      y: 24,
      stagger: 0.15,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: badgeRow,
        start: 'top 90%',
        toggleActions: 'play none none none',
        once: true,
      },
    });
  }

  if (timelineLine) {
    gsap.to(timelineLine, {
      height: '100%',
      duration: 1.5,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: '#timeline',
        start: 'top 80%',
        toggleActions: 'play none none none',
        once: true,
      },
    });
  }

  timelinePoints.forEach((point, index) => {
    gsap.to(point, {
      opacity: 1,
      duration: 0.6,
      delay: index * 0.3,
      scrollTrigger: {
        trigger: point,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      },
    });
  });
}

/* ============================================
   initAboutCarousel
   ============================================ */
function initAboutCarousel() {
  const root = document.getElementById('about-carousel');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('.about-carousel-slide'));
  const dots = Array.from(root.querySelectorAll('.about-dot'));
  const prevBtn = root.querySelector('.about-carousel-prev');
  const nextBtn = root.querySelector('.about-carousel-next');
  const deck = root.querySelector('.about-carousel-deck');
  const total = slides.length;
  let current = 0;
  let isAnimating = false;
  let touchStartX = 0;

  const normalize = (index) => ((index % total) + total) % total;

  const updateStack = () => {
    slides.forEach((slide, index) => {
      const depth = normalize(index - current);
      slide.dataset.depth = String(depth);
      slide.classList.remove('is-turning-out', 'is-revealing');
      slide.style.zIndex = '';
    });

    dots.forEach((dot, index) => {
      const active = index === current;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  };

  const goTo = (index) => {
    if (isAnimating) return;
    const next = normalize(index);
    if (next === current) return;

    const outgoing = slides[current];
    const incoming = slides[next];
    isAnimating = true;
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;

    // Next photo sits underneath; current page peels above and away
    incoming.dataset.depth = '0';
    incoming.classList.add('is-revealing');
    outgoing.classList.add('is-turning-out');

    window.setTimeout(() => {
      current = next;
      updateStack();
      isAnimating = false;
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
    }, 560);
  };

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = Number(dot.getAttribute('data-index'));
      if (Number.isNaN(index) || index === current) return;
      goTo(index);
    });
  });

  deck?.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  deck?.addEventListener(
    'touchend',
    (e) => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) < 40) return;
      if (diff > 0) goTo(current + 1);
      else goTo(current - 1);
    },
    { passive: true }
  );

  updateStack();
}

/* ============================================
   initCards
   ============================================ */
function initCards() {
  const cards = document.querySelectorAll('.expertise-card');
  if (!cards.length) return;

  // Cards 1/3 (índices 0/2) entram com rotation -3→0; cards 2/4 (índices
  // 1/3) com rotation 3→0 — leve efeito de "leque" na entrada.
  gsap.from(cards, {
    scrollTrigger: {
      trigger: '#cards-grid',
      start: 'top 75%',
      toggleActions: 'play none none none',
      once: true,
    },
    opacity: 0,
    y: 60,
    rotation: (index) => (index % 2 === 0 ? -3 : 3),
    stagger: 0.12,
    duration: 0.8,
    ease: 'back.out(1.4)',
    // clearProps evita que o transform inline do GSAP fique "preso" no
    // elemento e bloqueie o transform do :hover definido em CSS.
    clearProps: 'transform',
  });

  cards.forEach((card) => {
    const icon = card.querySelector('.card-icon');
    const title = card.querySelector('.card-title');

    card.addEventListener('mouseenter', () => {
      if (icon) gsap.to(icon, { scale: 1.2, rotation: 5, duration: 0.4, ease: 'back.out(1.7)' });
      if (title) gsap.to(title, { x: 4, duration: 0.3 });
    });
    card.addEventListener('mouseleave', () => {
      if (icon) gsap.to(icon, { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(1.7)' });
      if (title) gsap.to(title, { x: 0, duration: 0.3 });
    });
  });
}

/* ============================================
   initCases
   ============================================ */
function initCases() {
  document.querySelectorAll('.clinical-case').forEach((caseEl) => {
    const blocks = caseEl.querySelectorAll('.case-block');

    ScrollTrigger.create({
      trigger: caseEl,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        gsap.from(blocks, {
          opacity: 0,
          y: 20,
          stagger: 0.15,
          duration: 0.6,
        });
      },
    });
  });

  document.querySelectorAll('.case-accordion-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const parent = toggle.closest('.clinical-case');
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      parent?.classList.toggle('is-open', !expanded);
    });
  });

  document.querySelectorAll('.case-photo-slot img').forEach((img) => {
    const markLoaded = () => img.classList.add('loaded');
    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener('load', markLoaded);
      img.addEventListener('error', () => {
        img.removeAttribute('src');
        img.style.display = 'none';
      });
    }
  });
}

/* ============================================
   initCarousel
   ============================================ */
function initCarousel() {
  const track = document.getElementById('carousel-track');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  const viewport = document.querySelector('.carousel-viewport');

  if (!track) return;

  const slides = track.querySelectorAll('.carousel-slide');
  const total = slides.length;
  let currentSlide = 0;
  let touchStartX = 0;
  let touchEndX = 0;

  function updateDots(index) {
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
  }

  function goToSlide(index) {
    if (index < 0) index = total - 1;
    if (index >= total) index = 0;
    currentSlide = index;

    gsap.to(track, {
      x: `-${index * 100}%`,
      duration: 0.5,
      ease: 'power2.out',
    });

    gsap.fromTo(
      slides[index],
      { opacity: 0.6 },
      { opacity: 1, duration: 0.5 }
    );

    updateDots(index);
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  prevBtn?.addEventListener('click', prevSlide);
  nextBtn?.addEventListener('click', nextSlide);

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const slide = parseInt(dot.getAttribute('data-slide'), 10);
      goToSlide(slide);
    });
  });

  viewport?.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );

  viewport?.addEventListener(
    'touchend',
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextSlide();
        else prevSlide();
      }
    },
    { passive: true }
  );

  let isDragging = false;
  let dragStartX = 0;

  viewport?.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
  });

  window.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diff = dragStartX - e.clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  });

  gsap.set(track, { x: '0%' });
}

/* ============================================
   initMedia
   ============================================ */
function initMedia() {
  const cards = document.querySelectorAll('.media-card');
  if (!cards.length) return;

  gsap.from(cards, {
    scrollTrigger: {
      trigger: '#midia',
      start: 'top 75%',
      toggleActions: 'play none none none',
      once: true,
    },
    opacity: 0,
    y: 40,
    stagger: 0.2,
    duration: 0.7,
    ease: 'power2.out',
    clearProps: 'transform',
  });
}

/* ============================================
   initCTA
   ============================================ */
function initCTA() {
  const section = document.querySelector('.cta-inner');
  if (!section) return;

  const children = section.children;
  gsap.from(children, {
    scrollTrigger: {
      trigger: '#contato',
      start: 'top 70%',
      toggleActions: 'play none none none',
      once: true,
    },
    opacity: 0,
    y: 40,
    stagger: 0.1,
    duration: 0.8,
    ease: 'power2.out',
  });
}

/* ============================================
   initBookingForm
   Formulário de solicitação de avaliação. Não confirma horário — apenas
   coleta os dados e avisa que o contato de confirmação vem por WhatsApp.
   Envia por webhook (se configurado) e sempre abre um mailto de apoio.
   ============================================ */
function initBookingForm() {
  const form = document.getElementById('booking-form');
  const status = document.getElementById('booking-status');
  if (!form) return;

  // TODO: configure um endpoint (Formspree, Make, Zapier, Netlify Function
  // etc.) para receber o POST automaticamente. Deixe em branco para usar
  // apenas o fallback por e-mail (mailto).
  const WEBHOOK_URL = '';
  // TODO: substitua pelo e-mail real que deve receber as solicitações.
  const DEST_EMAIL = 'albertonavarrofisio@gmail.com';

  const buildMailtoLink = (payload) => {
    const subject = encodeURIComponent(`Solicitação de avaliação — ${payload.name}`);
    const body = encodeURIComponent(
      [
        `Nome: ${payload.name}`,
        `WhatsApp/Telefone: ${payload.phone}`,
        `Motivo: ${payload.reason}`,
        `Melhor período para contato: ${payload.period}`,
        `Mensagem: ${payload.message || '-'}`,
      ].join('\n')
    );
    return `mailto:${DEST_EMAIL}?subject=${subject}&body=${body}`;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      reason: String(data.get('reason') || '').trim(),
      period: String(data.get('period') || '').trim(),
      message: String(data.get('message') || '').trim(),
    };

    const submitBtn = form.querySelector('.booking-submit');
    if (submitBtn) submitBtn.disabled = true;
    if (status) {
      status.textContent = 'Enviando...';
      status.classList.remove('is-error');
    }

    let webhookOk = false;
    if (WEBHOOK_URL) {
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        webhookOk = response.ok;
      } catch (error) {
        console.warn('Webhook de agendamento falhou:', error);
      }
    }

    if (submitBtn) submitBtn.disabled = false;

    if (webhookOk) {
      if (status) {
        status.textContent = 'Solicitação recebida! Isso não confirma seu horário — nossa equipe vai te chamar no WhatsApp para combinar data e horário.';
      }
      form.reset();
      return;
    }

    // Sem webhook configurado (ou ele falhou): usa o mailto como fallback.
    window.location.href = buildMailtoLink(payload);
    if (status) {
      status.textContent = 'Abrimos seu aplicativo de e-mail com os dados preenchidos — confira e clique em enviar para concluir. Isso não confirma seu horário: nossa equipe vai te chamar no WhatsApp para combinar data e horário.';
    }
    form.reset();
  });
}

/* ============================================
   initStickyWhatsApp
   Botão fixo de WhatsApp em telas pequenas. Some quando a seção de
   contato (que já tem os mesmos CTAs) está visível, para não duplicar.
   ============================================ */
function initStickyWhatsApp() {
  const sticky = document.getElementById('mobile-sticky-cta');
  const ctaSection = document.getElementById('contato');
  const footer = document.querySelector('.site-footer');
  if (!sticky || !ctaSection || !('IntersectionObserver' in window)) return;

  // O footer vem logo depois de #contato — sem observá-lo também, o
  // sticky volta a aparecer ao rolar pelo footer (já que #contato deixa
  // de intersectar), cobrindo o texto de copyright.
  const targets = [ctaSection, footer].filter(Boolean);
  const state = new Map(targets.map((el) => [el, false]));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => state.set(entry.target, entry.isIntersecting));
      const anyIntersecting = Array.from(state.values()).some(Boolean);
      sticky.classList.toggle('is-hidden', anyIntersecting);
    },
    { threshold: 0.15 }
  );
  targets.forEach((el) => observer.observe(el));
}

/* ============================================
   initReducedMotion
   ============================================ */
function initReducedMotion() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) return;

  ScrollTrigger.getAll().forEach((t) => t.kill());
  gsap.globalTimeline.clear();

  const preloader = document.getElementById('preloader');
  if (preloader) preloader.style.display = 'none';
  document.body.classList.remove('preloader-active');

  document.querySelectorAll('.timeline-point, .case-block, .credential-item').forEach((el) => {
    el.style.opacity = '1';
  });

  document.querySelectorAll('.case-progress, .timeline-line').forEach((el) => {
    el.style.transform = 'none';
    el.style.height = el.classList.contains('timeline-line') ? '100%' : '';
    el.style.scale = '1';
  });
}

/* ============================================
   initIphoneModal
   ============================================ */
function initIphoneModal() {
  const modal = document.getElementById('video-modal');
  const backdrop = document.getElementById('vmodal-backdrop');
  const closeBtn = document.getElementById('vmodal-close');
  const player = document.getElementById('vmodal-player');
  const source = document.getElementById('vmodal-source');
  const titleEl = document.getElementById('vmodal-title');
  const descEl = document.getElementById('vmodal-desc');

  if (!modal || !backdrop || !closeBtn || !player || !source || !titleEl || !descEl) return;

  const openModal = (videoSrc, title, desc) => {
    source.src = videoSrc;
    titleEl.textContent = title;
    descEl.textContent = desc;
    player.load();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => player.focus(), 100);
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    player.pause();
    document.body.style.overflow = '';
    window.setTimeout(() => {
      source.src = '';
      player.load();
    }, 400);
  };

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  const getFocusableInModal = () => [closeBtn, player].filter(Boolean);

  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      closeModal();
      return;
    }

    // Focus trap: impede que Tab saia do modal enquanto ele está aberto.
    if (event.key === 'Tab') {
      const focusable = getFocusableInModal();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const openFromButton = (btn) => {
    if (!btn) return;
    const videoSrc = btn.getAttribute('data-video');
    const title = btn.getAttribute('data-title') || '';
    const desc = btn.getAttribute('data-desc') || '';
    if (!videoSrc) return;
    openModal(videoSrc, title, desc);
  };

  document.querySelectorAll('.iphone-watch-btn').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      openFromButton(btn);
    });
  });

  document.querySelectorAll('.iphone-play-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (event) => {
      event.stopPropagation();
      const btn = overlay.closest('.iphone-card')?.querySelector('.iphone-watch-btn');
      openFromButton(btn);
    });
  });

  const stage = document.querySelector('.iphone-stage');
  if (!stage) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof ScrollTrigger === 'undefined') {
    stage.classList.add('animated');
    return;
  }

  ScrollTrigger.create({
    trigger: stage,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      stage.classList.add('animated');
    },
  });
}

/* ============================================
   initCasesCarousel
   Roleta 3D dos casos clínicos: os 5 cartões ficam sempre em coverflow,
   posicionados via custom properties (--tx/--rot/--sc/--op/--z). Em
   telas com mouse a roda do mouse gira a roleta (preventDefault trava o
   scroll da página enquanto o cursor está sobre ela); em qualquer
   tamanho de tela dá pra usar as setas, os dots, arrastar (swipe) ou
   tocar num cartão lateral para centralizá-lo. Espaçamento entre os
   cartões encolhe em telas estreitas via getSteps().
   ============================================ */
function initCasesCarousel() {
  const wrap = document.getElementById('cases-carousel');
  const stage = wrap?.querySelector('.iphone-stage');
  if (!wrap || !stage) return;

  const cards = Array.from(stage.querySelectorAll('.iphone-card'));
  const total = cards.length;
  if (total < 2) return;

  const prevBtn = wrap.querySelector('.iphone-carousel-prev');
  const nextBtn = wrap.querySelector('.iphone-carousel-next');
  const dotsWrap = document.getElementById('iphone-carousel-dots');
  const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll('.iphone-dot')) : [];

  const STEPS_DESKTOP = {
    0: { tx: 0, rot: 0, sc: 1, op: 1, z: 5 },
    1: { tx: 190, rot: 20, sc: 0.82, op: 0.62, z: 3 },
    2: { tx: 330, rot: 32, sc: 0.64, op: 0.28, z: 1 },
  };
  const FAR_DESKTOP = { tx: 420, rot: 36, sc: 0.5, op: 0, z: 0 };

  // Espaçamento maior que no desktop (proporcionalmente à largura do
  // cartão) para reduzir a sobreposição entre cartões vizinhos — em telas
  // de toque, um alvo de toque parcialmente coberto pelo cartão da frente
  // é fácil de errar.
  const STEPS_MOBILE = {
    0: { tx: 0, rot: 0, sc: 1, op: 1, z: 5 },
    1: { tx: 150, rot: 24, sc: 0.72, op: 0.55, z: 3 },
    2: { tx: 240, rot: 34, sc: 0.54, op: 0.24, z: 1 },
  };
  const FAR_MOBILE = { tx: 290, rot: 38, sc: 0.42, op: 0, z: 0 };

  const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');
  let current = Math.floor(total / 2);
  let wheelLock = false;
  let touchStartX = 0;

  const isMobile = () => window.innerWidth < 641;
  const getSteps = () => (isMobile() ? STEPS_MOBILE : STEPS_DESKTOP);
  const getFar = () => (isMobile() ? FAR_MOBILE : FAR_DESKTOP);

  const normalize = (index) => ((index % total) + total) % total;

  const updateDots = () => {
    dots.forEach((dot) => {
      const active = Number(dot.dataset.index) === current;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  };

  const applyPositions = () => {
    const steps = getSteps();
    const far = getFar();
    cards.forEach((card, i) => {
      let diff = i - current;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;

      const absDiff = Math.abs(diff);
      const dir = Math.sign(diff);
      const step = steps[absDiff] || far;

      card.style.setProperty('--tx', `${dir * step.tx}px`);
      card.style.setProperty('--rot', `${-dir * step.rot}deg`);
      card.style.setProperty('--sc', step.sc);
      card.style.setProperty('--op', step.op);
      card.style.setProperty('--z', step.z);
      card.style.setProperty('--pe', step.op > 0.02 ? 'auto' : 'none');
      card.style.setProperty('--cap-op', diff === 0 ? 1 : 0);
      card.style.setProperty('--cap-pe', diff === 0 ? 'auto' : 'none');
      card.classList.toggle('is-center', diff === 0);
    });
    updateDots();
  };

  const goTo = (index) => {
    current = normalize(index);
    applyPositions();
  };

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  dots.forEach((dot) => {
    dot.addEventListener('click', () => goTo(Number(dot.dataset.index)));
  });

  stage.addEventListener(
    'wheel',
    (event) => {
      if (!hoverMq.matches) return;
      if (Math.abs(event.deltaY) < 4 && Math.abs(event.deltaX) < 4) return;
      event.preventDefault();
      if (wheelLock) return;
      wheelLock = true;
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      goTo(current + (delta > 0 ? 1 : -1));
      window.setTimeout(() => {
        wheelLock = false;
      }, 550);
    },
    { passive: false }
  );

  stage.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(current + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(current - 1);
    }
  });

  stage.addEventListener(
    'touchstart',
    (event) => {
      touchStartX = event.changedTouches[0].screenX;
    },
    { passive: true }
  );
  stage.addEventListener(
    'touchend',
    (event) => {
      const diff = touchStartX - event.changedTouches[0].screenX;
      if (Math.abs(diff) < 40) return;
      goTo(current + (diff > 0 ? 1 : -1));
    },
    { passive: true }
  );

  cards.forEach((card, i) => {
    // Capture phase: a tap/click anywhere on a non-center card (including
    // its play button) re-centers it instead of opening the video straight
    // away. Runs before .iphone-watch-btn/.iphone-play-overlay's own
    // bubble-phase listeners, which is why it must stop propagation here.
    card.addEventListener(
      'click',
      (event) => {
        if (i === current) return;
        event.stopPropagation();
        event.preventDefault();
        goTo(i);
      },
      true
    );

    card.addEventListener('click', (event) => {
      if (i !== current) return;
      if (event.target.closest('.iphone-watch-btn') || event.target.closest('.iphone-play-overlay')) return;
      card.querySelector('.iphone-watch-btn')?.click();
    });
  });

  // iOS dispara 'resize' repetidamente durante o scroll (a barra de
  // endereço recolhe/expande), sem a largura mudar de fato — recalcular
  // a posição de 5 cartões a cada disparo é trabalho de graça. Só refaz
  // as posições quando o breakpoint mobile/desktop realmente muda.
  let resizeTimer;
  let wasMobile = isMobile();
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const nowMobile = isMobile();
      if (nowMobile === wasMobile) return;
      wasMobile = nowMobile;
      applyPositions();
    }, 150);
  });

  stage.classList.add('is-interactive');
  stage.tabIndex = 0;
  applyPositions();
}

/* ============================================
   initMagneticButtons
   ============================================ */
function initMagneticButtons() {
  if (window.matchMedia('(hover: none)').matches) return;

  const buttons = document.querySelectorAll('.btn, .btn-primary, .btn-secondary, .btn-nav-cta, .iphone-watch-btn');
  const RADIUS = 80;
  const STRENGTH = 0.3;

  buttons.forEach((btn) => {
    btn.addEventListener('mousemove', (event) => {
      const rect = btn.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      if (Math.hypot(dx, dy) < RADIUS) {
        gsap.to(btn, { x: dx * STRENGTH, y: dy * STRENGTH, duration: 0.3, ease: 'power2.out' });
      }
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    });
  });
}

/* ============================================
   initCustomCursor
   ============================================ */
function initCustomCursor() {
  if ('ontouchstart' in window) return;

  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  document.addEventListener('mousemove', (event) => {
    gsap.set(dot, { x: event.clientX, y: event.clientY, xPercent: -50, yPercent: -50 });
    gsap.to(ring, {
      x: event.clientX,
      y: event.clientY,
      xPercent: -50,
      yPercent: -50,
      duration: 0.12,
      ease: 'power2.out',
    });
  });

  document.querySelectorAll('a, button, .iphone-card, .video-case-card, .expertise-card').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      gsap.to(dot, { scale: 0, opacity: 0, duration: 0.2 });
      gsap.to(ring, { width: 52, height: 52, borderColor: 'rgba(161,136,127,0.9)', duration: 0.3 });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(dot, { scale: 1, opacity: 1, duration: 0.2 });
      gsap.to(ring, { width: 32, height: 32, borderColor: 'rgba(161,136,127,0.5)', duration: 0.3 });
    });
  });

  document.addEventListener('mousedown', () => {
    gsap.to(ring, { scale: 0.8, duration: 0.1 });
  });
  document.addEventListener('mouseup', () => {
    gsap.to(ring, { scale: 1, duration: 0.2 });
  });
}

/* ============================================
   initSmoothNavLinks
   ============================================ */
function initSmoothNavLinks() {
  const links = document.querySelectorAll('a[href^="#"]');
  if (!links.length) return;

  // html tem scroll-behavior:smooth no CSS (para navegação nativa sem JS).
  // Isso compete com o ScrollToPlugin do GSAP — o navegador tenta suavizar
  // a MESMA mudança de scrollTop que o GSAP já está animando, e o destino
  // final acaba errado. Como a partir daqui todo scroll por âncora passa
  // pelo GSAP, desliga-se o smooth nativo para não haver duas animações
  // de scroll disputando a mesma propriedade.
  document.documentElement.style.scrollBehavior = 'auto';

  const navbar = document.getElementById('navbar');
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const menuToggle = document.getElementById('menu-toggle');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasScrollTo = typeof ScrollToPlugin !== 'undefined';

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      const navHeight = navbar ? navbar.getBoundingClientRect().height : 80;
      const targetY = target.getBoundingClientRect().top + window.scrollY - navHeight;

      if (!reduced && hasScrollTo) {
        gsap.to(window, { scrollTo: { y: targetY }, duration: 1.2, ease: 'power3.inOut' });
      } else {
        window.scrollTo({ top: targetY, behavior: reduced ? 'auto' : 'smooth' });
      }

      if (drawer && link.closest('#mobile-drawer')) {
        gsap.to(drawer, {
          x: '100%',
          opacity: 0,
          duration: 0.4,
          ease: 'power3.in',
          onComplete: () => gsap.set(drawer, { clearProps: 'opacity' }),
        });
        overlay?.classList.remove('active');
        menuToggle?.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
      }
    });
  });
}

/* ============================================
   initCarouselArrowsAndSwipeHints
   Entrada suave das setas premium (depoimentos + casos), micro-feedback de
   clique e o hint de swipe que some após a primeira interação de cada
   carrossel.
   ============================================ */
function initCarouselArrowsAndSwipeHints() {
  const groups = [
    { wrap: '.carousel-wrap', btns: '.carousel-btn' },
    { wrap: '.iphone-carousel', btns: '.iphone-carousel-btn' },
  ];

  groups.forEach(({ wrap, btns }) => {
    const wrapEl = document.querySelector(wrap);
    if (!wrapEl) return;

    const prevBtn = wrapEl.querySelector('[class*="-prev"]');
    const nextBtn = wrapEl.querySelector('[class*="-next"]');
    const hint = wrapEl.querySelector('.swipe-hint');
    const buttons = wrapEl.querySelectorAll(btns);

    // yPercent:-50 replica o translateY(-50%) do CSS — uma vez que o GSAP
    // escreve no atributo transform inline, o valor de CSS deixa de ter
    // efeito, então precisa ser recriado aqui para os botões continuarem
    // centralizados verticalmente.
    gsap.set(buttons, { opacity: 0, yPercent: -50 });
    if (prevBtn) gsap.set(prevBtn, { x: -20 });
    if (nextBtn) gsap.set(nextBtn, { x: 20 });
    gsap.to(buttons, { opacity: 1, x: 0, duration: 0.6, delay: 1.2, ease: 'power2.out' });

    buttons.forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        gsap.to(btn, { scale: 1.08, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { scale: 1, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('click', () => {
        gsap.to(btn, {
          scale: 0.85,
          duration: 0.1,
          onComplete: () => gsap.to(btn, { scale: 1, duration: 0.2, ease: 'elastic.out(1, 0.5)' }),
        });
      });
    });

    if (hint) {
      gsap.set(hint, { opacity: 0 });
      gsap.to(hint, { opacity: 1, duration: 0.5, delay: 1.5 });

      let dismissed = false;
      const dismissHint = () => {
        if (dismissed) return;
        dismissed = true;
        gsap.to(hint, {
          opacity: 0,
          duration: 0.4,
          onComplete: () => {
            hint.style.display = 'none';
          },
        });
      };

      wrapEl.addEventListener('touchstart', dismissHint, { passive: true, once: true });
      buttons.forEach((btn) => btn.addEventListener('click', dismissHint, { once: true }));
    }
  });
}

/* ============================================
   initLazyImageScrollRefresh
   Imagens lazy carregando fora de ordem mudam a altura das seções depois
   que o ScrollTrigger já mediu o layout — sem recalcular, os gatilhos de
   scroll (parallax, entradas) disparam na posição errada.
   ============================================ */
function initLazyImageScrollRefresh() {
  if (typeof ScrollTrigger === 'undefined') return;

  // Debounced e adiado enquanto há um scroll animado em andamento (ex.: o
  // gsap.to(window,{scrollTo:...}) do clique num link do menu): chamar
  // ScrollTrigger.refresh() no meio dessa animação a interrompe (o
  // refresh mede/reseta a posição de scroll), fazendo o scroll suave
  // travar antes de chegar na seção — bug real encontrado ao testar.
  let refreshTimer;
  const scheduleRefresh = () => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      if (typeof gsap !== 'undefined' && gsap.isTweening(window)) {
        scheduleRefresh();
        return;
      }
      ScrollTrigger.refresh();
    }, 250);
  };

  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', scheduleRefresh);
  });
}

/* ============================================
   DOM Ready
   ============================================ */
/* Uma função de init que falhar (ex.: GSAP bloqueado por extensão/adblock,
   CDN indisponível numa rede móvel instável) não pode travar as próximas —
   sem isso, um único throw síncrono aqui dentro impede o resto do array de
   rodar, incluindo o preloader e as animações de entrada. */
function safeInit(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[init] ${name} falhou:`, err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  window.scrollTo(0, 0);

  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    window.scrollTo(0, 0);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  safeInit('initNavbar', initNavbar);
  safeInit('initCases', initCases);
  safeInit('initCarousel', initCarousel);
  safeInit('initAboutCarousel', initAboutCarousel);
  safeInit('initIphoneModal', initIphoneModal);
  safeInit('initCasesCarousel', initCasesCarousel);
  safeInit('initBookingForm', initBookingForm);
  safeInit('initStickyWhatsApp', initStickyWhatsApp);
  safeInit('initHeroFlip', initHeroFlip);
  safeInit('initMagneticButtons', initMagneticButtons);
  if (window.matchMedia('(hover: hover)').matches) {
    safeInit('initCustomCursor', initCustomCursor);
  }
  safeInit('initSmoothNavLinks', initSmoothNavLinks);
  safeInit('initCarouselArrowsAndSwipeHints', initCarouselArrowsAndSwipeHints);
  safeInit('initLazyImageScrollRefresh', initLazyImageScrollRefresh);

  if (reduced) {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'none';
    document.body.classList.remove('preloader-active');
    document.body.classList.add('page-revealed', 'page-ready');
    loadLogoSvg().then((svg) => {
      mountStaticLogo(svg, document.getElementById('nav-logo-slot'), NAV_LOGO_PX);
      mountStaticLogo(svg, document.getElementById('footer-logo-slot'), FOOTER_LOGO_PX);
    });
    safeInit('initReducedMotion', initReducedMotion);
    return;
  }

  try {
    await initPreloader();
  } catch (err) {
    console.error('[init] initPreloader falhou:', err);
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'none';
    document.body.classList.remove('preloader-active');
    document.body.classList.add('page-revealed', 'page-ready');
    safeInit('initHeroAnimations', initHeroAnimations);
  }
  window.scrollTo(0, 0);
  safeInit('initPageEffects', initPageEffects);
  safeInit('initReducedMotion', initReducedMotion);
});
