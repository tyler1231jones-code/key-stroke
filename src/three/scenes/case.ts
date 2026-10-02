// A case. One evidence object from the library, in the scene behind the
// artefact panel. It travels a little slower than the page, so it slides
// under the panel as the case passes: depth from two flat planes.
import * as THREE from 'three';
import { addRig, pixelCamera, centreOf, type SceneFactory } from '../stage';
import { makeEvidence, type ObjectName } from '../objects';
import { bus } from '../../scripts/bus';

/** How much of the slot each object fills, and where it sits in it. */
const FIT: Record<string, { w: number; h: number; dx: number; dy: number }> = {
  drum: { w: 0.98, h: 0.82, dx: 0.06, dy: 0 },
  'key-field': { w: 1.02, h: 0.92, dx: 0.06, dy: -0.02 },
  numpad: { w: 0.62, h: 1.32, dx: 0.12, dy: -0.2 },
  'forms-stack': { w: 0.86, h: 0.8, dx: 0.04, dy: 0 },
  mouse: { w: 0.5, h: 1.3, dx: 0.14, dy: -0.18 },
  sheet: { w: 0.62, h: 1.5, dx: 0.1, dy: -0.34 },
};

export const caseScene: SceneFactory = (ctx) => {
  const { t, env, el } = ctx;
  const id = el.dataset.case ?? '';
  const name = (el.dataset.object ?? 'sheet') as ObjectName;
  const ev = makeEvidence(
    name,
    t,
    { id, before: Number(el.dataset.before), after: Number(el.dataset.after), sheet: el.dataset.practice === 'face' && id === '010' ? 'letterhead' : 'tender' },
    ctx.phone,
  );
  const scene = new THREE.Scene();
  addRig(scene, env, ev.view);
  const camera = pixelCamera();
  const holder = new THREE.Group();
  holder.add(ev.root);
  scene.add(holder);
  const slot = el.querySelector<HTMLElement>('.case-slot')!;
  const fit = FIT[name] ?? FIT.sheet;
  const rest = name === 'drum' ? 0.8 : 0.2;

  return {
    scene,
    camera,
    update(time) {
      const size = ctx.size();
      const r = ctx.rect(slot);
      const c = centreOf(r, size);
      // At rest the object is the evidence as found; the drums alone show the figure that remains.
      const p = ctx.still ? rest : (bus.cases[id] ?? rest);
      // A still is drawn inside its slot, so the whole object has to fit there.
      const s = Math.min((r.w * Math.min(fit.w, ctx.still ? 0.94 : 9)) / ev.size.w, (r.h * Math.min(fit.h, ctx.still ? 0.94 : 9)) / ev.size.h);
      holder.scale.setScalar(s);
      // Slower than the page: as the case scrolls up, the object falls behind.
      const lag = ctx.still ? 0 : (p - 0.5) * size.h * 0.2;
      holder.position.set(c.x + (ctx.still || ctx.phone ? 0 : r.w * fit.dx), c.y + (ctx.still ? 0 : r.h * fit.dy) - lag, 0);
      ev.update(p, time);
    },
    dispose() {
      ev.dispose();
    },
  };
};
