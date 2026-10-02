/**
 * Image sequence: scrub pre-rendered frames on a 2D canvas.
 *
 * Use this for anything too heavy or too particular to render live: a
 * Blender turntable, a simulated cloth, a macro with depth of field. The
 * frames are ordinary image files, one per step, numbered in order.
 *
 * Markup:
 *   <section class="seq" style="height: 300svh">
 *     <canvas style="position: sticky; top: 0; width: 100%; height: 100svh"></canvas>
 *   </section>
 *
 * Budget: 60–120 frames, each under about 60 KB (WebP, 1600px wide on
 * desktop, 800px on phones). Past that, cut the frame count before you cut
 * the quality.
 *
 * Loading: the first frame is requested at once. The rest are requested
 * when the section comes within two viewports of the screen, so a sequence
 * far down the page costs one request at load.
 *
 * fit: 'cover' fills the canvas and crops; 'contain' shows the whole frame.
 * A square render on a portrait phone loses over half its width to 'cover',
 * so render a portrait set for phones or use 'contain'.
 *
 * scrub is `true` (frames follow the scrollbar exactly). Give it a number
 * of seconds only when the page has no smooth-scroll library; otherwise two
 * things are smoothing at once.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function imageSequence(canvas, {
  urls,
  trigger = canvas.parentElement,
  start = 'top top',
  end = 'bottom bottom',
  scrub = true,
  fit = 'cover',
  maxDpr = 2,
} = {}) {
  const ctx = canvas.getContext('2d');
  const frames = new Array(urls.length).fill(null);
  const state = { frame: 0 };
  const last = urls.length - 1;
  let shown = -1;
  let dead = false;

  function ready(i) {
    const img = frames[i];
    return img && img.complete && img.naturalWidth > 0;
  }

  function draw() {
    // Show the wanted frame, or the nearest earlier one that has decoded.
    let i = Math.round(state.frame);
    while (i >= 0 && !ready(i)) i -= 1;
    if (i < 0 || i === shown) return;
    const img = frames[i];
    const ratio = fit === 'contain' ? Math.min : Math.max;
    const scale = ratio(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    shown = i;
  }

  function load(i) {
    if (frames[i]) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      // Redraw only if this frame is a better match than the one showing.
      if (!dead && i > shown && i <= Math.round(state.frame)) draw();
    };
    img.src = urls[i];
    frames[i] = img;
  }

  function measure() {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    shown = -1;
    draw();
  }

  const observer = new ResizeObserver(measure);
  observer.observe(canvas);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    // One settled frame, no scrubbing, one request.
    state.frame = last;
    load(last);
    return {
      destroy() {
        dead = true;
        observer.disconnect();
      },
    };
  }

  load(0);

  // The rest wait until the section is near: a coarse pass first, so fast
  // scrolling has something to show, then every frame.
  const near = ScrollTrigger.create({
    trigger,
    start: 'top 300%',
    once: true,
    onEnter: () => {
      for (let i = 0; i <= last; i += 8) load(i);
      for (let i = 0; i <= last; i += 1) load(i);
    },
  });

  const tween = gsap.to(state, {
    frame: last,
    ease: 'none',
    onUpdate: draw,
    scrollTrigger: { trigger, start, end, scrub },
  });

  return {
    destroy() {
      dead = true;
      observer.disconnect();
      near.kill();
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
    },
  };
}
