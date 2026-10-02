// Layered parallax: the Firewatch technique, rebuilt on ScrollTrigger.
// Adapted from the scroll-storytelling recipe (layered-parallax.js).
//
// Every [data-depth] child moves by (1 - depth) x scroll. Depth 1 moves with
// the page; depth 0 never leaves the viewport. All layers sit at zero offset
// at the instant the scene's top edge meets the top of the viewport, so the
// artwork is composed for that frame. With reduced motion nothing runs and
// the layers rest at y = 0, which is the composed artwork.
import { gsap } from './motion';

export function layeredParallax(root: HTMLElement, media = '(prefers-reduced-motion: no-preference)'): () => void {
  const layers = Array.from(root.querySelectorAll<HTMLElement>('[data-depth]'));
  const mm = gsap.matchMedia();
  mm.add(media, () => {
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true, // Lenis does the smoothing; a numeric scrub here would smooth twice
        invalidateOnRefresh: true,
      },
    });
    for (const layer of layers) {
      const lag = 1 - Number(layer.dataset.depth);
      tl.fromTo(layer, { y: () => -lag * window.innerHeight }, { y: () => lag * root.offsetHeight }, 0);
    }
  });
  return () => mm.revert();
}
