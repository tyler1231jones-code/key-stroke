// The 3D stage is its own chunk and starts after first paint, so the page
// never waits for it. If it cannot start, the page keeps its drawn stand-ins.
//
// On a desktop it starts at once: the download begins with the page's own
// script, and nothing waits for the browser to go idle. On a phone, where
// starting it competes with the page for one slow processor, it waits for the
// first sign of use (a touch, a scroll, a key) or for 3.5 seconds after load,
// whichever comes first. Until then the hero shows its drawn key, which is in
// the same place.
export function loadStage(): void {
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    import('../three/boot')
      .then((m) => m.bootStage())
      .catch((err) => {
        console.warn('3D stage unavailable; the page keeps its drawn stand-ins.', err);
        document.documentElement.classList.add('no-stage');
      });
  };
  const idle = (run: () => void, timeout: number) => ('requestIdleCallback' in window ? requestIdleCallback(run, { timeout }) : setTimeout(run, 200));

  const light = window.matchMedia('(max-width: 899px), (pointer: coarse)').matches;
  // ?debug starts at once, so the audit tools measure the stage itself.
  if (!light || new URLSearchParams(location.search).has('debug')) {
    start();
    return;
  }
  const signs = ['scroll', 'touchstart', 'pointerdown', 'keydown', 'wheel'] as const;
  let timer = 0;
  const go = () => {
    signs.forEach((name) => window.removeEventListener(name, go));
    window.clearTimeout(timer);
    idle(start, 300);
  };
  signs.forEach((name) => window.addEventListener(name, go, { passive: true }));
  const arm = () => (timer = window.setTimeout(go, 3500));
  if (document.readyState === 'complete') arm();
  else window.addEventListener('load', arm, { once: true });
}
