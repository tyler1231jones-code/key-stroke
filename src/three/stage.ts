/**
 * The stage: one persistent WebGL canvas behind the document, a scene per
 * section, scroll as the only clock. Adapted from the scroll-storytelling
 * recipe (scroll-stage.js), with three additions:
 *
 *  - Slots. A scene anchors its object to an HTML element, so layout is
 *    decided in CSS and the 3D follows it. `ctx.rect(el)` returns the
 *    element's rectangle in the frame the scene is drawn into.
 *  - Dip. The hand-over between two scenes is a cut at the viewport's
 *    midpoint; the canvas opacity dips toward that line so it is never seen.
 *  - Watchdog. A device that cannot hold frame rate has its pixel ratio
 *    lowered, then the stage hands over to stills.
 *
 * Only the scene under the middle of the viewport renders. Scenes are built
 * when their section comes within one viewport and disposed when it leaves.
 * Nothing renders unless scroll moved, the size changed, or a triggered
 * mechanism asked for a frame.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { tokens, type Tokens } from './tokens';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SceneContext {
  renderer: THREE.WebGLRenderer;
  /** The section this scene belongs to. */
  el: HTMLElement;
  t: Tokens;
  /** A neutral studio environment: greys only, for polish to read. */
  env: THREE.Texture;
  /** The frame being drawn into, in CSS pixels. The viewport when live; one slot when drawing a still. */
  size(): { w: number; h: number };
  /** An element's rectangle within that frame. */
  rect(el: Element): Rect;
  phone: boolean;
  /** True when one settled frame is being drawn (reduced motion, stills). */
  still: boolean;
}

export interface LiveScene {
  scene: THREE.Scene;
  camera: THREE.Camera;
  /** Called before every render. Read progress from the bus and positions from slots. */
  update(time: number): void;
  resize?(w: number, h: number): void;
  /** Crop the scene to a rectangle of the frame: a macro band, say. Set in update(). */
  clip?: Rect | null;
  dispose(): void;
}

export type SceneFactory = (ctx: SceneContext) => LiveScene;

/** An orthographic camera in which one world unit is one CSS pixel, origin at the frame's centre, y up. */
export function pixelCamera(): THREE.OrthographicCamera {
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 8000);
  cam.position.set(0, 0, 4000);
  return cam;
}

export function fitPixelCamera(cam: THREE.OrthographicCamera, w: number, h: number): void {
  cam.left = -w / 2;
  cam.right = w / 2;
  cam.top = h / 2;
  cam.bottom = -h / 2;
  cam.updateProjectionMatrix();
}

/** Centre of a frame rectangle in pixel-camera world coordinates. */
export function centreOf(r: Rect, size: { w: number; h: number }): { x: number; y: number } {
  return { x: r.x + r.w / 2 - size.w / 2, y: size.h / 2 - (r.y + r.h / 2) };
}

/** One flat, even source, above and slightly forward, plus fill. Neutral, no colour. */
export function addRig(scene: THREE.Scene, env: THREE.Texture, view: 'overhead' | 'square'): void {
  const key = new THREE.DirectionalLight(0xffffff, 2.3);
  if (view === 'overhead') key.position.set(-0.34, 0.5, 1);
  else key.position.set(-0.25, 1, 0.9);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  scene.environment = env;
  scene.environmentIntensity = 0.1;
}

/** Scissor the next render to a frame rectangle (CSS pixels, y down). */
export function applyClip(renderer: THREE.WebGLRenderer, clip: Rect | null, frameHeight: number): void {
  if (!clip) {
    renderer.setScissorTest(false);
    return;
  }
  renderer.setScissor(clip.x, frameHeight - clip.y - clip.h, clip.w, clip.h);
  renderer.setScissorTest(true);
}

export function makeRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer | null {
  // Ask quietly first, so a browser without WebGL does not log an error.
  if (!document.createElement('canvas').getContext('webgl2')) return null;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NoToneMapping;
    return renderer;
  } catch {
    return null; // no WebGL: the caller keeps its static fallback
  }
}

export function makeEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  // Blurred hard: soft, even reflections with no panel edges in them.
  const env = pmrem.fromScene(room, 0.6).texture;
  pmrem.dispose();
  room.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    (m.material as THREE.Material | undefined)?.dispose?.();
  });
  return env;
}

interface Entry {
  el: HTMLElement;
  slot: HTMLElement | null;
  factory: SceneFactory;
  live: LiveScene | null;
  triggers: ScrollTrigger[];
}

export interface Stage {
  renderer: THREE.WebGLRenderer;
  add(el: HTMLElement, factory: SceneFactory): void;
  invalidate(): void;
  destroy(): void;
}

export function createStage(canvas: HTMLCanvasElement, opts: { maxDpr: number; phone: boolean; onSlow: () => void }): Stage | null {
  const renderer = makeRenderer(canvas);
  if (!renderer) return null;
  const env = makeEnvironment(renderer);
  const t = tokens();
  const entries: Entry[] = [];
  let current: Entry | null = null;
  let dirty = true;
  let width = 1;
  let height = 1;
  let dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr);
  let opacity = -1;
  let dead = false;

  const ctxFor = (entry: Entry): SceneContext => ({
    renderer,
    el: entry.el,
    t,
    env,
    size: () => ({ w: width, h: height }),
    rect: (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    },
    phone: opts.phone,
    still: false,
  });

  function fit(entry: Entry): void {
    const cam = entry.live!.camera as THREE.PerspectiveCamera & THREE.OrthographicCamera;
    if (cam.isOrthographicCamera) fitPixelCamera(cam, width, height);
    entry.live!.resize?.(width, height);
  }

  function measure(): void {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    renderer!.setPixelRatio(dpr);
    renderer!.setSize(width, height, false);
    for (const entry of entries) if (entry.live) fit(entry);
    // setSize clears the drawing buffer, so repaint in the same task.
    paint(performance.now());
  }

  function paint(now: number): void {
    const live = current && current.live;
    if (live && current) {
      // Dip toward the hand-over line so the cut between scenes is never seen.
      const r = current.el.getBoundingClientRect();
      const mid = height / 2;
      const d = Math.min(mid - r.top, r.bottom - mid);
      const o = Math.round(Math.min(1, Math.max(0, d / (height * 0.16))) * 100) / 100;
      if (o !== opacity) {
        opacity = o;
        canvas.style.opacity = String(o);
      }
      live.update(now / 1000);
      applyClip(renderer!, live.clip ?? null, height);
      renderer!.render(live.scene, live.camera);
      renderer!.setScissorTest(false);
    } else {
      renderer!.setScissorTest(false);
      renderer!.setClearColor(0x000000, 0);
      renderer!.clear();
    }
    dirty = false;
  }

  function build(entry: Entry): void {
    if (entry.live || dead) return;
    entry.live = entry.factory(ctxFor(entry));
    fit(entry);
    entry.slot?.classList.add('slot-live');
    // Compile shaders now, off the critical frame, instead of at hand-over.
    renderer!.compileAsync(entry.live.scene, entry.live.camera).catch(() => {});
  }

  function release(entry: Entry): void {
    if (!entry.live) return;
    entry.live.dispose();
    entry.live = null;
    entry.slot?.classList.remove('slot-live');
  }

  function add(el: HTMLElement, factory: SceneFactory): void {
    const entry: Entry = { el, slot: el.querySelector<HTMLElement>('[data-slot]'), factory, live: null, triggers: [] };
    entry.triggers.push(
      // Build one viewport early, dispose one viewport late.
      ScrollTrigger.create({
        trigger: el,
        start: 'top 200%',
        end: 'bottom -100%',
        onToggle: (self) => {
          if (self.isActive) build(entry);
          else release(entry);
          dirty = true;
        },
      }),
      // The section under the viewport's centre owns the canvas.
      ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) {
            build(entry);
            current = entry;
          } else if (current === entry) {
            current = null;
          }
          dirty = true;
        },
      }),
    );
    entries.push(entry);
  }

  // Any scroll moves the slots, so any scroll asks for a frame.
  const onScroll = () => { dirty = true; };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Watchdog: judge only frames that were actually painted in a run.
  let slowRun = 0;
  let fastRun = 0;
  let lastPaint = 0;
  let stepped = false;
  function watch(now: number): void {
    const dt = now - lastPaint;
    lastPaint = now;
    if (dt > 250) return; // a gap between runs, not a slow frame
    if (dt > 44) { slowRun++; fastRun = 0; } else { fastRun++; if (fastRun > 30) slowRun = 0; }
    if (slowRun > 45) {
      slowRun = 0;
      if (!stepped && dpr > 1) {
        stepped = true;
        dpr = 1;
        measure();
      } else {
        opts.onSlow();
      }
    }
  }

  function frame(): void {
    if (dead || document.hidden) return;
    if (dirty) {
      const now = performance.now();
      paint(now);
      watch(now);
    }
  }

  const observer = new ResizeObserver(measure);
  observer.observe(canvas);
  measure();
  // One clock: the stage paints on GSAP's ticker, after Lenis has moved the page.
  gsap.ticker.add(frame);

  return {
    renderer,
    add,
    invalidate() { dirty = true; },
    destroy() {
      dead = true;
      gsap.ticker.remove(frame);
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      for (const entry of entries) {
        entry.triggers.forEach((tr) => tr.kill());
        release(entry);
      }
      entries.length = 0;
      current = null;
      env.dispose();
      renderer.dispose();
      canvas.style.opacity = '0';
    },
  };
}
