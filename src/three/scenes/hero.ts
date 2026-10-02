// Hero. An exactly overhead macro of one worn K key. The camera stays
// overhead and pulls straight back; the key turns out to be one in a field,
// typed by nobody. The field drops out row by row until the worn key is the
// only one left, and the camera comes straight back in.
//
// The camera is a perspective camera directly above the worn key, with its
// lens shifted so the key sits in its slot on screen. Pulling back is a
// change of distance along one axis and nothing else.
import * as THREE from 'three';
import { addRig, type SceneFactory, type LiveScene } from '../stage';
import { makeKey, makeField, WORN_K, KEY_HEIGHT, KEY_TRAVEL, type Field } from '../objects/keycap';
import { bus, HERO } from '../../scripts/bus';

const FOV = 30;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const span = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const stagger = (row: number) => [0, 0.5, 0.25, 0.75][((row % 4) + 4) % 4];

interface FieldKey {
  x: number;
  y: number;
  /** When in the drop this key starts to go, 0..1, and how long it takes. */
  t0: number;
  dur: number;
  /** Offset of this key in the typing wave. */
  lag: number;
  beat: number | null;
  struck: number;
}

export const heroScene: SceneFactory = (ctx) => {
  const { t, env, el } = ctx;
  const scene = new THREE.Scene();
  addRig(scene, env, 'overhead');
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 200);
  camera.position.set(0, 0, 10);

  const worn = makeKey(t, 'K', { wear: WORN_K, detail: ctx.phone ? 10 : 14, size: ctx.phone ? 512 : 1024 });
  scene.add(worn.mesh);

  const slot = el.querySelector<HTMLElement>('.hero-slot')!;
  const copy = el.querySelector<HTMLElement>('.hero-copy')!;
  const pin = el.querySelector<HTMLElement>('.hero-pin')!;
  const stage = el.querySelector<HTMLElement>('.hero-stage')!;

  let field: Field | null = null;
  let keys: FieldKey[] = [];
  let signature = '';
  let sMacro = 400;
  let sField = 76;

  /** Decide which keys exist. Everything is measured from the worn key, so it holds while the page scrolls. */
  function layout(): void {
    const s = ctx.rect(slot);
    const pinned = getComputedStyle(pin).position === 'sticky';
    const frame = ctx.rect(pinned ? pin : stage);
    const sig = [s.w, s.h, frame.w, frame.h, pinned].map((v) => (typeof v === 'number' ? Math.round(v) : v)).join(':');
    if (sig === signature) return;
    signature = sig;

    const ax = s.x + s.w / 2;
    const ay = s.y + s.h / 2;
    sMacro = (0.8 * Math.min(s.w, s.h)) / 0.94;
    sField = ctx.phone ? Math.min(60, Math.max(40, frame.w / 8.4)) : 76;

    field?.dispose();
    if (field) scene.remove(field.mesh);
    field = null;
    keys = [];
    if (ctx.still) return;

    // Copy sits on empty ground: no key may cross it at any distance of the
    // pull-back, so test each key along its whole path, not just where it rests.
    const c = ctx.rect(copy);
    const pad = 28;
    // The copy owns its whole corner: from the frame edge to its right side, from the top to its foot.
    const ex = pinned ? { l: -1e9, r: c.x + c.w + pad - ax, t: frame.y - ay, b: c.y + c.h + pad - ay } : null;
    const left = frame.x - ax;
    const right = frame.x + frame.w - ax;
    const top = frame.y - ay;
    const bottom = frame.y + frame.h - ay;
    const crosses = (dx: number, dy: number): boolean => {
      if (!ex) return false;
      for (let i = 0; i <= 14; i++) {
        const sc = Math.exp(Math.log(sField) + (Math.log(sMacro) - Math.log(sField)) * (i / 14));
        const half = sc * 0.5;
        const x = dx * sc;
        const y = dy * sc;
        if (x + half > ex.l && x - half < ex.r && y + half > ex.t && y - half < ex.b) return true;
      }
      return false;
    };

    const rMin = Math.floor(top / sField) - 1;
    const rMax = Math.ceil(bottom / sField) + 1;
    const cMin = Math.floor(left / sField) - 2;
    const cMax = Math.ceil(right / sField) + 2;
    const rows = new Map<number, number[]>();
    for (let r = rMin; r <= rMax; r++) {
      for (let k = cMin; k <= cMax; k++) {
        const dx = k + stagger(r) - stagger(0);
        if (r === 0 && Math.abs(dx) < 0.01) continue; // the worn key itself
        if (crosses(dx, r)) continue;
        if (!rows.has(r)) rows.set(r, []);
        rows.get(r)!.push(dx);
      }
    }
    // Drop order: the bottom row first and upward, then the top rows downward, the worn key's own row last.
    const below = [...rows.keys()].filter((r) => r > 0).sort((a, b) => b - a);
    const above = [...rows.keys()].filter((r) => r < 0).sort((a, b) => a - b);
    const order = [...below, ...above, ...(rows.has(0) ? [0] : [])];
    const n = Math.max(1, order.length);
    order.forEach((r, idx) => {
      const cols = rows.get(r)!.sort((a, b) => (r === 0 ? b - a : a - b));
      cols.forEach((dx, j) => {
        const h = Math.abs(Math.sin(dx * 12.9898 + r * 78.233) * 43758.5453) % 1;
        keys.push({
          x: dx,
          y: -r,
          t0: (idx + (j / Math.max(1, cols.length)) * 0.7) / (n + 0.9),
          dur: 1.4 / (n + 0.9),
          lag: dx * 0.085 + r * 0.19 + h * 0.5,
          beat: null,
          struck: -10,
        });
      });
    });
    if (keys.length) {
      field = makeField(t, keys.length, ctx.phone ? 4 : 5);
      field.mesh.frustumCulled = false;
      scene.add(field.mesh);
    }
  }

  /** A key struck at `at` goes down in 90ms and comes back in 120ms. */
  const strike = (now: number, at: number) => {
    const dt = now - at;
    if (dt < 0 || dt > 0.21) return 0;
    return dt < 0.09 ? dt / 0.09 : 1 - (dt - 0.09) / 0.12;
  };

  const live: LiveScene = {
    scene,
    camera,
    clip: null,
    update(time) {
      layout();
      // The scene belongs to its pin: nothing is drawn behind copy that sits outside it.
      live.clip = ctx.still ? null : ctx.rect(getComputedStyle(pin).position === 'sticky' ? pin : stage);
      const { w, h } = ctx.size();
      const s = ctx.rect(slot);
      const ax = s.x + s.w / 2;
      const ay = s.y + s.h / 2;
      const p = ctx.still ? 1 : bus.hero.p;

      // Straight back, then straight in again. Interpolated in log space so the pull reads as constant speed.
      const out = inOut(span(p, HERO.pull[0], HERO.pull[1])) * (1 - inOut(span(p, HERO.push[0], HERO.push[1])));
      const scale = Math.exp(Math.log(sMacro) + (Math.log(sField) - Math.log(sMacro)) * out);
      camera.aspect = w / h;
      camera.position.set(0, 0, KEY_HEIGHT + h / (2 * TAN * scale));
      camera.setViewOffset(w, h, w / 2 - ax, h / 2 - ay, w, h);
      camera.updateProjectionMatrix();

      let busy = false;
      const wave = span(p, HERO.waves[0], HERO.waves[1]);
      const typing = wave > 0 && wave < 1;
      const drop = span(p, HERO.drop[0], HERO.drop[1]);
      if (field) {
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          // The wave front is scrubbed; each key it passes is struck in real time.
          const beat = typing ? Math.floor(wave * 7 - k.lag) : null;
          if (beat !== k.beat) {
            if (beat !== null && k.beat !== null && beat >= 0) k.struck = time;
            k.beat = beat;
          }
          const press = strike(time, k.struck);
          if (press > 0) busy = true;
          const d = span(drop, k.t0, k.t0 + k.dur);
          field.set(i, k.x, k.y, press, d * d * (3 - 2 * d));
        }
        field.commit();
      }
      worn.mesh.position.z = -bus.hero.press * KEY_TRAVEL;
      // Keys still moving need another frame even if the page has stopped.
      if (busy) bus.invalidate();
    },
    dispose() {
      worn.dispose();
      field?.dispose();
    },
  };
  return live;
};
