# KEYSTROKE: build notes for handover

Written 5 October 2026 by the session that did the first build, revision 1
and revision 2 (2 to 3 October). It is the companion to `HANDOVER.md`, which
another session wrote the same day and which covers the business, the
deployment, the forms, the quiz, pricing, the legal pages and today's open
items. This file covers what that one does not: how the site is put
together, which older documents are now wrong, the traps, and what was never
verified. No secret values are in this file.

Read `CLAUDE.md` first. Its standing rules still apply.

## Which document to trust

| Document | Written | Status |
|---|---|---|
| `CLAUDE.md` | 2 Oct | Current. Standing rules and precedence |
| `HANDOVER.md` | 5 Oct | Current. The state of the business and the live site. On this computer only: it is kept out of the public repository |
| `README.md` | Updated 5 Oct (twice) | Current. Run, build, forms, prices, deploy, content files, what stays out of git |
| `NOTES.md` | 3 Oct | **A snapshot of the end of revision 2.** Still right about decisions and why. Wrong about state (list below) |
| `AUDIT-motion.md`, `AUDIT-mobile.md`, `AUDIT-seo.md` | 3 Oct | The method and the findings stand. The scores were measured before the 5 October changes and I have no record of them being run again |
| `PLAN.md`, `REVISION-PLAN.md`, `REVISION-2-PLAN.md` | 2 to 3 Oct | History only |
| `docs/build-brief.md`, `revision-1.md`, `revision-2.md` | 2 Oct | The briefs. Revision 2 wins, then revision 1, then the brief |

Where `NOTES.md` is now wrong, checked against the repository today:

| `NOTES.md` says | Now |
|---|---|
| Revision 2 is not committed | Committed (`d8dbc44`), on `main`, pushed to GitHub |
| The forms run in development mode | They are live. `npm run forms` now posts real enquiries |
| Nothing is deployed; `npm run deploy` refuses to run | The site deploys from `main` through Cloudflare's own build, which does not run that guard |
| The cases are mock | All twelve have `demo: false` |
| `/savers` shows the three plan prices | It shows a longer price list from `src/content/prices.json` |
| The weekly change under the hero counter was moved (decision 11) | Removed (`148bea9`) |
| Decision 10: the 3D start was changed for phones only | Still right for phones (a touch, a scroll or 3.5 seconds). A desktop now starts it at once and no longer waits for the browser to go idle (`ea1833d`) |
| There is no Worker script | `src/worker.ts` answers `/api/*` |
| The quiz result is worked out by rules | Claude writes it; the rules in `src/lib/quiz.ts` are the fallback |
| I wrote the privacy page | It now renders the owner's text from `legal.json`. `/terms` was added |

## How the site is put together

Things that are not obvious from reading one file.

- **Pages are files, not folders.** `astro.config.mjs` sets `build.format:
  'file'` and `trailingSlash: 'never'`, so `/audit` is `dist/audit.html`. At
  build time `Astro.url.pathname` is `/audit.html` (and `/index.html` for the
  homepage). `Base.astro` strips that; anything new that reads the path must
  do the same. No internal link ends in a slash.
- **One layout.** `src/layouts/Base.astro` holds the head, share tags,
  structured data, header, closing band, footer, the phone bar and the one
  canvas. Page-level options are its props (`band`, `service`, `bookHref`,
  `crumbs`, `faq`, `schema`, `noindex`).
- **Stylesheet order matters.** `Base.astro` loads `tokens.css`,
  `motion.css`, `base.css`, `parts.css` in that order. A page's own
  stylesheet (`home.css`, `pages.css`, `demos.css`) must be imported in the
  page's frontmatter **after** `Base.astro`. Rules of equal weight are won by
  the later file. The phone text sizes sit at the end of `parts.css` for
  that reason: placed in `base.css` they were silently overridden.
- **All content is data.** Copy and every figure are in `src/content/*.json`.
  `npm run check` fails on a keystroke figure that is not in a content file
  or computed from the ledger.
- **Price switches.** `products.json` has `display` flags per area and a
  `quoteLine` shown where a price is switched off.
- **One motion system.** `src/styles/motion.css`: three durations (0.15s,
  0.4s, 0.7s), two easings, 70ms stagger, `[data-reveal]` for text and
  `[data-reveal="card"]` for cards. `src/scripts/site.ts` adds the class
  `pre` only to blocks below the fold, so a page without script shows
  everything. Mechanisms (a digit rolling, a key press) stay linear.
- **Moving between pages** is the browser's cross-document view transition,
  two lines of CSS. It is not Astro's client router, on purpose: the canvas,
  smooth scrolling and scroll triggers need a clean start on every page.
- **3D.** `src/scripts/stage.ts` loads the three.js chunk after first paint.
  One renderer sits behind the document (`src/three/stage.ts`); the scenes
  are the homepage hero and the audit page. Until it is ready the hero shows
  a drawn SVG key in the same place. `?debug` on any address starts the stage
  at once and exposes GSAP to the audit tools.
- **The hero scroll sequence is protected.** Revision 2 said it must not be
  changed. After any change near it, compare frames at the same scroll
  positions before and after.
- **Service demonstrations.** HTML, CSS and SVG, each driven by one GSAP
  timeline (`src/scripts/demos.ts`, `src/components/demos/`,
  `src/styles/demos.css`). Progress 0 is "before", 1 is "after"; each rests
  on "after". On the homepage the four take turns. Every colour and radius
  inside a frame is a `--demo-*` property, which is how the check tells an
  illustration from the site. Colour appears nowhere else.
- **Forms.** One component, `EnquiryForm.astro`, and one script,
  `src/scripts/forms.ts`. Google's script loads only when a form nears the
  viewport or takes focus.
- **Search.** `src/lib/seo.ts` builds the structured data. Share images are
  in `public/og/`: after changing a title or description, run build, then
  `npm run og`, then build again. The Savers structured data still reads the
  three plans from `products.json`, not the newer `prices.json`; check the
  two agree.
- **Phones.** As built in revision 2: tap targets are 48px and running text
  16px below 900px; the header is tightened below 480px so the mark, the
  button and "Menu" fit a 360px screen; a bar with the button is fixed to
  the foot of the screen below 720px and hides while a form or the footer is
  on screen.

## Checks and tools

- Always `npm run build`, then `npm run check`. The check reads `dist/`.
- `npm run check` fails on: a dollar figure anywhere but `/savers`; a banned
  word, an exclamation mark or an emoji; italics, a radius over 6px or a
  colour that is not a token (outside the demonstration frames); a figure not
  from a content file; `TODO` or builder's terms on a page; a disabled
  control; a crew card without the tag `AI agent`; a page without `noindex`
  while demo mode is on.
- `npm run qa`, `npm run audit:motion`, `npm run audit:mobile` and
  `npm run lighthouse` each take 3 to 12 minutes and read `dist/`. Do not
  rebuild while one is running.
- Lighthouse runs on the Chromium that Playwright already installed. Nothing
  else was installed on the machine.
- `npm run audit:contrast` checks the text inside the demonstrations in both
  states. Lighthouse only sees whichever state a demonstration is in when it
  looks.
- `tools/shots.mjs` takes `--route=quiz` with no leading slash (see Traps).
- **`npm run forms` posts real enquiries now.** Do not run it without the
  owner saying so.
- This machine draws WebGL in software. Frame times for the 3D scenes
  measured here say nothing about a real device.

## Traps on this machine

- Windows, Git Bash for the Bash tool. A heredoc whose body has an odd number
  of apostrophes fails with "unexpected EOF". Backticks and `$` inside
  `node -e "..."` are eaten by the shell. For anything with quotes or
  template strings, write a script file with the Write tool and run it.
- Git Bash rewrites an argument that starts with `/` into a Windows path.
- `cd` inside a Bash call moves the tool's working folder for later calls.
- The Write tool refuses a file that changed on disk since it was last read.
  Read it again first.
- Keep every file inside the project folder. Ask before installing anything
  outside it.
- There is no Python on this machine. Script with Node.
- The Read tool cannot render PDF pages here (no `pdftoppm`), so passing
  `pages` fails. Read the whole PDF instead.

## Onboarding forms

Added 8 October on the branch `onboarding` (`docs/onboarding-brief.md`,
README "Onboarding forms"). Templates are TypeScript files in
`src/onboarding/templates/`, checked when the site builds
(`src/onboarding/index.ts`): a bad id, a show-if that points at nothing or
waits for an answer that is not offered, a field that asks for a password,
or more than 10 uploads in one form stops the build. The pages are generated
only once `forms.formspreeOnboardId` is set, or with `npm run build:onboard`.
`node tools/onboard-test.mjs` drives every form end to end and writes each
email's contents to `shots/onboard/`. `Base.astro`, `Nav.astro` and
`Footer.astro` gained a `minimal` prop for these pages; the Worker gained
`/api/stamp`.

## The repository is public

`github.com/tyler1231jones-code/key-stroke` can be read by anyone. Since
5 October the business plan and design system PDFs, the build kit zip,
`HANDOVER.md`, `src/content/signatures.json` and the `signatures/` folder are
kept out of git by `.gitignore`; they are still on this computer. They are
still in the history of earlier commits, which removing them from the latest
commit does not change. Making the repository private, or rewriting its
history, is the principals' decision. Check `git status` before every commit.

## Decisions from revisions 1 and 2 that still hold

- Crew cards must never read as human staff, and crew copy never uses "he",
  "she" or "it".
- Nothing on a page may show `TODO` or a disabled control. A value set to
  `TODO` in `site.json` leaves its line off the page.
- The line under each form reads "This site is protected by reCAPTCHA."
  with a link to `/privacy`. That is Google's wording for a hidden badge.
- The dollar rule has no exceptions: the invented sample rows in case
  illustrations lost their dollar signs too.
- `npm run check` no longer rations the word "automation"; it is in a
  service's name.
- Cloudflare Web Analytics, once its token is set, counts page views only.
  Enquiries are counted in Formspree.
- Day names keep their capital in page titles (`sentenceCase` in
  `src/lib/format.ts`); case headlines are stored in capitals.

## Still open from revisions 1 and 2

These are not in `HANDOVER.md`'s list.

1. Twelve FAQ questions are held off the page in `src/content/faqs.json`
   with `"a": "TODO"` and a note saying what fact is missing (31 are
   answered and shown). Several touch the conflicts `HANDOVER.md` lists:
   minimum term, unused hours, ownership of code and files.
2. The invented businesses in the demonstrations (Tarnwick Plumbing,
   Wattlemere Freight, Corrimba Fitouts and its contact Dana Whitlock,
   Mallowby Bakehouse) were searched with a tool that returns United States
   results. Search each once in Australia.
3. ~~"You get a report and a fixed quote" is still the third step of the
   audit.~~ Read beside the pricing policy on 5 October: it agrees (the
   Keystroke Audit ends with a scoped build quote, presented as a fixed
   total). The audit pages now say the Keystroke Audit is fixed price and
   the first conversation and a quick initial audit are free.
4. The site renders on open stand-in fonts (Oswald, Archivo, IBM Plex Mono).
   The licensed faces (Knockout, Söhne, Söhne Mono) were never bought;
   `README.md` says how to swap them in.
5. No offline render was ever made. Blender and ffmpeg are not installed.
6. The three audits are worth running again now that the Worker, the new
   quiz, the price list and the legal pages exist.
7. `keystroke-build-kit.zip` and two PDFs duplicated from `docs/` sit at the
   top of the folder. They are out of git now, but still on disk.

## Never verified

- A real phone or tablet. Everything was emulated Chromium.
- Safari and Firefox.
- A screen reader.
- Frame rate on a real graphics chip.

Verified since: the redirects in `public/_redirects` are served by Cloudflare
(5 October: `/practice/clear` and `/services/automation` return 301 to the
new service addresses).

## Skills

The 25 skills used for the build are in `.claude/skills/` and are exported,
with their corrections and licences, in `keystroke-skills-export.zip` at the
top of the project folder (on disk only; zips are kept out of git, and the
same skills are committed in `.claude/skills/`). Read `docs/skill-corrections.md` before any
`threejs-*` or `gsap-*` skill.

## Where Claude's own records are

- Memory for this project folder:
  `C:\Users\User\.claude\projects\C--Users-User-Desktop-KEYSTROKE\memory\`.
  It holds one note, the shell traps above. A new Claude Code session opened
  in the same folder on the same machine loads it by itself. Anywhere else,
  this file carries the same content.
- Session transcripts are in the folder above that one. `HANDOVER.md` says a
  reCAPTCHA secret key was pasted in chat, so treat those transcript files as
  holding a secret and do not pass them on.

## Working with the owner

- The three large jobs arrived as long written briefs, pasted whole, each
  ending "Do not deploy". Follow the brief's order of work and report against
  its own checklist.
- Commit or push only when asked. A push to `main` deploys.
- Report what was not verified, and what went wrong on the way, as plainly as
  what worked.
