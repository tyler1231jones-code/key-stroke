// The audit page and the service pages: a hero that carries the page's one
// 3D object, driven by scroll, and then plain sections. On a wide, tall
// window the hero pins for a short stretch; otherwise the object plays as the
// hero scrolls away.
import { ScrollTrigger, reduced, initSmooth } from './motion';
import { driver } from './driver';
import { initSite } from './site';
import { loadStage } from './stage';
import { bus } from './bus';

function initHero(): void {
  const section = document.querySelector<HTMLElement>('.phero');
  const pin = section?.querySelector<HTMLElement>('.phero-pin');
  const slot = section?.querySelector<HTMLElement>('.phero-slot');
  if (!section || !pin || !slot || reduced) return;
  const target = section.dataset.scene === 'audit' ? bus.audit : bus.service;
  const d = driver([{ host: section, pin }], slot, [0.9, 0.12]);
  d.progress((p) => {
    target.p = p;
    bus.invalidate();
  });
}

initSmooth();
initHero();
initSite();
document.documentElement.classList.add('run');
document.fonts.ready.then(() => ScrollTrigger.refresh());
loadStage();
