# Build brief: the KEYSTROKE website

Draft 3 / 2 October 2026 / for Fable 5.1 in Claude Code, run from the project folder.

## 0. What this is

You are building the launch website for KEYSTROKE, a two-person Australian firm (Kieran and Tyler) that takes the manual admin out of businesses of 5–50 staff and rebuilds it so it runs itself. A crew of software agents runs the scheduled work overnight. The firm counts the inputs a person no longer has to make, and the brand is that number going down.

You are working in Claude Code, in the project folder. It already holds:

- `CLAUDE.md`, the standing rules for this project.
- `docs/KEYSTROKE - Business plan 2026-27.pdf` and `docs/KEYSTROKE - Design system.pdf`. Read both in full before you write anything.
- `docs/build-brief.md`, this file. It says what to build, where it departs from those two documents, and what content to use.
- `docs/stack.md`, the packages, versions and tools to use.
- `docs/skill-corrections.md`, where the skills are out of date. Read it before using any `threejs-*` or `gsap-*` skill.
- `.claude/skills/`, 25 skills: 23 covering GSAP, three.js, model optimisation, Cloudflare, performance and front-end design, and two written for this job, `scroll-storytelling` and `prerendered-3d`. Use them. Read `scroll-storytelling` and its `references/reference-sites.md` before you plan the homepage.

This is not a standard brochure site. It is a scroll-driven piece with real-time 3D, rendered 3D, motion graphics and choreographed sections from top to bottom. The visitor scrolls and the site does the typing: keys press themselves, counters roll, stacks of forms clear, tallies strike out. Treat it as a showpiece that also loads fast, reads properly with motion off, and deploys cleanly to Cloudflare.

Three sites set the level of craft: firewatchgame.com for layered depth, sbs.com.au/theboat for a story told by one scrolling canvas, and melaniedaveid.com for monochrome rendered 3D. Section 2a says what to take from each. None of them is to be copied; the KEYSTROKE site has its own subject and its own rules.

## 1. Precedence

1. This brief.
2. The design system: tokens, type, voice, components, crew rules, counting method.
3. The business plan: site structure, sections, prices, quiz.

Where this brief and the design system disagree about motion, this brief wins. Section 2 is a deliberate amendment by the principals, not an oversight. Everything else in the design system holds.

Five places the documents disagree, settled here:

- **Showcase layout.** Vertical, one case per viewport, narrative left and artefact right (the plan). The design system's case tile supplies the anatomy of the figure, the before/after line, the tally bar and the foot. Its horizontal rail and its two-sentence copy limit do not apply; case copy follows the plan (one sentence on what was wrong, up to three lines on what was built).
- **Crew size.** Five units. Do not use "Seven agents" from the copy bank.
- **Guarantee line.** Do not use "If the number doesn't move, you don't pay for the month it didn't move in." It is not an agreed commercial term.
- **The 812,000 line.** Do not use "812,000 keystrokes cleared this year." The homepage figure and its label are computed from the ledger.
- **The quiz estimate.** The plan has the quiz return an indicative figure for businesses of that size; the design system allows no house average. Keep the plan's figure, in hours, on the quiz result only, labelled as an estimate and followed by "We would have to count yours to be sure." It never appears in a counter and is never stated in keystrokes.

## 2. Motion amendment (replaces the design system's motion limits for this site)

The design system allows one moving counter per page and bans fades, scaling, parallax, entrance animation, and anything in the hero beyond a headline and a counter. For the website those limits are lifted. Motion, 3D and scroll choreography run through every section.

What the motion has to feel like:

- **Mechanical, not decorative.** Things roll, press, strike, clear, index and advance on rails. Borrow from odometers, keyboards, punched tape, tally counters and plotters. If a move could sit on any agency site, replace it.
- **Scroll is the input.** The state of every section follows from scroll position, and scrolling back up undoes it. Add smooth scrolling so scenes feel weighted rather than jittery.
- **Scrub what is continuous; trigger what has a duration.** Cameras, 3D objects, parallax layers and layout moves are scrubbed directly to scroll position. Mechanisms (a digit rolling, a figure being struck, a tally clearing, text typing on) are fired at a scroll threshold and play in real time at the design system's durations: a digit rolls in 180ms linear, a tally clears at 60ms a stroke. They reverse when the visitor scrolls back above the threshold. Do not scrub a mechanism.
- **Two timing registers.** Mechanisms stay `linear` or `steps()`. These are the brand signature and do not change. Cameras, 3D objects and layout moves may ease in and out so the piece feels cinematic rather than stiff.
- **No bounce, elastic or overshoot anywhere.** A mechanism lands and stops.
- **Prefer mechanical reveals** (clip, wipe, roll, slide on a rail, type-on, assemble) to plain opacity fades. Opacity is fine for depth, fog and scene transitions.
- **The direction of travel is decrement.** By the end of each section something is fewer than at the start: keys, sheets, strokes, digits.
- **Parallax and rendered footage are allowed.** The design system's "nothing parallaxes" and "no video in the hero" are lifted with the rest. Layered parallax is in. Rendered 3D loops and scrubbed frame sequences are in, anywhere, as long as they follow the photography brief and have a still poster.
- **Colour does not animate as decoration.** `signal` appears once per viewport, in one of two forms: a delta (`− n`) that holds 400ms and is gone, or the struck baseline on a case, which stays. A settled figure is never `signal`.

Still out, amendment or not: a scroll cue in the hero; any background pattern or texture, including film grain; loading spinners, progress rings, progress bars and percentages (something that takes time shows a count); gradients as decoration.

Copy, the nav and the logotype always sit on a solid token ground or over an empty region of a scene, never across a lit object. Lay each scene out around its text, and hold 4.5:1 with the scene at its brightest.

## 2a. What to take from the three reference sites

The teardown is in `.claude/skills/scroll-storytelling/references/reference-sites.md`. For this site:

- **From Firewatch: depth built from flat layers.** Its hero is nine flat, single-colour silhouettes moving at nine speeds. KEYSTROKE's palette is already flat neutral greys, so the same technique works in the Instrument tokens with distance shown by value alone. Use it wherever a scene is a side-on view: rows of keys receding, a desk edge, stacks of forms at different distances. Recipe: `recipes/layered-parallax.js`.
- **From The Boat: one canvas, one clock.** The whole piece is a single WebGL canvas whose every movement follows scroll, with the heavy effects spent on a few moments. Build the homepage the same way, with a scene per section. Do not copy its virtual scrolling or its text-in-canvas; the page scrolls natively and all copy is HTML. Recipe: `recipes/scroll-stage.js`.
- **From Melanie Daveid: rendered objects.** Its 3D is rendered offline, monochrome, softly lit and matte, and shipped as stills and a loop. That is the design system's photography brief. Where an object has to look exactly right (the worn key, the polished numpad, the worn mouse), render it offline and scrub or loop the frames. Skill: `prerendered-3d`. Recipe: `recipes/image-sequence.js`. Take the renders, not that site's grain or rounded cards.

The measure of success is that the finished site belongs in that company. It should not resemble any of them.

## 3. What does not change

- The twelve Instrument tokens. No new colour, no warmth, no gradients. Dark is theme one.
- Type: Oswald (display, upper case only), Archivo (body), IBM Plex Mono (every figure, tabular). Keep Knockout, Söhne and Söhne Mono first in each stack so the licensed files drop in later.
- Radii stop at 6px. No pills, no circles. No CSS shadows except on key-shaped controls. No icon library; glyphs are characters in the data family.
- Every figure sits in the data family, including mid-sentence and inside a display headline (wrap the numerals in a span). Body copy never exceeds 66 characters a line. No italics. No emoji. No exclamation marks.
- Voice: flat, precise, faintly amused by waste. Numbers before adjectives. Apply the three tests and the banned word list to every line you write. Approved copy bank lines may be used as written, except the three excluded in section 1.
- Australian English, AUD, 24-hour time with the zone.
- Figures are never rounded up and never abbreviated. Where one is rounded down, the label or the footer line says so.
- The crew is software and is presented as software. Every crew surface carries `Not a person.` at field weight. Designations are a unit number and a verb. No human names, faces, avatars, personas, or any pronoun other than it.
- `live` has two uses and no others: a 2px underline on the active nav item, and a 9px square shown while a crew unit is running. It is never text and it does not blink. While a crew unit's data is demo, the running mark is never shown.
- One XL counter on the whole site, on the homepage. No button in the hero.
- The 3D objects stand in for a photo shoot that has not happened. Say so once, in `plate`, in the footer line.
- Published prices are exactly: the audit, the three indicative build ranges, the three Keystroke Savers tiers, and the cost range on each case. Nothing else is priced.

Paste the `:root` token block, the counter markup and the counter CSS from the design system's Build notes verbatim. Do not retype values. The only permitted additions are responsive rules for phones (section 11).

## 4. Stack and deploy

- Use the packages and versions in `docs/stack.md`, and scaffold the way it describes. Run `node -v` first; Astro needs Node 22.12 or later.
- **Astro**, static output, TypeScript. No UI framework unless a component needs one.
- **Three.js** (`WebGLRenderer`) for 3D. **GSAP with ScrollTrigger** for choreography. **Lenis** for smooth scrolling. Do not use GSAP ScrollSmoother; it breaks `position: sticky`, which the pinned sections and the filter bar rely on.
- Fonts self-hosted through the plain `@fontsource` packages named in `docs/stack.md`, not a Google Fonts link and not the `@fontsource-variable` packages, whose family names do not match the token block.
- **Deploy target: Cloudflare Workers with static assets**, not Pages. A `wrangler.jsonc` with an assets directory pointing at the build output, and `npm run deploy` that builds then runs `wrangler deploy`. Check Cloudflare's current documentation before you configure it.
- Do not deploy, log in to Cloudflare or create accounts. Leave a repo that deploys with one command and a README that says how.
- At the start, check for Node, ffmpeg, Blender and Playwright's browser. If any is missing, tell the user once, in one message, what is missing and what it is for, and ask whether to install it. Do not wait for the answer: carry on with everything that does not need it. Without Playwright's browser, take screenshots through the Edge already on the machine (`channel: 'msedge'`).

## 5. Architecture

- **One persistent WebGL canvas**, fixed behind the document. All copy, headings and figures are real HTML above it. The canvas never carries meaning on its own.
- **A scene manager.** Each section registers its objects, camera path and scroll range. Only the scene under the middle of the viewport renders; scenes are built as they come near and disposed as they leave. Start from `recipes/scroll-stage.js`. The canvas is transparent where no scene is current, and each section supplies its own ground colour in HTML and CSS, not as a scene background.
- **3D is made here, in code.** Download no models and no stock footage. Each object in section 7 exists in up to two forms: a real-time version built in three.js from geometry and generated textures, and, if Blender is installed, an offline render made by a Python script kept in `tools/blender/`, shipped as a still, a loop or a frame sequence. If Blender is not there, build everything real-time, record that in `NOTES.md`, and leave the hooks so renders can replace it later. Keep a loader and a `models/` folder so a GLB can replace any object.
- **Content lives in `src/content/*.json`.** No figure, case, unit or price is written into a template. The homepage counter and every running total are computed from `ledger.json`, at build time for the HTML and again on load.
- **Demo mode.** Every case, unit, ledger row, product item and sample in section 10 is mock. `site.json` carries `"demo": true` and each record carries its own `demo` flag.
  - A demo case shows the plate `DEMONSTRATION BUILD / FIGURES ILLUSTRATIVE`.
  - A counter is labelled `DEMONSTRATION FIGURE` while any row that feeds it is demo.
  - While `site.demo` is true, the footer says the figures are illustrative until the ledger opens, and every page carries `noindex`.
  - Setting `site.demo` to false removes every remaining demo record from the site and from every sum. Real and demo figures are never added together in a figure presented as real.
- **Logotype.** Build the Drum direction as an inline SVG component bound to tokens, with its reduced mark for narrow headers and the favicon. Keep it behind one component so Tally can replace it. The Drum lockup takes no tagline and is static in the nav.
- **Config.** `site.json` holds the contact email, booking link and domain as `TODO` values. While a value is `TODO`, the control that needs it renders disabled, with no link target, `npm run check` prints a warning, and `NOTES.md` lists it. Do not invent a phone number, address, ABN, surname or biography.

## 6. Homepage storyboard

Eight sections, one scroll. This is the intended sequence. Improve the craft; keep the idea of each beat. Each entry ends with its resting state, which is what the section shows once its motion has played, and what it shows from the start when the visitor prefers reduced motion.

1. **Hero.** One continuous `base-900` field. Headline `LET US PUSH THE BUTTONS FOR YOU.` in `display-xl`, an eyebrow, and the lede "Somebody in your office types the same invoice details three times. We counted." The copy sits on empty ground to the left; the scene occupies the right and the space below.
   - Opening frame: an exactly overhead macro of one worn keycap, its legend half gone. The legend is `V`, the paste key. It is not `K`: a worn K keycap is the Keycap logotype's mark, which this build does not use.
   - On scroll the key presses by itself. The camera stays overhead and pulls straight back, and the key turns out to be one in a full field of keys, depressing in waves as if typed by nobody.
   - The keys drop out of the field row by row until one is left, the worn key, while the XL counter housing indexes in on its strip.
   - The counter first shows the total as it stood seven days ago (the same maths run for that date, and 0 if that date falls in the previous year), then rolls to today's total. The delta, `− n`, stamps once in `signal`, holds 400ms, and is gone. `n` is the difference between those two displayed figures, so the stamp always matches the roll. If the two are equal there is no roll and no delta.
   - Second voice line ranged right: "We don't sell transformation. We sell a smaller number than the one you've got."
   - Resting state: eyebrow, headline, lede, the second voice line, the one worn key, the counter settled on today's total, no delta.
2. **The count.** Pinned. The four largest cleared-per-year figures in the ledger, each an M counter with its scope and date in the label. Each counter starts with blank cells. As the visitor scrolls, each in turn spins and settles on its figure (the design system's counter settle: the last digit lands and stops). Behind them, a macro of odometer drums turning, seam at 62%, the camera tracking along the axle. No `signal` in this section.
   - Resting state: four settled figures with labels.
3. **The cases.** The reason the site exists. One case per viewport, stepping as the visitor scrolls.
   - Left: eyebrow `CASE 001`, the descriptor, the symptom as the headline, what was wrong, what was built, the cost range, the practice tag and the crew unit.
   - Right: the artefact, a small live mock built from tokens in HTML or SVG showing the thing running: a report table filling itself, a form writing a job, a reconciliation list ticking through. Never a stock image, never a dashboard screenshot. Artefacts may show invented sample rows such as job numbers and amounts; mark the element `data-artefact`. An artefact never shows a keystroke figure.
   - On entry, the M counter shows the before figure and rolls down to the after figure. The housing keeps the number of cells the before figure needs; cells the after figure does not use go blank, not to zero. Beneath it the before/after line appears: the baseline struck in `signal` with a 2px rule, an arrow, the remainder in `ink`. The struck baseline stays; it is the one `signal` in that viewport.
   - The tally bar is 20 segments, all `rule` to begin with. They are struck from the left, one every 60ms, turning to `ink`, until the cleared share is reached. Round the cleared share down to a whole segment, so a case with anything left to type never shows a full bar.
   - Cases 009 and 010 are Face work. They show their own units in the same counter and before/after line, and have no tally bar and no crew unit.
   - Each case also has one evidence object from the 3D library in the scene behind it.
   - A sticky filter bar carries two rows, practice and business type. Filtering reorders on rails and never empties the list.
   - After the fourth case, one line inside the showcase: "Not sure which of these is you? Nine questions."
   - Resting state: the counter on the after figure, the before/after line with the baseline struck, the tally bar struck to its share.
4. **The audit.** A stack of the same printed form, edge on, forty deep. Scrolling removes sheets until one is left. It turns face on and becomes the shift report in HTML, filled from `shiftReport.json`: the count, the cost in hours, a ranked list of what to fix, a scoped quote. Four fields beside it: `$1,500` fixed, `1–2` weeks, `1` process defined in writing, `1` initial tool included. Then what happens next: the three indicative build ranges from `products.json`. One button: "Book the audit".
   - Resting state: the shift report, the four fields, the ranges, the button.
5. **Practices.** Four blocks, each linking to its page, each with a mechanism that runs as it enters. Count: digit cells settling. Clear: a tally striking out. Build: cells assembling into a grid. Face: a blank sheet ruling itself into a letterhead. Lay the section out as a sequence, because practices 01 to 03 clear the desk and practice 04 builds what goes on it.
   - Resting state: each mechanism in its finished position.
6. **The crew.** Five roster cards built exactly to the design system's crew card. Punched tape advances across each plate as the visitor scrolls. Running totals are S counters computed from the ledger. Keep this section flat, with no 3D behind it: the roster is the exhibit.
   - Tape: eight data rows and a sprocket row placed as the design system draws it. Encode the string `UNIT 01 / RECONCILE` (upper case, plain ASCII) one character per column, one hole per set bit of its ASCII code. Generate it from the text.
   - Plate: designation left, as `Unit 01 — Reconcile` in the plate style; crew position right as `01 / 05`.
   - Status bar: `Not a person.` left; the fixed word `SOFTWARE` right. It is not a status.
   - Running mark: one function, `isRunning(unit)`, decides it, so a real status source can replace the schedule later. It returns false while the unit is demo. Otherwise it is true when the time in `Australia/Brisbane` is inside the unit's window on one of its `runDays`.
   - Resting state: five cards, tape still, totals settled.
7. **Keystroke Savers.** Three tiers in a table, named as foundation pricing, one business day response on every tier. Hours drawn as tally strokes: 10, 20, 35. State what the tiers include and that support covers what KEYSTROKE built.
   - Resting state: the table, all strokes drawn.
8. **The two of us.** Kieran and Tyler, named plainly as the whole firm, in two or three flat sentences. Two unworn keycaps side by side, K and T. No portraits. Then the footer: one `plate` line, the demo notice, the stand-in notice, "Keystroke totals are rounded down to the nearest hundred.", and a link to the counting method.
   - Resting state: as described; the keycaps are a still.

## 7. 3D object library

Build these once and reuse them across sections, cases and practice pages. The three with wear (key, numpad, mouse) are the ones worth rendering offline, because the wear is the whole point and it has to read as real.

- A worn keycap with a `V` legend, and the same key, unworn and blank, instanced into a full field
- An odometer drum row
- A stack of forty identical printed forms, edge on
- A numeric keypad with the 4, 5 and 6 polished and the rest matte
- A mouse with the finish gone off the left button only
- A single sheet (tender page, letterhead)
- Two clean keycaps, K and T

All of it follows the design system's photography brief. Shell in `base-900`, face in `readout`, sides in `rule`. Neutral greys only, no environment colour, no warmth. One flat, even light source. Cameras are square-on or exactly overhead, at rest and while moving between scenes: travel along those two axes, not through a three-quarter angle. Deep focus, no bokeh. Ground is `base-000` or `base-900`. Wear is asymmetric texture, not a repeating pattern. `signal` and `live` never appear on a 3D object. Read colours for 3D from the CSS custom properties at run time, so no token value is written into scene code.

## 8. Other pages

- `/practice/count`, `/practice/clear`, `/practice/build`, `/practice/face`. A symptom headline, the one-line "sells" statement and capability list from the plan, the three indicative build ranges, that practice's cases, and the audit button. One signature scroll sequence each, reusing the library.
- `/counting`. Light theme, because it is a document. The counting method as published in the design system, then the ledger as a table: scope, baseline a year, remaining a year, frequency, go-live, confirmed, accrued to date (computed). Almost no motion.
- `/quiz`. Section 9.
- A 404 that stays in voice.

Nav in `plate`: Cases, Audit, Practices, Crew, Savers, Counting. No dropdowns. The bar is sticky. There is no theme toggle. The first five are anchors on the homepage; the `live` underline marks the current page only, so on the homepage no item carries it, and there is no scroll-spy.

## 9. The quiz

Nine questions, about ninety seconds, one per screen, tappable answers only, a progress marker that starts at `1 of 9`, no email gate. Each screen advances like a counter indexing. Build the interpreter as deterministic rules over `quiz.json` (the questions, options and rules below, which you write out as data) and `products.json`. No model call.

1. What kind of business? *Trades and construction / Professional services / Transport and logistics / Manufacturing / Property / Wholesale / Health / Something else.* Sets which cases they see. "Something else" leaves the showcase unfiltered.
2. How many people? *Under 5 / 5–10 / 11–25 / 26–50 / Over 50.* Sizing.
3. Which of these happens every week? (multi) *The same details get typed twice / Reports arrive too late to act on / One spreadsheet only one person understands / Things wait in an inbox for approval / We pay for a tool nobody uses / None of these.* Choosing "None of these" clears the others, and choosing any other clears it.
4. How long does month-end take? *Under a day / 1–2 days / 3–5 days / More than a week / We do not really do one.*
5. Can you see what a job made while it is running? *Yes, any day / Roughly, at month-end / Only when it is finished / No.*
6. How many systems do not talk to each other? *None / 1–2 / 3–4 / 5 or more.*
7. When did you last update how the business looks? *This year / 1–3 years ago / 4–10 years ago / Cannot remember.* The only route to Face. No judgement in the wording.
8. If you got fifteen hours a month back, where would it go? *Sales / Delivery / The owner goes home on time / Fixing the next thing.* Changes the language of the result, not its content.
9. What is stopping you fixing this today? *Do not know who to trust / Cost / Time / Tried before and it failed / Not sure it is a real problem.* Selects the closing paragraph.

**Rules.** An item from `products.json` qualifies when its condition is met:

| Item | Qualifies when |
|---|---|
| `reporting-pack` | Q3 includes "Reports arrive too late" or "One spreadsheet", or Q4 is 3–5 days, more than a week, or "We do not really do one" |
| `job-costing` | Q5 is "Only when it is finished" or "No" |
| `re-entry` | Q3 includes "typed twice" or "wait in an inbox" |
| `integration` | Q6 is 3–4 or 5 or more |
| `application` | Q3 includes "a tool nobody uses" |
| `identity` | Q7 is 4–10 years ago or "Cannot remember" |

Recommend at most three, taken in the `order` given in `products.json` (Count, then Clear, then Build, then Face). That order is also "the order to do them in". Link each to the case from its `cases` list that matches the Q1 business type, or the first in the list, and show the item's `band` range.

- **Buy nothing yet:** Q2 is "Under 5", or no item qualifies. The result is the read, one sentence recommending they buy nothing yet, and the closing paragraph. No estimate, no items, and no "Book the audit" exit; the other two exits remain.
- **Over 50:** run the rules as usual, add one sentence saying the firm works with businesses of 5–50 staff, and show no estimate figure.
- **The estimate** is shown only when `re-entry` qualifies, because it is a figure about re-entry. Otherwise the result carries no figure.

The result returns, in this order: a two or three sentence read that names their problem back to them using their own answers; the estimate for their size band where it applies, labelled as an estimate, followed by "We would have to count yours to be sure."; the recommended items; the order; and the closing paragraph for their Q9 answer from `quiz.json`.

Guardrails: never more than three items. Never a price for custom work beyond the published ranges. Nothing diagnosed beyond what the answers support.

Write the read as templates filled from the answers, in the brand voice, and list every template and the five closing paragraphs in `NOTES.md` for the principals to approve. They are commercial statements.

Three exits at equal weight, no pressure hierarchy. The result has its own URL with the answers encoded in the hash.

- **Email me this:** a mail link with no recipient, the result URL in the body, so the visitor sends it to themselves.
- **Ask a question about it:** a mail link to `site.email` with the result URL.
- **Book the audit:** a link to `site.bookingUrl`.

Then return them to the showcase filtered to their business type.

## 10. Content (all mock; demo mode on)

Write these into `src/content/`. Do not add cases, units, figures or testimonials of your own. Write any connecting copy the pages need in the brand voice, and keep it short.

`site.json`

```json
{
  "demo": true,
  "name": "KEYSTROKE",
  "tagline": "Let us push the buttons for you.",
  "principals": ["Kieran", "Tyler"],
  "email": "TODO",
  "bookingUrl": "TODO",
  "domain": "TODO",
  "logotype": "drum",
  "timezone": "Australia/Brisbane"
}
```

`cases.json`

```json
[
  {"id":"001","practice":"count","businessType":"Trades and construction","descriptor":"Mechanical contractor · 22 staff · Toowoomba","headline":"NOBODY KNOWS WHAT A JOB MADE UNTIL IT IS FINISHED.","wrong":"Job costs were retyped from the job system into a spreadsheet once a month, four days after the month closed.","built":"An API pipeline from simPRO and Xero into a Power BI model. The job-cost pack builds itself overnight.","before":{"value":41900,"unit":"keystrokes a year","note":"Four days late, every month."},"after":{"value":400,"unit":"keystrokes a year","note":"06:00 AEST on the 1st: the report is there."},"crewUnit":"03","costRange":"$6,000–$9,000","scope":"Monthly job-cost reporting","goLive":"2026-02-09","artefact":"report-table","object":"drum","demo":true},
  {"id":"002","practice":"clear","businessType":"Trades and construction","descriptor":"Electrical contractor · 14 staff · Geelong","headline":"THE INVOICES GET TYPED TWICE.","wrong":"Every job sheet was typed once into the job system and again into the accounts.","built":"A Power Automate flow. The completed job form writes the invoice draft in Xero and routes it for approval.","before":{"value":58200,"unit":"keystrokes a year","note":"Typed twice."},"after":{"value":2100,"unit":"keystrokes a year","note":"Typed once, on site."},"crewUnit":"02","costRange":"$6,000–$8,000","scope":"Job sheets to invoices","goLive":"2026-03-02","artefact":"form-writes-invoice","object":"key-field","demo":true},
  {"id":"003","practice":"count","businessType":"Professional services","descriptor":"Accounting practice · 9 staff · Ballarat","headline":"MONTH-END TAKES FOUR DAYS.","wrong":"Bank lines were matched by eye and client packs were assembled by copying between workbooks.","built":"A reconciliation agent, an Excel system built to hold, and a pack generator that reads from both.","before":{"value":33600,"unit":"keystrokes a year","note":"Four days."},"after":{"value":1800,"unit":"keystrokes a year","note":"One morning."},"crewUnit":"01","costRange":"$7,000–$11,000","scope":"Month-end reconciliation and client packs","goLive":"2026-03-23","artefact":"reconcile-list","object":"numpad","demo":true},
  {"id":"004","practice":"clear","businessType":"Transport and logistics","descriptor":"Freight operator · 38 staff · Townsville","headline":"THE QUOTE LIVES IN FOUR PLACES.","wrong":"A quote was written in Word, then retyped into the job board, the accounts and the customer email.","built":"One quote record in a SharePoint list. Document generation writes the PDF and Power Automate tells the other three.","before":{"value":96400,"unit":"keystrokes a year","note":"Four places."},"after":{"value":6300,"unit":"keystrokes a year","note":"One place, which tells the other three."},"crewUnit":"04","costRange":"$9,000–$14,000","scope":"Quoting","goLive":"2026-04-13","artefact":"one-record-three-targets","object":"forms-stack","demo":true},
  {"id":"005","practice":"build","businessType":"Manufacturing","descriptor":"Joinery manufacturer · 17 staff · Newcastle","headline":"TIMESHEETS ARRIVE ON PAPER ON FRIDAY.","wrong":"Paper timesheets were typed into payroll and typed again against each job.","built":"A time-tracking web app on Cloudflare. Hours are entered once on the floor and feed payroll and job costing.","before":{"value":27300,"unit":"keystrokes a year","note":"Typed twice, a week late."},"after":{"value":900,"unit":"keystrokes a year","note":"Entered once, the same day."},"crewUnit":"02","costRange":"$15,000–$22,000","scope":"Timesheets to payroll and job costing","goLive":"2026-05-04","artefact":"timesheet-app","object":"mouse","demo":true},
  {"id":"006","practice":"build","businessType":"Property","descriptor":"Property manager · 11 staff · Bendigo","headline":"EVERY MAINTENANCE REQUEST IS AN EMAIL SOMEBODY RETYPES.","wrong":"Tenant emails were read, then retyped as a work order, a tradesperson booking and an owner notice.","built":"An intake form and a small web app. The request writes the work order, the booking and the notice.","before":{"value":44800,"unit":"keystrokes a year","note":"Retyped three times."},"after":{"value":3200,"unit":"keystrokes a year","note":"Written once, by the tenant."},"crewUnit":"02","costRange":"$15,000–$20,000","scope":"Maintenance requests","goLive":"2026-05-25","artefact":"request-to-three","object":"key-field","demo":true},
  {"id":"007","practice":"count","businessType":"Professional services","descriptor":"Civil engineering consultancy · 31 staff · Wollongong","headline":"PROJECT HOURS ARE KNOWN SIX WEEKS LATE.","wrong":"Timesheets were exported, cleaned by hand and pasted into a project workbook after invoicing.","built":"An API pipeline from the timesheet system into Power BI project analytics. A daily report lands before work starts.","before":{"value":51700,"unit":"keystrokes a year","note":"Six weeks late."},"after":{"value":2400,"unit":"keystrokes a year","note":"06:00 AEST, daily."},"crewUnit":"03","costRange":"$10,000–$15,000","scope":"Project hours and analytics","goLive":"2026-06-15","artefact":"report-table","object":"drum","demo":true},
  {"id":"008","practice":"clear","businessType":"Wholesale","descriptor":"Wholesale distributor · 26 staff · Launceston","headline":"THREE SYSTEMS. ONE PERSON COPYING BETWEEN THEM.","wrong":"Orders, stock and accounts were kept in step by one person copying and pasting each afternoon.","built":"An integration between the order system, the inventory system and MYOB. An agent syncs them overnight and lists the exceptions.","before":{"value":112500,"unit":"keystrokes a year","note":"Copied every afternoon."},"after":{"value":4700,"unit":"keystrokes a year","note":"Exceptions only."},"crewUnit":"05","costRange":"$16,000–$24,000","scope":"Order, stock and accounts sync","goLive":"2026-07-06","artefact":"three-system-sync","object":"forms-stack","demo":true},
  {"id":"009","practice":"face","businessType":"Trades and construction","descriptor":"Builder · 19 staff · Mackay","headline":"3 WEEKS PER TENDER. EACH ONE STARTS FROM THE LAST.","wrong":"Each tender was assembled from the previous one, in Word, over three weeks.","built":"A tender system: structure, messaging, page templates and a library of answers the business owns.","before":{"value":21,"unit":"days to assemble","note":"60 pages, from old files."},"after":{"value":4,"unit":"days","note":"60 pages. 4 days. Won."},"crewUnit":null,"costRange":"$6,000–$9,000","scope":"Tender and EOI material","goLive":"2026-06-01","artefact":"tender-pages","object":"sheet","demo":true},
  {"id":"010","practice":"face","businessType":"Health","descriptor":"Allied health clinic · 12 staff · Albury","headline":"THE BUSINESS GREW. THE LETTERHEAD DID NOT.","wrong":"14 document templates, made by different people over ten years, none matching.","built":"One identity and one template system: letterhead, reports, forms and signage drawn from the same rules.","before":{"value":14,"unit":"templates","note":"None matching."},"after":{"value":1,"unit":"system","note":"Everything drawn from it."},"crewUnit":null,"costRange":"$6,000–$10,000","scope":"Identity and document system","goLive":"2026-07-20","artefact":"letterhead-system","object":"sheet","demo":true}
]
```

Cases 009 and 010 are Face work. Their unit is not a keystroke, they have no ledger row and no crew unit, and they add nothing to any counter.

`ledger.json`

```json
[
  {"id":"L-001","caseId":"001","crewUnit":"03","baselinePerYear":41900,"remainingPerYear":400,"frequency":"Monthly","goLive":"2026-02-09","confirmed":"2026-03-09","stopped":null,"demo":true},
  {"id":"L-002","caseId":"002","crewUnit":"02","baselinePerYear":58200,"remainingPerYear":2100,"frequency":"Each job","goLive":"2026-03-02","confirmed":"2026-03-30","stopped":null,"demo":true},
  {"id":"L-003","caseId":"003","crewUnit":"01","baselinePerYear":33600,"remainingPerYear":1800,"frequency":"Monthly","goLive":"2026-03-23","confirmed":"2026-04-20","stopped":null,"demo":true},
  {"id":"L-004","caseId":"004","crewUnit":"04","baselinePerYear":96400,"remainingPerYear":6300,"frequency":"Each quote","goLive":"2026-04-13","confirmed":"2026-05-11","stopped":null,"demo":true},
  {"id":"L-005","caseId":"005","crewUnit":"02","baselinePerYear":27300,"remainingPerYear":900,"frequency":"Weekly","goLive":"2026-05-04","confirmed":"2026-06-01","stopped":null,"demo":true},
  {"id":"L-006","caseId":"006","crewUnit":"02","baselinePerYear":44800,"remainingPerYear":3200,"frequency":"Each request","goLive":"2026-05-25","confirmed":"2026-06-22","stopped":null,"demo":true},
  {"id":"L-007","caseId":"007","crewUnit":"03","baselinePerYear":51700,"remainingPerYear":2400,"frequency":"Daily","goLive":"2026-06-15","confirmed":"2026-07-13","stopped":null,"demo":true},
  {"id":"L-008","caseId":"008","crewUnit":"05","baselinePerYear":112500,"remainingPerYear":4700,"frequency":"Daily","goLive":"2026-07-06","confirmed":"2026-08-03","stopped":null,"demo":true}
]
```

Counter maths, following the counting method:

- A row accrues nothing before its `confirmed` date, which is four weeks after go-live.
- Its weekly rate is `(baselinePerYear − remainingPerYear) / 52`.
- Its accrual this year is the weekly rate times the number of completed 7-day periods between the later of its `confirmed` date and 1 January of the current year, and today (or its `stopped` date). "Today" is the date in `Australia/Brisbane`.
- The homepage total is the sum of those accruals. A unit's running total is the same sum over its own rows.
- Add first, then round down to the nearest hundred, once, for display. Unit totals are rounded separately and need not add up to the homepage figure.
- The cleared-per-year figure for a row is `baselinePerYear − remainingPerYear`.

`crew.json`

```json
[
  {"unit":"01","verb":"Reconcile","function":"Matches bank lines and records between systems. Does not post a journal or approve a payment.","start":"02:00","end":"03:10","zone":"AEST","days":"Every day","runDays":[0,1,2,3,4,5,6],"runs":"7 runs a week","demo":true},
  {"unit":"02","verb":"Intake","function":"Turns submitted forms into jobs, invoice drafts and work orders. Does not contact a customer.","start":"03:10","end":"03:40","zone":"AEST","days":"Every day","runDays":[0,1,2,3,4,5,6],"runs":"7 runs a week","demo":true},
  {"unit":"03","verb":"Report","function":"Builds the reporting packs from source. Does not change a figure.","start":"04:00","end":"05:40","zone":"AEST","days":"Every day","runDays":[0,1,2,3,4,5,6],"runs":"7 runs a week","demo":true},
  {"unit":"04","verb":"Draft","function":"Drafts quotes and documents from one record. Does not send anything.","start":"03:40","end":"04:00","zone":"AEST","days":"Monday to Friday","runDays":[1,2,3,4,5],"runs":"5 runs a week","demo":true},
  {"unit":"05","verb":"Sync","function":"Keeps records in step between systems and lists the exceptions. Does not resolve an exception.","start":"05:40","end":"05:55","zone":"AEST","days":"Every day","runDays":[0,1,2,3,4,5,6],"runs":"7 runs a week","demo":true}
]
```

`products.json`

```json
{
  "audit": {"name":"The Keystroke Audit","price":"$1,500","terms":"Fixed","delivery":"1–2 weeks","includes":["One process, defined in writing","The count and its cost in hours","A ranked list of what to fix","A scoped quote for the first build","One initial tool"]},
  "builds": [
    {"band":"small","name":"Small engagement","range":"$2,500–$4,000"},
    {"band":"typical","name":"Typical build","range":"$6,000–$15,000"},
    {"band":"large","name":"Integration and software","range":"Above $15,000"}
  ],
  "items": [
    {"id":"reporting-pack","order":1,"practice":"count","name":"A reporting pack that builds itself","band":"typical","cases":["001","003","007"],"demo":true},
    {"id":"job-costing","order":2,"practice":"count","name":"Job costing you can read while the job is running","band":"typical","cases":["001","007"],"demo":true},
    {"id":"re-entry","order":3,"practice":"clear","name":"One entry that writes every system","band":"typical","cases":["002","004"],"demo":true},
    {"id":"integration","order":4,"practice":"clear","name":"Systems that keep each other in step","band":"large","cases":["008"],"demo":true},
    {"id":"application","order":5,"practice":"build","name":"A tool built for how the business runs","band":"large","cases":["005","006"],"demo":true},
    {"id":"identity","order":6,"practice":"face","name":"One identity and one set of documents","band":"typical","cases":["010","009"],"demo":true}
  ],
  "estimates": {"demo":true,"unit":"hours a year lost to re-entry","bands":{"5–10":"40–70","11–25":"80–120","26–50":"120–200"}},
  "savers": {
    "label":"Foundation pricing",
    "response":"1 business day",
    "includes":["Monitoring and repair of everything we built","The monthly reporting pack, produced and checked","A block of change hours","A scheduled review"],
    "tiers":[
      {"name":"Watch","hours":10,"monthly":"$1,500"},
      {"name":"Run","hours":20,"monthly":"$3,000"},
      {"name":"Own","hours":35,"monthly":"$5,250"}
    ]
  }
}
```

The item names and the estimate bands other than 80–120 are placeholders for the principals to replace. Every case's cost range sits inside one of the three published build ranges; keep it that way if you touch them.

`shiftReport.json`, the sample shown in the audit section:

```json
{
  "demo": true,
  "client": "Electrical contractor · 14 staff · Geelong",
  "process": "Job sheets to invoices",
  "recorded": "2026-01-19",
  "count": {"value": 58200, "unit": "keystrokes a year"},
  "hours": {"value": 95, "unit": "hours a year"},
  "afterRebuild": {"value": 2100, "unit": "keystrokes a year"},
  "fixes": [
    {"rank": 1, "what": "Job details typed into the job system, then again into the accounts", "count": 41800},
    {"rank": 2, "what": "Invoice PDFs attached and sent by hand", "count": 11600},
    {"rank": 3, "what": "Approvals chased by email", "count": 4800}
  ],
  "quote": {"scope": "Job sheets to invoices", "range": "$6,000–$8,000"}
}
```

## 11. Performance, fallbacks and accessibility

- First paint does not wait for 3D. HTML, CSS and fonts first; Three.js loads as its own chunk afterwards. Until the canvas is ready the hero shows a token-drawn SVG key in the same position, swapped with no layout shift.
- Cap device pixel ratio at 2 on desktop and 1.5 on phones. Stop rendering when the tab is hidden.
- Frame sequences request one frame at load and the rest when their section is near.
- Targets: LCP under 2.5s on a mid-range phone on 4G, no layout shift, 60fps on a current laptop, 30fps or better on a mid-range phone.
- No WebGL, or a device that cannot hold frame rate: fall back to static SVG or rendered stills per section.
- `prefers-reduced-motion`: no smoothing and no scrubbing. Every section renders in the resting state given in section 6, counters show settled figures, and the canvas draws one still frame per section.
- Semantic HTML with one `h1`. A skip link. Pinned sections must not trap keyboard focus. Filters are buttons with `aria-pressed`. Quiz answers are real radio and checkbox groups. Focus is the 2px square ring.
- Every text pair holds 4.5:1. Check any new pair you introduce.

Phones get the same story with lighter scenes: fewer keys, fewer sheets, shorter sequences, and no pinning that fights touch scrolling. The page never scrolls sideways. Specifically, below 720px:

- The XL counter keeps its proportions and scales from one custom property so that six cells and the separator fit the viewport with `space-4` margins. Nothing else about the counter changes.
- The hero headline drops to the largest display size at which the longest word fits the measure.
- The nav becomes the reduced mark and a text control, `MENU`, that opens a full-screen list of the same six items. No icon.
- The two filter rows scroll sideways inside their own container.
- A case stacks: narrative, then artefact.

## 12. How to work

1. Read both PDFs, `CLAUDE.md`, `docs/stack.md`, `docs/skill-corrections.md` and the `scroll-storytelling` skill. Write `PLAN.md`: the scenes, which technique each one uses, components and build order. Then start; do not wait for approval.
2. Build in this order: scaffold, tokens, type and content files; every section as static HTML in its resting state, with no motion; the counter and ledger maths; 2D scroll choreography; 3D scenes one at a time; the other pages; the quiz; fallbacks and performance.
3. Load the matching skill before each kind of work: `gsap-scrolltrigger` and `gsap-timeline` for choreography, the `threejs-*` skills for scenes, `threejs-errors-rendering` when a scene is black or wrong, `threejs-errors-performance` and `web-perf` for the performance pass, `prerendered-3d` for anything rendered offline, `wrangler` for the deploy configuration, `frontend-design` for layout decisions the design system leaves open.
4. After each stage, run the build and look at it. With `@playwright/test`, take screenshots at 1440×900 and 390×844 at several scroll positions, read them, and fix what you see before moving on. The first version that works is not the finished one. Do a craft pass on timing, spacing and camera moves.
5. Add `npm run check`, and keep it passing. It reads the rendered text of the built pages (text nodes only, not markup, scripts or styles) and the built CSS, and fails on:
   - a banned word outside an approved copy bank line;
   - an exclamation mark or an emoji in text;
   - `font-style: italic`, a radius above 6px, or a colour value that is not a token;
   - a keystroke or dollar figure in text that does not match a value in a content file or one computed from the ledger. Text inside `[data-artefact]` is skipped.
   It warns, without failing, on any `TODO` left in `site.json`.
6. Where something in this brief cannot be done well, do the nearest good thing and record it in `NOTES.md`. Do not drop it silently.

Deliver: the repo; a README covering run, build, deploy to Cloudflare, turning demo mode off, replacing mock rows, swapping the logotype, and where licensed fonts, renders and GLB models go; and `NOTES.md` with your decisions, the quiz copy for approval, and open items.

## 13. Not in this build

- Sound. No audio of any kind.
- The bounded "ask a question" conversation. Leave the quiz exit as a mail link and note where a Worker route would attach.
- A CMS, analytics, a booking system, a blog, cookie banners.
- The Tally and Keycap logotypes.
- Photography, licensed fonts, real client names or logos.
