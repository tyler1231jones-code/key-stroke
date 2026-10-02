// The two of us. Two unworn keycaps side by side, K and T, exactly overhead.
// A still; each key is pressed once as the section arrives.
import * as THREE from 'three';
import { addRig, pixelCamera, centreOf, type SceneFactory } from '../stage';
import { makeKey, KEY_TRAVEL } from '../objects/keycap';
import { bus } from '../../scripts/bus';
import { site } from '../../lib/data';

export const usScene: SceneFactory = (ctx) => {
  const { t, env, el } = ctx;
  const scene = new THREE.Scene();
  addRig(scene, env, 'overhead');
  const camera = pixelCamera();
  const slot = el.querySelector<HTMLElement>('.us-slot')!;
  const keys = site.principals.map((name) => makeKey(t, name[0].toUpperCase(), { detail: 10, size: 512 }));
  const group = new THREE.Group();
  keys.forEach((k, i) => {
    k.mesh.position.x = i - (keys.length - 1) / 2;
    group.add(k.mesh);
  });
  scene.add(group);

  return {
    scene,
    camera,
    update() {
      const size = ctx.size();
      const r = ctx.rect(slot);
      const c = centreOf(r, size);
      const pitch = Math.min(r.w / (keys.length + 0.4), r.h / 1.25, 260);
      group.scale.setScalar(pitch);
      group.position.set(c.x, c.y, 0);
      keys.forEach((k, i) => {
        k.mesh.position.z = -(bus.us.press[i] ?? 0) * KEY_TRAVEL;
      });
    },
    dispose() {
      keys.forEach((k) => k.dispose());
    },
  };
};
