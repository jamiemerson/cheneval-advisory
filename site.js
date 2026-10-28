// Progressive enhancement only. The page is complete without this file.
//   - mobile navigation, active nav state, FAQ open/close animation
//   - fade-up reveals, once per element
//   - the header goes navy glass while it sits over a dark section
//   - [data-tilt] cards lean toward the cursor with a soft sheen
//   - Lenis smooth scrolling on fine-pointer devices
import Lenis from 'lenis';

const html = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Mobile navigation ---------- */
const toggle = document.getElementById('navToggle');
const nav = document.getElementById('primaryNav');
if (toggle && nav) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.setAttribute('data-open', String(open));
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

/* ---------- Active nav state ---------- */
const navLinks = [...document.querySelectorAll('.nav__link[href^="#"]')];
if (navLinks.length && 'IntersectionObserver' in window) {
  const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const targets = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const link = byId.get(entry.target.id);
      if (!link) continue;
      navLinks.forEach((a) => a.classList.remove('is-active'));
      link.classList.add('is-active');
    }
  }, { rootMargin: '-35% 0px -60% 0px', threshold: 0 });
  targets.forEach((t) => io.observe(t));
}

/* ---------- Fade-up reveal ---------- */
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-visible');
      else io.observe(el);
    });
  }
}

/* ---------- FAQ: native details, smooth open and close ---------- */
document.querySelectorAll('details.faq-item').forEach((details) => {
  const summary = details.querySelector('summary');
  const panel = details.querySelector('.faq-item__answer');
  if (!summary || !panel) return;
  let animating = false;
  summary.addEventListener('click', (e) => {
    if (reduceMotion || animating || typeof panel.animate !== 'function') return;
    e.preventDefault();
    animating = true;
    const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
    if (details.open) {
      const h = panel.offsetHeight;
      panel.style.overflow = 'hidden';
      const anim = panel.animate([{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 240, easing: ease });
      anim.onfinish = () => { details.open = false; panel.style.overflow = ''; animating = false; };
    } else {
      details.open = true;
      const h = panel.offsetHeight;
      panel.style.overflow = 'hidden';
      const anim = panel.animate([{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 320, easing: ease });
      anim.onfinish = () => { panel.style.overflow = ''; animating = false; };
    }
  });
});

/* ---------- Header: navy glass while over a dark section ---------- */
const header = document.getElementById('siteHeader');
if (header) {
  const luminance = (css) => {
    const m = css.match(/[\d.]+/g);
    if (!m) return null;
    const [r, g, b, a] = m.map(Number);
    if (a === 0) return null;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };
  let raf = 0;
  const check = () => {
    raf = 0;
    const y = header.getBoundingClientRect().bottom + 2;
    const hits = document.elementsFromPoint(innerWidth / 2, y).filter((e) => !header.contains(e));
    let dark = false;
    for (const el of hits) {
      const l = luminance(getComputedStyle(el).backgroundColor);
      if (l === null) continue;
      dark = l < 0.35;
      break;
    }
    header.classList.toggle('is-dark', dark);
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(check); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  check();
  setTimeout(check, 300);
}

/* ---------- Tilt toward the cursor ---------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    const max = Number(el.dataset.tilt) || 6;
    const face = el.querySelector('.build-card__frame') || el;
    let raf = 0, rx = 0, ry = 0, tx = 0, ty = 0;
    const step = () => {
      raf = 0;
      rx += (tx - rx) * 0.14;
      ry += (ty - ry) * 0.14;
      face.style.transform = `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
      if (Math.abs(tx - rx) > 0.02 || Math.abs(ty - ry) > 0.02) raf = requestAnimationFrame(step);
      else if (tx === 0 && ty === 0) face.style.transform = '';
    };
    const loop = () => { if (!raf) raf = requestAnimationFrame(step); };
    el.addEventListener('pointermove', (e) => {
      const r = face.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      tx = (0.5 - py) * max * 2;
      ty = (px - 0.5) * max * 2;
      face.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      face.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      el.classList.add('is-tilting');
      loop();
    });
    el.addEventListener('pointerleave', () => {
      tx = 0; ty = 0;
      el.classList.remove('is-tilting');
      loop();
    });
  });
}

/* ---------- Smooth scrolling ---------- */
if (finePointer && !reduceMotion) {
  try {
    const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -88 } });
    html.classList.add('lenis-on');
    window.__lenis = lenis;
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  } catch (err) {
    console.warn('Lenis unavailable', err);
  }
}

document.getElementById('year').textContent = new Date().getFullYear();
