# Mobile audit

2 October 2026. Revision 2, section 6.

## How it was done

`tools/audit-mobile.mjs` (`npm run audit:mobile`) opens every page at 360,
390 and 430 wide and at 768, with touch, the processor slowed four times and
a slow 4G connection (1.6 Mbps, 150ms round trip). On each it checks:

- sideways scroll, and any control cut off by the edge of the screen
- at 360×740, whether the headline, the first sentence and the main button
  are all on the first screen
- tap targets under 48px
- running text under 16px
- form fields: input type, autocomplete, text size, the height of the submit
- what was transferred, and whether three.js was loaded
- Largest Contentful Paint, layout shift, and the slowest response to a tap
  (a menu, a demonstration toggle, a filter chip, a question, a quiz option,
  a plan link)

`tools/lighthouse.mjs` (`npm run lighthouse`) runs Lighthouse 13.5 on every
page at its phone profile.

The brief asks for the `web-perf` skill. That skill is written around Chrome
DevTools trace tools, which this session did not have. I followed its
checklist with what was available: Playwright with the DevTools protocol for
throttling, the browser's own performance observers for the three vitals,
the network log for weight, and Lighthouse for scoring and accessibility.
What that cannot give is a trace-level breakdown of a slow paint; where one
was needed (the homepage and the audit page) I profiled start-up directly.

Nothing here was measured on a real phone. See "Not verified".

## What was found

**1. The header was too wide for a 360px screen.** With the longer button
label, the mark, "Book a free consultation" and "Menu" ran 10px into the
right-hand margin at 360 wide. Everything was still on screen and still
worked, but it was not the layout.

This one got worse before it got better, and the reason is worth recording.
My first fix for tap targets (finding 2) made the mark and "Menu" 48px wide,
which pushed "Menu" partly off the edge of a 360px screen, where a tap on it
missed. The audit as first written did not see that: the page did not scroll
sideways, and "Menu" measured as a full-size target. It surfaced on the
re-test as a layout shift on the quiz page at 360, which I traced to a tap
that would not land. The header is now fixed properly (change 1), and the
audit checks for controls cut off by the screen edge and reports any tap
that fails, so the same mistake cannot pass again.

**2. Tap targets under 48px: 17 to 22 on every page.** The same ones
everywhere:

| Control | Size |
|---|---|
| The mark in the header | 32×32 |
| "Book a free consultation" in the header | 44 high |
| "Menu" | 33×38 |
| Every footer link | 15 high, 12px apart |
| "See all cases", "See how we count" and the other text links | 25 high |
| Buttons and filter chips | 44 high |
| "Skip to content" | 32 high |
| The service tag on a case page | 24 high |
| "Start again" on the quiz result | 21 high |

**3. Running text under 16px: 15 to 39 pieces on every page.** At 14px: the
footer's description, links and closing line; the "who" line on case cards;
the product names on the service cards; small supporting text under forms
and prices.

**4. The homepage and the audit page were slow to become usable.**
Lighthouse performance was 52 on the homepage and 68 on the audit page,
against 98 or 99 everywhere else. The paint was on time; the cause was total
blocking time of 6.7 and 5.2 seconds. Starting the 3D scene during page load
(parsing three.js, compiling shaders, and drawing the worn key's texture in
one go) held the processor while the visitor's first taps waited.

**5. The automation page painted its main content late at 430 and 768
wide.** Largest Contentful Paint was 3.2 to 3.3 seconds. The demonstration
faded in after the script loaded, and at those widths its text was the
largest thing on the screen. The other three service pages were built the
same way and were at 1.5 to 2.0 seconds.

**6. Text inside the demonstrations failed the contrast standard** on all
four service pages (Lighthouse accessibility 96): pale grey labels, coloured
figures on tints, and the "before" states, which were drawn deliberately
drab and went too far.

**7. One case illustration had a table with no column headers** for a screen
reader (case 003).

**8. No fixed button on phones.** Once the hero had scrolled away, the next
"Book a free consultation" was at the foot of the page.

What was already right: no page scrolled sideways at any width; at 360×740
every page had its headline, first sentence and main button on the first
screen (the script's one flag, on the quiz result, is discussed under
"Results"); form fields were 16px with the right input types and autocomplete,
so a phone neither zooms on focus nor shows the wrong keyboard; layout shift
was under 0.03 everywhere; no tap took longer than 130ms to answer; three.js
was loaded only on the two pages that use it.

## What was changed

1. **The header fits 360px.** Below 480px its spacing is tighter and the
   button's padding is 12px. The mark and "Menu" keep their place on the
   page margin, and their 48px tap areas reach 8px into it. Below 350px the
   header drops the button.
2. **Every tap target is at least 48px** on screens under 900px: the mark,
   the menu, header and footer links, text links, tags, buttons, chips, the
   skip link. Footer links are 48px rows.
3. **Running text is 16px or more** under 900px, the footer included.
   Labels, tags and the units beside figures stay small, as the design
   system sets them.
4. **The 3D scene waits on a phone.** It starts at the first touch or scroll,
   or 3.5 seconds after load, whichever comes first. Until then the hero
   shows the drawn key in the same place. The worn key's texture is drawn in
   slices between frames and cached. A desktop is unchanged.
5. **Demonstrations are painted in their finished state from the first
   frame,** then rewind and play. Their timelines are built one at a time as
   a page nears them.
6. **Demonstration colours were adjusted** until all text in both states
   passes: darker greys for labels, figures in ink with the colour moved to
   a border, darker reds and blues in the "before" states.
7. **The table in case 003 names its columns** for screen readers.
8. **A slim bar with "Book a free consultation"** is fixed to the foot of the
   screen under 720px. It comes up once the first screen has scrolled past
   and goes away while a form or the footer is on screen, so it never covers
   the thing it points to. It respects the safe area on phones with a home
   indicator. While it is up, the header's own button is hidden.
9. **The weekly change under the hero counter** no longer shifts the layout
   (see `AUDIT-motion.md`).

## Results

### The checks, across all 17 pages and states at four widths

| | Before | After |
|---|---|---|
| Pages that scroll sideways | 0 | 0 |
| Controls cut off by the screen edge | 0 (the header overran its margin by 10px at 360) | 0 |
| Taps that did not land | 0 | 0 |
| First screen at 360×740 without headline, sentence and button | 0 | 0 |
| Tap targets under 48px | 17 to 22 a page | 0 |
| Running text under 16px | 15 to 39 pieces a page | 0 |
| Slowest Largest Contentful Paint | 3.28s | 1.75s |
| Largest layout shift | 0.025 | 0.010 |
| Slowest response to a tap | 128ms | 72ms |

The limits were 2.5s, 0.1 and 200ms. Between the two columns there was one
run in which "Menu" was cut off at 360 and its tap did not land (finding 1).

The first-screen check reports the quiz result as missing its sentence. That
is the script looking for the wrong element. The first screen of a result at
360×740 shows the heading, the whole of "what your answers say", the
estimate and the button (`shots/first-quiz-r-a-c-ab-c-d-c-c-a-b.png`).

### Each page at 390 wide, after

| Page | LCP | Layout shift | Slowest tap | Transferred |
|---|---|---|---|---|
| Home | 1.74s | 0 | 32ms | 308 KB |
| Services | 0.81s | 0 | 32ms | 164 KB |
| Automation and AI agents | 0.88s | 0 | 40ms | 166 KB |
| Reporting and dashboards | 1.36s | 0 | 40ms | 167 KB |
| Websites and software | 1.00s | 0.001 | 32ms | 167 KB |
| Branding and graphic design | 1.40s | 0.001 | 56ms | 167 KB |
| Cases | 0.82s | 0 | 40ms | 157 KB |
| A case | 0.78s | 0 | 32ms | 156 KB |
| Audit | 1.31s | 0 | 56ms | 296 KB |
| Crew | 0.80s | 0 | 32ms | 162 KB |
| Savers | 0.80s | 0 | 32ms | 161 KB |
| Quiz | 1.12s | 0 | 32ms | 162 KB |
| Quiz result | 1.30s | 0.007 | 32ms | 162 KB |
| Counting | 0.80s | 0 | 32ms | 156 KB |
| Contact | 0.76s | 0 | 32ms | 161 KB |
| Privacy | 0.78s | 0 | 24ms | 160 KB |
| 404 | 0.72s | 0 | 32ms | 102 KB |

The homepage and the audit page are heavier because they carry three.js
(139 KB compressed), fetched after first paint. Every other page carries
about 60 KB of script.

### Lighthouse, phone profile

Scores are performance / accessibility / best practices / SEO. "Before" was
run on 16 pages; "after" on all 27. Lighthouse simulates a mid-range phone on
slow 4G.

| Page | Before | After | LCP before | LCP after | Blocking before | Blocking after | Layout shift after |
|---|---|---|---|---|---|---|---|
| Home | 52 / 100 / 100 / 60 | 95 / 100 / 100 / 63 | 4.2s | 2.3s | 6727ms | 134ms | 0 |
| Services | 98 / 100 / 100 / 60 | 98 / 100 / 100 / 63 | 2.3s | 2.3s | 0ms | 0ms | 0 |
| Automation and AI agents | 98 / 96 / 100 / 60 | 98 / 100 / 100 / 63 | 2.3s | 2.3s | 15ms | 0ms | 0 |
| Reporting and dashboards | 98 / 96 / 100 / 60 | 98 / 100 / 100 / 63 | 2.1s | 2.3s | 56ms | 15ms | 0 |
| Websites and software | 98 / 96 / 100 / 60 | 98 / 100 / 100 / 63 | 2.3s | 2.1s | 0ms | 0ms | 0.002 |
| Branding and graphic design | 98 / 96 / 100 / 60 | 98 / 100 / 100 / 63 | 2.3s | 2.3s | 19ms | 0ms | 0.001 |
| Cases | 99 / 100 / 100 / 60 | 99 / 100 / 100 / 63 | 2.0s | 2.0s | 17ms | 0ms | 0.001 |
| Case 001 | not run | 100 / 100 / 100 / 63 |  | 1.5s |  | 0ms | 0.001 |
| Case 002 | 99 / 100 / 100 / 60 | 99 / 100 / 100 / 63 | 2.0s | 2.0s | 19ms | 0ms | 0.001 |
| Case 003 | not run | 99 / 100 / 100 / 63 |  | 2.0s |  | 0ms | 0.001 |
| Case 004 | not run | 99 / 100 / 100 / 63 |  | 2.0s |  | 0ms | 0.001 |
| Case 005 | not run | 99 / 100 / 100 / 63 |  | 2.0s |  | 0ms | 0.001 |
| Case 006 | not run | 99 / 100 / 100 / 63 |  | 2.0s |  | 0ms | 0.001 |
| Case 007 | not run | 99 / 100 / 100 / 63 |  | 2.0s |  | 0ms | 0.001 |
| Case 008 | not run | 99 / 100 / 100 / 63 |  | 2.0s |  | 0ms | 0.001 |
| Case 009 | not run | 99 / 100 / 100 / 63 |  | 2.0s |  | 0ms | 0.001 |
| Case 010 | not run | 99 / 100 / 100 / 63 |  | 2.0s |  | 0ms | 0.001 |
| Case 011 | 99 / 100 / 100 / 60 | 99 / 100 / 100 / 63 | 2.0s | 2.0s | 3ms | 0ms | 0.001 |
| Case 012 | not run | 99 / 100 / 100 / 63 |  | 2.0s |  | 0ms | 0.001 |
| Audit | 68 / 100 / 100 / 60 | 99 / 100 / 100 / 63 | 2.1s | 2.1s | 5172ms | 0ms | 0 |
| Crew | 99 / 100 / 100 / 60 | 99 / 100 / 100 / 63 | 2.1s | 2.1s | 0ms | 0ms | 0.001 |
| Savers | 98 / 100 / 100 / 60 | 99 / 100 / 100 / 63 | 2.1s | 2.1s | 0ms | 0ms | 0.001 |
| Quiz | 99 / 100 / 100 / 60 | 99 / 100 / 100 / 63 | 1.8s | 2.0s | 0ms | 0ms | 0 |
| Counting | 99 / 100 / 100 / 60 | 99 / 100 / 100 / 63 | 2.0s | 2.0s | 8ms | 0ms | 0.002 |
| Contact | 98 / 100 / 100 / 60 | 99 / 100 / 100 / 63 | 2.1s | 2.1s | 2ms | 0ms | 0 |
| Privacy | 98 / 100 / 100 / 60 | 99 / 100 / 100 / 63 | 2.1s | 2.1s | 4ms | 0ms | 0.001 |
| 404 | not run | 100 / 100 / 100 / 63 |  | 1.4s |  | 0ms | 0.001 |

- **Performance:** 95 to 100 on every page. The target was 90. Before, the
  homepage was 52 and the audit page 68. The homepage scored 98 in three
  earlier runs and 95 in this last one, with 134ms of blocking time where the
  others had under 15ms. That is run-to-run variation on the one page that
  starts a large 3D scene. The table shows the lowest figure seen.
- **Accessibility:** 100 on every page. Before, the four service pages were 96.
- **Best practices:** 100 on every page.
- **SEO:** 63. The one failing check is "page is blocked from indexing",
  which is the `noindex` every page carries while the content is mock. With
  demo mode off, the six pages checked score 100 (`AUDIT-seo.md`).
- **Slowest Largest Contentful Paint:** 2.3s. **Most blocking time:** 134ms.

## What is left

- **One script file of 59 KB on every page** holds the animation library and
  the site's content data. Splitting it would save a few kilobytes on the
  simplest pages and cost a second request on the rest. Left alone.
- **Three open fonts, six files, about 85 KB.** They are the stand-ins for
  the licensed faces. Revisit the weights when the licensed fonts go in.
- **The SEO score** is held down by `noindex`, which is deliberate while the
  content is mock.

## Not verified

- **A real phone.** Tap targets, text size and layout are facts about the
  page and will hold. Speed is not: these figures come from a desktop
  processor slowed four times, which is a convention, not a phone.
- **The 3D scenes at a real frame rate.** This machine draws 3D in software.
  On a phone with a graphics chip the hero should be far smoother than
  anything measured here, but that needs looking at on two or three real
  devices, including an older Android phone.
- **Interaction to Next Paint in the field.** The lab figure is the slowest
  of a handful of scripted taps. The real measure comes from visitors, and
  Cloudflare Web Analytics reports it once the token is set.
- **Safari on an iPhone.** Only Chromium was used. The things most worth
  checking there are the bar at the foot of the screen against Safari's own
  toolbar, and the hero's pinned sequence.
