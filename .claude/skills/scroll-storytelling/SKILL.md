---
name: scroll-storytelling
description: Build pages that play like a film the visitor scrolls through - layered parallax scenes, a persistent WebGL canvas with one scene per section, and scrubbed pre-rendered image sequences. Use when asked for parallax, pinned or scrubbed scroll scenes, scroll-driven 3D, or a page "like Firewatch" or "like The Boat". Carries three tested recipes and the rules that keep such pages fast, accessible and usable on phones.
---

# Scroll storytelling

A scroll-driven page has one input, the scroll position, and the state of everything on it follows from that input. Build it that way: no scroll listeners doing layout, no section that plays by itself once and is then dead. If the visitor scrolls back up, the film runs backwards.

Two kinds of motion live on such a page, and they are wired differently:

- **Continuous motion is scrubbed.** Camera moves, object positions, parallax and frame sequences are tied directly to scroll position (`scrub`).
- **Motion with its own duration is triggered.** A digit rolling, a stamp landing, a line being struck out take a fixed time however fast the visitor scrolls. Fire these at a scroll threshold and let them play in real time (`toggleActions: 'play none none reverse'`), so they still undo on the way back up. Scrubbing them destroys their timing.

Three techniques cover almost every scene. Pick by what the scene is made of.

| The scene is | Use | Recipe |
|---|---|---|
| Flat artwork in depth planes (a landscape, a skyline, a desk seen side-on) | Layered parallax | `recipes/layered-parallax.js` |
| Live 3D that the camera or the objects move through | Persistent canvas, one scene per section | `recipes/scroll-stage.js` |
| 3D or footage that was rendered offline | Image sequence scrubbed on a 2D canvas | `recipes/image-sequence.js` |

A page normally mixes them. Read `references/reference-sites.md` for how the three sites this skill was drawn from are put together and which of their choices to keep.

## The recipes

Each file is an ES module written for a bundler (`import { gsap } from 'gsap'`, `import * as THREE from 'three'`). Copy the file into the project and adapt it; the header comment in each one gives the markup and CSS it expects.

They were run in headless Chromium against GSAP 3.15.0 and three 0.186.1 and passed 36 checks: layer offsets at several scroll positions (section at the top of the page and in the middle), frame selection across a scrubbed range in both directions, deferred frame loading, scene hand-over, lazy build and disposal, progress running 0 to 1 for the first and last sections, no rendering while idle, repaint on resize, a stable canvas at device pixel ratio 2, a canvas that returns to transparent after a scene with its own background, and the reduced-motion path of each. They have not been run on a phone or with a smooth-scroll library attached; test both in the project.

- `layeredParallax(root)` moves every `[data-depth]` child by `(1 - depth) × scroll`. Depth 1 moves with the page; depth 0 stays pinned to the viewport. All layers sit at zero offset at the instant the scene's top edge meets the top of the viewport, so compose the artwork for that frame.
- `createStage(canvas)` returns `{ add(sectionEl, buildScene), invalidate(), destroy() }`, or `null` when WebGL is unavailable. `buildScene` returns `{ scene, camera, update(progress, time), animated, rest, resize, dispose }`. Drive a paused GSAP timeline from `update` with `timeline.progress(progress)` when a scene has more than one beat.
- `imageSequence(canvas, { urls, fit })` scrubs numbered frames across the height of the canvas's parent section. It requests one frame at load and the rest when the section is near.

For the ScrollTrigger and three.js APIs themselves, use the `gsap-scrolltrigger`, `gsap-timeline` and `threejs-*` skills. To produce frames for a sequence, use `prerendered-3d`.

## How to assemble a page

1. Write the whole page as static HTML and CSS first, every section in its settled state, with real headings and copy. This is what a visitor with reduced motion, no WebGL or a search crawler gets, and it has to stand on its own.
2. Add one fixed canvas behind the document and register a scene for each section that needs live 3D. Sections with no scene leave the canvas clear.
3. Add scrubbed timelines per section. Give each section the scroll length its story needs (`min-height` in `svh`), and pin with CSS `position: sticky` inside a tall section before reaching for ScrollTrigger's `pin`.
4. Add smoothing last, once everything works with native scroll. Use Lenis, wired to ScrollTrigger exactly as its current README shows. Do not use GSAP ScrollSmoother with these recipes: it moves the page by transforming a wrapper, which stops `position: sticky` from working inside it.
5. Call `ScrollTrigger.refresh()` after fonts and above-the-fold images have loaded, since both change section heights.

## Rules

**Performance**
- Animate `transform` and `opacity` only. Never animate `top`, `height`, `margin`, `filter: blur()` or `box-shadow` on scroll.
- One `requestAnimationFrame` loop for WebGL. Render on demand: only when scroll moved, the size changed, or the scene is animated.
- Cap device pixel ratio at 2 on desktop and 1.5 on phones.
- Dispose geometries, materials and textures when a scene leaves range. Check `renderer.info.memory` while scrolling the full page twice; the counts should return to where they started.
- `overflow: clip` on parallax scenes, not `overflow: hidden`, which creates a scroll container.

**Access**
- Keep native scrolling. Do not hijack the wheel, set the document height to the viewport, or snap the visitor between sections against their input.
- All copy is HTML. The canvas is `aria-hidden="true"` and carries nothing a reader needs.
- `prefers-reduced-motion: reduce` means no scrubbing and no smoothing. Every recipe here already renders one settled state in that case; keep that behaviour when you adapt them.
- Pinned sections must not trap keyboard focus, and tabbing to a link must bring it on screen.

**Phones**
- Size full-height scenes in `svh`, so they fit while the address bar is showing. Never `dvh`: it changes as the bar collapses and moves every trigger mid-scroll. Add `ScrollTrigger.config({ ignoreMobileResize: true })` so the same collapse does not refresh every trigger.
- Fewer layers, fewer instances, shorter sequences at half the pixel width. Decide by measuring, not by user-agent.
- Never create horizontal page scroll.

**Sound**
- Off unless the project asks for it. If it is used, it starts only after a deliberate tap on a labelled control, has a visible mute, and is never required to follow the story.

## Things that go wrong

- **The canvas is invisible.** When both `html` and `body` have a background, a `position: fixed; z-index: -1` canvas is painted behind the `body` one. Put the page background on `html` only and leave `body` transparent, or give the canvas `z-index: 0` and the content wrapper `position: relative; z-index: 1`.
- **The canvas is tiny, or grows without limit.** It has no CSS size. `inset: 0` does not size a canvas; give it `width: 100%; height: 100%`.
- **Text is unreadable over a scene.** Copy needs a solid ground or an empty region of the scene behind it. Lay the scene out around the text, not the other way round, and check contrast with the scene at its brightest.
- **A hero scene starts half-played.** A trigger with `start: 'top bottom'` on an element already on screen has a start position before scroll zero, so its progress is above 0 at load. The parallax recipe relies on this to stay exact; for other tweens, start at `'top top'` or wrap the value in `clamp()`.
- **Triggers are offset after load.** Late fonts or images moved the layout. Refresh after they load.
- **Everything stutters during smooth scroll.** Two things are smoothing: Lenis plus a numeric `scrub` lag, or CSS `scroll-behavior: smooth`. Keep one; with Lenis, use `scrub: true`.
- **Memory climbs on every pass.** A scene is built again without the old one being disposed, or a texture is created inside `update`.
- **`window.frames`, `window.length`, `window.name`** and friends are built-in properties. Do not use them as counters or flags while debugging.
