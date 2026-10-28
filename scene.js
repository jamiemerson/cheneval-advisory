// Three.js scenes. Progressive: the page is complete without this file.
//   1. Hero + Approach: a pinned stage where the laptop opens as you scroll and its screen walks
//      through the three phases while the copy fades in beside it.
//   2. Contact: the laptop returns and its screen mirrors the form as you type.
// Model and hinge mechanics adapted from pmndrs/examples "floating-laptop" (MIT, Paul Henschel).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const NAVY = '#0E2240', NAVY_DEEP = '#091A33', GOLD = '#C5A572', OFFWHITE = '#F5F2EC', MIST = '#8E97A8';
const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const isDesktop = () => matchMedia('(min-width: 768px)').matches;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ramp = (v, [a, b]) => clamp01((v - a) / (b - a));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const { lerp, damp } = THREE.MathUtils;
const status = (k, v) => { html.dataset[k] = v; };

/* ---------- Shared model ---------- */
let modelPromise = null;
function loadModel() {
  if (!modelPromise) {
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/libs/draco/gltf/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    modelPromise = loader.loadAsync('lab/mac-draco.glb');
  }
  return modelPromise;
}

function makeRenderer(host, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', ...opts });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  return renderer;
}

function fitRenderer(renderer, camera, host) {
  const w = host.clientWidth || 1, h = host.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// A soft pool of light under the laptop: a radial gradient on a plane, lying flat.
function makeGlow(color, size, opacity) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/* ---------- Screen painters (1024 x 640) ---------- */
const HEAD = '"Cormorant Garamond", Georgia, serif';
const BODY = '"Lato", Helvetica, Arial, sans-serif';

function paintBase(ctx) {
  const { width: W, height: H } = ctx.canvas;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, W * 0.9);
  g.addColorStop(0, 'rgba(197,165,114,0.22)');
  g.addColorStop(1, 'rgba(197,165,114,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
function paintMark(ctx, size, x, y, alpha = 0.9) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = GOLD;
  ctx.font = `600 ${size}px ${HEAD}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'right';
  ctx.fillText('C', x, y);
  ctx.restore();
}
function paintEyebrow(ctx, text, x, y) {
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y + 10, 36, 1.5);
  ctx.fillStyle = MIST;
  ctx.font = `700 20px ${BODY}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.letterSpacing = '0.22em';
  ctx.fillText(text.toUpperCase(), x + 52, y);
  ctx.letterSpacing = '0px';
}

function paintCover(ctx) {
  const { width: W, height: H } = ctx.canvas;
  paintBase(ctx);
  ctx.fillStyle = GOLD;
  ctx.font = `600 150px ${HEAD}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Cheneval', W / 2, H * 0.52);
  ctx.fillRect(W / 2 - 110, H * 0.6, 220, 2);
  ctx.fillStyle = OFFWHITE;
  ctx.font = `700 26px ${BODY}`;
  ctx.letterSpacing = '0.4em';
  ctx.textBaseline = 'top';
  ctx.fillText('ADVISORY', W / 2 + 6, H * 0.64);
  ctx.letterSpacing = '0px';
}

function paintStep(ctx, { num, title, eyebrow }) {
  const { width: W, height: H } = ctx.canvas;
  paintBase(ctx);
  const pad = W * 0.08;
  paintEyebrow(ctx, eyebrow, pad, pad);
  ctx.fillStyle = GOLD;
  ctx.font = `400 ${Math.round(H * 0.44)}px ${HEAD}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(num, pad - 8, H * 0.66);
  ctx.fillStyle = OFFWHITE;
  ctx.font = `400 ${Math.round(H * 0.17)}px ${HEAD}`;
  ctx.fillText(title, pad, H * 0.88);
  paintMark(ctx, H * 0.2, W - pad, H - pad * 0.6, 0.7);
}

// The Build frame: a workflow running on its own. Lines land one after another, then loop.
const LOG = [
  ['Receipt received', 'inbox'],
  ['Supplier matched', 'Xero'],
  ['Bill coded and filed', 'Xero'],
  ['Approval requested', 'Teams'],
  ['Approved', 'Jami'],
  ['Stock levels updated', 'Shopify'],
  ['Weekly summary drafted', 'Claude'],
];
function paintLog(ctx, { eyebrow, shown, caret }) {
  const { width: W, height: H } = ctx.canvas;
  paintBase(ctx);
  const pad = W * 0.08;
  paintEyebrow(ctx, eyebrow, pad, pad);
  ctx.fillStyle = OFFWHITE;
  ctx.font = `400 64px ${HEAD}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Build', pad, pad + 100);
  ctx.fillStyle = GOLD;
  ctx.font = `400 64px ${HEAD}`;
  ctx.fillText('02', pad + 150, pad + 100);
  ctx.fillStyle = 'rgba(245,242,236,0.14)';
  ctx.fillRect(pad, pad + 128, W - pad * 2, 1);

  const lh = 52;
  let y = pad + 160;
  const count = Math.min(LOG.length, shown);
  for (let i = 0; i < count; i++) {
    const [text, via] = LOG[i];
    const last = i === count - 1;
    ctx.globalAlpha = last ? 1 : 0.62;
    ctx.fillStyle = GOLD;
    ctx.fillRect(pad, y + 12, 8, 8);
    ctx.fillStyle = OFFWHITE;
    ctx.font = `400 28px ${BODY}`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(text, pad + 28, y);
    ctx.fillStyle = MIST;
    ctx.font = `400 22px ${BODY}`;
    ctx.textAlign = 'right';
    ctx.fillText(via, W - pad, y + 4);
    y += lh;
  }
  ctx.globalAlpha = 1;
  if (caret && count < LOG.length) {
    ctx.fillStyle = GOLD;
    ctx.fillRect(pad + 28, y + 4, 3, 30);
  }
  paintMark(ctx, H * 0.2, W - pad, H - pad * 0.6, 0.5);
}

/* ---------- Laptop ---------- */
class Laptop {
  constructor(gltf) {
    const node = (name) => {
      const n = gltf.scene.getObjectByName(name);
      if (!n) throw new Error(`model node missing: ${name}`);
      return n;
    };
    const mesh = (name, material) => new THREE.Mesh(node(name).geometry, material || node(name).material);

    this.group = new THREE.Group();
    this.lid = new THREE.Group();
    this.lid.position.set(0, -0.04, 0.41);
    const inner = new THREE.Group();
    inner.position.set(0, 2.96, -0.13);
    inner.rotation.set(Math.PI / 2, 0, 0);
    this.screenMat = node('Cube008_2').material.clone();
    inner.add(mesh('Cube008'), mesh('Cube008_1'), mesh('Cube008_2', this.screenMat));
    this.lid.add(inner);

    const keyboard = mesh('keyboard');
    keyboard.position.set(1.79, 0, 3.45);
    const base = new THREE.Group();
    base.position.set(0, -0.1, 3.39);
    base.add(mesh('Cube002'), mesh('Cube002_1'));
    const touchbar = mesh('touchbar');
    touchbar.position.set(0, -0.03, 1.2);
    this.group.add(this.lid, keyboard, base, touchbar);

    // Painted screen: a 2D canvas as an emissive texture, so it shows true colours.
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 640;
    this.ctx = canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.flipY = false;
    this.tex.anisotropy = 8;
    const m = this.screenMat;
    m.map = null;
    m.color = new THREE.Color('#000000');
    m.emissiveMap = this.tex;
    m.emissive = new THREE.Color('#ffffff');
    m.emissiveIntensity = 1;
    m.roughness = 1;
    m.metalness = 0;
    m.envMapIntensity = 0;
    m.needsUpdate = true;

    this.painter = null;
    this.paintKey = null;
    this.y = 0;
    document.fonts?.ready.then(() => this.repaint());
  }
  paint(painter, key) {
    if (key !== undefined && key === this.paintKey && painter === this.painter) return;
    this.painter = painter;
    this.paintKey = key;
    this.repaint();
  }
  repaint() {
    if (!this.painter) return;
    this.painter(this.ctx);
    this.tex.needsUpdate = true;
  }
  // open: 0 closed .. 1 open. Drifts in the air once open, settles flat when closed.
  update(t, open, { restY, floatY, bob = 0.3 }) {
    this.lid.rotation.x = lerp(1.575, -0.425, open);
    const g = this.group;
    const drift = reduced ? 0 : open;
    const k = 0.08;
    g.rotation.x = lerp(g.rotation.x, (Math.cos(t / 10) / 10 + 0.25) * drift, k);
    g.rotation.y = lerp(g.rotation.y, (Math.sin(t / 10) / 4) * drift, k);
    g.rotation.z = lerp(g.rotation.z, (Math.sin(t / 10) / 10) * drift, k);
    const y = lerp(restY, floatY + (reduced ? 0 : Math.sin(t) * bob), open);
    g.position.y = lerp(g.position.y, y, k);
  }
}

function addLights(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;
  const key = new THREE.PointLight(OFFWHITE, 900, 80, 2);
  key.position.set(10, 12, 10);
  const rim = new THREE.PointLight(GOLD, 1400, 70, 2);
  rim.position.set(-12, -2, -16);
  scene.add(key, rim);
  return { key, rim };
}

/* ============================================================
   1. Hero + Approach scene
   ============================================================ */
const T = {
  hero: [0.08, 0.17],          // hero copy fades out
  lid: [0.05, 0.34],           // lid opens
  beats: [
    [0.21, 0.40],              // approach intro
    [0.40, 0.59],              // Diagnose
    [0.59, 0.78],              // Build
    [0.78, 1.00],              // Embed, holds
  ],
};
function beatVisibility(v, i) {
  const [a, b] = T.beats[i];
  const w = b - a;
  const rise = ramp(v, [a, a + w * 0.28]);
  const fall = i === T.beats.length - 1 ? 1 : 1 - ramp(v, [b - w * 0.18, b]);
  return Math.min(rise, fall);
}
function frameFor(v) {
  for (let i = T.beats.length - 1; i >= 1; i--) if (v >= T.beats[i][0] + 0.015) return i; // 1..3
  return 0;
}

function heroScene(section) {
  const host = section.querySelector('[data-sc="canvas"]');
  const hero = section.querySelector('[data-sc="hero"]');
  const cue = section.querySelector('[data-sc="cue"]');
  const beats = [...section.querySelectorAll('[data-sc="beat"]')];

  // Choreography first: the copy moves even before the model arrives.
  section.classList.add('is-live');
  let target = 0, p = 0;
  const measure = () => {
    const r = section.getBoundingClientRect();
    const total = r.height - innerHeight;
    target = total > 0 ? clamp01(-r.top / total) : 0;
  };
  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; measure(); }); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  measure();
  p = target;

  const applyDom = (v) => {
    const out = ramp(v, T.hero);
    hero.style.opacity = String(1 - out);
    hero.style.transform = `translate3d(0, ${-out * 36}px, 0)`;
    hero.style.pointerEvents = out > 0.5 ? 'none' : '';
    if (cue) cue.style.opacity = String(1 - ramp(v, [0, 0.06]));
    beats.forEach((b, i) => {
      const vis = beatVisibility(v, i);
      b.style.opacity = String(vis);
      b.style.transform = `translate3d(0, ${(1 - vis) * 28}px, 0)`;
      b.style.pointerEvents = vis > 0.6 ? 'auto' : 'none';
    });
  };
  applyDom(p);

  // Three
  let renderer, scene, camera, laptop, glow;
  const clock = new THREE.Clock();
  let logShown = 1, logTick = 0, logCaret = true;
  const eyebrow = 'Our Approach';
  const painters = [
    (ctx) => paintCover(ctx),
    (ctx) => paintStep(ctx, { num: '01', title: 'Diagnose', eyebrow: `${eyebrow} · 01 of 03` }),
    (ctx) => paintLog(ctx, { eyebrow: `${eyebrow} · 02 of 03`, shown: logShown, caret: logCaret }),
    (ctx) => paintStep(ctx, { num: '03', title: 'Embed', eyebrow: `${eyebrow} · 03 of 03` }),
  ];

  const layout = () => {
    const d = isDesktop();
    camera.fov = d ? 38 : 56;
    camera.updateProjectionMatrix();
    // The laptop lives inside a pivot turned 180 degrees, so +x here lands on the right of the
    // screen, clear of the copy column. The glow is in world space, so it takes the opposite sign.
    laptop.group.position.x = d ? 4.8 : 0;
    glow.position.set(d ? -4.8 : 0, d ? -4.6 : 2.4, 0);
    return d;
  };

  const tick = () => {
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    p = reduced ? target : damp(p, target, 7, dt);
    applyDom(p);
    if (!renderer) return;
    const d = isDesktop();
    const open = easeInOut(ramp(p, T.lid));
    const frame = frameFor(p);
    if (frame === 2) {
      logTick += dt;
      if (logTick > 0.75) { logTick = 0; logShown = logShown >= LOG.length ? 1 : logShown + 1; logCaret = !logCaret; }
      laptop.paint(painters[2], `log-${logShown}-${logCaret}`);
    } else {
      laptop.paint(painters[frame], frame);
    }
    laptop.update(t, open, d ? { restY: -4.3, floatY: -0.7, bob: 0.33 } : { restY: 3.2, floatY: 3.0, bob: 0.2 });
    glow.material.opacity = 0.18 + open * 0.3;
    renderer.render(scene, camera);
  };
  tick();

  loadModel().then((gltf) => {
    renderer = makeRenderer(host);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
    camera.position.set(0, 0, -30);
    camera.lookAt(0, 0, 0);
    addLights(scene, renderer);
    laptop = new Laptop(gltf);
    const pivot = new THREE.Group();
    pivot.rotation.y = Math.PI;
    pivot.add(laptop.group);
    glow = makeGlow('rgba(197,165,114,0.9)', 26, 0.2);
    scene.add(pivot, glow);
    laptop.paint(painters[0], 0);
    fitRenderer(renderer, camera, host);
    layout();
    new ResizeObserver(() => { fitRenderer(renderer, camera, host); layout(); }).observe(host);
    host.dataset.ready = 'true';
    status('scene', 'ready');
  }).catch((err) => {
    console.warn('Hero scene unavailable', err);
    status('scene', 'error: ' + (err && err.message));
  });
}

/* ============================================================
   3. Contact laptop: mirrors the form
   ============================================================ */
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(-maxLines);
}

function contactScene(host, form, section) {
  const fields = { name: '', organisation: '', message: '' };
  let caret = true, tick = 0;
  const read = () => {
    const v = (n) => (form.querySelector(`[name="${n}"]`)?.value ?? '').trim();
    fields.name = v('name'); fields.organisation = v('organisation'); fields.message = v('message');
    tick++;
  };
  form.addEventListener('input', read);
  read();
  let blink = 0;
  form.addEventListener('focusin', () => {
    clearInterval(blink);
    blink = setInterval(() => { caret = !caret; tick++; }, 560);
  });
  form.addEventListener('focusout', () => { clearInterval(blink); blink = 0; caret = true; tick++; });

  const painter = (ctx) => {
    const { width: W, height: H } = ctx.canvas;
    paintBase(ctx);
    const pad = W * 0.08;
    paintEyebrow(ctx, 'New message', pad, pad);
    const who = [fields.name, fields.organisation].filter(Boolean).join(' · ');
    ctx.fillStyle = GOLD;
    ctx.font = `400 48px ${HEAD}`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(who || 'From', pad, pad + 64);
    ctx.fillStyle = OFFWHITE;
    ctx.font = `400 40px ${HEAD}`;
    const lines = fields.message ? wrapText(ctx, fields.message, W - pad * 2, 7) : [];
    const lh = 52;
    const y = pad + 148;
    if (!lines.length) {
      ctx.fillStyle = MIST;
      ctx.globalAlpha = 0.7;
      ctx.fillText('Tell us about the process that should run itself.', pad, y);
      ctx.globalAlpha = 1;
    }
    lines.forEach((l, i) => ctx.fillText(l, pad, y + i * lh));
    if (caret) {
      const last = lines[lines.length - 1] ?? '';
      const cx = pad + (last ? ctx.measureText(last).width + 8 : 0);
      const cy = y + Math.max(0, lines.length - 1) * lh;
      ctx.fillStyle = GOLD;
      ctx.fillRect(cx, cy + 4, 3, 42);
    }
    paintMark(ctx, H * 0.2, W - pad, H - pad * 0.6, 0.6);
  };

  let openTarget = 0, openCur = 0;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { openTarget = e.isIntersecting ? 1 : 0; }, { threshold: 0.3 }).observe(section);
  } else openTarget = 1;

  loadModel().then((gltf) => {
    const renderer = makeRenderer(host);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
    camera.position.set(0, 1.5, -26);
    camera.lookAt(0, 0.6, 0);
    addLights(scene, renderer);
    const laptop = new Laptop(gltf);
    const pivot = new THREE.Group();
    pivot.rotation.y = Math.PI + 0.18;
    pivot.add(laptop.group);
    const glow = makeGlow('rgba(197,165,114,0.9)', 22, 0.35);
    glow.position.y = -2.9;
    scene.add(pivot, glow);
    const layout = () => {
      fitRenderer(renderer, camera, host);
      camera.fov = isDesktop() ? 30 : 34;
      camera.updateProjectionMatrix();
    };
    layout();
    new ResizeObserver(layout).observe(host);
    const clock = new THREE.Clock();
    const loop = () => {
      requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      openCur = reduced ? openTarget : damp(openCur, openTarget, 2.2, dt);
      const open = easeInOut(openCur);
      laptop.paint(painter, tick);
      laptop.update(clock.elapsedTime, open, { restY: -2.6, floatY: -1.9, bob: 0.12 });
      renderer.render(scene, camera);
    };
    loop();
    host.dataset.ready = 'true';
    status('contact', 'ready');
  }).catch((err) => {
    console.warn('Contact scene unavailable', err);
    status('contact', 'error: ' + (err && err.message));
  });
}

/* ---------- Boot ---------- */
function near(el, margin, cb) {
  if (!('IntersectionObserver' in window)) { cb(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); cb(); }
  }, { rootMargin: `${margin}px 0px` });
  io.observe(el);
}

try {
  const hero = document.getElementById('top');
  if (hero) heroScene(hero);
  const contactHost = document.getElementById('contactLaptop');
  const form = document.getElementById('contactForm');
  const contact = document.getElementById('contact');
  if (contactHost && form && contact) near(contact, 900, () => contactScene(contactHost, form, contact));
} catch (err) {
  console.warn('Scenes unavailable', err);
  status('scene', 'error: ' + (err && err.message));
}
