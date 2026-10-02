# KEYSTROKE website

A scroll-driven site with real-time 3D, built with Astro, three.js, GSAP and
Lenis, deployed to Cloudflare Workers as static assets.

The brief is `docs/build-brief.md`. Decisions, open items and the quiz copy
awaiting approval are in `NOTES.md`. The plan the build followed is `PLAN.md`.

## Run

Needs Node 22.12 or later.

```bash
npm install
npm run dev        # http://localhost:4321
```

## Build and check

```bash
npm run build      # static site into dist/
npm run check      # copy, colour and figure rules, read from the built pages
npm run qa         # browser checks: measure, contrast, keyboard, load, 3D memory
npm run preview    # serve dist/ locally
```

`npm run check` fails on: a banned word outside an approved copy bank line; an
exclamation mark or emoji; `font-style: italic`; a radius above 6px; a colour
that is not a token; a keystroke or dollar figure that is not in a content
file or computed from the ledger. It warns on any `TODO` left in `site.json`.
Text inside `[data-artefact]` is skipped.

Other scripts:

| Script | Does |
|---|---|
| `npm run ledger` | Prints the totals the site computes from the ledger, for today or a given date |
| `npm run shots -- --route=quiz --size=phone` | Screenshots of the built site (see the header of `tools/shots.mjs`) |
| `npm run stills` | Re-renders the fallback stills in `public/stills/` from the real scenes |
| `npm run check:types` | `astro check` |

## Deploy to Cloudflare

The target is **Cloudflare Workers with static assets**, not Pages.
`wrangler.jsonc` points `assets.directory` at `dist/` and serves `404.html` for
unknown addresses. There is no Worker script.

```bash
npx wrangler login     # once, in your own browser
npm run deploy         # build, check, then wrangler deploy
```

Nobody has run `wrangler login` or `wrangler deploy` on this repo yet. After
the first deploy, attach the domain in the Cloudflare dashboard and set
`domain` in `src/content/site.json`.

`public/_headers` sets long-lived caching for the fingerprinted files in
`/_astro/`.

## Content

Everything the site states lives in `src/content/*.json`. No figure, case,
unit or price is written into a template.

| File | Holds |
|---|---|
| `site.json` | Demo switch, principals, contact email, booking link, domain, logotype, time zone |
| `cases.json` | The ten cases |
| `ledger.json` | One row per cleared task. Every counter is computed from this |
| `crew.json` | The five units |
| `products.json` | The audit, the three build ranges, the quiz items, the estimate bands, Keystroke Savers |
| `shiftReport.json` | The sample shift report in the audit section |
| `quiz.json` | The nine questions, the rules, the read templates and the five closing paragraphs |
| `practices.json` | The four practices: field, sells line, capabilities, page headline |
| `artefacts.json` | Invented sample rows for the case artefacts |
| `assets.json` | Offline renders and GLB models that replace built 3D objects |

### Set the contact details

`site.json` has `email`, `bookingUrl` and `domain` as `TODO`. While a value is
`TODO`, the control that needs it renders disabled with no link target, and
`npm run check` prints a warning. Replace the three values and rebuild.

### Turn demo mode off

Every record in the content files is mock and carries `"demo": true`.
`site.json` carries `"demo": true` for the whole site.

1. Replace mock rows with real ones, and set `"demo": false` on each real
   record (cases, ledger rows, crew units, product items, the estimates block,
   the shift report).
2. While `site.demo` is still `true`, real and demo rows show together and
   every counter fed by a demo row is labelled `DEMONSTRATION FIGURE`.
3. Set `"demo": false` in `site.json`. Every remaining demo record is then
   removed from the site and from every sum, the footer notice goes, and the
   pages stop carrying `noindex`. A section with nothing real in it does not
   render.

Real and demo figures are never added together in a figure presented as real.

### Replace mock rows

- **A case**: add or edit an entry in `cases.json`. `artefact` and `object`
  pick the mock and the 3D object (`drum`, `key-field`, `numpad`,
  `forms-stack`, `mouse`, `sheet`). Add its sample rows to `artefacts.json`
  under the case id. Keep the cost range inside one of the three published
  build ranges.
- **A ledger row**: add it to `ledger.json` with its `caseId` and `crewUnit`.
  `confirmed` is four weeks after `goLive`. Set `stopped` to a date when a
  client stops using the process. Run `npm run ledger` to see the totals.
- **A crew unit**: edit `crew.json`. `runDays` uses 0 for Sunday. The running
  mark shows only for a unit that is not demo, inside its window, in the site
  time zone. `src/lib/crew.ts` has the one function, `isRunning`, that
  decides it; point it at a real status source there.
- **Quiz items and copy**: `products.json` (`items`, `estimates`) and
  `quiz.json`. The rules are data; `src/lib/quiz.ts` only evaluates them.

The counting maths is in `src/lib/ledger.ts` and nowhere else.

## Swap the logotype

The logotype sits behind one component, `src/components/Logotype.astro`, in
two variants: `lockup` and `mark`. It currently draws the Drum direction.
To replace it, redraw those two variants in that file and update
`public/favicon.svg` (a file cannot inherit colour, so its ink is baked in).
Nothing else references the logotype.

## Licensed fonts

The site renders on the open fallbacks (Oswald, Archivo, IBM Plex Mono),
self-hosted through `@fontsource`. When Knockout, Söhne and Söhne Mono are
licensed:

1. Put the `.woff2` files in `public/fonts/`.
2. Check the file names in `src/styles/licensed-fonts.css`.
3. Import that file in `src/layouts/Base.astro`, above `tokens.css`, and
   point the three `<link rel="preload">` tags at the new files.

The token block already lists the licensed families first, so nothing else
changes. The 3D textures (key legends, drum digits) read the same stacks.

## Renders and models

Every 3D object is built in code, in `src/three/objects/`. Two hooks let
offline work replace them without touching scene code. Both are driven by
`src/content/assets.json`:

- **Renders** go in `public/renders/` and are named under `"renders"`. A
  render is drawn as a flat plane in place of the mesh.
- **GLB models** go in `public/models/` and are named under `"models"`.

`tools/blender/README.md` has the pipeline and the format of `assets.json`.
Blender and ffmpeg were not installed when the site was built, so no render
has been made yet.

After changing any object, run `npm run build && npm run stills && npm run build`
so the no-WebGL stills match.

## How it is put together

```
src/
  content/      all copy that is data, and every figure
  lib/          ledger maths, demo mode, quiz rules, tape encoding, crew schedule
  layouts/      Base.astro: head, bar, footer, the one canvas
  components/   counter, case, artefacts, crew card, shift report, logotype...
  pages/        /, /practice/[key], /counting, /quiz, /404
  styles/       tokens.css (pasted from the design system), base, home, pages
  scripts/      scroll choreography (GSAP, ScrollTrigger, Lenis), counter, quiz
  three/        stage.ts (scene manager), still.ts, objects/, scenes/
tools/          check, qa, shots, stills, probe, ledger, blender/
public/         favicon, stills, _headers, renders/, models/
```

- **First paint does not wait for 3D.** HTML, CSS and fonts come first; three.js
  is a separate chunk loaded when the browser is idle. Until the canvas is
  ready the hero shows a token-drawn SVG key in the same place.
- **One canvas, one clock.** `src/three/stage.ts` keeps one renderer behind
  the document. Each section registers a scene; only the scene under the
  middle of the viewport renders; scenes are built as they come near and
  disposed as they leave. Scroll position is the only input.
- **Scrubbed or triggered.** Cameras, objects and layout moves follow scroll
  directly. Mechanisms (a digit rolling, a tally striking, a key being struck)
  fire at a scroll position, play in real time, and undo on the way back up.
- **Fallbacks.** With reduced motion every section renders in its resting
  state and each scene is drawn once into its slot. Without WebGL, or on a
  device that cannot hold frame rate, the slots show stills.

## Licences

GSAP is under GreenSock's standard licence (no charge, commercial use
allowed): https://gsap.com/standard-license. three, Lenis, Astro and the
fonts are MIT or OFL. Third-party skills in `.claude/skills/` are listed in
`docs/THIRD-PARTY.md`.
