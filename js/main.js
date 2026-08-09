if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
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
  initAbout();
  initCards();
  initMedia();
  initCTA();
  initCredentials();
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

  const openDrawer = () => {
    if (!drawer) return;
    gsap.to(drawer, { x: 0, duration: 0.4, ease: 'power3.out' });
    overlay?.classList.add('active');
    menuToggle?.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
  };

  const closeDrawer = () => {
    if (!drawer) return;
    gsap.to(drawer, { x: '100%', duration: 0.4, ease: 'power3.in' });
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

  gsap.set(drawer, { x: '100%' });
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
}

/* ============================================
   initAbout
   ============================================ */
function initAbout() {
  const parallaxGroup = document.getElementById('about-parallax-group');
  const timelineLine = document.getElementById('timeline-line');
  const timelinePoints = document.querySelectorAll('.timeline-point');

  if (parallaxGroup) {
    gsap.fromTo(
      parallaxGroup,
      { y: -36 },
      {
        y: 48,
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

  gsap.from(cards, {
    scrollTrigger: {
      trigger: '#cards-grid',
      start: 'top 75%',
      toggleActions: 'play none none none',
      once: true,
    },
    opacity: 0,
    y: 50,
    stagger: 0.15,
    duration: 0.8,
    ease: 'power3.out',
    // clearProps evita que o transform inline do GSAP fique "preso" no
    // elemento e bloqueie o transform do :hover definido em CSS.
    clearProps: 'transform',
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
  const DEST_EMAIL = 'SEU-EMAIL-AQUI@dominio.com';

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
  if (!sticky || !ctaSection || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      sticky.classList.toggle('is-hidden', entry.isIntersecting);
    },
    { threshold: 0.15 }
  );
  observer.observe(ctaSection);
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
   Roleta 3D dos casos clínicos: em telas com mouse (hover fino,
   >= 901px) os 5 cartões viram um coverflow posicionado via
   custom properties (--tx/--rot/--sc/--op/--z), navegável pela
   roda do mouse, setas e dots. Em mobile/touch os cartões seguem
   em lista vertical simples (sem transform), sem roleta.
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

  const STEPS = {
    0: { tx: 0, rot: 0, sc: 1, op: 1, z: 5 },
    1: { tx: 190, rot: 20, sc: 0.82, op: 0.62, z: 3 },
    2: { tx: 330, rot: 32, sc: 0.64, op: 0.28, z: 1 },
  };
  const FAR = { tx: 420, rot: 36, sc: 0.5, op: 0, z: 0 };

  const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)');
  let current = Math.floor(total / 2);
  let wheelLock = false;

  const normalize = (index) => ((index % total) + total) % total;

  const updateDots = () => {
    dots.forEach((dot) => {
      const active = Number(dot.dataset.index) === current;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  };

  const applyPositions = () => {
    cards.forEach((card, i) => {
      let diff = i - current;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;

      const absDiff = Math.abs(diff);
      const dir = Math.sign(diff);
      const step = STEPS[absDiff] || FAR;

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

  const clearInline = () => {
    cards.forEach((card) => {
      ['--tx', '--rot', '--sc', '--op', '--z', '--pe', '--cap-op', '--cap-pe'].forEach((prop) =>
        card.style.removeProperty(prop)
      );
      card.classList.remove('is-center');
    });
  };

  const sync = () => {
    if (mq.matches) {
      stage.classList.add('is-interactive');
      stage.tabIndex = 0;
      applyPositions();
    } else {
      stage.classList.remove('is-interactive');
      stage.removeAttribute('tabindex');
      clearInline();
    }
    if (prevBtn) prevBtn.style.display = mq.matches ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = mq.matches ? 'inline-flex' : 'none';
    if (dotsWrap) dotsWrap.style.display = mq.matches ? 'flex' : 'none';
  };

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  dots.forEach((dot) => {
    dot.addEventListener('click', () => goTo(Number(dot.dataset.index)));
  });

  stage.addEventListener(
    'wheel',
    (event) => {
      if (!mq.matches) return;
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
    if (!mq.matches) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(current + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(current - 1);
    }
  });

  cards.forEach((card, i) => {
    // Capture phase: on desktop, a click anywhere on a non-center card
    // (including its play button) re-centers it instead of opening the
    // video straight away. Runs before .iphone-watch-btn/.iphone-play-overlay's
    // own bubble-phase listeners, which is why it must stop propagation here.
    card.addEventListener(
      'click',
      (event) => {
        if (!mq.matches || i === current) return;
        event.stopPropagation();
        event.preventDefault();
        goTo(i);
      },
      true
    );

    card.addEventListener('click', (event) => {
      if (mq.matches && i !== current) return;
      if (event.target.closest('.iphone-watch-btn') || event.target.closest('.iphone-play-overlay')) return;
      card.querySelector('.iphone-watch-btn')?.click();
    });
  });

  mq.addEventListener('change', sync);
  sync();
}

/* ============================================
   DOM Ready
   ============================================ */
document.addEventListener('DOMContentLoaded', async () => {
  window.scrollTo(0, 0);

  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    window.scrollTo(0, 0);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initNavbar();
  initCases();
  initCarousel();
  initAboutCarousel();
  initIphoneModal();
  initCasesCarousel();
  initBookingForm();
  initStickyWhatsApp();

  if (reduced) {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'none';
    document.body.classList.remove('preloader-active');
    document.body.classList.add('page-revealed', 'page-ready');
    loadLogoSvg().then((svg) => {
      mountStaticLogo(svg, document.getElementById('nav-logo-slot'), NAV_LOGO_PX);
      mountStaticLogo(svg, document.getElementById('footer-logo-slot'), FOOTER_LOGO_PX);
    });
    initReducedMotion();
    return;
  }

  await initPreloader();
  window.scrollTo(0, 0);
  initPageEffects();
  initReducedMotion();
});
