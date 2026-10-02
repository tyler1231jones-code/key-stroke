# PLAN

Build plan for the KEYSTROKE site. Written before the first line of code, kept as a record.
Decisions that depart from the brief are in `NOTES.md`, not here.

## Machine

Node 24.15, git, Edge and Playwright's Chromium (rev 1243, matches `@playwright/test` 1.63.0) are present.
ffmpeg and Blender are not. So: every 3D object is built real-time in three.js, stills for the
no-WebGL fallback are captured from those scenes with Playwright, and the hooks for offline renders
(`tools/blender/`, `public/models/`, `public/seq/`) are left in place.

## Shape of the site

| Route | Theme | Canvas | Notes |
|---|---|---|---|
| `/` | dark | yes | Eight sections, one scroll |
| `/practice/count` `/clear` `/build` `/face` | dark | yes | One signature sequence each |
| `/counting` | light | no | Method, then the ledger table |
| `/quiz` | dark | no | Nine screens, deterministic rules |
| `/404` | dark | no | In voice |

## Layering

```
html background (base-000)
  .ground  per-section colour, z-index -1   (direct child of the section)
  #stage   one fixed WebGL canvas, z-index 0, transparent where nothing is drawn
  content  position: relative, z-index 1    (all copy is HTML)
```

Sections do not create stacking contexts, so their grounds sit under the canvas and their content
over it. Copy sits on empty ground or on a solid panel; no text crosses a lit object.

## Scene manager (`src/three/stage.ts`)

Adapted from `scroll-storytelling/recipes/scroll-stage.js`.

- One renderer, one rAF loop, render on demand, DPR capped at 2 (1.5 on phones), stopped while hidden.
- Each section registers a factory. A scene is built when its section is within one viewport and
  disposed when it leaves. Only the scene under the middle of the viewport renders.
- **Slots.** Each scene's object is anchored to an HTML element (`[data-slot]`). The stage converts
  the slot's on-screen rectangle to world units for the scene's camera, so layout (and the phone
  layout) is decided in CSS and the 3D follows it.
- **Hand-over.** The cut at the midpoint is covered by a scroll-linked dip of the canvas opacity
  near a section edge (opacity is allowed for scene transitions).
- Colours are read from the CSS custom properties at run time (`src/three/tokens.ts`).
- A frame-rate watchdog lowers DPR, then swaps the canvas for stills.

## Motion wiring

- Lenis for smoothing, wired to ScrollTrigger; off under reduced motion.
- **Scrubbed** (continuous): cameras, object transforms, parallax, tape advance, sheet removal.
  Each pinned section has one ScrollTrigger whose progress feeds its scene and a paused timeline.
- **Triggered** (own duration): digit rolls (180ms linear), delta stamp (400ms hold, steps),
  tally strikes (60ms a stroke), type-on, key press. Fired at a scroll threshold with
  `onEnter` / `onLeaveBack`, so they undo on the way back up. Never scrubbed.
- Pinning is CSS `position: sticky` inside a tall section, only where the pinned content fits
  (min-width 960px and min-height 700px). Below that the section flows and the same beats fire
  as elements pass through the viewport.

## Homepage scenes

| # | Section | Technique | 3D | Beats |
|---|---|---|---|---|
| 1 | Hero | Pinned, persistent canvas, perspective camera exactly overhead with a shifted lens so the worn key stays put while the camera pulls straight back | Worn `V` key + instanced field of blank keys | key presses itself → pull back, field types itself in waves → rows drop out → push back in on the one key → counter strip indexes in, rolls last week's total to today's, delta stamps |
| 2 | The count | Pinned | Odometer drum row, square-on, camera tracks the axle | four M counters spin and settle in turn; drums leave frame by the end |
| 3 | The cases | Flow, one case per viewport; object behind the artefact panel with slower travel (layered depth) | One evidence object per case | counter rolls before → after, baseline struck, tally bar strikes, artefact runs |
| 4 | The audit | Pinned | Stack of forty forms edge on | sheets leave on rails, count rolls 40 → 01, last sheet turns face on, shift report prints over it |
| 5 | Practices | Flow, 2D | none | four token-drawn mechanisms run on entry |
| 6 | The crew | Flow, 2D | none (flat by brief) | punched tape advances with scroll; S totals |
| 7 | Savers | Flow, 2D | none | tally strokes drawn, 60ms a stroke |
| 8 | The two of us | Flow | K and T keycaps, overhead, still | keys press once on entry |

Layered parallax (Firewatch technique) is used inside the drum, forms and key scenes as depth
planes of flat value, and in HTML where a scene is side-on.

## Object library (`src/three/objects/`)

`keycap` (worn V, blank, K, T; instanced field) · `drums` · `forms` (stack of 40, single sheet)
· `numpad` · `mouse` · `sheet` (tender page, letterhead). Geometry from code, textures drawn on a
2D canvas from tokens, wear from seeded noise (asymmetric, not tiled). `loadModel(name)` checks
`/models/<name>.glb` first so a GLB can replace any of them.

## Data

`src/content/*.json` holds everything. `src/lib/ledger.ts` is the counting maths (Brisbane date,
completed 7-day periods, add then round down once). `src/lib/data.ts` applies demo mode. The same
modules run at build time (Astro) and on load (client), and `tools/check.mjs` imports them too.

## Components

`Base` layout · `Nav` · `Footer` · `Logotype` (Drum, inline SVG, reduced mark) · `Counter` (markup
from the design system, verbatim) · `CaseArticle` + ten artefacts drawn from six templates ·
`TallyBar` · `ShiftReport` · `CrewCard` + `Tape` · `SaversTable` · `PracticeBlock` · `KeySvg`
(token-drawn hero stand-in).

## Build order

1. Scaffold, tokens, type, content files, ledger maths.
2. Every homepage section as static HTML in its resting state.
3. Counter component behaviour (roll, blank cells, delta).
4. 2D scroll choreography with Lenis and ScrollTrigger.
5. Stage, then scenes one at a time: hero, count, cases, audit, two of us.
6. Practice pages, counting page, 404.
7. Quiz.
8. Fallbacks, stills, performance pass, `npm run check`, README, NOTES.

Screenshots at 1440×900 and 390×844 after each stage (`tools/shots.mjs`).
