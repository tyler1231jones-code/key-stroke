// The wake (src/wake/engine.ts) belongs to the homepage hero and runs nowhere
// else. It is its own chunk, fetched once the page has loaded and gone quiet
// (or at the first mouse movement, if that comes sooner), so it costs the
// page nothing to load and is ready when the hero greets. It is for a mouse
// only: a touch screen has no pointer to follow, and with reduced motion
// there is no wake at all.
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const home = document.documentElement.dataset.page === 'home';

if (!reduced && mouse && home && document.getElementById('hero')) {
  let started = false;
  const start = (first?: PointerEvent) => {
    if (started) return;
    started = true;
    window.removeEventListener('pointermove', onMove);
    import('../wake/engine').then((m) => m.startWake(first)).catch(() => {});
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') start(e);
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  const quiet = () => ('requestIdleCallback' in window ? requestIdleCallback(() => start(), { timeout: 1500 }) : setTimeout(() => start(), 300));
  if (document.readyState === 'complete') quiet();
  else window.addEventListener('load', quiet, { once: true });
}
