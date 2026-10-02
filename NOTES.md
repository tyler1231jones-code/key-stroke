# NOTES

Decisions made during the build, copy that needs the principals' approval,
and what is still open. Written 2 October 2026.

## 1. State of the build

- All eight homepage sections, the four practice pages, `/counting`, `/quiz`
  and the 404 are built. `npm run build`, `npm run check`, `npm run qa` and
  `npm run check:types` pass.
- Homepage figure on the build date: `146,700`, from `138,200` seven days
  earlier, delta `8,500`. Unit totals `14,000` / `47,800` / `33,500` /
  `34,600` / `16,500`. `npm run ledger` prints them for any date.
- Not done by me, by instruction: `wrangler login`, `wrangler deploy`, any
  install outside the project, any account.
- `git init` has been run, so the folder is a repository. Nothing has been
  committed: the first commit is yours. The kit zip and the two top-level
  PDFs are untracked duplicates of what is in `docs/`.

## 2. Machine and tools

| Tool | Found | Consequence |
|---|---|---|
| Node 24.15, git, Edge | yes | |
| Playwright Chromium rev 1243 | already in `ms-playwright`, and it is the build `@playwright/test` 1.63.0 expects | No browser download was needed |
| ffmpeg | **no** | No loops or frame sequences encoded |
| Blender | **no** | **Every 3D object is real-time three.js.** No offline render exists |

I asked once whether to install ffmpeg and Blender and carried on without
them. The hooks are in place: `tools/blender/` (starter script, unrun, and the
pipeline), `public/renders/`, `public/models/`, and `src/content/assets.json`,
which swaps any library object for a render or a GLB with no scene change.

The kit arrived as `keystroke-build-kit.zip` in the project folder, not
unpacked. I unpacked it in place (no file was overwritten). The two PDFs now
exist both at the top of the folder and in `docs/`; the top-level copies and
the zip can be deleted.

### Packages

Every version in `docs/stack.md` resolved and installed together without
change. One addition: `parse5` (dev), used by `tools/check.mjs` to read text
nodes from the built pages.

`npm audit` reports two high-severity advisories, both in the copy of `sharp`
nested inside `@gltf-transform/cli` (a dev-only command-line tool that the
site does not load). `npm audit fix` is offered. I left it alone because it
changes a pinned tool; it has no bearing on what is deployed.

`vite-plugin-glsl` is installed and unused: no scene needed a hand-written
shader.

Fonts are imported as the `latin-*.css` files of the plain `@fontsource`
packages (weights 500 and 600 of Oswald, 400 and 600 of Archivo, 400 and 500
of IBM Plex Mono), not the full `400.css` to `700.css` set, to keep the CSS
small. The arrow in the before/after line (U+2192) is not in the latin subset
of IBM Plex Mono and falls back to the system monospace face.

## 3. Decisions and interpretations

Where the brief left a choice, or could not be done as written, this is what
was done.

**Hero**

- The opening frame is a macro of the worn `V` key, but the edges of its
  neighbours are in frame, as they would be in a real macro. By the end of
  the section they are gone and the key is alone, which is the resting state.
  The drawn SVG stand-in shows the key alone.
- The copy owns its corner of the pinned frame. A key that would cross it at
  any distance of the pull-back is not placed, so the field wraps the copy
  and no key ever passes under a word. The worn key is therefore the leftmost
  key of its row.
- The camera is a perspective camera exactly above the worn key with its lens
  shifted, so the key stays in its slot while the camera moves along one axis.
  After the rows drop out it comes straight back in to the macro.
- The typing wave: the wave front is scrubbed by scroll; each key the front
  passes is struck in real time (90ms down, 120ms up), so nothing freezes
  half-pressed when scrolling stops.
- The delta stamps when the roll begins and is gone 400ms after the roll's
  180ms, so it is on screen while the digits land.

**Counters**

- Every changed cell rolls once, 180ms, linear, with a 60ms cascade from the
  right. "Spin and settle" (the count, crew totals, the Count practice block)
  passes a few digits at 180ms each and lands; the rightmost cell lands last.
- A seam element sits in every cell (the design system's `.seam` rule); the
  sample markup in the Build notes does not show it.
- Counters that are not keystroke figures (sheets left, quiz step, the 404's
  zero) carry `data-figure="other"` so `npm run check` does not test them
  against the ledger.

**The count**

- The drums in the scene spell the same four ledger figures as the counters
  above them, and each group lands as its counter settles. The drums are a
  macro of the counters, not a second set of numbers.
- The band crops the drums top and bottom (a scissor on the scene), and the
  seam hairline at 62% is HTML.

**The cases**

- Cases are **not pinned**. Each is at least one viewport tall and plays as it
  passes. A pinned case has to fit its whole narrative inside the viewport
  under two sticky bars, which fails on a 768px-tall laptop, so the cases flow
  and their mechanisms fire at a scroll line instead.
- The evidence object sits behind and below the artefact panel and travels a
  little slower than the page, so it slides under the panel: depth from two
  flat planes. Drums show the case's own before figure rolling to its after
  figure. Sheets leaving the forms stack always exit away from the copy.
- Filtering reorders with a FLIP move: every case travels along the vertical
  rail from where it was to where it now belongs, 540ms, linear. Matching both
  rows sorts first, matching one sorts next, nothing is hidden.
- The demo plate sits beside the eyebrow, and the counter label also says
  `Demonstration figure`.
- Face cases show their own units in the counter and before/after line
  (`21 days to assemble -> 4 days`, `14 templates -> 1 system`).

**The audit**

- The sheet takes the shift report's proportion rather than A4, so the last
  sheet lands exactly on the HTML report, which then prints over it in eleven
  stepped lines.
- The shift report is a document, so it takes the light theme inside the dark
  page. Its three figures are set as plain figures rather than counter
  housings: in the light theme the counter seam is a light hairline on a dark
  housing and reads as a strike-through at S size.
- The four fields are derived from `products.json` (`price`, `terms`,
  `delivery`, and the "one process" and "one initial tool" lines of
  `includes`).

**Layered parallax**

- The Firewatch technique is used once, as an interlude before the audit: a
  side-on view of stacks of forms at five distances, each layer one flat
  silhouette in one token, depth by value alone, speeds 0.1 / 0.2 / 0.38 /
  0.64 / 1. It is drawn at build time from a seeded generator
  (`src/components/Skyline.astro`). Phones get three of the five layers.

**The crew**

- The design system says the sprocket row runs "through the fifth channel".
  I drew the sprocket row as the fifth of nine rows: four data rows above,
  four below. If the design system's drawing differs, change `SPROCKET_AFTER`
  in `src/lib/tape.ts`.
- Holes are squares, because the system has no circles.
- Bits are most significant first, top to bottom.

**Keystroke Savers**

- Tally strokes are drawn in, 60ms a stroke. This is the one section where
  something is added rather than removed; the brief asks for the hours "drawn
  as tally strokes", so that is what it does.
- On phones the Response column is hidden, because the table would otherwise
  scroll sideways to reach the price. The line under the table states the
  response time for every tier.

**Pinning**

- Hero, the count and the audit pin with CSS `position: sticky`, and only
  when the pinned content fits: at least 960px wide (1100 for the audit) and
  600 / 640 / 820px tall respectively. Below that the section flows and the
  same beats fire as its stage passes through the viewport.
- On phones the hero copy flows and the key scene pins on its own beneath it
  for 320svh. That is sticky, native scrolling, nothing hijacked.

**Scene manager**

- Scenes anchor their objects to HTML slots (`[data-slot]`), so the phone
  layout is decided in CSS and the 3D follows it.
- The cut between two scenes at the viewport's midpoint is covered by a
  scroll-linked dip of the canvas opacity.
- With reduced motion the fixed canvas is not used. Each scene is built once,
  drawn in its resting state into a small 2D canvas inside its slot, and
  disposed, so the still scrolls with the page with no lag.
- Without WebGL, or with no script, the slots show WebP stills
  (`public/stills/`, made by `npm run stills` from the real scenes). The hero
  and the two keys at the foot keep their drawn SVG stand-ins.
- A watchdog steps the pixel ratio down, then hands over to stills, if frames
  stay over 44ms.

**Other pages**

- Practice heroes show a counter computed from the ledger: the sum of
  baseline and of remaining keystrokes a year across that practice's rows
  (Count `127,200 -> 4,600`, Clear `267,100 -> 13,100`, Build
  `72,100 -> 4,100`). These are new presentations of ledger figures.
  Face has no keystroke figure and says why.
- `/counting` reproduces the method from the design system with one change:
  the "812,000 keystrokes cleared this year" example is removed, as the brief
  excludes that line. The two worked examples (`1,920 a week`, `14,600 a
  year`) are kept and are allow-listed in `tools/check.mjs` as examples.
  A "Stopped" column is added to the ledger table.
- The 404 shows a counter at `0` labelled "Pages at this address".

**The check**

- "A keystroke figure" is taken to mean: every counter's contents; any number
  followed by the word keystroke(s); and any number written with a thousands
  separator. Each must be a value in a content file or computed from the
  ledger for the build date.
- It also fails on: the three excluded copy bank lines; "automation" more
  than once a page; a page without exactly one `h1`; a crew card without
  "Not a person."; a missing `noindex` in demo mode.
- `npm run deploy` runs the build, then the check, then `wrangler deploy`.

## 4. Copy for approval

All of this is mine and all of it is a commercial statement. None of it is in
the approved copy bank.

### Quiz: the read

Built from the visitor's own answers. `{evidence}` is the list of evidence
phrases below, joined with commas and "and".

| Template | Text |
|---|---|
| Lead | You told us about {evidence}. |
| One piece of evidence | That is one problem, and it can be counted. |
| Two or more | That is not {n} problems. It is one problem showing up in {n} places. |
| No evidence | Nothing in your answers points to work being done twice, late or by hand. |
| Under 5 people | With fewer than 5 people, the audit is unlikely to repay what it costs. |
| Over 50 people | KEYSTROKE works with businesses of 5–50 staff. Yours is larger, so read this as a first look, not a scope. |
| Buy nothing yet | Our recommendation is to buy nothing yet. |

Evidence phrases, in the order they are listed in the read:

| Answer | Phrase |
|---|---|
| Q6: 3–4 | 3–4 systems that do not talk to each other |
| Q6: 5 or more | 5 or more systems that do not talk to each other |
| Q4: 3–5 days | a month-end that takes 3–5 days |
| Q4: More than a week | a month-end that takes more than a week |
| Q4: We do not really do one | no real month-end at all |
| Q5: Only when it is finished | no view of what a job made until it is finished |
| Q5: No | no view of what a job made |
| Q3: typed twice | the same details typed twice |
| Q3: reports too late | reports that arrive too late to act on |
| Q3: one spreadsheet | one spreadsheet only one person understands |
| Q3: inbox | things waiting in an inbox for approval |
| Q3: unused tool | a tool you pay for and nobody uses |
| Q7: 4–10 years ago | a look last updated 4–10 years ago |
| Q7: Cannot remember | a look nobody can remember updating |

Last sentence of the read, from Q8 (changes the language, not the content):

| Answer | Text |
|---|---|
| Sales | Fix it and the hours go to sales. |
| Delivery | Fix it and the hours go to delivery. |
| The owner goes home on time | Fix it and the owner goes home on time. |
| Fixing the next thing | Fix it and the hours go to fixing the next thing. |

### Quiz: the estimate, the order

- Estimate (only when `re-entry` qualifies, for 5–50 staff): "Businesses of
  {band} people with this symptom typically lose {hours} hours a year to
  re-entry alone. We would have to count yours to be sure." Labelled
  `ESTIMATE / DEMONSTRATION FIGURE` while the bands are demo. Only 80–120 is
  from the plan; 40–70 and 120–200 are the brief's placeholders.
- Order, one item: "Start there."
- Order, several: "Start with number 1. The rest is cheaper once it exists."
- Result headings: "What your answers say." / "Buy nothing yet."

### Quiz: the five closing paragraphs (Q9)

1. **Do not know who to trust.** You do not have to trust us yet. The audit is
   one process, counted from a recording you watch being made, and it ends
   with a figure you can check against your own records. If the count is
   wrong, you will know before you spend anything else.
2. **Cost.** The audit is $1,500, fixed, and includes an initial tool. What
   follows is quoted on hours, inside a range that is published before you
   ask. We quote the build. We don't quote the transformation, because there
   isn't one.
3. **Time.** The audit takes one process and 1–2 weeks. Your part is to do the
   task once, the usual way, while it is recorded. The counting is ours.
4. **Tried before and it failed.** Most attempts that fail start with a
   platform and then try to fit the business to it. We count one process
   first, then build for the business as it is. If the count says there is
   nothing worth building, the report says so.
5. **Not sure it is a real problem.** Then count it before deciding. The audit
   returns the annual figure and its cost in hours for one process. If the
   number is small, you will know, and you can stop there.

The item names in `products.json` are the brief's placeholders and appear in
the result as written.

### Site copy I wrote

| Where | Text |
|---|---|
| Hero eyebrow | For Australian businesses of 5–50 staff |
| The count | We counted. / What one rebuilt process clears in a year. Each figure is a row in the ledger, counted from a recording, not estimated. |
| The cases | What was built, and what it did. / 10 cases, each the same object: the business, the count before, what was wrong, what was built, the count after, and what builds like it cost. |
| Quiz line, second line | About 90 seconds / no email / no sales call unless you ask |
| The audit | The front door / We take one process end to end and count what a person physically does: characters typed, clicks, copies and pastes, attachments. You get the annual figure, what it costs in hours, and what it would be after a rebuild. / The audit is fixed. What follows is quoted on hours, and the audit's own numbers make the case for it. |
| Practices | Three clear the desk. One builds what goes on it. / Clear the desk / Then build what goes on it |
| The crew | **5 units. None of them are people. None of them take leave.** This is the excluded "Seven agents" line with the number computed from `crew.json`. The brief excludes the line for its number; if the sentence itself is unwanted, delete it in `src/pages/index.astro`. |
| Keystroke Savers | The agents keep running. Somebody watches them. / A monthly layer on top of a build. Support covers what KEYSTROKE built. That boundary is what stops it becoming a helpdesk. / Foundation pricing. Response is 1 business day on every tier. The tiers differ on hours alone. |
| The two of us | Kieran and Tyler. That is the whole firm. / Two principals do the work. The people who design a build are the people who deliver it. Nobody hands you to a junior, because there isn't one. |
| Footer | KEYSTROKE / Kieran and Tyler / 2 principals / 5 units / Australia / 2026 · Figures on this site are illustrative until the ledger opens. · The 3D objects stand in for a photo shoot that has not happened. |
| Practice headlines | Count: The report arrives after the decision. Clear: The same details get typed twice. Build: The software assumes a different business. Face: The business grew. The letterhead did not. |
| Practice ledes | Count: Numbers the business cannot see until it is too late to use them. Clear: Work a person does by hand every week, on a schedule a machine could keep. Build: A platform bought for a business shaped differently, still on the card. Face: Practices 01 to 03 clear the desk. This one builds what goes on it. |
| Practice pages | We quote the build. / Every relationship starts with the audit: $1,500, fixed, one process, delivered in 1–2 weeks. What follows is quoted on hours, inside one of three published ranges. |
| Face page note | Design is not effort removed, so it is not counted in keystrokes. Its place is after the rebuild: practices 01 to 03 clear the desk, and this one builds what goes on it. |
| Counting page | One row per cleared task. / the three notes under the ledger table |
| 404 | Nothing here to count. / Somebody typed this address, or followed a link that somebody else typed. Either way it was typed by hand, which is the kind of thing we are against. |
| Disabled controls | Booking link not connected yet / Contact address not connected yet |
| Artefacts | Captions on the sample mocks (`artefacts.json`), for example "6 jobs. Nobody typed this." |

The tagline appears in sentence case with its stop in the footer and as the
upper-case headline in the hero. The Drum lockup carries no tagline.

## 5. Open items

**Config (all `TODO` in `site.json`)**

- `email`: "Ask a question about it" on the quiz result is disabled.
- `bookingUrl`: "Book the audit" is disabled in the audit section, on the
  practice pages and on the quiz result.
- `domain`: not used by any page yet; needed for the Cloudflare route.

**Not verified**

- **No real phone.** Phone layouts were checked at 390 × 844 in Chromium with
  touch emulation only. Lenis, the sticky pins and the frame rate have not
  been tried on a device.
- **Frame rate.** Everything was run on a software WebGL renderer in headless
  Chromium, which says nothing about 60fps on a laptop or 30fps on a phone.
  Scenes are light (the largest is about 160 instanced keys in a handful
  of draw calls), render on demand, and cap the pixel ratio at 2 (1.5 on phones).
  3D memory returns to its starting counts after two full passes of the page.
- **Load.** LCP 0.94s and layout shift 0 on a throttled phone profile
  (9 Mbps, 170ms, CPU four times slower), served locally without compression.
  Compressed sizes: HTML 15 KB, CSS 7 KB, page script 51 KB, the three.js
  chunk 121 KB (loaded after first paint), six font files of 12 to 15 KB.
- **Deploy.** `wrangler.jsonc` was written against the installed Wrangler's
  config schema and Cloudflare's current static assets documentation. It has
  not been run, including as a dry run.
- **Screen readers.** Semantics are in place (one `h1`, a skip link, counters
  as labelled images, filters with `aria-pressed`, real radio and checkbox
  groups, the canvas hidden). Tabbing was tested by script on three pages.
  Nothing was listened to in a screen reader.

**To decide or supply**

- Approve or replace the copy in section 4.
- The licensed fonts (`src/styles/licensed-fonts.css` is ready, not imported).
- Offline renders of the worn key, numpad and mouse, once Blender is there.
- Real cases, ledger rows, crew units and product names; then demo mode off.
- The bounded "ask a question" conversation is not built. The quiz exit is a
  mail link. A Worker route would attach in `src/scripts/quiz.ts` (the place
  is marked) with `main` and `run_worker_first` added to `wrangler.jsonc`.
- Demo mode off with all records still demo leaves a short site: hero without
  a counter, the audit without a sample report, practices, Savers, the two of
  us. That is by design, and worth seeing once before real rows go in.

**Known rough edges**

- Resizing a window across a pin breakpoint mid-page can leave a mechanism in
  the wrong state until the next scroll. A reload fixes it.
- A reduced-motion visitor without WebGL gets the stills; a no-script visitor
  gets the stills and the resting layout, and the quiz explains that it needs
  script.
- The typing wave in the hero and the key strikes need a few frames after
  scrolling stops; the stage keeps drawing until they finish.
