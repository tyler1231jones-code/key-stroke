/**
 * Layered parallax: the Firewatch technique, rebuilt on ScrollTrigger.
 *
 * The original site stacks nine `position: fixed` PNG layers and, on every
 * scroll event, sets each one to translate3d(0, -(scrollTop * speed / 100), 0)
 * with speeds 2, 5, 11, 16, 26, 36, 49, 69, 100. This recipe gives the same
 * result with layers that stay in normal flow, so the scene can sit anywhere
 * on the page, and with no scroll listener.
 *
 * Markup, back to front:
 *   <section class="px" data-parallax>
 *     <div class="px-layer" data-depth="0.02">…</div>  far: nearly pinned to the viewport
 *     <div class="px-layer" data-depth="0.36">…</div>
 *     <div class="px-layer" data-depth="1">…</div>     near: moves with the page
 *   </section>
 *
 * CSS:
 *   .px       { position: relative; height: 100svh; overflow: clip; }
 *   .px-layer { position: absolute; inset: 0; will-change: transform; }
 *
 * depth is the fraction of page scroll a layer appears to travel:
 * 1 scrolls with the page, 0 never leaves the viewport. Space the depths
 * unevenly (more gap near the front); even steps look like a slideshow.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function layeredParallax(root, {
  media = '(prefers-reduced-motion: no-preference)',
  scrub = true,
} = {}) {
  const layers = Array.from(root.querySelectorAll('[data-depth]'));
  const mm = gsap.matchMedia();

  mm.add(media, () => {
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root,
        start: 'top bottom',   // scene enters the viewport
        end: 'bottom top',     // scene has left it
        scrub,
        invalidateOnRefresh: true,
      },
    });

    for (const layer of layers) {
      const lag = 1 - Number(layer.dataset.depth);
      // Every layer is at y = 0 at the moment the scene's top meets the
      // viewport's top, so the composed artwork is exact at that instant.
      tl.fromTo(
        layer,
        { y: () => -lag * window.innerHeight },
        { y: () => lag * root.offsetHeight },
        0,
      );
    }
  });

  // With reduced motion (or outside `media`) nothing runs and the layers
  // rest at y = 0, which is the composed artwork.
  return () => mm.revert();
}
