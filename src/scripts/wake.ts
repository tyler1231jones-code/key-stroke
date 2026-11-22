// The wake (src/wake/engine.ts) is its own chunk and is not fetched until a
// mouse first moves, so it costs a page nothing to load. It is for a mouse
// only: a touch screen has no pointer to follow, and with reduced motion, or
// on a client's working page (an onboarding form), there is no wake at all.
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const working = document.documentElement.dataset.page === 'onboard';

if (!reduced && mouse && !working) {
  const start = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    window.removeEventListener('pointermove', start);
    import('../wake/engine').then((m) => m.startWake(e)).catch(() => {});
  };
  window.addEventListener('pointermove', start, { passive: true });
}
