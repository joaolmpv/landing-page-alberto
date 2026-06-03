gsap.registerPlugin(ScrollTrigger);

/* ============================================
   initPreloader
   ============================================ */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const logoPaths = preloader?.querySelectorAll('.logo-stroke');
  const logoWrap = preloader?.querySelector('.preloader-logo-wrap');
  const navLogo = document.querySelector('.navbar-logo');

  if (!preloader || !logoPaths?.length) {
    initHeroAnimations();
    return;
  }

  document.body.classList.add('preloader-active');

  logoPaths.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
  });

  const getNavOffset = () => {
    if (!navLogo || !logoWrap) return { x: 0, y: 0 };
    const nr = navLogo.getBoundingClientRect();
    const wr = logoWrap.getBoundingClientRect();
    const scaledW = wr.width * 0.15;
    const scaledH = wr.height * 0.15;
    return {
      x: nr.left + nr.width / 2 - (wr.left + wr.width / 2),
      y: nr.top + nr.height / 2 - (wr.top + wr.height / 2),
    };
  };

  const tl = gsap.timeline({
    onComplete: () => {
      preloader.style.display = 'none';
      document.body.classList.remove('preloader-active');
      gsap.set(logoWrap, { clearProps: 'transform' });
      initHeroAnimations();
    },
  });

  tl.to(logoPaths, {
    strokeDashoffset: 0,
    duration: 1.8,
    ease: 'power2.inOut',
    stagger: 0.12,
  });

  tl.to(
    logoWrap,
    {
      scale: 0.15,
      x: () => getNavOffset().x,
      y: () => getNavOffset().y,
      duration: 0.8,
      ease: 'power2.inOut',
    },
    '+=0.1'
  );

  tl.to(
    preloader,
    {
      scaleY: 0,
      transformOrigin: 'top center',
      duration: 1,
      ease: 'power4.inOut',
    },
    '-=0.4'
  );
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
  if (photo) {
    gsap.from(photo, {
      opacity: 0,
      scale: 0.9,
      duration: 1,
      delay: 0.5,
      ease: 'power3.out',
    });
  }
  if (badges[0]) {
    gsap.from(badges[0], { opacity: 0, x: 30, duration: 0.7, delay: 1.2 });
  }
  if (badges[1]) {
    gsap.from(badges[1], { opacity: 0, x: -30, duration: 0.7, delay: 1.4 });
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
  const parallaxEl = document.querySelector('#about-parallax-wrap .about-img-placeholder, #about-parallax-wrap .about-img');
  const timelineLine = document.getElementById('timeline-line');
  const timelinePoints = document.querySelectorAll('.timeline-point');

  if (parallaxEl) {
    gsap.to(parallaxEl, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: '#about-parallax-wrap',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
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
      },
    });
  });
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
    },
    opacity: 0,
    y: 50,
    stagger: 0.15,
    duration: 0.8,
    ease: 'power3.out',
  });
}

/* ============================================
   initCases
   ============================================ */
function initCases() {
  document.querySelectorAll('.clinical-case').forEach((caseEl) => {
    const progressLines = caseEl.querySelectorAll('.case-progress');
    const blocks = caseEl.querySelectorAll('.case-block');

    ScrollTrigger.create({
      trigger: caseEl,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        const lineTl = gsap.timeline();
        progressLines.forEach((line, i) => {
          lineTl.to(
            line,
            {
              scaleX: 1,
              duration: 0.9,
              ease: 'power2.inOut',
            },
            i * 0.2
          );
        });

        gsap.from(blocks, {
          opacity: 0,
          y: 20,
          stagger: 0.25,
          duration: 0.6,
          delay: 0.3,
        });
      },
    });
  });

  document.querySelectorAll('.case-accordion-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const parent = toggle.closest('.clinical-case');
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      parent?.classList.toggle('is-open', !expanded);
    });
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
    },
    opacity: 0,
    y: 40,
    stagger: 0.1,
    duration: 0.8,
    ease: 'power2.out',
  });
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
   DOM Ready
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'none';
    document.body.classList.remove('preloader-active');
    initNavbar();
    initCases();
    initCarousel();
    initReducedMotion();
    return;
  }

  initPreloader();
  initNavbar();
  initAbout();
  initCards();
  initCases();
  initCarousel();
  initCTA();
  initCredentials();
  initReducedMotion();
});
