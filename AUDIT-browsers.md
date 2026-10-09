# Audit: browsers

9 October 2026. The principals saw problems loading the site in Microsoft
Edge that they did not see in Chrome. This audit loads the site in four
browser engines and records what goes wrong in each.

How to run it again: `npm run build`, then `node tools/browsers.mjs`
(add `--live` for the live site, `--browser=edge` for one browser). Results
and screenshots go to `shots/browsers/`.

## What was tested

| Browser | Version | What it stands for |
|---|---|---|
| Chromium (Playwright) | 153 | Google Chrome |
| Microsoft Edge (installed on this PC) | 154 | Edge, the same program a visitor runs |
| Firefox (Playwright) | 155 | Firefox |
| WebKit (Playwright) | 26.6 | Safari on Mac, and every browser on iPhone and iPad |

Thirteen pages (home, services, a service page, cases, a case, audit, crew,
Savers, quiz, contact, counting, privacy, an onboarding form), each at
1440 by 900 and at phone size (390 by 844; touch and phone emulation
everywhere except Firefox, which cannot emulate a phone). On each page:
script errors, console errors, failed requests, whether the page script
started, whether the fonts loaded, sideways scrolling, load time, and
whether the 3D stage drew. Every page was scrolled to the bottom so that
everything that appears on scroll ran.

## Results

**No problems in any of the four browsers.** 104 page loads, no script
errors, no console errors, no failed requests, no sideways scrolling. The
page script started everywhere, the three fonts loaded everywhere, every
block that arrives on scroll arrived, and the 3D keys on the homepage and the
audit page drew in all four. Screenshots of the same page match across the
browsers.

The first run flagged "Oswald missing" on `/quiz` in every browser. That was
the test asking for a weight of Oswald the quiz never uses; the headline is
in Oswald in every screenshot. The test now asks for the weights the site
actually uses.

Moving between pages is a cross-fade in Chrome, Edge and Safari, and a plain
cut in Firefox, which does not support cross-page transitions yet. That is
by design and not a fault.

## The Edge problem: not reproduced

Edge on this PC loads every page correctly, so the problem seen was probably
specific to that computer's Edge rather than to the site. Likely causes, most
likely first:

1. **Graphics acceleration is off** in that Edge (Settings, System and
   performance, "Use graphics acceleration when available"). The 3D keys then
   draw in software: slow to appear and jerky while scrolling, though the
   page still works.
2. **Enhanced security mode** set to Strict (Settings, Privacy, search and
   services). It slows heavy scripts such as the 3D, so the page can sit on
   its still version for a few seconds.
3. **An extension**, such as an ad or script blocker, stopping the page
   script. The page then shows its still, no-motion version after 5 seconds.
4. **An old copy from before a deploy.** Pages are served so that a browser
   always checks for a newer one, so this clears with a refresh.

To pin it down: a screenshot of what Edge shows, the page address, and the
Edge version (Settings, About Microsoft Edge). If the 3D is the problem, a
lighter fallback for slow graphics is a small change.

## Internet Explorer

Internet Explorer was retired by Microsoft in 2022 and cannot run this site
(nor most current sites). On Windows 10 and 11, opening it now opens Edge.
It is not supported, and was not tested.

## What was not tested

- Real phones and tablets: phone sizes were emulated.
- Safari on an actual Mac or iPhone: WebKit is the same engine, but not the
  same program.
- Frame rate with real graphics hardware: these runs draw 3D in software.
- A screen reader.
