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
npm run forms      # fills and sends every form with the keyboard alone. The forms
                   # are live, so this posts real enquiries: ask the principals first
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
| `node tools/browsers.mjs` | Every main page in Chrome, Edge, Firefox and Safari's engine (WebKit), at desktop and phone size: errors, failed requests, fonts, sideways scroll, 3D. `--live` for the live site, `--browser=edge` for one. See `AUDIT-browsers.md` |
| `node tools/onboard-test.mjs` | Fills in every onboarding form in a browser, with Formspree and reCAPTCHA intercepted |

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
| `/audit` | The Keystroke Audit (fixed price; the price is on `/savers`). Ends on the form, `/audit#book` |
| `/crew` | The five AI agents |
| `/savers` | Keystroke Savers: the only page with prices. Ends on the form, `/savers#enquire` |
| `/quiz` | Nine questions. The form sits under the result |
| `/contact` | The form. Every "Book a free consultation" button comes here |
| `/privacy` | The privacy policy, from `legal.json` |
| `/terms` | The website terms of use, from `legal.json` |
| `/counting` | The counting method and the ledger. Linked from the footer |
| `/onboard`, `/onboard/[service]` | The client onboarding forms (see "Onboarding forms"). Not linked, not indexed, and not built until their Formspree id is set |

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

1. **Formspree.** Each form's address looks like
   `https://formspree.io/f/abcdwxyz`: the last part is the id. The live site
   uses one form for everything, so `formspreeContactId` and
   `formspreeQuizId` hold the same id. To send quiz results somewhere else,
   create a second form and put its id in `formspreeQuizId`.
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
Nothing is sent anywhere and no Google script is loaded. `npm run deploy`
refuses to run in this mode. All three values are set now, so development
mode is off and `npm run forms` sends real enquiries.

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

## The quiz result

When the last question is answered, the page sends the nine answers and a
reCAPTCHA v3 token to `/api/quiz`, a small Worker (`src/worker.ts`) that is
the only code running on Cloudflare; every page is still a static file. The
Worker:

1. accepts only the quiz's own option ids, never free text;
2. checks the token with Google, and stops there if the check fails;
3. asks Claude (`claude-opus-5-5`) to read the answers against the product
   list. Claude can pick only from the ids it is given. Names, cases and
   prices on the page come from the site's own content.

If any of that fails, or takes longer than 20 seconds, the page shows the
result it works out itself by fixed rules (`src/lib/quiz.ts`).

Two secrets, set by a person in the Cloudflare dashboard under the Worker's
Settings, Variables and Secrets. They are never written in this project:

| Name | What |
| --- | --- |
| `ANTHROPIC_API_KEY` | A key from the Claude Console. Set a monthly spend limit there. |
| `RECAPTCHA_SECRET` | The reCAPTCHA v3 secret key, the same one given to Formspree. |

`/api/health` on the live site says whether each is set (yes or no, never the
value). One visitor can ask for 5 results a minute. Errors are in the Worker's
logs in the dashboard.

To run the Worker on this machine: `npm run build`, then
`npx wrangler dev --local`. Local secrets go in `.dev.vars`, which is not
committed.

## Prices

Prices are shown on `/savers` and nowhere else. The published price list
(Keystroke Savers, website care, the two website builds, the free initial
audit and the Keystroke Audit) is `src/content/prices.json`, which only
`/savers` reads. Other pages say the Keystroke Audit is fixed price and link
to it there; the free part is the first conversation and a quick initial
audit (`products.json`, `audit.free`). `src/content/products.json` also has
the older switch:

```json
"display": { "audit": false, "builds": false, "cases": false, "quiz": false, "savers": true }
```

Where a price is switched off, the page says `quoteLine` ("Every job is
quoted individually after a free consultation.") in its place. The prices
themselves are still in the file. To show one again, set its flag to `true`
and change `npm run check`, which fails on any dollar figure outside
`/savers` (`tools/check.mjs`, the dollar rule).

## Onboarding forms

One form per service at `/onboard/<service>`: website build, website care,
automation, reporting, branding and the Keystroke Audit. `/onboard` lists
them with a "Copy link" button. You send a client the link; they work through
it step by step; Send emails every answer to us through Formspree. Nothing
else is involved: no database, no logins, no change to any email or DNS
setting. The brief is `docs/onboarding-brief.md`.

**Switching them on.** The pages are not built at all until
`forms.formspreeOnboardId` in `src/content/site.json` holds the id of the
Formspree form that receives them. Create a form called "Onboarding" in
Formspree, give it the same reCAPTCHA setting as the contact form (the same
secret key, in its settings), put its id in `site.json`, then build, check
and push. Uploads need a paid Formspree plan.

**Looking at them before that.** `npm run build:onboard` builds the site with
the forms included. They send nothing in this state: Send prints the
submission to the browser console and shows the thank-you.
`node tools/onboard-test.mjs` then fills in every form in a browser, checks
the show-and-hide rules, the password guard, uploads and resuming, and writes
what each email would contain to `shots/onboard/`.

**What we receive.** One email per form: the service and the client's
details; an access checklist (every "give us access" block and whether it is
done); one block per step with every answer; the agreement (name, position,
date, the time it was sent and the IP address, from `/api/stamp`); then the
files as links.

**Changing a form.** Each form is one file in `src/onboarding/templates/`.
Steps shared by several forms (you and your business, the current website,
the domain, email, Google, timing) are in `src/onboarding/shared.ts`. To
change a question, edit its `label` or `help` text. To add one:

1. Copy a field of the same kind from any template and paste it where it
   should appear.
2. Give it a new `id`: lower case, words joined by underscores, not used
   anywhere else in that form. Never rename an `id` once clients are using
   the form.
3. Set `type`: `text`, `longtext`, `email`, `tel`, `url`, `date`, `colour`,
   `choice` (one answer), `multi` (several), `tick`, `file`, `group`
   (repeatable, such as team members), `access` (how to give us access:
   never a password field) or `note` (text, not a question).
4. To show it only after a certain answer, add
   `showIf: { field: 'the_other_id', is: 'The answer' }` (use `has:` for a
   multiple choice).
5. Run `npm run build:onboard`. If anything in a template is wrong, the
   build stops and says which form and field, in words.

**Adding a form.** Copy the closest template in `src/onboarding/templates/`,
rename the file and its `id` (the `id` becomes the address), change the
steps, and add it to the list in `src/onboarding/index.ts`.

**Shared settings** are in `src/content/onboarding.json`: the address
clients add to their accounts (`accessEmail`), the privacy note, the file
limits (Formspree takes 10 files of 25 MB a submission) and the terms every
client accepts. Change `terms.version` whenever the terms change, so each
email records which version was accepted.

The forms carry `noindex`, are left out of the sitemap, the menu and the
share images, and have a plain header and footer. `npm run check` allows
the dollar figure in the terms on these pages and nowhere else but `/savers`.

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
- `/llms.txt` and `/llms-full.txt` describe the site in plain Markdown for AI
  tools. They are written at build from the content files
  (`src/lib/llms.ts`), leave out anything still marked demo, and carry no
  prices. `npm run check` reads them too. See `AUDIT-ai-search.md`.

## Deploy to Cloudflare

The target is **Cloudflare Workers with static assets**, not Pages.
`wrangler.jsonc` points `assets.directory` at `dist/` and serves `404.html` for
unknown addresses. The one Worker script, `src/worker.ts`, answers `/api/*`
only (see "The quiz result").

**The live site deploys itself.** The Worker `key-stroke` is connected to the
GitHub repository `tyler1231jones-code/key-stroke`. Every push to `main`
starts a Cloudflare build (`npm run build`, then `npx wrangler deploy`) and
the site at key-stroke.com.au updates in about a minute. That build does not
run `npm run ready`, so nothing stops demo content going live; run
`npm run build && npm run check` before pushing.

`npm run deploy` (ready check, build, check, then `wrangler deploy`) is for a
deploy from this computer instead. It needs `npx wrangler login` first, done
by a person in their own browser, and it refuses while any demo content
remains.

Runtime secrets live in the Cloudflare dashboard, under the Worker's
Settings, Variables and Secrets (not the Builds section). `wrangler.jsonc`
has `keep_vars: true`, so a deploy never clears them. Never copy a secret
into `wrangler.jsonc`.

### What stays out of git

The repository is public. `.gitignore` keeps these on this computer only:

- the business plan and design system PDFs (`docs/` and the top folder), and
  every other `*.pdf`, `*.docx` and `*.zip`
- `HANDOVER.md`, which describes unpublished pricing terms
- `src/content/signatures.json` and the `signatures/` folder, which hold
  personal phone numbers. Copy `src/content/signatures.example.json` to
  `signatures.json` and fill it in to run `npm run signatures`.

A fresh clone therefore has no PDFs in `docs/`. Copy them in from the
principals before starting work that needs them.

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
5. `npm run ready` to confirm nothing demo is left, then
   `npm run build && npm run og && npm run build && npm run check`, commit,
   and push to `main`. The domain is already attached to the Worker.

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
| `prices.json` | The published price list, read by `/savers` only |
| `legal.json` | The privacy policy and the website terms of use |
| `onboarding.json` | Settings shared by the onboarding forms: the access address, the privacy note, file limits, the terms clients accept |
| `signatures.example.json` | The shape of `signatures.json` (kept out of git), which `npm run signatures` reads |
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
