# The three reference sites

Inspected in a browser on 2 October 2026. Each entry says what was observed on the live page, then what to take from it.

## Firewatch — firewatchgame.com

**How it is built.** No canvas and no animation library. jQuery 1.12 and one 1.7 KB script.

- The hero is nine PNG layers, `parallax0.png` to `parallax8.png`, each a full-width `div` with a background image.
- Layers 0 to 7 are `position: fixed`. On every `scroll` event the script sets each to `translate3d(0, -(scrollTop × speed / 100), 0)`.
- The speeds are 2, 5, 11, 16, 26, 36, 49, 69. Layer 8, the foreground, is in normal flow, which is a speed of 100.
- A scrim layer sits between layers 6 and 7 to darken the art as content scrolls over it.
- On iPhone and iPad the script hides the layers and shows one flat JPG instead.

**Why it works.** The art, not the code. Every layer is a flat silhouette in a single colour. Distance is shown by value alone: far layers are pale and close to the sky colour, near layers are dark and saturated. The speeds are spaced unevenly, with the gaps widening toward the front, which is what real parallax does.

**Take.** Flat single-colour layers; depth by value; uneven speed spacing; a composed frame at scroll zero that is a finished image by itself; a static fallback.

**Leave.** `position: fixed` layers and a raw scroll listener (use `recipes/layered-parallax.js`); device sniffing; a hero that is the only moving thing on the page.

## The Boat — sbs.com.au/theboat

**How it is built.** One full-viewport WebGL canvas and almost no DOM.

- three.js r70 renders everything. GSAP 1.x (`TweenMax`, `TimelineMax`, `SplitText`) sequences it. CreateJS handles preloading and sound, Backbone the app structure, and a capability check runs before anything loads.
- The document is exactly one viewport tall. Scrolling is virtual: wheel and touch input advance a timeline, and there is an auto-scroll mode.
- The studio's own account: the ink illustrations were scanned and placed in the scene as 3D objects, moved with GLSL shaders, and sound comes from a custom multichannel engine that responds to scroll position and on-screen animation. About 300 illustrations were drawn; 59 have custom animation, effects or layering.
- Panels and text sway and jolt together with the boat. Weather (rain streaks, lightning) is particles over the artwork.
- It opens on a "click to start" gate, which is what unlocks audio in the browser.

**Why it works.** Motion carries the meaning: the page rocks because the boat rocks. Text and image move as one object. Stillness is used as deliberately as movement, and the heavy effects are spent on a few moments rather than spread thinly.

**Take.** One persistent canvas with a scene per chapter; the scroll position as the only clock; artwork as planes in real 3D space so the camera can move through it; particles for atmosphere; a few big moments.

**Leave.** Virtual scrolling (it breaks keyboard scrolling, anchors, find-in-page and assistive technology; use `recipes/scroll-stage.js` with native scroll); text drawn in the canvas; a start gate, unless sound is part of the brief.

## Melanie Daveid — melaniedaveid.com

**How it is built.** A Wix site. There is no canvas, no WebGL and no 3D library on the page.

- All the 3D is rendered offline. The hero background is a looping MP4 of slow monochrome smoke. The object imagery (a sphere cut into concentric rings, soft blob forms) is still images.
- The page is black and white with a coarse grain over everything, and colour is admitted only inside the work-sample cards.
- Content sits on large rounded cards that overlap one another as the page scrolls.

**Why it works.** The renders are simple forms lit softly, with long gradients across matte surfaces and visible grain. Because nothing is computed live, the look is identical on every device and costs nothing at run time.

**Take.** Pre-rendered 3D for anything that has to look exactly right; monochrome forms with soft, even light; grain added as an overlay; a loop as a hero background with a still poster behind it. See the `prerendered-3d` skill.

**Leave.** The page builder; rounded cards, where the project's design system sets its own radii; heavy video with no poster or reduced-motion alternative.
