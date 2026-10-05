# Revision 2 plan

Follows `docs/revision-2.md` (2 October 2026). The state before this revision
is commit `5564510`, "Before revision 2", on branch `revision-1`. Before
screenshots are in `shots/r2-before/` (not committed).

The test for anything this plan does not cover: does it make a visitor more
likely to understand what KEYSTROKE does, see it demonstrated, and book a
free first conversation?

## What stays

Tokens, type, the counter, the key-shaped control, the Drum logotype, the
stack, the ledger maths, the quiz rules, the crew and its avatars, and the
hero scroll sequence, which no part of this revision touches.

## Order of work

The offer, the forms and the showcases come first, so the three audits
examine the site as it will be. Each audit is a script that can be run again,
so its numbers are refreshed at the end.

| # | Brief | Work | Files |
|---|---|---|---|
| 0 | §0, §1 | Empty commit "Before revision 2"; before screenshots; the brief saved as `docs/revision-2.md`; one line in `CLAUDE.md` | `CLAUDE.md`, `docs/revision-2.md` |
| 1 | §2 | **The offer.** `display` block and `audit.offer` / `audit.note` in `products.json`; every price outside `/savers` behind a `display` flag; `$1,500` gone; "Book a free consultation" everywhere; the audit page says "Free"; "one working tool included" off the page; the homepage Savers cards without figures; "Quoted after the audit" in the sample report; quiz closings rewritten without prices; dollar signs taken out of the sample rows in case illustrations | `src/content/products.json`, `quiz.json`, `artefacts.json`, `src/lib/data.ts`, `src/components/BookButton.astro`, `ClosingBand.astro`, `Nav.astro`, `TierCard.astro`, `ShiftReport.astro`, `src/pages/index.astro`, `audit.astro`, `cases/[id].astro`, `services/[slug].astro`, `src/scripts/quiz.ts` |
| 2 | §2 | `npm run check`: a dollar figure anywhere but `/savers` fails | `tools/check.mjs` |
| 3 | §3 | **Forms.** One form component and one script: validation, reCAPTCHA v3 loaded on approach, Formspree post, sending, thank-you and error states, development mode while the ids are `TODO`. `/contact` (new), the booking block on `/audit`, the Savers enquiry with its plan, the quiz form under the result. `/privacy` (new). The booking link and mail links removed | `src/components/EnquiryForm.astro`, `src/scripts/forms.ts`, `src/pages/contact.astro`, `privacy.astro`, `audit.astro`, `savers.astro`, `quiz.astro`, `src/scripts/quiz.ts`, `src/content/site.json`, `src/styles/parts.css` |
| 4 | §3 | Deploy guard: the two Formspree ids, the reCAPTCHA site key and the email are required; the booking link is not | `tools/predeploy.mjs` |
| 5 | §4 | **Showcases.** Four demonstrations in HTML, CSS and SVG with GSAP, each with Before / After and Replay, each at full size on its service page and compact on the homepage. Invented business names, each searched first. Colour only inside the frames, held in `--demo-*` properties so the check can tell them from site colour | `src/components/demos/*.astro`, `src/scripts/demos.ts`, `src/styles/demos.css`, `src/content/demos.json`, `tools/check.mjs` |
| 6 | §4.4 | Product lists from the new `services.json`; service pages rebuilt around the demonstration; the 3D object on service pages removed with its scene, its objects and its stills | `src/content/services.json`, `src/pages/services/[slug].astro`, `services/index.astro`, `src/components/ServiceCard.astro`, `src/three/*` |
| 7 | §5 | **Motion audit.** A script that scrolls every page slowly at both sizes under a 4× CPU slowdown and records what is moving at each step, frame times and layout shift; contact sheets to read. `AUDIT-motion.md`. Then one motion system in one file, the same reveals everywhere, hover, focus and tap responses, something small in each dead stretch, page-to-page continuity | `tools/audit-motion.mjs`, `src/styles/motion.css`, `src/scripts/site.ts`, `demos.ts`, `AUDIT-motion.md` |
| 8 | §6 | **Mobile audit.** A script for 360, 390, 430 and 768 wide with touch and throttling: first screen, tap targets, text size, sideways scroll, form fields, weight; Lighthouse on every page at the phone profile. `AUDIT-mobile.md`. The fixed bottom bar on phones | `tools/audit-mobile.mjs`, `tools/lighthouse.mjs`, `src/components/StickyCta.astro`, `AUDIT-mobile.md` |
| 9 | §7 | **SEO audit.** Titles, descriptions, canonical, Open Graph and Twitter tags, share images, JSON-LD, sitemap and robots, service routes renamed and redirected, FAQs, internal links, `location` and `serviceArea`, Cloudflare Web Analytics behind `analyticsToken`. A script that reads the built HTML and reports. A demo-off build into a temporary folder, inspected and discarded. `AUDIT-seo.md` | `src/lib/seo.ts`, `src/layouts/Base.astro`, `src/components/Faq.astro`, `src/content/faqs.json`, `src/pages/sitemap.xml.ts`, `robots.txt.ts`, `tools/og.mjs`, `tools/audit-seo.mjs`, `astro.config.mjs`, `public/_redirects`, `AUDIT-seo.md` |
| 10 | §8 | After screenshots; build, check, QA, Lighthouse; the four confirmations; `README.md` and `NOTES.md` | all of the above |

## Decisions made up front

- **Where the button goes.** "Book a free consultation" goes to `/contact`
  from every page. On `/audit` it goes to the form at the foot of that page.
- **Routes.** `/services/automation-and-ai-agents`,
  `/services/reporting-and-dashboards`, `/services/websites-and-software`,
  `/services/branding-and-graphic-design`. The four short addresses from
  revision 1 and the four `/practice/*` addresses redirect.
- **Sample rows lose their dollar signs.** The illustrations on case pages
  show invented invoices and price lists. Those are not KEYSTROKE prices,
  but "no dollar figure outside `/savers`" is simpler to keep, and to check,
  with no exceptions.
- **The reCAPTCHA disclosure uses Google's current wording.** The FAQ now
  gives the text as "This site is protected by reCAPTCHA." with no policy
  links, so that is what goes under each form, next to the link to
  `/privacy`.
- **Page-to-page continuity uses the browser's cross-document view
  transitions,** not Astro's client router. The router keeps one document
  alive across pages, which would mean tearing down and rebuilding the
  canvas, Lenis and every scroll trigger on each navigation.
- **Service pages no longer use the canvas.** The demonstration replaces
  the 3D object, so three.js loads on the homepage and the audit page only.
- **The domain becomes a deploy requirement.** Canonical addresses, the
  sitemap and share images need it at build time.
- **Cloudflare Web Analytics has no custom events** (its FAQ: "Not yet").
  Page views are recorded once the token is set; submissions are counted in
  Formspree.
