// node tools/browsers.mjs            the built site in dist/ (run `npm run build` first)
// node tools/browsers.mjs --live     https://key-stroke.com.au
// node tools/browsers.mjs --browser=edge,firefox   only those browsers
//
// Firefox and WebKit come from `npx playwright install firefox webkit`
// (installed on this PC on 9 October 2026); Edge is the copy Windows ships.
//
// Loads the main pages in four browsers, at desktop and phone size, and
// records what goes wrong in each:
//   chrome   Playwright's Chromium (the engine Chrome uses)
//   edge     Microsoft Edge, the copy installed on this PC
//   firefox  Playwright's Firefox
//   safari   Playwright's WebKit (the engine Safari uses on Mac, iPhone and iPad)
// For each page: script errors, console errors, requests that failed, whether
// the page script started (the page falls back to its still version if it
// has not after 5 seconds), whether the fonts loaded, sideways scroll, load
// time, and on the homepage whether the 3D stage drew. It scrolls each page
// to the bottom so everything that arrives on scroll is tried, and takes a
// screenshot of the top of each page to shots/browsers/<browser>-<size>-<page>.png.
// Results also go to shots/browsers/results.json. Nothing is submitted.
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from '@playwright/test';
import { serve } from './shots.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'shots', 'browsers');
await mkdir(out, { recursive: true });

const live = process.argv.includes('--live');
const local = live ? null : await serve();
const base = live ? 'https://key-stroke.com.au' : local.url;

const PAGES = ['/', '/services', '/services/websites-and-software', '/cases', '/cases/001', '/audit', '/crew', '/savers', '/quiz', '/contact', '/counting', '/privacy', '/onboard/website-build'];
const ALL = [
  { name: 'chrome', type: chromium, options: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } },
  { name: 'edge', type: chromium, options: { channel: 'msedge' } },
  { name: 'firefox', type: firefox, options: {} },
  { name: 'safari', type: webkit, options: {} },
];
// --browser=edge (or a comma list) runs only those.
const only = process.argv.find((a) => a.startsWith('--browser='))?.split('=')[1]?.split(',');
const BROWSERS = only ? ALL.filter((b) => only.includes(b.name)) : ALL;
const SIZES = [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'phone', viewport: { width: 390, height: 844 }, mobile: true },
];
const key = (path) => (path === '/' ? 'home' : path.slice(1).replace(/\//g, '-'));

const results = [];
for (const b of BROWSERS) {
  let browser;
  try {
    browser = await b.type.launch(b.options);
  } catch (err) {
    console.log(`${b.name}: could not start (${err.message.split('\n')[0]})`);
    results.push({ browser: b.name, error: 'could not start' });
    continue;
  }
  console.log(`\n${b.name} ${browser.version()}`);
  for (const size of SIZES) {
    // Firefox does not emulate a phone; it gets the phone's width and height.
    const mobile = size.mobile && b.name !== 'firefox' ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {};
    const context = await browser.newContext({ viewport: size.viewport, ...mobile });
    for (const path of PAGES) {
      const page = await context.newPage();
      const found = { browser: b.name, size: size.name, page: path, errors: [], console: [], failed: [] };
      page.on('pageerror', (e) => found.errors.push(e.message.split('\n')[0]));
      page.on('console', (m) => m.type() === 'error' && found.console.push(m.text().split('\n')[0].slice(0, 200)));
      page.on('requestfailed', (r) => found.failed.push(`${r.failure()?.errorText ?? 'failed'} ${r.url().replace(base, '')}`));
      page.on('response', (r) => r.status() >= 400 && !r.url().endsWith('favicon.ico') && found.failed.push(`${r.status()} ${r.url().replace(base, '')}`));
      const started = Date.now();
      try {
        await page.goto(base + path, { waitUntil: 'load', timeout: 45000 });
        found.loadMs = Date.now() - started;
        await page.waitForTimeout(1500);
        // Scroll to the bottom in steps, so every reveal and scroll scene runs.
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.8)) {
            scrollTo(0, y);
            await new Promise((ok) => setTimeout(ok, 120));
          }
          scrollTo(0, 0);
        });
        await page.waitForTimeout(5200 - Math.min(5200, Date.now() - started));
        Object.assign(
          found,
          await page.evaluate(() => {
            const d = document.documentElement;
            const canvas = document.querySelector('canvas#stage');
            return {
              scriptRan: d.classList.contains('run'),
              fellBackToStill: d.classList.contains('still'),
              // The weights every page uses (and preloads). Asking for any other
              // weight reports a face the page simply never needed.
              fonts: ['600 16px "Oswald"', '400 16px "Archivo"', '500 16px "IBM Plex Mono"'].filter((f) => !document.fonts.check(f)),
              sideways: d.scrollWidth - innerWidth,
              stage: canvas ? { width: canvas.width, height: canvas.height, ready: d.classList.contains('stage-ready') || canvas.width > 0 } : null,
              hiddenBlocks: Array.from(document.querySelectorAll('[data-reveal].pre')).length,
            };
          }),
        );
        await page.screenshot({ path: join(out, `${b.name}-${size.name}-${key(path)}.png`) });
      } catch (err) {
        found.errors.push(`did not load: ${err.message.split('\n')[0]}`);
      }
      const problems = [
        ...found.errors.map((e) => `script error: ${e}`),
        ...found.console.map((e) => `console: ${e}`),
        ...found.failed.map((e) => `request: ${e}`),
        ...(found.scriptRan === false ? ['the page script did not start'] : []),
        ...(found.fonts?.length ? [`fonts missing: ${found.fonts.join(', ')}`] : []),
        ...(found.sideways > 1 ? [`scrolls sideways by ${found.sideways}px`] : []),
        ...(found.hiddenBlocks ? [`${found.hiddenBlocks} blocks never revealed`] : []),
      ];
      found.problems = problems;
      results.push(found);
      console.log(`  ${size.name.padEnd(7)} ${path.padEnd(32)} ${String(found.loadMs ?? '-').padStart(5)}ms  ${problems.length ? problems.join(' | ') : 'ok'}`);
      await page.close();
    }
    await context.close();
  }
  await browser.close();
}
local?.server.close();
await writeFile(join(out, 'results.json'), JSON.stringify(results, null, 2));
const bad = results.filter((r) => r.problems?.length || r.error);
console.log(bad.length ? `\n${bad.length} page loads with problems. Details in shots/browsers/results.json.` : '\nNo problems in any browser.');
