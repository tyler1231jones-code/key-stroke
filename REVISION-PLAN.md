# Revision 1 plan

Follows the revision brief of 2 October 2026 ("Revision 1: clearer, simpler,
built to convert"). The state before this revision is commit `1d33a55`
("Before revision 1"). Before screenshots are in `shots/before/` (not
committed), made with `node tools/tour.mjs --tag=before`.

The test for anything this plan does not cover: can a business owner who has
never heard of KEYSTROKE say what it is and what to do next, in a few seconds?

## What stays

Tokens, type, the counter, the key-shaped control, the Drum logotype, the
stack (Astro, three.js, GSAP, Lenis, Workers static assets), the one canvas
and its scene manager, the ledger maths, the quiz rules engine, and the hero
scroll sequence (only its legend changes).

## Order of work

Each step ends with a build and a look at the pages it touched, at 1440×900
and 390×844.

| # | Brief | Work | Files |
|---|---|---|---|
| 1 | §0 | One line in `CLAUDE.md` saying the revision brief wins. Save the revision brief as `docs/revision-1.md` so the line has something to point at | `CLAUDE.md`, `docs/revision-1.md` |
| 2 | §11 | Content: new `site.json` keys; crew names, roles, character; `service` on every case, cases 011 and 012 and their sample artefact rows; one-sentence `summary` per case; Savers `suits` and `foundationNote`; practices become services (name, one line, what it is, three examples, slug); quiz copy cut; featured cases named in `site.json` | `src/content/*.json`, `src/lib/data.ts`, `src/lib/format.ts` |
| 3 | §2, §10 | Shell: header (Services, Cases, Audit, Crew, Savers, Quiz, key-shaped Book the audit), phone menu, rebuilt footer, closing band, larger keys, section spacing, load-in and reveal styles, no demo or TODO text | `src/layouts/Base.astro`, `src/components/Nav.astro`, `Footer.astro`, `ClosingBand.astro`, `BookButton.astro`, `src/styles/base.css`, `src/scripts/site.ts` |
| 4 | §3.1 | Hero: K legend everywhere (3D key, SVG stand-in, stills, comments), load-in once per session, description sentence, audience line removed, two 56px buttons. Scroll sequence untouched | `src/pages/index.astro`, `src/three/scenes/hero.ts`, `src/three/objects/keycap.ts`, `src/three/objects/index.ts`, `src/components/KeySvg.astro`, `src/styles/home.css`, `src/scripts/home.ts` |
| 5 | §3.2–3.9 | Homepage below the hero: proof strip (no drum scene, digits roll in place), four service cards, the audit in three steps, three featured cases, crew row, three Savers cards, quiz band, origin line | `src/pages/index.astro`, `src/components/ServiceCard.astro`, `CaseCard.astro`, `Avatar.astro`, `TierCard.astro`, `src/styles/home.css` |
| 6 | §7 | Crew: five SVG avatars in `src/assets/crew/`, new card, `/crew` page | `src/assets/crew/*.svg`, `src/components/Avatar.astro`, `CrewCard.astro`, `src/pages/crew.astro` |
| 7 | §4 | Cases: card with five things, `/cases` with one filter row, `/cases/[id]` with the depth | `src/components/CaseCard.astro`, `src/pages/cases/index.astro`, `src/pages/cases/[id].astro`, `src/scripts/cases.ts`, `src/components/Artefact.astro` |
| 8 | §5 | Services: `/services` and `/services/[slug]`, one small scroll moment each, `/practice/*` redirected | `src/pages/services/index.astro`, `src/pages/services/[slug].astro`, `src/three/scenes/service.ts`, `src/scripts/service.ts`, `public/_redirects`, `astro.config.mjs` |
| 9 | §6 | Audit page: four blocks, the stack-of-forms sequence shortened at the top, the booking block at the foot | `src/pages/audit.astro`, `src/components/ShiftReport.astro`, `src/three/scenes/audit.ts`, `src/scripts/audit.ts` |
| 10 | §8 | Savers page: one sentence, three tier cards, what every plan includes, the foundation note | `src/pages/savers.astro` |
| 11 | §9 | Quiz: in the header, size wording and the under-five rule removed, result cut to the read, the items and the next step, no disabled controls | `src/content/quiz.json`, `src/lib/quiz.ts`, `src/scripts/quiz.ts`, `src/pages/quiz.astro` |
| 12 | §12 | Counting page and 404 simplified to the same rules; rounding notice lives on `/counting` | `src/pages/counting.astro`, `src/pages/404.astro` |
| 13 | §12 | Remove what is no longer used: drum, case and keycap-pair scenes, the parallax interlude, tally bars, punched tape, practice mechanisms, the old case article and filter script | `src/three/scenes/*`, `src/components/*`, `src/scripts/*`, `src/lib/tape.ts`, `public/stills/*` |
| 14 | §10 | Publishing guard: `npm run deploy` stops while the site or any record is demo, or email or booking link is `TODO`. `npm run check` drops the demo-label checks and adds: no `TODO`, no demo wording, no disabled control, no audience limit, `AI agent` on every crew card | `tools/predeploy.mjs`, `tools/check.mjs`, `package.json` |
| 15 | §13 | After screenshots, hero sequence compared frame by frame with the before set, `check`, `qa`, build. `README.md` and `NOTES.md` rewritten for the new site, with the per-page answers and the copy awaiting approval | `tools/qa.mjs`, `tools/stills.mjs`, `README.md`, `NOTES.md` |

## Decisions made up front

- **Routes.** Service pages take the `service` values the brief gives the
  cases: `/services/automation`, `/services/reporting`,
  `/services/web-software`, `/services/brand-design`.
- **Book the audit** always goes to `/audit#book`. That block is the closing
  band of the audit page. It shows the booking link and the email address
  only when they are set, and nothing in their place when they are not.
- **Closing band.** Every page ends with it, with two exceptions decided by
  sense: the homepage ends as section 3 of the brief sets out (quiz band,
  origin line, footer), and the quiz page has no band because its result
  already ends on the next step.
- **3D.** The canvas stays on three kinds of page only: the homepage (hero),
  the audit page (forms stack) and the service pages (one object each).
  Everything else is HTML.
- **Motion.** Scroll-entry reveals and figure rolls play once and do not undo
  on the way back up. The hero sequence still scrubs both ways.
- **Crew avatars** are keycap-headed characters, so they read as friendly and
  as plainly not human. Every card carries the tag `AI agent`, and
  `npm run check` fails if one does not.
- **The counting method** keeps its full published text, folded under a short
  plain summary, so the page a visitor first sees is half the length.
