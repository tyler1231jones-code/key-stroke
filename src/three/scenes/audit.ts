// The audit. A stack of the same printed form, edge on, forty deep. Scrolling
// removes sheets on their rails until one is left, and that one turns to face
// the visitor: forty forms, one report. The page's one set piece.
import * as THREE from 'three';
import { addRig, pixelCamera, centreOf, type SceneFactory } from '../stage';
import { makeStack, SHEET_W, SHEET_PITCH } from '../objects/forms';
import { bus, AUDIT } from '../../scripts/bus';

const span = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const COUNT = 40;
const DEPTH = 297; // A4, so the last sheet is a page when it turns

export const auditScene: SceneFactory = (ctx) => {
  const { t, env, el } = ctx;
  const scene = new THREE.Scene();
  addRig(scene, env, 'square');
  const camera = pixelCamera();
  const slot = el.querySelector<HTMLElement>('[data-slot]')!;

  const stack = makeStack(t, COUNT, DEPTH, 'form');
  const count = stack.count;
  stack.jitter[0].x = 0;
  stack.jitter[0].rot = 0;
  scene.add(stack.group);

  return {
    scene,
    camera,
    update() {
      const size = ctx.size();
      const r = ctx.rect(slot);
      const c = centreOf(r, size);
      const p = ctx.still ? 1 : bus.audit.p;
      const clear = span(p, AUDIT.clear[0], AUDIT.clear[1]);
      const turn = inOut(span(p, AUDIT.turn[0], AUDIT.turn[1]));

      // Edge on, the stack fills the slot's width; face on, the page fits inside it.
      const edgeOn = Math.min((0.8 * r.w) / SHEET_W, (0.86 * r.h) / (count * SHEET_PITCH));
      const faceOn = Math.min((0.9 * r.w) / SHEET_W, (0.92 * r.h) / DEPTH);
      const s = edgeOn + (faceOn - edgeOn) * turn;
      const baseY = c.y - (count * SHEET_PITCH * edgeOn) / 2;

      // Top sheet first, each along its own rail, out past the edge of the
      // frame and never across the copy on the left.
      const gone = clear * (count - 1 + 0.4);
      for (let i = 1; i < count; i++) {
        const fromTop = count - 1 - i;
        const out = span(gone, fromTop, fromTop + 1.4);
        stack.place(i, out * out, 1);
      }
      stack.place(0, 0);
      stack.commit();

      // The last sheet turns from edge on to face on about its long axis.
      stack.group.scale.setScalar(s);
      stack.group.rotation.x = turn * (Math.PI / 2);
      stack.group.position.set(c.x, baseY + (c.y - baseY) * turn, 0);
    },
    dispose() {
      stack.dispose();
    },
  };
};
