// The object library, by name. Each case names one evidence object; practice
// pages reuse them. Every object reports its footprint so a scene can fit it
// to a slot, and which way it is looked at: exactly overhead or square-on.
//
// assets.json can replace any object with a GLB model or an offline render
// without touching scene code. See README, "Renders and models".
import * as THREE from 'three';
import type { Tokens } from '../tokens';
import assets from '../../content/assets.json';
import { makeField, makeKey, KEY_TRAVEL, WORN_V } from './keycap';
import { makeDrums, DRUM_R } from './drums';
import { makeStack, makeSheet, SHEET_W, SHEET_PITCH } from './forms';
import { makeNumpad, NUMPAD_SIZE } from './numpad';
import { makeMouse, MOUSE_SIZE } from './mouse';

export type ObjectName = 'drum' | 'key-field' | 'numpad' | 'forms-stack' | 'mouse' | 'sheet' | 'key-worn';

export interface Evidence {
  root: THREE.Object3D;
  /** Footprint in the object's own units, as seen by the camera. */
  size: { w: number; h: number };
  view: 'overhead' | 'square';
  /** Drive the object from scroll progress (0..1 through the viewport). */
  update(p: number, time: number): void;
  dispose(): void;
}

export interface EvidenceData {
  id?: string;
  before?: number;
  after?: number;
  sheet?: 'tender' | 'letterhead' | 'form';
}

const span = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const smooth = (t: number) => t * t * (3 - 2 * t);
const digitsOf = (n: number, len: number) => String(Math.trunc(n)).padStart(len, '0').slice(-len).split('').map(Number);

type Overrides = { models: Record<string, string>; renders: Record<string, { still?: string; frames?: string[]; width: number; height: number }> };
const overrides = assets as Overrides;

/** An offline render stands in for the mesh as a flat plane. Cameras are square-on or overhead, so it reads the same. */
function renderPlane(name: string): Evidence | null {
  const r = overrides.renders[name];
  if (!r) return null;
  const loader = new THREE.TextureLoader();
  const urls = r.frames?.length ? r.frames : r.still ? [r.still] : [];
  if (!urls.length) return null;
  const textures: (THREE.Texture | null)[] = urls.map(() => null);
  const load = (i: number) => {
    if (textures[i]) return;
    const tex = loader.load(urls[i]);
    tex.colorSpace = THREE.SRGBColorSpace;
    textures[i] = tex;
  };
  load(0); // one frame at once; the rest when the object is first driven
  const material = new THREE.MeshBasicMaterial({ map: textures[0], transparent: true });
  const geometry = new THREE.PlaneGeometry(r.width, r.height);
  let loadedAll = false;
  return {
    root: new THREE.Mesh(geometry, material),
    size: { w: r.width, h: r.height },
    view: 'overhead',
    update(p) {
      if (urls.length < 2) return;
      if (!loadedAll) {
        loadedAll = true;
        urls.forEach((_, i) => load(i));
      }
      const tex = textures[Math.round(span(p, 0.1, 0.9) * (urls.length - 1))];
      if (tex && tex.image) material.map = tex;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      textures.forEach((tex) => tex?.dispose());
    },
  };
}

/** A GLB dropped into public/models replaces the built object. Loaded only when assets.json names one. */
function modelFor(name: string, fallback: Evidence): Evidence {
  const url = overrides.models[name];
  if (!url) return fallback;
  const root = new THREE.Group();
  root.add(fallback.root);
  import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
    new GLTFLoader().load(url, (gltf) => {
      root.remove(fallback.root);
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const s = fallback.size.w / Math.max(1e-6, box.max.x - box.min.x);
      gltf.scene.scale.setScalar(s);
      root.add(gltf.scene);
    });
  });
  return { ...fallback, root };
}

export function makeEvidence(name: ObjectName, t: Tokens, data: EvidenceData = {}, phone = false): Evidence {
  const rendered = renderPlane(name);
  if (rendered) return rendered;
  return modelFor(name, build(name, t, data, phone));
}

function build(name: ObjectName, t: Tokens, data: EvidenceData, phone: boolean): Evidence {
  switch (name) {
    case 'drum': {
      // The case's own figure on drums: the before figure rolls down to the after figure.
      const before = data.before ?? 0;
      const after = data.after ?? 0;
      const len = Math.max(3, String(Math.trunc(before)).length);
      const drums = makeDrums(t, len);
      const from = digitsOf(before, len);
      const to = digitsOf(after, len);
      return {
        root: drums.group,
        size: { w: len, h: DRUM_R * 1.5 },
        view: 'square',
        update(p) {
          for (let i = 0; i < len; i++) {
            const k = smooth(span(p, 0.3 + i * 0.03, 0.56 + i * 0.03));
            // Roll downward through the digits, the long way if need be, and land exactly.
            const turn = from[i] >= to[i] ? from[i] - to[i] : from[i] + 10 - to[i];
            drums.show(i, from[i] - turn * k);
          }
        },
        dispose: () => drums.dispose(),
      };
    }
    case 'key-field': {
      // The keys that were typed twice: most of them drop out.
      const cols = phone ? 6 : 8;
      const rows = 4;
      const field = makeField(t, cols * rows, phone ? 4 : 5);
      field.mesh.frustumCulled = false;
      const keep = new Set([cols + 2, cols + 3, cols * 2 + 4, cols * 2 + 1]);
      return {
        root: field.mesh,
        size: { w: cols + 0.75, h: rows },
        view: 'overhead',
        update(p) {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const i = r * cols + c;
              const x = c - (cols - 1) / 2 + [0, 0.5, 0.25, 0.75][r] - 0.375;
              const y = (rows - 1) / 2 - r;
              const order = ((c * 7 + r * 13) % (cols * rows)) / (cols * rows);
              const drop = keep.has(i) ? 0 : smooth(span(p, 0.3 + order * 0.3, 0.42 + order * 0.3));
              field.set(i, x, y, 0, drop);
            }
          }
          field.commit();
        },
        dispose: () => field.dispose(),
      };
    }
    case 'numpad': {
      const pad = makeNumpad(t);
      return {
        root: pad.group,
        size: NUMPAD_SIZE,
        view: 'overhead',
        update(p) {
          // 4, 5, 6: the three keys that did the work, pressed once more in passing.
          for (let i = 0; i < 3; i++) {
            const k = span(p, 0.36 + i * 0.05, 0.44 + i * 0.05);
            pad.press(i, Math.sin(k * Math.PI));
          }
        },
        dispose: () => pad.dispose(),
      };
    }
    case 'forms-stack': {
      const count = 40;
      const stack = makeStack(t, count);
      stack.group.position.y = (-count * SHEET_PITCH) / 2;
      const holder = new THREE.Group();
      holder.add(stack.group);
      return {
        root: holder,
        size: { w: SHEET_W * 1.08, h: count * SHEET_PITCH },
        view: 'square',
        update(p) {
          // Sheets leave from the top until a few are left, always away from the copy.
          const gone = smooth(span(p, 0.26, 0.7)) * (count - 6);
          for (let i = 0; i < count; i++) {
            const fromTop = count - 1 - i;
            stack.place(i, smooth(span(gone, fromTop, fromTop + 1.5)), 1);
          }
          stack.commit();
        },
        dispose: () => stack.dispose(),
      };
    }
    case 'mouse': {
      const mouse = makeMouse(t);
      return { root: mouse.mesh, size: MOUSE_SIZE, view: 'overhead', update() {}, dispose: () => mouse.dispose() };
    }
    case 'sheet': {
      const sheet = makeSheet(t, data.sheet ?? 'tender');
      return { root: sheet.mesh, size: { w: SHEET_W, h: 297 }, view: 'square', update() {}, dispose: () => sheet.dispose() };
    }
    case 'key-worn': {
      const key = makeKey(t, 'V', { wear: WORN_V, detail: 10, size: 512 });
      return {
        root: key.mesh,
        size: { w: 1, h: 1 },
        view: 'overhead',
        update(p) {
          key.mesh.position.z = -Math.sin(span(p, 0.4, 0.5) * Math.PI) * KEY_TRAVEL;
        },
        dispose: () => key.dispose(),
      };
    }
  }
}
