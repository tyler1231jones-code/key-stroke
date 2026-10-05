# Notes on the build

2 October 2026. This file covers revision 2 (`docs/revision-2.md`). The plan
it followed is `REVISION-2-PLAN.md`. The three audits it asked for are
`AUDIT-motion.md`, `AUDIT-mobile.md` and `AUDIT-seo.md`.

Where the history is:

- The state before this revision is commit `5564510`, "Before revision 2", on
  the branch `revision-1`.
- Revision 1 is commit `73d69e0` on the same branch. Its notes are in that
  commit: `git show 73d69e0:NOTES.md`.
- **Revision 2 itself is not committed.** It is in the working folder,
  waiting for you to look at it.

## 1. Where things stand

- `npm run build`, `npm run check`, `npm run check:types`, `npm run qa`,
  `npm run forms` and `npm run audit:seo` all pass.
- The site has 27 pages: the homepage, `/services` and four service pages,
  `/cases` and twelve case pages, `/audit`, `/crew`, `/savers`, `/quiz`,
  `/contact`, `/privacy`, `/counting` and the 404. Nine old addresses
  redirect.
- Lighthouse at its phone profile, on all 27 pages: performance 95 to 100,
  accessibility 100, best practices 100. SEO is 63 while every page
  carries `noindex`, and 100 on a build with demo mode off
  (six pages checked).
- On phones from 360 to 768 wide: no sideways scroll, no control cut off,
  every tap target 48px or more, running text 16px or more.
- All content is still mock, and the three form values are not set, so
  `npm run deploy` refuses to run (section 6).
- Nothing was deployed, and nobody has logged in to Cloudflare.

## 2. What changed, page by page

**Every page**

- The one button now reads "Book a free consultation" and goes to the form
  on `/contact`. On `/audit` and `/savers` it goes to the form at the foot of
  that page.
- The closing band reads "Book a free consultation, or start with the quiz."
  The consultation is the main button and the quiz is the second.
- The footer has a link to `/privacy`, and its contact column leads to the
  form.
- On a phone, a slim bar with the button sits at the foot of the screen once
  the first screen has scrolled past. It goes away while a form or the
  footer is on screen. While it is up, the header does not repeat the button.
- Blocks, cards and the footer arrive the same way on every page; every
  control responds to the pointer and to a tap; pages cross-fade into each
  other with the header held still (`AUDIT-motion.md`).
- Every page has a title and description written for search, share tags with
  its own share image, and structured data (`AUDIT-seo.md`).
- No dollar figure appears anywhere except `/savers`.

**Homepage**

- The hero's two buttons have changed places: "Book a free consultation" is
  the main one, "Take the 90-second quiz" the second.
- Each of the four service cards opens with a small, looping version of that
  service's demonstration. They take turns.
- "It starts with one audit": the price is replaced by "Free", "No cost and
  no obligation."
- The three Savers cards show hours and who each plan suits, with no prices.
  The link reads "See plans and pricing".
- The hero scroll sequence is unchanged (section 5).

**Services**

- `/services`: each card lists the names of what that service offers.
- The four service pages have new addresses, named after the services. Each
  opens with the animated demonstration beside the heading, with Before and
  After buttons and Replay. Below it: "What we offer", the list of products
  with one line each; the quote line and the button; two cases; questions and
  answers. The 3D object that sat in each hero is gone, with its scene.

**Cases**

- "What a build like this costs", with its range, is replaced by the quote
  line. Dollar signs are gone from the invented sample rows in the
  illustrations.
- Page titles are the case headline alone, so they fit a results page.

**Audit**

- "What it costs" now says "Free." and one sentence: "We watch one process,
  count it and send you the report in 1–2 weeks. No cost and no obligation."
- "What happens next" is the quote line. The three price ranges and "One
  working tool included" are off the page.
- The sample report says "Quoted after the audit" where it showed a figure.
- Six questions and answers.
- The page ends on the form.

**Savers**

- The only page with prices. Each plan has an "Ask about" link that jumps to
  the form at the foot of the page and fills the plan in.
- Six questions and answers.

**Quiz**

- The heading is "Nine questions: what should your business fix first?"
- The result ends with the form. What the visitor answered, and what was
  recommended, go with the enquiry. The result's cost lines and the prices in
  the closing lines are gone.

**New pages**

- `/contact`: the form, and three lines on what happens next.
- `/privacy`: what the forms collect, where it goes, reCAPTCHA, cookies, and
  how to have details removed.

**Crew, Counting, 404**

- Crew: the avatars blink. Counting: its sections and the ledger arrive as
  they are reached. The 404 is as it was.

## 3. Decisions where the revision left room

1. **Where the button goes.** `/contact` from every page; the page's own form
   on `/audit` and `/savers`. A button on a service page arrives with that
   service already chosen in the form.
2. **Two Formspree forms, three kinds of enquiry.** The consultation and
   Savers forms post to one Formspree form, the quiz to the other, as the
   revision's two ids imply. The three are told apart by the subject line,
   the `plan` field and the reCAPTCHA action.
3. **The reCAPTCHA line under each form** reads "This site is protected by
   reCAPTCHA." with a link to `/privacy`. That is the wording Google's
   documentation gives today for sites that hide the badge. Older versions of
   that guidance also asked for links to Google's Privacy Policy and Terms of
   Service. If you would rather carry those links too, it is one line in
   `src/components/EnquiryForm.astro`.
4. **The dollar rule has no exceptions.** The invented invoices and price
   lists in the case illustrations lost their dollar signs too. They were
   never KEYSTROKE prices, but "no dollar figure outside `/savers`" is simpler
   to keep, and to check, with no exceptions.
5. **"One working tool included" is off the page, and so is "One initial
   tool"** in the list of what the audit includes. Both are still in
   `products.json`. Whether the free audit includes a tool is open item 3.
6. **Colour appears inside the demonstration frames and nowhere else.** Every
   colour and corner radius inside a frame is a `--demo-*` property, which is
   how `npm run check` tells an illustration from the site. Both the
   "before" and the "after" of each demonstration meet the contrast standard
   for text.
7. **The demonstrations rest on "after".** A visitor who never scrolls to one
   still sees the finished thing. It rewinds, holds on "before" for a moment
   and plays. On the homepage the four take turns so only one moves at a time.
8. **Invented businesses.** Tarnwick Plumbing, Wattlemere Freight, Corrimba
   Fitouts (and its contact, Dana Whitlock) and Mallowby Bakehouse. I
   searched each name and found no business using it. The search tool I had
   returns results for the United States, so please search each name once
   yourselves in Australia before launch. The website demonstration uses the
   address `tarnwickplumbing.example`, which can never be a real site.
9. **The service pages lost their 3D.** The demonstration takes the place the
   3D object had. three.js now loads on the homepage and the audit page only,
   and a service page is 166 KB, where the homepage is 308 KB.
10. **On a phone the 3D key starts later.** The first screen shows the drawn
    key, which sits in exactly the same place, until the first touch or
    scroll, or 3.5 seconds, whichever comes first. Starting the 3D during
    load was costing phones several seconds of unresponsiveness (Lighthouse
    performance 52 on the homepage; it is now 95 to 98). The scroll sequence
    itself is not changed. On a desktop nothing is different.
11. **The weekly change under the hero counter** sits above the counter on a
    phone, without taking space. Before, it wrapped to a second line when
    its figure arrived and pushed the buttons down.
12. **Page-to-page continuity is the browser's own cross-fade,** not Astro's
    client router. The reasons are in `AUDIT-motion.md`.
13. **The header on a narrow phone.** The longer button label did not fit a
    360px screen beside the mark and the menu. Spacing in the header is
    tighter below 480px so all three fit. Below 350px, narrower than any
    current phone, the header drops the button; the hero and the bar at the
    foot of the screen still carry it.
14. **Text on a phone is 16px or more,** including the footer. Labels, tags
    and the units beside figures stay small, as the design system sets them.
15. **`npm run check` no longer rations the word "automation".** It is in a
    service's name, an address, six product names and a dozen answers. The
    banned-word list otherwise stands.
16. **The Savers plans are marked up as offers in Australian dollars.** The
    business plan gives the prices in dollars for Australian clients. Say so
    if that is wrong.
17. **The domain is now required before deploying.** Canonical addresses, the
    sitemap and share images are built from it.
18. **Enquiries are counted in Formspree, not in analytics.** Cloudflare Web
    Analytics records page views only. It has no custom events.
19. **Day names keep their capital in page titles.** Case headlines are
    stored in capitals and lowered for titles, which had turned "Friday"
    into "friday".

## 4. Copy awaiting approval

Everything below is new or changed in this revision. The files are
`src/content/*.json` unless a page is named.

**Supplied in the revision, used as given**

- "Book a free consultation", "Free", and "Every job is quoted individually
  after a free consultation."
- The four services: name, one line, page title, and every product name and
  line (`services.json`).

**Written by me**

- Audit page: "We watch one process, count it and send you the report in 1–2
  weeks. No cost and no obligation." / "Tell us what you need. The first
  conversation and the audit are free." / "A short report and a quote. This
  is a sample." / "Quoted after the audit".
- Homepage: "No cost and no obligation." / "See plans and pricing".
- Closing band: "Book a free consultation, or start with the quiz."
- The form (`src/components/EnquiryForm.astro`): the labels as the revision
  lists them; "optional"; the messages "Enter your name." and "Enter an email
  address we can reply to."; "That did not send. Nothing you typed has been
  lost. Try again, or email us at …"; "Thank you. That is with us." / "We
  will reply by email to arrange a time to talk. The first conversation is
  free, and there is no obligation."
- Contact page: "Tell us what you need help with. The first conversation and
  the Keystroke Audit are free, and there is no obligation." / "What happens
  next": "We reply by email to arrange a time." "We talk through what you
  need." and the quote line.
- Savers: "Ask about Watch" (and Run, Own) / "Ask about a plan." / "Tell us
  what we built for you, or what you want built, and which plan you are
  considering." / "Send the enquiry".
- Service pages: "What we offer." / "Jobs like this." / "Questions people
  ask."
- Quiz: the heading, "Send it and get in touch", and two closing lines
  rewritten without prices
  (`quiz.json`):
  - Trust: "You do not have to trust us yet. The audit is free, and it ends
    with a figure you can check against your own records."
  - Cost: "The first conversation and the audit are free. Every job after
    that is quoted individually."
- **The privacy page**, all of it (`src/pages/privacy.astro`). It describes
  what the site's code does. It is not legal advice, and it says nothing
  about how long you keep enquiries, because that is your policy, not a fact
  about the site. Please read it against what you actually do.
- **The questions and answers** (`faqs.json`): 31 answered and shown, 12 held
  back. Every answer restates something in the brief, the business plan or
  the content files. The tools they name (Power BI, Excel, Power Automate,
  SharePoint, WordPress, Cloudflare) and the one-business-day reply are from
  the business plan. Please check each answer is something you are happy to
  publish.
- **Page titles and descriptions**, listed in `AUDIT-seo.md`.
- **The demonstrations' sample text** (`demos.json` and
  `src/components/demos/`): the invented plumber's website, the freight
  spreadsheet and dashboard, the fit-out enquiry email and the bakery brand.

## 5. The four confirmations

1. **No dollar figure outside `/savers`.** `npm run check` reads every built
   page and fails on one. It passes. The only dollar figures in the build are
   the three plan prices on `/savers`.
2. **Every button reads "Book a free consultation" and reaches a form.** The
   header, the hero, each service page, each case, the closing band and the
   phone bar all carry that label and lead to `/contact`, `/audit#book` or
   `/savers#enquire`, each of which is a form. The other key-shaped
   controls are deliberate: the quiz button ("Take the 90-second quiz"), the
   "Ask about Watch", "Run" and "Own" links on `/savers`, which lead to its
   form, and two submit buttons that say what they do: "Send the enquiry" on
   Savers and "Send it and get in touch" under the quiz result.
3. **Every form produces the right payload in development mode.** `npm run
   forms` fills and sends all four with the keyboard alone and prints what
   each would post: the fields, the page, the plan on Savers, and the answers
   and recommendations under the quiz. It also confirms that an empty form is
   stopped with messages, that the thank-you takes the form's place, and that
   nothing is requested from Formspree or Google before a form is approached.
4. **The hero scroll sequence is unchanged.** Frames at the same scroll
   positions before and after are side by side in
   `shots/hero-compare-desktop.png` and `shots/hero-compare-phone.png`. On a
   desktop they match apart from the button labels. On a phone they match
   apart from the labels, the position of the weekly change (decision 11),
   and the first screen showing the drawn key until first touch (decision 10).

## 6. Publishing guard

`npm run deploy` runs `tools/predeploy.mjs` first. Today it stops with this
list, which is the work left before the site can go live:

- `site.json`: `demo` is true; `email` and `domain` are `TODO`; the two
  Formspree ids and the reCAPTCHA site key are `TODO`
- `cases.json`: 12 demo records
- `crew.json`: 5 demo records
- `ledger.json`: 8 demo records
- `products.json`: 7 demo records (six quiz items and the estimates)
- `shiftReport.json`: the sample report

It also notes, without stopping, that `location`, `serviceArea`,
`analyticsToken` and `yearsExperience` are not set. `npm run ready` prints
the same list without deploying. I ran the guard on its own and confirmed it
exits with an error. I did not run `npm run deploy`.

## 7. What was checked, and what was not

Checked:

- Every page at 1440×900 and 390×844, top to bottom, before and after
  (`shots/r2-before/`, `shots/r2-after/`).
- Every page at 360, 390, 430 and 768 wide with touch, a slowed processor
  and a slow connection (`AUDIT-mobile.md`).
- Lighthouse on all 27 pages at its phone profile.
- All four forms, by keyboard alone, in development mode.
- Each demonstration frame by frame at both sizes, its Before, After and
  Replay controls, and its finished state under reduced motion.
- Contrast of all text inside the demonstrations, in both states
  (`npm run audit:contrast`).
- A build with demo mode off and a stand-in domain, made into a temporary
  folder, inspected and deleted (`AUDIT-seo.md`).
- `npm run check` against the rules it enforces, including a dollar figure
  planted on a page other than `/savers`.

Not checked:

- **A real form submission.** There are no Formspree ids or reCAPTCHA key
  yet, so no form has posted to Formspree and no token has been issued. The
  code follows Formspree's and Google's documentation; the first real
  submission after the keys are set is the test.
- **A real phone or tablet.** Phone layouts, tap targets and speed were
  measured in emulated Chromium only.
- **Frame rate.** Everything ran on a software WebGL renderer.
- **Safari and Firefox.** Only Chromium was used. In a browser without
  cross-document view transitions, pages change with a plain cut.
- **A screen reader.** Labels, error messages, the live status of each form
  and the demonstrations' text descriptions follow the rules, and Lighthouse
  scores accessibility at 100 on every page, but nobody has listened to it.
- **The redirects on Cloudflare.** `public/_redirects` follows Cloudflare's
  format but has not been served by Cloudflare.
- **`wrangler deploy`.** Not run, by instruction.

The `web-perf` skill expects Chrome DevTools trace tools that this session
did not have. Its checklist was followed with Playwright, the DevTools
protocol and Lighthouse, as `AUDIT-mobile.md` sets out.

## 8. Open items for the principals

1. **Two Formspree form ids and a reCAPTCHA v3 site key**, into `site.json`
   under `forms`. The reCAPTCHA **secret** key goes into each Formspree
   form's settings, never into this project. README, "Forms", has the steps.
   Check that your Formspree plan allows a custom reCAPTCHA key.
2. **Approval of the copy in section 4**: the privacy page, the questions and
   answers, the product names and lines as they read on the page, and the
   form's wording.
3. **Does the free audit include the initial tool?** The line is off the
   page until you decide. If yes, say how to word it; `audit.tool` and
   `audit.includes` in `products.json` still hold the old lines.
4. **Location and service area**: `location` and `serviceArea` in
   `site.json`. Not guessed. Until they are set, the site names no place,
   which limits local search more than anything else (`AUDIT-seo.md`).
5. **A Cloudflare Web Analytics token**: `analyticsToken` in `site.json`.
6. **The twelve questions held back** for want of a fact, listed in
   `AUDIT-seo.md` and marked `TODO` in `faqs.json`.
7. **Contact email and domain**: `email` and `domain` in `site.json`. Both
   are now required to deploy.
8. **Search each invented business name in Australia** (decision 8).
9. **"You get a report and a fixed quote"** is still the third step of the
   audit, from revision 1. It names no price, so it stands, but read it
   beside "Every job is quoted individually" and say if "fixed" should go.
10. **Commit.** The revision is uncommitted. `git add -A` and commit when you
    are happy with it.
11. Still open from before: real content to replace the mock records, years
    of experience, licensed fonts, avatar artwork if you want to supply it,
    and the duplicate PDFs and kit zip at the top of the folder.
