// A mouse seen from exactly overhead, with the finish gone off the left
// button and nowhere else. The body is a superellipse dome; the seams, wheel
// and wear are a texture projected from above. Half-length is one unit.
import * as THREE from 'three';
import type { Tokens } from '../tokens';
import { mouseTop } from '../textures';

export const MOUSE_SIZE = { w: 1.24, h: 2 };

export interface Mouse {
  mesh: THREE.Mesh;
  dispose(): void;
}

export function makeMouse(t: Tokens): Mouse {
  const A = 0.62; // half width
  const B = 1; // half length
  const E = 2.7; // superellipse exponent: squarer than an ellipse
  const rings = 28;
  const segs = 96;
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const index: number[] = [];
  const sgnPow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);
  for (let k = 0; k <= rings; k++) {
    const rho = k / rings;
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const x = A * rho * sgnPow(Math.cos(a), 2 / E);
      const yRaw = B * rho * sgnPow(Math.sin(a), 2 / E);
      // The front (toward +y) is a touch narrower than the back.
      const taper = 1 - 0.1 * Math.max(0, yRaw / B);
      // The hump sits behind centre; the nose slopes down.
      const hump = 0.46 * (1 - 0.35 * (yRaw / B));
      const z = hump * Math.pow(Math.max(0, 1 - Math.pow(rho, 2.4)), 0.62);
      pos.push(x * taper, yRaw, z);
      uv.push(x / (2 * A) + 0.5, yRaw / (2 * B) + 0.5);
      // Face in readout, falling to rule on the sides.
      const side = Math.min(1, Math.max(0, (rho - 0.78) / 0.2));
      const c = t.readout.clone().lerp(t.rule, side);
      col.push(c.r / t.readout.r, c.g / t.readout.g, c.b / t.readout.b);
    }
  }
  const row = segs + 1;
  for (let k = 0; k < rings; k++) {
    for (let j = 0; j < segs; j++) {
      const a = k * row + j;
      const b = (k + 1) * row + j;
      index.push(a, b, b + 1, a, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const tex = mouseTop(t);
  const material = new THREE.MeshStandardMaterial({ map: tex.map, roughnessMap: tex.roughnessMap, roughness: 1, metalness: 0, vertexColors: true });
  const mesh = new THREE.Mesh(geometry, material);
  return {
    mesh,
    dispose() {
      geometry.dispose();
      material.dispose();
      tex.map.dispose();
      tex.roughnessMap.dispose();
    },
  };
}
