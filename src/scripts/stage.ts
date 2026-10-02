// The 3D stage is its own chunk and loads after first paint, so the page
// never waits for it. If it cannot start, the page keeps its drawn stand-ins.
export function loadStage(): void {
  const start = () =>
    import('../three/boot')
      .then((m) => m.bootStage())
      .catch((err) => {
        console.warn('3D stage unavailable; the page keeps its drawn stand-ins.', err);
        document.documentElement.classList.add('no-stage');
      });
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 });
  else setTimeout(start, 200);
}
