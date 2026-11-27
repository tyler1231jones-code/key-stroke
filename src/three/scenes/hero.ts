// Hero. An exactly overhead macro of one worn K key. The camera stays
// overhead and pulls straight back; the key turns out to be one in a field,
// typed by nobody. The field drops out row by row until the worn key is the
// only one left, and the camera comes straight back in.
//
// The camera is a perspective camera directly above the worn key, with its
// lens shifted so the key sits in its slot on screen. Pulling back is a
// change of distance along one axis and nothing else.
//
// That sequence is for a desktop, where the hero is pinned (src/styles/
// home.css decides). On a phone or a tablet, and in a small window, the hero
// is a still picture: the worn key close up with the few keys around it, in
// the band its slot is in, and no scroll tied to anything. There the scene
// docks the canvas over that band (LiveScene.dock), so the picture is part of
// the page and scrolls with it, and is not redrawn to keep up.
//
// The keys answer the visitor as well as the scroll. A key under the mouse
// goes down and comes back up behind it, so the pointer leaves a wake of
// pressed keys. A click or a tap sends a ring out through the field from
// that key. When the page first arrives, the worn key presses itself once and
// its neighbours follow. These sit on top of the scroll sequence and change
// none of its timing.
//
// The scene also tells the page two things through the bus. One is how this
// keyboard is laid out: how big a key is, and which keys were left out to keep
// the copy on empty ground. The wake (src/wake/engine.ts) draws exactly those
// missing keys, so the keyboard carries on under the headline. The
// other is how many of the field's keys are still up, which the page shows as
// a figure that goes down as the rows drop out.
import * as THREE from 'three';
import { addRig, type SceneFactory, type LiveScene, type Rect } from '../stage';
import { makeKey, makeField, WORN_K, KEY_HEIGHT, KEY_TRAVEL, type Field } from '../objects/keycap';
import { bus, HERO, type HeroGrid } from '../../scripts/bus';

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
  /** How far the pointer is holding this key down, 0..1. */
  hover: number;
}

/** A ring from a click travels a key every 45ms and reaches this many keys. */
const RING_STEP = 0.045;
const RING_REACH = 11;

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

  /** The scroll sequence runs where the hero is pinned. */
  const sequenced = () => getComputedStyle(pin).position === 'sticky';
  /** The band the slot is in, in the viewport: the slot's own height, out to the edge of the screen on any side where the slot reaches the page margin. */
  const band = (): Rect => {
    const r = slot.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const x0 = r.left < 80 ? 0 : r.left;
    const x1 = r.right > vw - 80 ? vw : r.right;
    return { x: x0, y: r.top, w: x1 - x0, h: r.height };
  };
  /** Where keys are drawn, in the frame: the whole pin with the sequence. Without it the canvas is docked over the band, so that is all of the frame. */
  const frameRect = (seq: boolean): Rect => {
    if (seq) return ctx.rect(pin);
    const { w, h } = ctx.size();
    return { x: 0, y: 0, w, h };
  };

  let field: Field | null = null;
  let keys: FieldKey[] = [];
  let signature = '';
  let sMacro = 400;
  let sField = 76;
  const grid: HeroGrid = { sequence: true, pitch: 76, macro: 400, scale: 400, base: 1, frame: [0, 0, 0, 0], copy: null };

  // The pointer, in viewport pixels. `on` is a mouse inside the hero's frame.
  const ptr = { x: 0, y: 0, on: false };
  const taps: { x: number; y: number }[] = [];
  let ringUntil = 0;
  let wornHover = 0;
  let wornStruck = -10;
  let lastTime = 0;
  // The greeting: once, when the page arrives at its top, the worn key presses itself and the ring goes out.
  let greetAt: number | null = !ctx.still && window.scrollY < 8 ? -1 : null;
  // While the intro is playing its own key is still on its way to the slot. The greeting waits for it to land.
  let held = document.documentElement.classList.contains('pitch-on');
  const onLanded = () => {
    held = false;
    if (greetAt !== null) greetAt = -2;
    bus.invalidate();
  };
  let keysLeft = -1;
  /** Is this point of the frame inside where keys are drawn? */
  const inFrame = (x: number, y: number) => {
    const r = frameRect(sequenced());
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  };
  /** A pointer event's position, in the frame. */
  const at = (e: { clientX: number; clientY: number }) => {
    const o = ctx.origin();
    return { x: e.clientX - o.x, y: e.clientY - o.y };
  };
  // Where the worn key was and how big a key was at the last frame drawn, to tell whether the pointer is near a key.
  const seen = { ax: 0, ay: 0, scale: 1, reach: 1 };
  let touching = false;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const pt = at(e);
    const on = inFrame(pt.x, pt.y);
    if (!on && !ptr.on) return;
    ptr.x = pt.x;
    ptr.y = pt.y;
    ptr.on = on;
    // Over the copy's corner there is no key to press, so there is nothing to redraw: the frame is asked for only
    // when the pointer reaches a key, or leaves the last one it was on.
    const px = (ptr.x - seen.ax) / seen.scale;
    const py = -(ptr.y - seen.ay) / seen.scale;
    const lim = seen.reach + 0.5;
    let near = on && Math.abs(px) < lim && Math.abs(py) < lim;
    if (on && !near) for (const k of keys) if (Math.abs(k.x - px) < lim && Math.abs(k.y - py) < lim) { near = true; break; }
    if (near || touching) bus.invalidate();
    touching = near;
  };
  const onLeave = () => {
    if (!ptr.on) return;
    ptr.on = false;
    bus.invalidate();
  };
  const onClick = (e: MouseEvent) => {
    // A click on a link, a button or a field is that control's, not the keyboard's.
    if ((e.target as Element | null)?.closest?.('a, button, input, select, textarea, summary, label')) return;
    const pt = at(e);
    if (!inFrame(pt.x, pt.y)) return;
    taps.push(pt);
    bus.invalidate();
  };
  if (!ctx.still) {
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('click', onClick);
    window.addEventListener('ks:intro-end', onLanded);
  }

  /** Decide which keys exist. Everything is measured from the worn key, so it holds while the page scrolls. */
  function layout(): void {
    const s = ctx.rect(slot);
    const pinned = sequenced();
    const frame = frameRect(pinned);
    const sig = [s.w, s.h, frame.x, frame.w, frame.h, pinned].map((v) => (typeof v === 'number' ? Math.round(v) : v)).join(':');
    if (sig === signature) return;
    signature = sig;

    const ax = s.x + s.w / 2;
    const ay = s.y + s.h / 2;
    sMacro = (0.8 * Math.min(s.w, s.h)) / 0.94;
    // With no sequence the camera never pulls back, so the field is laid out at the size it is seen at.
    sField = pinned ? 76 : sMacro;

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
    grid.sequence = pinned;
    grid.pitch = sField;
    grid.macro = sMacro;
    grid.frame = [left, top, right, bottom];
    grid.copy = ex ? [ex.r, ex.b] : null;
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
          // Every key is all the way down by the end of the drop, the last one included.
          t0: (idx + (j / Math.max(1, cols.length)) * 0.7) / (n + 1.1),
          dur: 1.4 / (n + 1.1),
          lag: dx * 0.085 + r * 0.19 + h * 0.5,
          beat: null,
          struck: -10,
          hover: 0,
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
    dock: () => (ctx.still || sequenced() ? null : band()),
    update(time) {
      layout();
      // The scene belongs to its pin: nothing is drawn behind copy that sits outside it.
      const seq = sequenced();
      live.clip = ctx.still ? null : frameRect(seq);
      const { w, h } = ctx.size();
      const s = ctx.rect(slot);
      const ax = s.x + s.w / 2;
      const ay = s.y + s.h / 2;
      const p = ctx.still ? 1 : seq ? bus.hero.p : 0;

      // Straight back, then straight in again. Interpolated in log space so the pull reads as constant speed.
      const out = inOut(span(p, HERO.pull[0], HERO.pull[1])) * (1 - inOut(span(p, HERO.push[0], HERO.push[1])));
      const scale = Math.exp(Math.log(sMacro) + (Math.log(sField) - Math.log(sMacro)) * out);
      camera.aspect = w / h;
      camera.position.set(0, 0, KEY_HEIGHT + h / (2 * TAN * scale));
      camera.setViewOffset(w, h, w / 2 - ax, h / 2 - ay, w, h);
      camera.updateProjectionMatrix();
      grid.scale = scale;
      grid.base = (camera.position.z - KEY_HEIGHT) / camera.position.z;
      bus.hero.grid = ctx.still || !field ? null : grid;

      let busy = false;
      const dt = Math.min(0.05, Math.max(0, time - lastTime));
      lastTime = time;

      // The pointer and any clicks, in key units from the worn key.
      const reach = Math.max(0.62, 58 / scale);
      seen.ax = ax;
      seen.ay = ay;
      seen.scale = scale;
      seen.reach = reach;
      const px = (ptr.x - ax) / scale;
      const py = -(ptr.y - ay) / scale;
      const ring = (ux: number, uy: number) => {
        for (const k of keys) {
          const d = Math.hypot(k.x - ux, k.y - uy);
          if (d <= RING_REACH) k.struck = time + Math.max(0, d - 0.5) * RING_STEP;
        }
        const own = Math.hypot(ux, uy);
        if (own <= RING_REACH) wornStruck = time + Math.max(0, own - 0.5) * RING_STEP;
        ringUntil = time + RING_REACH * RING_STEP + 0.25;
      };
      for (const tap of taps.splice(0)) ring((tap.x - ax) / scale, -(tap.y - ay) / scale);
      if (greetAt !== null && !held) {
        if (greetAt === -1) greetAt = time + 1.15;
        if (greetAt === -2) greetAt = time + 0.16; // straight after the intro's key lands
        if (p > 0.02) greetAt = null; // already scrolling: the sequence has its own press
        else if (time >= greetAt) {
          greetAt = null;
          ring(0, 0);
          // The same ring goes out through the keys under the headline.
          const o = ctx.origin();
          const vx = ax + o.x;
          const vy = ay + o.y;
          window.dispatchEvent(new CustomEvent('ks:ring', { detail: { x: vx, y: vy, reach: Math.hypot(vx, window.innerHeight - vy) + 160, life: 2.1, strength: 1.05 } }));
        } else busy = true;
      }
      if (time < ringUntil) busy = true;
      const overWorn = ptr.on && Math.abs(px) < 0.5 && Math.abs(py) < 0.5;
      // Only a key that is still moving asks for another frame: one held down at rest costs nothing.
      const wornTarget = overWorn ? 1 : 0;
      if (Math.abs(wornTarget - wornHover) > 0.004) {
        wornHover += (wornTarget - wornHover) * (1 - Math.exp(-dt * (overWorn ? 24 : 8)));
        busy = true;
      } else wornHover = wornTarget;

      const wave = span(p, HERO.waves[0], HERO.waves[1]);
      const typing = wave > 0 && wave < 1;
      const drop = span(p, HERO.drop[0], HERO.drop[1]);
      let left = 0;
      if (field) {
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          // The wave front is scrubbed; each key it passes is struck in real time.
          const beat = typing ? Math.floor(wave * 7 - k.lag) : null;
          if (beat !== k.beat) {
            if (beat !== null && k.beat !== null && beat >= 0) k.struck = time;
            k.beat = beat;
          }
          // Held down while the pointer is over it, and let up behind it.
          const held = ptr.on && Math.hypot(k.x - px, k.y - py) < reach;
          const target = held ? 1 : 0;
          if (Math.abs(target - k.hover) > 0.004) {
            k.hover += (target - k.hover) * (1 - Math.exp(-dt * (held ? 26 : 7)));
            busy = true;
          } else k.hover = target;
          const tap = strike(time, k.struck);
          if (tap > 0 || k.struck > time) busy = true;
          const press = Math.max(tap, k.hover * 0.9);
          const d = span(drop, k.t0, k.t0 + k.dur);
          if (d < 0.5) left++;
          field.set(i, k.x, k.y, press, d * d * (3 - 2 * d));
        }
        field.commit();
      }
      if (!ctx.still && keys.length && left !== keysLeft) {
        keysLeft = left;
        bus.hero.onKeys?.(left, keys.length);
      }
      const wornTap = strike(time, wornStruck);
      if (wornTap > 0) busy = true;
      worn.mesh.position.z = -Math.max(bus.hero.press, wornTap, wornHover * 0.3) * KEY_TRAVEL;
      // Keys still moving need another frame even if the page has stopped.
      if (busy) bus.invalidate();
    },
    dispose() {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('click', onClick);
      window.removeEventListener('ks:intro-end', onLanded);
      bus.hero.grid = null;
      // The field is gone (the stage handed over to still frames, or the hero left the screen): no count to show.
      if (keysLeft >= 0) bus.hero.onKeys?.(-1, 0);
      keysLeft = -1;
      worn.dispose();
      field?.dispose();
    },
  };
  return live;
};
