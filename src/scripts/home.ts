// The homepage. HTML first: every section is already in its resting state.
// This script wires the hero to scroll, lets the sections below it arrive as
// they are reached, and then loads the 3D stage as its own chunk.
import { gsap, ScrollTrigger, reduced, initSmooth, span, easeInOut, ROLL, HOLD } from './motion';
import { driver } from './driver';
import { counter } from './counter';
import { refreshFigures } from './live';
import { initSite } from './site';
import { loadStage } from './stage';
import { bus, HERO } from './bus';

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);

/* ---------- Hero ---------- */
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

/* ---------- Boot ---------- */
function boot(): void {
  const figures = refreshFigures();
  initSmooth();
  initHero(figures);
  initSite();
  document.documentElement.classList.add('run');

  // Fonts change section heights; refresh once they are in.
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  loadStage();
}

boot();
