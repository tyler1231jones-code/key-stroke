// Practice pages. One signature sequence each, reusing the object library:
// the object sits in the page's slot and is driven by the pin's progress.
import * as THREE from 'three';
import { addRig, pixelCamera, centreOf, type SceneFactory } from '../stage';
import { makeEvidence, type ObjectName } from '../objects';
import { bus } from '../../scripts/bus';

const FILL: Record<string, { w: number; h: number }> = {
  drum: { w: 1, h: 0.9 },
  'key-field': { w: 1.04, h: 0.7 },
  'forms-stack': { w: 0.86, h: 0.74 },
  sheet: { w: 0.7, h: 0.86 },
  numpad: { w: 0.7, h: 0.86 },
  mouse: { w: 0.6, h: 0.86 },
};

export const practiceScene: SceneFactory = (ctx) => {
  const { t, env, el } = ctx;
  const name = (el.dataset.object ?? 'sheet') as ObjectName;
  const ev = makeEvidence(
    name,
    t,
    { before: Number(el.dataset.before ?? 0), after: Number(el.dataset.after ?? 0), sheet: 'letterhead' },
    ctx.phone,
  );
  const scene = new THREE.Scene();
  addRig(scene, env, ev.view);
  const camera = pixelCamera();
  const holder = new THREE.Group();
  holder.add(ev.root);
  scene.add(holder);
  const slot = el.querySelector<HTMLElement>('[data-slot]')!;
  const fill = FILL[name] ?? FILL.sheet;

  return {
    scene,
    camera,
    update(time) {
      const size = ctx.size();
      const r = ctx.rect(slot);
      const c = centreOf(r, size);
      const p = ctx.still ? (name === 'drum' ? 0.8 : 0.2) : bus.practice.p;
      const s = Math.min((r.w * fill.w) / ev.size.w, (r.h * fill.h) / ev.size.h);
      holder.scale.setScalar(s);
      holder.position.set(c.x, c.y, 0);
      ev.update(p, time);
    },
    dispose() {
      ev.dispose();
    },
  };
};
