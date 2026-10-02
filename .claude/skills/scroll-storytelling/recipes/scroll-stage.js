/**
 * Scroll stage: one persistent WebGL canvas behind the document, with a scene
 * per section and scroll position as the only clock.
 *
 * This is how SBS's The Boat is put together (a full-viewport three.js canvas,
 * GSAP timelines, illustration scans placed as textured planes), with one
 * change: The Boat replaces native scrolling with its own virtual timeline.
 * Here the page scrolls natively and the canvas follows it, so keyboard
 * scrolling, anchors, find-in-page and screen readers all keep working.
 *
 * Markup:
 *   <canvas id="stage" aria-hidden="true"></canvas>
 *   <section data-scene="hero">…real HTML copy…</section>
 *
 * CSS:
 *   #stage { position: fixed; inset: 0; width: 100%; height: 100%; z-index: -1; }
 *   html   { background: <page colour>; }   body stays transparent
 *
 * Give each section its ground colour in CSS and leave scene.background
 * unset, so the canvas is transparent wherever nothing is drawn.
 *
 * The width and height are required. A canvas is a replaced element, so
 * `inset: 0` alone does not size it, and without a CSS size the drawing
 * buffer and the layout size chase each other on high-density screens.
 *
 * A scene is a function that builds lazily and returns:
 *   {
 *     scene, camera,
 *     update(progress, time),  progress 0..1 across the section's pass through the viewport
 *                              (for the first and last sections, across the part of that
 *                              pass the page can actually reach, so the hero starts at 0)
 *     animated: false,         true if it moves without scrolling (rain, drift, sway)
 *     rest: 0.5,               progress shown when the visitor prefers reduced motion
 *     resize(width, height),   optional
 *     dispose(),               free geometries, materials, textures
 *   }
 *
 * Only the section under the viewport's centre is rendered, so the hand-over
 * between two scenes is a cut at the midpoint; cover it with the HTML (a
 * solid band, a rule, a counter housing) or leave a section with no scene
 * between them. Scenes are built, and their shaders compiled, when their
 * section comes within one viewport of the screen, and disposed when it
 * leaves that range. Nothing renders unless scroll moved, the size changed,
 * or the current scene says it is animated.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function createStage(canvas, { maxDpr = 2 } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    return null; // no WebGL: the caller keeps its static fallback
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const entries = [];
  let current = null;
  let dirty = true;
  let raf = 0;
  let width = 1;
  let height = 1;

  function fit(entry) {
    const { camera, resize } = entry.live;
    if (camera.isPerspectiveCamera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    if (resize) resize.call(entry.live, width, height);
  }

  function measure() {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(width, height, false);
    for (const entry of entries) if (entry.live) fit(entry);
    // setSize clears the drawing buffer, so repaint in the same task. Waiting
    // for the next frame shows a blank canvas for as long as a resize lasts.
    paint(performance.now());
  }

  function paint(now) {
    const live = current && current.live;
    if (live) {
      if (live.update) live.update(current.progress, now / 1000);
      renderer.render(live.scene, live.camera);
    } else {
      // A scene that set scene.background leaves that colour as the clear
      // colour. Reset it so an empty canvas is transparent again.
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
    }
    dirty = false;
  }

  function build(entry) {
    if (entry.live) return;
    entry.live = entry.factory({ renderer, canvas });
    fit(entry);
    if (reduce) entry.progress = entry.live.rest ?? 0.5;
    // Compile shaders now, off the critical frame, instead of at hand-over.
    if (renderer.compileAsync) {
      renderer.compileAsync(entry.live.scene, entry.live.camera).catch(() => {});
    }
  }

  function release(entry) {
    if (!entry.live) return;
    if (entry.live.dispose) entry.live.dispose();
    entry.live = null;
  }

  function add(el, factory) {
    const entry = { el, factory, live: null, progress: 0, triggers: [] };

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

    if (!reduce) {
      entry.triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            // Measure against the scroll range the page can reach, so a
            // section at the very top starts at 0 and one at the very
            // bottom ends at 1.
            const from = Math.max(self.start, 0);
            const to = Math.min(self.end, ScrollTrigger.maxScroll(window));
            entry.progress = to > from
              ? Math.min(1, Math.max(0, (self.scroll() - from) / (to - from)))
              : 0;
            dirty = true;
          },
        }),
      );
    }

    entries.push(entry);
    return entry;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const live = current && current.live;
    const moving = live && live.animated && !reduce;
    if (dirty || moving) paint(now);
  }

  function start() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function onVisibility() {
    if (document.hidden) stop();
    else {
      dirty = true;
      start();
    }
  }

  const observer = new ResizeObserver(measure);
  observer.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);
  measure();
  start();

  return {
    renderer,
    add,
    invalidate() { dirty = true; },
    get current() { return current; },
    destroy() {
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      for (const entry of entries) {
        entry.triggers.forEach((t) => t.kill());
        release(entry);
      }
      entries.length = 0;
      current = null;
      renderer.dispose();
    },
  };
}
