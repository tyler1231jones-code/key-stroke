// Still mode. With reduced motion, or on a device that cannot hold frame
// rate, the fixed canvas is not used. Each scene is built once, drawn in its
// resting state at the size of its slot, copied to a small 2D canvas that
// lives in the page, and disposed. One still frame per section, scrolling
// with the document like any other image.
import * as THREE from 'three';
import { makeRenderer, makeEnvironment, fitPixelCamera, applyClip, type SceneFactory, type SceneContext } from './stage';
import { tokens } from './tokens';

export interface StillDef {
  el: HTMLElement;
  factory: SceneFactory;
  /** Scenes whose resting state is entirely HTML have no still. */
  still?: boolean;
}

export function bootStill(defs: StillDef[], phone: boolean): boolean {
  const off = document.createElement('canvas');
  const renderer = makeRenderer(off);
  if (!renderer) return false;
  const env = makeEnvironment(renderer);
  const t = tokens();
  const drawn = new Set<StillDef>();

  function draw(def: StillDef): void {
    const slot = def.el.querySelector<HTMLElement>('[data-slot]');
    if (!slot) return;
    const box = slot.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
    renderer!.setPixelRatio(dpr);
    renderer!.setSize(box.width, box.height, false);
    const ctx: SceneContext = {
      renderer: renderer!,
      el: def.el,
      t,
      env,
      size: () => ({ w: box.width, h: box.height }),
      rect: (el) => {
        const r = el.getBoundingClientRect();
        const o = slot.getBoundingClientRect();
        return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
      },
      phone,
      still: true,
    };
    const live = def.factory(ctx);
    const cam = live.camera as THREE.OrthographicCamera;
    if (cam.isOrthographicCamera) fitPixelCamera(cam, box.width, box.height);
    live.resize?.(box.width, box.height);
    live.update(0);
    renderer!.setScissorTest(false);
    renderer!.clear();
    applyClip(renderer!, live.clip ?? null, box.height);
    renderer!.render(live.scene, live.camera);
    renderer!.setScissorTest(false);

    let target = slot.querySelector<HTMLCanvasElement>('canvas.still-canvas');
    if (!target) {
      target = document.createElement('canvas');
      target.className = 'still-canvas';
      target.setAttribute('aria-hidden', 'true');
      slot.appendChild(target);
    }
    target.width = off.width;
    target.height = off.height;
    target.getContext('2d')!.drawImage(off, 0, 0);
    live.dispose();
    slot.classList.add('slot-live');
    drawn.add(def);
  }

  // Draw each still when its section is near, so a long page costs little at load.
  const near = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        if (!record.isIntersecting) continue;
        const def = defs.find((d) => d.el === record.target);
        if (def && !drawn.has(def)) draw(def);
      }
    },
    { rootMargin: '100% 0px' },
  );
  defs.filter((d) => d.still !== false).forEach((d) => near.observe(d.el));

  let timer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => drawn.forEach((def) => draw(def)), 200);
  });
  return true;
}
