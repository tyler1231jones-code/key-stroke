// The wake (src/wake/engine.ts): the keyboard the pointer lights. In the
// homepage hero it is at full strength, behind the headline; everywhere else
// it is a faint trail over the page. It is its own chunk. On the homepage it
// is fetched once the page has loaded and gone quiet (or at the first mouse
// movement, if that comes sooner), so it is ready when the hero greets; on any
// other page it is not fetched until a mouse first moves. Either way it costs
// the page nothing to load.
//
// It is for a mouse only: a touch screen has no pointer to follow. With
// reduced motion there is no wake at all, nor on a client's working page (an
// onboarding form), nor on a light page, where added light would not show.
const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const off = root.dataset.page === 'onboard' || root.dataset.theme === 'light';

if (!reduced && mouse && !off) {
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
  if (root.dataset.page === 'home' && document.getElementById('hero')) {
    const quiet = () => ('requestIdleCallback' in window ? requestIdleCallback(() => start(), { timeout: 1500 }) : setTimeout(() => start(), 300));
    if (document.readyState === 'complete') quiet();
    else window.addEventListener('load', quiet, { once: true });
  }
}
