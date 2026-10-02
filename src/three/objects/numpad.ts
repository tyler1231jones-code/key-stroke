// A numeric keypad seen from exactly overhead: the 4, 5 and 6 polished by
// use and the rest matte. One unit is one key pitch. Four columns, five rows.
import * as THREE from 'three';
import type { Tokens } from '../tokens';
import { keyFace } from '../textures';
import { keycapGeometry, keyMaterials, KEY_TRAVEL } from './keycap';

interface PadKey {
  legend: string;
  col: number;
  row: number;
  w?: number;
  d?: number;
}

const KEYS: PadKey[] = [
  { legend: 'Num', col: 0, row: 0 }, { legend: '/', col: 1, row: 0 }, { legend: '*', col: 2, row: 0 }, { legend: '-', col: 3, row: 0 },
  { legend: '7', col: 0, row: 1 }, { legend: '8', col: 1, row: 1 }, { legend: '9', col: 2, row: 1 }, { legend: '+', col: 3, row: 1, d: 2 },
  { legend: '4', col: 0, row: 2 }, { legend: '5', col: 1, row: 2 }, { legend: '6', col: 2, row: 2 },
  { legend: '1', col: 0, row: 3 }, { legend: '2', col: 1, row: 3 }, { legend: '3', col: 2, row: 3 }, { legend: 'Ent', col: 3, row: 3, d: 2 },
  { legend: '0', col: 0, row: 4, w: 2 }, { legend: '.', col: 2, row: 4 },
];

const POLISHED: Record<string, { at: [number, number]; seed: number }> = {
  '4': { at: [0.55, 0.56], seed: 4 },
  '5': { at: [0.48, 0.52], seed: 5 },
  '6': { at: [0.43, 0.58], seed: 6 },
};

export const NUMPAD_SIZE = { w: 4, h: 5 };

export interface Numpad {
  group: THREE.Group;
  /** Press the 4, 5 or 6 (index 0..2) by `depth`, 0..1. */
  press(i: number, depth: number): void;
  dispose(): void;
}

export function makeNumpad(t: Tokens): Numpad {
  const group = new THREE.Group();
  const disposers: (() => void)[] = [];
  const geos = new Map<string, THREE.BufferGeometry>();
  const worn: THREE.Mesh[] = [];
  for (const k of KEYS) {
    const w = k.w ?? 1;
    const d = k.d ?? 1;
    const id = `${w}x${d}`;
    if (!geos.has(id)) geos.set(id, keycapGeometry({ w, d, detail: 6 }));
    const polished = POLISHED[k.legend];
    const aspect = (w - 0.36) / (d - 0.32);
    const face = keyFace(t, k.legend, 256, polished ? { at: polished.at, radius: 0.46, seed: polished.seed } : undefined, aspect);
    const mats = keyMaterials(t, face);
    const mesh = new THREE.Mesh(geos.get(id)!, [mats.side, mats.top]);
    mesh.position.set(k.col + w / 2 - 2, 2.5 - (k.row + d / 2), 0);
    group.add(mesh);
    disposers.push(() => mats.dispose());
    if (polished) worn.push(mesh);
  }
  return {
    group,
    press(i, depth) {
      if (worn[i]) worn[i].position.z = -depth * KEY_TRAVEL;
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      disposers.forEach((d) => d());
    },
  };
}
