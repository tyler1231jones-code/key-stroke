# KEYSTROKE website

A short sales site with one scroll-driven hero, real-time 3D on two pages,
four animated service demonstrations and one enquiry form. Built with Astro,
three.js, GSAP and Lenis, deployed to Cloudflare Workers as static assets.

The brief is `docs/build-brief.md`. `docs/revision-1.md` revised it, and
`docs/revision-2.md` revised that; the later file wins where they disagree.
Decisions, the copy awaiting approval and the open items are in `NOTES.md`.
The three audits are `AUDIT-motion.md`, `AUDIT-mobile.md` and `AUDIT-seo.md`.

## Run

Needs Node 22.12 or later.

```bash
npm install
npm run dev        # http://localhost:4321
```

## Build and check

```bash
npm run build      # static site into dist/
npm run check      # copy, colour, price and figure rules, read from the built pages
npm run qa         # browser checks: measure, contrast, keyboard, load, 3D memory
npm run forms      # fills and sends every form with the keyboard alone
npm run preview    # serve dist/ locally
```

`npm run check` fails on:

- a dollar figure on any page except `/savers`
- a banned word outside an approved copy bank line, an exclamation mark or an emoji
- `font-style: italic`, a radius above 6px, or a colour that is not a token.
  The demonstrations are the one exception: inside a demonstration's frame,
  colours and radii are `--demo-*` custom properties, and only those
- a keystroke figure that is not in a content file or computed from the ledger
- text written for the builder, not the customer: `TODO`, a demo label, the
  old "5 to 50 staff" limit, or an internal term (ledger, baseline, a unit,
  practice or case number) anywhere but the counting page
- a disabled control
- a crew card without the tag `AI agent`
- a page without `noindex` while demo mode is on

It warns on any `TODO` left in `site.json`. Text inside `[data-artefact]` and
inside a demonstration's frame is skipped: both show invented sample data.

Other scripts:

| Script | Does |
|---|---|
| `npm run ready` | Says whether the content is fit to publish, and lists what is not (see "Go live") |
| `npm run og` | Makes the share image for every page into `public/og/` (see "Share images") |
| `npm run audit:motion -- --tag=after` | Scrolls every page under a slowed processor and records what moves, dead stretches, long frames and controls that do not respond |
| `npm run audit:mobile -- --tag=after` | Every page at 360, 390, 430 and 768 wide: sideways scroll, first screen, tap targets, text size, weight, speed |
| `npm run audit:seo -- --dir=dist` | Titles, descriptions, headings, canonical, share tags, structured data, links, sitemap and robots, read from the built files |
| `npm run lighthouse -- --tag=after` | Lighthouse on every page at its phone profile |
| `npm run audit:contrast` | Contrast of all text inside the four demonstrations, in both their states |
| `npm run tour -- --tag=after` | One contact sheet per page and size, top to bottom, in `shots/after/` |
| `npm run shots -- --route=quiz --size=phone` | Screenshots at chosen scroll positions (see the header of `tools/shots.mjs`) |
| `npm run stills` | Re-renders the no-WebGL still for the audit page in `public/stills/` |
| `npm run ledger` | Prints the totals the site computes from the ledger, for today or a given date |
| `npm run check:types` | `astro check` |

The audit scripts write their measurements to `shots/audit/`, which git
ignores. All of them need `npm run build` first.

## Pages

| Route | Page |
|---|---|
| `/` | The homepage: hero, proof, four services each with a small looping demonstration, the audit in three steps, three cases, the crew, Savers, the quiz band |
| `/services` | The four services |
| `/services/automation-and-ai-agents` | Automation and AI agents |
| `/services/reporting-and-dashboards` | Reporting and dashboards |
| `/services/websites-and-software` | Websites and software |
| `/services/branding-and-graphic-design` | Branding and graphic design |
| `/cases`, `/cases/[id]` | Every case as a card, and each case in full |
| `/audit` | The free audit. Ends on the form, `/audit#book` |
| `/crew` | The five AI agents |
| `/savers` | Keystroke Savers: the only page with prices. Ends on the form, `/savers#enquire` |
| `/quiz` | Nine questions. The form sits under the result |
| `/contact` | The form. Every "Book a free consultation" button comes here |
| `/privacy` | What the forms collect and where it goes |
| `/counting` | The counting method and the ledger. Linked from the footer |

Old addresses redirect: the four `/practice/*` pages from the first build, and
the four short service addresses from revision 1 (`/services/automation` and
so on). Cloudflare reads `public/_redirects`; `astro.config.mjs` writes
fallback pages for any other host. `sitemap.xml` and `robots.txt` are written
at build time.

## Forms

One component, `src/components/EnquiryForm.astro`, is the form on `/contact`,
at the foot of `/audit` and `/savers`, and under the quiz result. The script
is `src/scripts/forms.ts`. Each form posts to Formspree with a reCAPTCHA v3
token.

### Set them up

All three values go in `src/content/site.json`, under `forms`:

```json
"forms": {
  "formspreeContactId": "TODO",
  "formspreeQuizId": "TODO",
  "recaptchaSiteKey": "TODO"
}
```

1. **Formspree.** Create two forms at formspree.io. One receives the
   consultation and Savers enquiries; the other receives quiz results. Each
   form's address looks like `https://formspree.io/f/abcdwxyz`: the last part
   is the id. Put the first in `formspreeContactId` and the second in
   `formspreeQuizId`.
2. **reCAPTCHA v3.** At google.com/recaptcha/admin, register a new site, type
   "Score based (v3)". Add the live domain to its list of domains. Google
   gives two keys:
   - the **site key** goes in `recaptchaSiteKey`. It is public.
   - the **secret key never goes in this project.** Paste it into each of the
     two Formspree forms, in the form's settings, under reCAPTCHA (use your
     own key). Formspree checks every submission against it.
3. `localhost` is not accepted by a reCAPTCHA key unless you add `localhost`
   to the key's domain list. To test the real round trip on your own machine,
   add it, or test on the deployed site.

The email address in `site.json` (`email`) is shown beside a form that fails
to send, so a visitor always has another way through.

### Development mode

While any of the three values is `TODO` the forms run in development mode: a
form checks its fields, prints the payload it would have sent to the browser
console (`[KEYSTROKE form: development mode]`), and shows the thank-you.
Nothing is sent anywhere and no Google script is loaded. `npm run forms`
tests all four forms this way. `npm run deploy` refuses to run in this mode.

### What a form sends

`name`, `email`, `phone`, `business`, `service` and `message`, plus:

| Field | Holds |
|---|---|
| `page` | The page the form was on, such as `/audit` |
| `plan` | The Savers plan the visitor asked about, when there is one |
| `quiz_answers`, `quiz_recommended`, `quiz_result` | On the quiz form only: the answers in words, the items recommended, and a link back to the result |
| `_subject` | The subject line of the email Formspree sends |
| `g-recaptcha-response` | The token, fetched at the moment of sending |
| `_gotcha` | The honeypot. People never see it |

The reCAPTCHA actions are `consultation`, `savers` and `quiz`, so the three
kinds of enquiry can be told apart in Google's console. Google's script is
loaded only when a form comes near the viewport or takes focus. Its floating
badge is hidden, and the line Google asks for in that case sits under every
form.

## Prices

Prices are shown on `/savers` and nowhere else. `src/content/products.json`
has the switch:

```json
"display": { "audit": false, "builds": false, "cases": false, "quiz": false, "savers": true }
```

Where a price is switched off, the page says `quoteLine` ("Every job is
quoted individually after a free consultation.") in its place. The prices
themselves are still in the file. To show one again, set its flag to `true`
and change `npm run check`, which fails on any dollar figure outside
`/savers` (`tools/check.mjs`, the dollar rule).

## Service demonstrations

Each service page opens with an animated demonstration built from HTML, CSS
and SVG and driven by one GSAP timeline: no video and no WebGL. The homepage
cards show a compact, looping version of the same four.

| File | Is |
|---|---|
| `src/components/demos/Demo.astro` | The frame, the Before and After toggle, the replay button, the description for screen readers |
| `src/components/demos/WebDemo.astro`, `ReportDemo.astro`, `AutomationDemo.astro`, `BrandDemo.astro` | The four scenes |
| `src/scripts/demos.ts` | The four timelines, the controls, and the turn-taking on the homepage |
| `src/styles/demos.css` | Their styles. Every colour inside a frame is a `--demo-*` property |
| `src/content/demos.json` | The invented business names and sample text |

The businesses in the demonstrations are invented. Before changing a name in
`demos.json`, search for it and make sure no real business has it. With
reduced motion a demonstration shows its finished state and nothing plays.

## Share images

Each page has its own 1200 by 630 share image in `public/og/`, drawn from the
page's own title and description. After changing a title or a description, or
adding a page:

```bash
npm run build && npm run og && npm run build
```

## Search

- While `site.demo` is true every page carries `noindex`. `robots.txt` still
  allows crawling, because a crawler has to fetch a page to see that tag.
- Once `domain` is set in `site.json`, every page gets a canonical address,
  the sitemap lists absolute addresses, share images are absolute, and (with
  demo mode off) `robots.txt` names the sitemap.
- Structured data (JSON-LD) is built in `src/lib/seo.ts`: the organisation and
  the site on every page, the business on the homepage and `/contact`, one
  service per service page, the Savers plans as offers, the questions on each
  page that has them, and the trail of pages on every inner page. There is no
  review or rating data, and the mock cases are not marked up as real work.
- `location` and `serviceArea` in `site.json` go into the footer and the
  structured data once set. While `TODO` they are left out.
- The questions and answers are in `src/content/faqs.json`. An answer of
  `"TODO"` keeps its question off the page and out of the structured data.
- `analyticsToken` in `site.json` is the Cloudflare Web Analytics token. No
  analytics script is loaded until it is set. It uses no cookies.

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
pages do not say so, so `npm run deploy` refuses to publish until the mock
content is gone. It stops, and lists what is left, while any of these is true:

- `site.json` has `"demo": true`
- any record in any content file has `"demo": true`
- `email` or `domain` in `site.json` is still `TODO`
- any of the three `forms` values in `site.json` is still `TODO`

Run `npm run ready` at any time to see the same list without deploying.

To go live:

1. Set `email`, `domain` and the three `forms` values in
   `src/content/site.json` (see "Forms").
2. Replace each mock record with a real one and set its `"demo"` to `false`:
   cases, ledger rows, crew agents, the quiz items and estimates in
   `products.json`, and the sample report.
3. Answer the questions in `faqs.json` that are marked `"TODO"`, or delete
   them. Set `location`, `serviceArea`, `yearsExperience` and
   `analyticsToken` if you want them shown.
4. Set `"demo": false` in `site.json`. Any record still marked demo then
   drops off the site and out of every sum.
5. `npm run build && npm run og && npm run deploy`, then attach the domain in
   the Cloudflare dashboard.

`domain` has to be known before the first deploy, because canonical addresses
and the sitemap are built from it.

## Content

Everything the site states lives in `src/content/*.json`. No figure, case,
agent, price, question or product is written into a template.

| File | Holds |
|---|---|
| `site.json` | Demo switch, tagline, description, origin line, years of experience, location, service area, contact email, domain, the three form values, the analytics token, the three featured cases, logotype, time zone |
| `services.json` | The four services: name, address, page title and description, one line, what it is, and the list of products with one line each |
| `cases.json` | The twelve cases. `service` files a case under a service; `summary` is the one sentence on its card |
| `ledger.json` | One row per cleared task. Every counter is computed from this |
| `crew.json` | The five AI agents: name, role, character, schedule |
| `products.json` | The price switch and the quote line, the audit and its three steps, the build ranges, the quiz items, the estimate bands, Keystroke Savers |
| `faqs.json` | The questions and answers on `/audit`, `/savers` and the four service pages |
| `demos.json` | The invented businesses and sample text in the four demonstrations |
| `shiftReport.json` | The sample report on the audit page |
| `quiz.json` | The nine questions, the rules, the read templates and the five closing lines |
| `artefacts.json` | Invented sample rows for the illustration on each case page |

### Replace mock rows

- **A case**: add or edit an entry in `cases.json`. Give it a `service`
  (`automation`, `reporting`, `web-software` or `brand-design`) and a
  one-sentence `summary`. Add its sample rows to `artefacts.json` under the
  case id.
- **The featured three** on the homepage are named in `site.json`,
  `featuredCases`. Keep them from different services.
- **A ledger row**: add it to `ledger.json` with its `caseId` and `crewUnit`.
  `confirmed` is four weeks after `goLive`. Set `stopped` to a date when a
  client stops using the process. Run `npm run ledger` to see the totals.
- **A crew agent**: edit `crew.json`. `runDays` uses 0 for Sunday. The running
  mark shows only for an agent that is not demo, inside its window, in the
  site time zone. `src/lib/crew.ts` has the one function, `isRunning`, that
  decides it; point it at a real status source there.
- **A product on a service page**: edit `products` in `services.json`. Each
  is a name and one line.
- **Quiz items and copy**: `products.json` (`items`, `estimates`) and
  `quiz.json`. The rules are data; `src/lib/quiz.ts` only evaluates them.

The counting maths is in `src/lib/ledger.ts` and nowhere else.

## Crew avatars

The five avatars are SVG files in `src/assets/crew/`, named by the agent's
name in lower case (`tilly.svg`, `ivy.svg`, `paige.svg`, `drew.svg`,
`link.svg`). They are inlined, so they take the site's colour tokens. The
two shapes with `class="eye"` blink.

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
`public/favicon.svg` (a file cannot inherit colour, so its ink is baked in),
then run `npm run og` so the share images and `public/og/logo.png` follow.

## Licensed fonts

The site renders on the open fallbacks (Oswald, Archivo, IBM Plex Mono),
self-hosted through `@fontsource`. When Knockout, Söhne and Söhne Mono are
licensed:

1. Put the `.woff2` files in `public/fonts/`.
2. Check the file names in `src/styles/licensed-fonts.css`.
3. Import that file in `src/layouts/Base.astro`, above `tokens.css`, and
   point the three `<link rel="preload">` tags at the new files.

The token block already lists the licensed families first, so nothing else
changes. The key legend in the 3D scene reads the same stacks.

## How it is put together

```
src/
  content/      all copy that is data, and every figure
  assets/crew/  the five avatars
  lib/          ledger maths, demo mode, quiz rules, crew schedule, structured data
  layouts/      Base.astro: head, share tags, header, closing band, footer, the one canvas
  components/   form, questions, counter, cards, report, artefact, logotype, demos/
  pages/        the pages, plus sitemap.xml and robots.txt
  styles/       tokens.css (from the design system), motion.css, base, parts, home, pages, demos
  scripts/      hero choreography, forms, demonstrations, reveals and rolling figures, quiz
  three/        stage.ts (scene manager), still.ts, objects/, scenes/ (hero, audit)
tools/          check, predeploy, qa, forms, the three audits, lighthouse, og, tour, shots, stills, ledger
public/         favicon, og/, stills/, _headers, _redirects
```

- **First paint does not wait for 3D.** HTML, CSS and fonts come first.
  three.js is a separate chunk. On a desktop it loads when the browser is
  idle. On a phone it loads at the first touch or scroll, or after 3.5
  seconds, whichever is first. Until the canvas is ready the hero shows a
  token-drawn SVG key in the same place.
- **One large set piece.** The homepage hero is driven by scroll: cameras and
  objects follow it directly, and mechanisms (a digit rolling, a key being
  struck) fire at a scroll position and undo on the way back up. The audit
  page has one smaller scroll moment in its hero.
- **One motion system.** `src/styles/motion.css` holds the three durations,
  the two easings and the standard arrivals. Everything below a page's first
  screen uses it: blocks rise in once as they are reached and figures roll
  into place once (`src/scripts/site.ts`). Moving between pages is the
  browser's own cross-fade, with the header held still.
- **One canvas, one clock.** `src/three/stage.ts` keeps one renderer behind
  the document. Scenes are built as they come near and disposed as they leave.
- **Phones.** A slim bar with the consultation button sits at the foot of the
  screen once the first screen has scrolled past. It goes away while a form
  or the footer is on screen.
- **Fallbacks.** With reduced motion nothing animates: every page renders in
  its resting state, each scene is drawn once into its slot, and each
  demonstration shows its finished state. Without WebGL the slots show
  stills. Without JavaScript every page still reads in full, apart from the
  quiz and the sending of a form.

Offline renders are not used. `tools/blender/README.md` says how one would be
made.

## Licences

GSAP is under GreenSock's standard licence (no charge, commercial use
allowed): https://gsap.com/standard-license. three, Lenis, Astro and the
fonts are MIT or OFL. Third-party skills in `.claude/skills/` are listed in
`docs/THIRD-PARTY.md`.
