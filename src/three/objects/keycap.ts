// The keycap. One unit is one key pitch (19.05mm). Geometry is lofted from
// rounded rectangles: a tapered body, a small fillet, and a face dished
// across its width, so a flat light still finds a gradient on it.
// Shell in base-900 (the ground), face in readout, sides in rule.
import * as THREE from 'three';
import type { Tokens } from '../tokens';
import { keyFace, type FaceTextures, type WearSpec } from '../textures';

export interface KeyShape {
  w?: number;
  d?: number;
  h?: number;
  /** Points per corner arc and rings across the face. */
  detail?: number;
}

export const KEY_HEIGHT = 0.42;
export const KEY_TRAVEL = 0.17;

function ring(hx: number, hy: number, r: number, seg: number, cy: number): [number, number][] {
  const pts: [number, number][] = [];
  const corners: [number, number, number][] = [
    [hx - r, -hy + r, -Math.PI / 2],
    [hx - r, hy - r, 0],
    [-hx + r, hy - r, Math.PI / 2],
    [-hx + r, -hy + r, Math.PI],
  ];
  for (const [cx, cyy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cyy + cy + Math.sin(a) * r]);
    }
  }
  return pts;
}

export function keycapGeometry({ w = 1, d = 1, h = KEY_HEIGHT, detail = 6 }: KeyShape = {}): THREE.BufferGeometry {
  const seg = detail;
  const rings = Math.max(4, detail);
  const hx0 = (w - 0.06) / 2;
  const hy0 = (d - 0.06) / 2;
  const hxT = hx0 - 0.15;
  const hyT = hy0 - 0.13;
  const shift = 0.025; // the face sits a little toward the back of the key
  const dish = 0.035;
  const n = 4 * (seg + 1);

  const pos: number[] = [];
  const uv: number[] = [];
  const push = (x: number, y: number, z: number) => {
    pos.push(x, y, z);
    uv.push((x + hxT) / (2 * hxT), (y - shift + hyT) / (2 * hyT));
  };
  // Body: base, then just under the shoulder, then the face outline.
  for (const [x, y] of ring(hx0, hy0, 0.06, seg, 0)) push(x, y, 0);
  for (const [x, y] of ring(hxT + 0.03, hyT + 0.028, 0.09, seg, shift * 0.86)) push(x, y, h * 0.86);
  const outline = ring(hxT, hyT, 0.08, seg, shift);
  const faceZ = (x: number) => h - dish * (1 - Math.min(1, (x / hxT) ** 2));
  for (const [x, y] of outline) push(x, y, faceZ(x));
  // Face: the outline drawn inward ring by ring, then a centre point.
  for (let k = 1; k < rings; k++) {
    const s = 1 - k / rings;
    for (const [x, y] of outline) push(x * s, shift + (y - shift) * s, faceZ(x * s));
  }
  push(0, shift, faceZ(0));

  const index: number[] = [];
  const quad = (a: number, b: number) => {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      index.push(a + i, a + j, b + j, a + i, b + j, b + i);
    }
  };
  quad(0, n);
  quad(n, 2 * n);
  const sideCount = index.length;
  for (let k = 0; k < rings - 1; k++) quad((2 + k) * n, (3 + k) * n);
  const last = (1 + rings) * n;
  const centre = last + n;
  for (let i = 0; i < n; i++) index.push(last + i, last + ((i + 1) % n), centre);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.addGroup(0, sideCount, 0);
  g.addGroup(sideCount, index.length - sideCount, 1);
  g.computeVertexNormals();
  // The face is a dish curved across its width only, so its normals are known
  // exactly. Setting them removes the faceting the ring triangulation leaves.
  const normal = g.getAttribute('normal');
  for (let i = 3 * n; i < pos.length / 3; i++) {
    const x = pos[i * 3];
    const slope = (2 * dish * x) / (hxT * hxT);
    const len = Math.hypot(slope, 1);
    normal.setXYZ(i, -slope / len, 0, 1 / len);
  }
  return g;
}

export interface KeyMaterials {
  side: THREE.MeshStandardMaterial;
  top: THREE.MeshStandardMaterial;
  dispose(): void;
}

export function keyMaterials(t: Tokens, face?: FaceTextures, polish = 0): KeyMaterials {
  const side = new THREE.MeshStandardMaterial({ color: t.rule, roughness: 0.74, metalness: 0 });
  const top = new THREE.MeshStandardMaterial({
    color: face ? 0xffffff : t.readout,
    map: face?.map ?? null,
    roughnessMap: face?.roughnessMap ?? null,
    roughness: face?.roughnessMap ? 1 : 0.8 - polish * 0.58,
    metalness: 0,
  });
  return {
    side,
    top,
    dispose() {
      side.dispose();
      top.dispose();
      face?.map.dispose();
      face?.roughnessMap?.dispose();
    },
  };
}

export interface Key {
  mesh: THREE.Mesh;
  dispose(): void;
}

/** Where a fingertip has worn the K: the foot of its leg, and a chip at the head of the stem. */
export const WORN_K: WearSpec = { at: [0.69, 0.7], radius: 0.24, seed: 11, chip: [0.36, 0.35, 0.065] };

/** A single keycap with a legend. The hero key is a worn K. */
export function makeKey(t: Tokens, legend: string, opts: { wear?: WearSpec; detail?: number; size?: number } = {}): Key {
  const geometry = keycapGeometry({ detail: opts.detail ?? 12 });
  const mats = keyMaterials(t, keyFace(t, legend, opts.size ?? 1024, opts.wear));
  const mesh = new THREE.Mesh(geometry, [mats.side, mats.top]);
  return {
    mesh,
    dispose() {
      geometry.dispose();
      mats.dispose();
    },
  };
}

export interface Field {
  mesh: THREE.InstancedMesh;
  /** Write one key: position in key units, press depth 0..1, and how far it has dropped out, 0..1. */
  set(i: number, x: number, y: number, press: number, drop: number): void;
  commit(): void;
  dispose(): void;
}

/** The same key, unworn and blank, instanced into a field. */
export function makeField(t: Tokens, count: number, detail = 5): Field {
  const geometry = keycapGeometry({ detail });
  const mats = keyMaterials(t);
  const mesh = new THREE.InstancedMesh(geometry, [mats.side, mats.top], count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const m = new THREE.Matrix4();
  const colour = new THREE.Color();
  for (let i = 0; i < count; i++) mesh.setColorAt(i, colour.setScalar(1));
  mesh.instanceColor!.setUsage(THREE.DynamicDrawUsage);
  return {
    mesh,
    set(i, x, y, press, drop) {
      // A key that has dropped out is lower, smaller and dark against the ground.
      const s = drop >= 1 ? 0 : 1 - drop * 0.35;
      m.makeScale(s, s, s);
      m.setPosition(x, y, -press * KEY_TRAVEL - drop * 2.4);
      mesh.setMatrixAt(i, m);
      // A pressed key sits in the shade of its neighbours.
      const shade = (1 - press * 0.34) * (1 - drop) * (1 - drop);
      mesh.setColorAt(i, colour.setScalar(shade));
    },
    commit() {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor!.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      mats.dispose();
      mesh.dispose();
    },
  };
}
