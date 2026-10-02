// Homepage choreography. HTML first: every section is already in its resting
// state. This script sets the starting states, wires scroll to them, and then
// loads the 3D stage as its own chunk so first paint never waits for it.
import { gsap, ScrollTrigger, reduced, initSmooth, onPass, stepper, span, easeInOut, ROLL, STROKE, HOLD } from './motion';
import { driver } from './driver';
import { counter } from './counter';
import { initCases } from './cases';
import { initFilters } from './filters';
import { refreshFigures } from './live';
import { initMechanism } from './mechanisms';
import { layeredParallax } from './parallax';
import { bus, HERO, AUDIT } from './bus';

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

/* ---------- 1. Hero ---------- */
function initHero(figures: { today: number; weekAgo: number } | null): void {
  const section = $('#hero');
  const pin = $('.hero-pin');
  const track = $('.hero-track');
  const stage = $('.hero-stage');
  const strip = $('.hero-strip');
  if (!section || !pin || !track || !stage || !strip) return;
  if (reduced) {
    bus.hero.p = 1;
    return;
  }
  const d = driver([{ host: section, pin }, { host: track, pin: stage }], stage);
  const ctrEl = $('#home-counter');
  const delta = $('#home-delta');
  const c = ctrEl ? counter(ctrEl) : null;
  const rolls = Boolean(c && figures && figures.today !== figures.weekAgo);
  if (c && figures && rolls) c.show(figures.weekAgo);

  d.progress((p) => {
    bus.hero.p = p;
    bus.invalidate();
    // The counter strip indexes in on its rail.
    const s = easeInOut(span(p, HERO.strip[0], HERO.strip[1]));
    strip.style.transform = s >= 1 ? '' : `translate3d(0, ${(1 - s) * 120}%, 0)`;
    strip.style.visibility = s <= 0 ? 'hidden' : 'visible';
  });

  // The key presses by itself.
  const standIn = $('.hero-slot .stand-in');
  d.beat(
    HERO.press,
    () => {
      gsap.timeline({ onUpdate: bus.invalidate })
        .to(bus.hero, { press: 1, duration: 0.09, ease: 'none' })
        .to(bus.hero, { press: 0, duration: 0.12, ease: 'none' });
      if (standIn) gsap.fromTo(standIn, { y: 0 }, { y: 4, duration: 0.09, ease: 'none', yoyo: true, repeat: 1 });
    },
    () => {},
  );

  // Last week's total rolls to today's. The delta stamps once, holds, and is gone.
  let stamp: gsap.core.Tween | null = null;
  d.beat(
    HERO.roll,
    () => {
      if (!c || !figures || !rolls) return;
      c.roll(figures.today, { dir: 1 });
      if (delta) {
        delta.hidden = false;
        stamp?.kill();
        stamp = gsap.delayedCall(HOLD + ROLL, () => (delta.hidden = true));
      }
    },
    () => {
      if (!c || !figures || !rolls) return;
      stamp?.kill();
      if (delta) delta.hidden = true;
      c.roll(figures.weekAgo, { dir: -1 });
    },
  );
}

/* ---------- 2. The count ---------- */
function initCount(): void {
  const section = $('#count');
  const pin = $('.count-pin');
  const slot = $('.count-slot');
  if (!section || !pin || !slot) return;
  if (reduced) {
    bus.count.p = 0.5;
    return;
  }
  const d = driver([{ host: section, pin }], slot, [1, -0.6]);
  d.progress((p) => {
    bus.count.p = p;
    bus.invalidate();
  });
  const items = $$('.count-item', section);
  items.forEach((item, i) => {
    const el = $('.ctr', item);
    if (!el) return;
    const c = counter(el);
    const value = c.value;
    c.show(null);
    const enter = () => c.roll(value, { dir: 1, spin: 2 });
    const back = () => c.roll(null, { dir: -1 });
    if (d.pinned()) d.beat(0.1 + i * 0.17, enter, back);
    else onPass(item, '84%', enter, back);
  });
}

/* ---------- 4. The audit ---------- */
function initAudit(): void {
  const section = $('#audit');
  const pin = $('.audit-pin');
  const doc = $('.audit-doc');
  const report = $('#shift-report');
  if (!section || !pin || !doc || !report) return;
  if (reduced) {
    bus.audit.p = 1;
    return;
  }
  const sheets = $('#audit-sheets');
  const sheetEl = $('#sheet-counter');
  const sheetCtr = sheetEl ? counter(sheetEl) : null;
  const fields = $$('.audit-field', section);
  const next = $$('.audit-next, .audit-copy .key-wrap, .audit-copy > .key', section);
  const d = driver([{ host: section, pin }], doc, [0.92, 0.08]);

  report.style.clipPath = 'inset(0 0 100% 0)';
  // Only the pinned layout holds the fields back. In flow they sit above the
  // document and are read before the stack arrives.
  const staged = d.pinned();
  if (staged) {
    fields.forEach((f) => f.classList.add('is-off'));
    next.forEach((n) => n.classList.add('is-off'));
  }
  sheets?.classList.add('is-on');
  sheetCtr?.show(40);

  let left = 40;
  d.progress((p) => {
    bus.audit.p = p;
    bus.invalidate();
    const n = 40 - Math.round(span(p, AUDIT.clear[0], AUDIT.clear[1]) * 39);
    if (n !== left) {
      sheetCtr?.roll(n, { dir: n < left ? 1 : -1, stagger: 0 });
      left = n;
    }
  });

  // The last sheet becomes the shift report: it prints, line by line.
  const print = gsap.to(report, { clipPath: 'inset(0 0 0% 0)', duration: 0.66, ease: 'steps(11)', paused: true });
  d.beat(AUDIT.print, () => { print.play(); sheets?.classList.remove('is-on'); }, () => { print.reverse(); sheets?.classList.add('is-on'); });
  const index = stepper(fields.length, STROKE * 2, (n) => fields.forEach((f, i) => f.classList.toggle('is-off', i >= n)));
  if (staged) {
    d.beat(AUDIT.fields, () => index.play(), () => index.reverse());
    d.beat(AUDIT.next, () => next.forEach((n) => n.classList.remove('is-off')), () => next.forEach((n) => n.classList.add('is-off')));
  }
}

/* ---------- 5. Practices ---------- */
function initPractices(): void {
  if (reduced) return;
  $$('[data-practice-block]').forEach((block) => initMechanism(block));
}

/* ---------- 6. The crew ---------- */
function initCrew(): void {
  const section = $('#crew');
  if (!section || reduced) return;
  // Punched tape advances across each plate as the visitor scrolls.
  const runs = $$('.tape-run', section).map((run) => ({ run, w: parseFloat(getComputedStyle(run).getPropertyValue('--tape-w')) || 228 }));
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => runs.forEach(({ run, w }) => (run.style.transform = `translate3d(${-self.progress * w * 2}px, 0, 0)`)),
  });
  $$('.crew-card', section).forEach((card, i) => {
    const el = $('.ctr', card);
    if (!el) return;
    const c = counter(el);
    const value = c.value;
    c.show(null);
    onPass(card, '82%', () => gsap.delayedCall(i * STROKE * 2, () => c.roll(value, { dir: 1, spin: 1 })), () => c.roll(null, { dir: -1 }));
  });
}

/* ---------- 7. Keystroke Savers ---------- */
function initSavers(): void {
  if (reduced) return;
  $$('.savers-table tbody tr').forEach((row) => {
    const strokes = $$('.tm-stroke', row);
    strokes.forEach((s) => s.classList.add('is-off'));
    const draw = stepper(strokes.length, STROKE, (n) => strokes.forEach((s, i) => s.classList.toggle('is-off', i >= n)));
    onPass(row, '84%', () => draw.play(), () => draw.reverse());
  });
}

/* ---------- 8. The two of us ---------- */
function initUs(): void {
  const slot = $('.us-slot');
  if (!slot || reduced) return;
  const keys = $$('.stand-in', slot);
  const tap = (i: number) => {
    const o = { v: 0 };
    gsap.timeline({ onUpdate: () => { bus.us.press[i] = o.v; bus.invalidate(); } })
      .to(o, { v: 1, duration: 0.09, ease: 'none' })
      .to(o, { v: 0, duration: 0.12, ease: 'none' });
    if (keys[i]) gsap.fromTo(keys[i], { y: 0 }, { y: 4, duration: 0.09, ease: 'none', yoyo: true, repeat: 1 });
  };
  onPass(slot, '62%', () => { tap(0); gsap.delayedCall(0.26, () => tap(1)); }, () => {});
}

/* ---------- Boot ---------- */
function boot(): void {
  const figures = refreshFigures();
  initSmooth();
  initHero(figures);
  initCount();
  initCases();
  initFilters();
  $$('[data-parallax]').forEach((scene) => layeredParallax(scene));
  initAudit();
  initPractices();
  initCrew();
  initSavers();
  initUs();
  document.documentElement.classList.add('run');

  // Fonts change section heights; refresh once they are in.
  document.fonts.ready.then(() => ScrollTrigger.refresh());

  // The 3D stage is its own chunk and loads after first paint.
  const start = () => import('../three/boot').then((m) => m.bootStage('home')).catch((err) => {
    console.warn('3D stage unavailable; the page keeps its drawn stand-ins.', err);
    document.documentElement.classList.add('no-stage');
  });
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 });
  else setTimeout(start, 200);
}

boot();
