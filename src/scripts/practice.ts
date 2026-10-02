// Practice pages: one signature sequence in the hero, then the practice's
// cases, choreographed exactly as on the homepage.
import { ScrollTrigger, reduced, initSmooth } from './motion';
import { driver } from './driver';
import { counter } from './counter';
import { initCases } from './cases';
import { initMechanism } from './mechanisms';
import { bus } from './bus';

function initHero(): void {
  const section = document.getElementById('practice');
  const pin = section?.querySelector<HTMLElement>('.phero-pin');
  const slot = section?.querySelector<HTMLElement>('.phero-slot');
  if (!section || !pin || !slot) return;
  if (reduced) {
    bus.practice.p = 0.2;
    return;
  }
  const d = driver([{ host: section, pin }], slot, [0.95, -0.3]);
  d.progress((p) => {
    bus.practice.p = p;
    bus.invalidate();
  });
  const ctrEl = document.getElementById('practice-counter');
  const line = document.getElementById('practice-ba');
  if (ctrEl) {
    const c = counter(ctrEl);
    const before = Number(ctrEl.dataset.before);
    const after = c.value;
    c.show(before);
    line?.classList.add('is-off');
    d.beat(
      0.46,
      () => c.roll(after, { dir: 1, onSettle: () => c.value === after && line?.classList.remove('is-off') }),
      () => {
        line?.classList.add('is-off');
        c.roll(before, { dir: -1 });
      },
    );
  }
}

function boot(): void {
  initSmooth();
  initHero();
  document.querySelectorAll<HTMLElement>('[data-practice-block]').forEach((block) => initMechanism(block));
  initCases();
  document.documentElement.classList.add('run');
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  const start = () => import('../three/boot').then((m) => m.bootStage('practice')).catch((err) => {
    console.warn('3D stage unavailable; the page keeps its drawn stand-ins.', err);
    document.documentElement.classList.add('no-stage');
  });
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 });
  else setTimeout(start, 200);
}

boot();
