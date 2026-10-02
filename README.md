# KEYSTROKE website

A short sales site with one scroll-driven hero and real-time 3D, built with
Astro, three.js, GSAP and Lenis, deployed to Cloudflare Workers as static
assets.

The brief is `docs/build-brief.md`. `docs/revision-1.md` revised it, and wins
where the two disagree. Decisions, the copy awaiting approval and the open
items are in `NOTES.md`.

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

`npm run check` fails on:

- a banned word outside an approved copy bank line, an exclamation mark or an emoji
- `font-style: italic`, a radius above 6px, or a colour that is not a token
- a keystroke or dollar figure that is not in a content file or computed from the ledger
- text written for the builder, not the customer: `TODO`, a demo label, the
  old "5 to 50 staff" limit, or an internal term (ledger, baseline, a unit,
  practice or case number) anywhere but the counting page
- a disabled control
- a crew card without the tag `AI agent`
- a page without `noindex` while demo mode is on

It warns on any `TODO` left in `site.json`. Text inside `[data-artefact]` is
skipped: artefacts show invented sample rows.

Other scripts:

| Script | Does |
|---|---|
| `npm run ready` | Says whether the content is fit to publish, and lists what is not (see "Go live") |
| `npm run tour -- --tag=after` | One contact sheet per page and size, top to bottom, in `shots/after/` |
| `npm run shots -- --route=quiz --size=phone` | Screenshots at chosen scroll positions (see the header of `tools/shots.mjs`) |
| `npm run stills` | Re-renders the fallback stills in `public/stills/` from the real scenes |
| `npm run ledger` | Prints the totals the site computes from the ledger, for today or a given date |
| `npm run check:types` | `astro check` |

## Pages

| Route | Page |
|---|---|
| `/` | The homepage: hero, proof, four services, the audit in three steps, three cases, the crew, Savers, the quiz band |
| `/services`, `/services/[slug]` | The four services: `automation`, `reporting`, `web-software`, `brand-design` |
| `/cases`, `/cases/[id]` | Every case as a card, and each case in full |
| `/audit` | The audit. Its last block, `/audit#book`, is where every "Book the audit" control goes |
| `/crew` | The five AI agents |
| `/savers` | Keystroke Savers |
| `/quiz` | Nine questions |
| `/counting` | The counting method and the ledger. Linked from the footer |

The old `/practice/*` addresses redirect to the service pages: Cloudflare
reads `public/_redirects`, and `astro.config.mjs` writes fallback pages for
any other host.

## Deploy to Cloudflare

The target is **Cloudflare Workers with static assets**, not Pages.
`wrangler.jsonc` points `assets.directory` at `dist/` and serves `404.html` for
unknown addresses. There is no Worker script.

```bash
npx wrangler login     # once, in your own browser
npm run deploy         # ready check, build, check, then wrangler deploy
```

Nobody has run `wrangler login` or `wrangler deploy` on this repo yet.

### Go live

Every case, figure, crew total and estimate on the site is **mock**. The
pages no longer say so, so `npm run deploy` refuses to publish until the mock
content is gone. It stops, and lists what is left, while any of these is true:

- `site.json` has `"demo": true`
- any record in any content file has `"demo": true`
- `email` or `bookingUrl` in `site.json` is still `TODO`

Run `npm run ready` at any time to see the same list without deploying.
While `site.demo` is true every page also carries `noindex`.

To go live:

1. Set `email` and `bookingUrl` in `src/content/site.json`. Until they are
   set, the contact details are simply left off the page: nothing is shown
   disabled and nothing prints `TODO`.
2. Replace each mock record with a real one and set its `"demo"` to `false`:
   cases, ledger rows, crew agents, the quiz items and estimates in
   `products.json`, and the sample report.
3. Set `"demo": false` in `site.json`. Any record still marked demo then
   drops off the site and out of every sum.
4. `npm run deploy`. After the first deploy, attach the domain in the
   Cloudflare dashboard and set `domain` in `site.json`.

Set `yearsExperience` in `site.json` to a number to show the experience line
under "Australian owned and operated" on the homepage. While it is `TODO` the
line is left out.

## Content

Everything the site states lives in `src/content/*.json`. No figure, case,
agent or price is written into a template.

| File | Holds |
|---|---|
| `site.json` | Demo switch, tagline, description, origin line, years of experience, contact email, booking link, domain, the three featured cases, logotype, time zone |
| `services.json` | The four services: name, one line, what it is, three examples, the practice name kept as a small label, the 3D object |
| `cases.json` | The twelve cases. `service` files a case under a service; `summary` is the one sentence on its card |
| `ledger.json` | One row per cleared task. Every counter is computed from this |
| `crew.json` | The five AI agents: name, role, character, schedule |
| `products.json` | The audit and its three steps, the three build ranges, the quiz items, the estimate bands, Keystroke Savers |
| `shiftReport.json` | The sample report on the audit page |
| `quiz.json` | The nine questions, the rules, the read templates and the five closing lines |
| `artefacts.json` | Invented sample rows for the illustration on each case page |
| `assets.json` | Offline renders and GLB models that replace built 3D objects |

### Replace mock rows

- **A case**: add or edit an entry in `cases.json`. Give it a `service`
  (`automation`, `reporting`, `web-software` or `brand-design`) and a
  one-sentence `summary`. Add its sample rows to `artefacts.json` under the
  case id. Keep the cost range inside one of the three published build ranges.
- **The featured three** on the homepage are named in `site.json`,
  `featuredCases`. Keep them from different services.
- **A ledger row**: add it to `ledger.json` with its `caseId` and `crewUnit`.
  `confirmed` is four weeks after `goLive`. Set `stopped` to a date when a
  client stops using the process. Run `npm run ledger` to see the totals.
- **A crew agent**: edit `crew.json`. `runDays` uses 0 for Sunday. The running
  mark shows only for an agent that is not demo, inside its window, in the
  site time zone. `src/lib/crew.ts` has the one function, `isRunning`, that
  decides it; point it at a real status source there.
- **Quiz items and copy**: `products.json` (`items`, `estimates`) and
  `quiz.json`. The rules are data; `src/lib/quiz.ts` only evaluates them.

The counting maths is in `src/lib/ledger.ts` and nowhere else.

## Crew avatars

The five avatars are SVG files in `src/assets/crew/`, named by the agent's
name in lower case (`tilly.svg`, `ivy.svg`, `paige.svg`, `drew.svg`,
`link.svg`). They are inlined, so they take the site's colour tokens.

To use supplied artwork, put a file with the same name in that folder (svg,
png, jpg, webp or avif) and delete the drawn one. `src/components/Avatar.astro`
is the only place that loads them.

Whatever the artwork, the crew must never read as human staff: no photographs
and no photorealistic faces. Every crew card carries the tag `AI agent`, and
`npm run check` fails if one does not.

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
changes. The 3D textures (the key legend, drum digits) read the same stacks.

## Renders and models

Every 3D object is built in code, in `src/three/objects/`. Three kinds of
page use the canvas: the homepage (the worn K key and its field), the audit
page (the stack of forms) and the service pages (one object each, named in
`services.json`). Two hooks let offline work replace the service objects
without touching scene code, both driven by `src/content/assets.json`:

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
  assets/crew/  the five avatars
  lib/          ledger maths, demo mode, quiz rules, crew schedule, formatting
  layouts/      Base.astro: head, header, closing band, footer, the one canvas
  components/   counter, cards (service, case, tier, crew), report, artefact, logotype
  pages/        /, /services, /cases, /audit, /crew, /savers, /quiz, /counting, /404
  styles/       tokens.css (pasted from the design system), base, parts, home, pages
  scripts/      hero choreography, reveals and rolling figures, quiz, case filter
  three/        stage.ts (scene manager), still.ts, objects/, scenes/
tools/          check, predeploy, qa, tour, shots, stills, probe, ledger, blender/
public/         favicon, stills, _headers, _redirects, renders/, models/
```

- **First paint does not wait for 3D.** HTML, CSS and fonts come first; three.js
  is a separate chunk loaded when the browser is idle. Until the canvas is
  ready the hero shows a token-drawn SVG key in the same place.
- **One large set piece.** The homepage hero is driven by scroll: cameras and
  objects follow it directly, and mechanisms (a digit rolling, a key being
  struck) fire at a scroll position and undo on the way back up. The audit
  page and each service page have one smaller scroll moment in their hero.
- **Everything else is quiet.** The hero assembles once per browser session,
  in about 1.2 seconds. Inner pages bring in their heading and first block.
  Below that, blocks rise in once as they are reached and figures roll into
  place once. `src/scripts/site.ts` does both.
- **One canvas, one clock.** `src/three/stage.ts` keeps one renderer behind
  the document. Scenes are built as they come near and disposed as they leave.
- **Fallbacks.** With reduced motion nothing animates: every page renders in
  its resting state and each scene is drawn once into its slot. Without
  WebGL, or on a device that cannot hold frame rate, the slots show stills.
  Without JavaScript every page still reads in full, apart from the quiz.

## Licences

GSAP is under GreenSock's standard licence (no charge, commercial use
allowed): https://gsap.com/standard-license. three, Lenis, Astro and the
fonts are MIT or OFL. Third-party skills in `.claude/skills/` are listed in
`docs/THIRD-PARTY.md`.
