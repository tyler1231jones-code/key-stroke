// Printed sheets. A stack of the same form seen edge on, forty deep, and a
// single sheet seen face on. One unit is one millimetre of an A4 sheet's
// width; thickness is exaggerated so an edge reads at macro scale.
import * as THREE from 'three';
import type { Tokens } from '../tokens';
import { sheetFace, rng } from '../textures';

export const SHEET_W = 210;
export const SHEET_T = 2.6;
export const SHEET_GAP = 1.5;
export const SHEET_PITCH = SHEET_T + SHEET_GAP;

export interface Stack {
  group: THREE.Group;
  mesh: THREE.InstancedMesh;
  count: number;
  /** Per-sheet resting offsets: no two sheets sit exactly square. */
  jitter: { x: number; rot: number }[];
  /** Place sheet i (0 is the bottom). `out` slides it away along its rail, 0..1. */
  place(i: number, out: number, dir?: number): void;
  commit(): void;
  dispose(): void;
}

/**
 * `depth` is the sheet's other dimension (into the screen while edge on). The
 * audit scene sets it from the shift report's proportion so the last sheet
 * can turn face on and land on it.
 */
export function makeStack(t: Tokens, count = 40, depth = 297, face: 'form' | 'tender' | 'letterhead' = 'form'): Stack {
  const geometry = new THREE.BoxGeometry(SHEET_W, SHEET_T, depth);
  const map = sheetFace(t, face);
  const edge = new THREE.MeshStandardMaterial({ color: t.paper, roughness: 0.92, metalness: 0 });
  const top = new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0 });
  // BoxGeometry groups: +x, -x, +y (the printed face), -y, +z, -z.
  const mesh = new THREE.InstancedMesh(geometry, [edge, edge, top, edge, edge, edge], count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const r = rng(40);
  // No two sheets catch the light alike.
  const shade = new THREE.Color();
  for (let i = 0; i < count; i++) mesh.setColorAt(i, shade.setScalar(i === 0 ? 1 : 0.84 + r() * 0.16));
  const jitter = Array.from({ length: count }, () => ({ x: (r() - 0.5) * 7, rot: (r() - 0.5) * 0.02 }));
  const group = new THREE.Group();
  group.add(mesh);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const p = new THREE.Vector3();
  const s = new THREE.Vector3(1, 1, 1);
  return {
    group,
    mesh,
    count,
    jitter,
    place(i, out, dir = 1) {
      const j = jitter[i];
      q.setFromAxisAngle(up, j.rot);
      p.set(j.x + dir * out * SHEET_W * 2.4, i * SHEET_PITCH + SHEET_T / 2, 0);
      s.setScalar(out >= 1 ? 0 : 1);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    },
    commit() {
      mesh.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      map.dispose();
      edge.dispose();
      top.dispose();
      mesh.dispose();
    },
  };
}

export interface Sheet {
  mesh: THREE.Mesh;
  dispose(): void;
}

/** A single sheet, face toward +Z. Width 210, height 297. */
export function makeSheet(t: Tokens, kind: 'form' | 'tender' | 'letterhead'): Sheet {
  const geometry = new THREE.BoxGeometry(SHEET_W, 297, SHEET_T);
  const map = sheetFace(t, kind);
  const edge = new THREE.MeshStandardMaterial({ color: t.paper, roughness: 0.92, metalness: 0 });
  const face = new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0 });
  const mesh = new THREE.Mesh(geometry, [edge, edge, edge, edge, face, edge]);
  return {
    mesh,
    dispose() {
      geometry.dispose();
      map.dispose();
      edge.dispose();
      face.dispose();
    },
  };
}
