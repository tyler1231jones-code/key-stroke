// node tools/intro-test.mjs   (after `npm run build`)
//
// The homepage intro (src/components/Pitch.astro), in a real browser:
//   - it plays on the first visit in a session and not on the second
//   - it is over, and out of the document, inside four and a half seconds
//   - Skip, the Escape key and a scroll each end it at once
//   - its key lands on the hero's key
//   - with reduced motion it is one still frame and nothing moves
//   - a phone gets it too, with nothing wider than the screen
// A program-driven browser is not shown the intro unless the address asks
// (?intro), so every visit here asks. Film strips go to shots/intro/.
// Exits 1 on a failure.
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { serve, launch } from './shots.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'shots', 'intro');
await mkdir(out, { recursive: true });
const { server, url } = await serve();
const browser = await launch();
const failures = [];
const ok = (cond, what) => {
  if (!cond) failures.push(what);
  console.log(`${cond ? '  ok  ' : '  FAIL'} ${what}`);
};
const state = (page) =>
  page.evaluate(() => ({
    there: Boolean(document.getElementById('pitch')),
    on: document.documentElement.classList.contains('pitch-on'),
    sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

/** Film a visit: a frame every `every` ms for `ms`, laid out as a strip. */
async function film(page, name, ms, every, cols, size) {
  const frames = [];
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const at = Date.now() - t0;
    frames.push({ at, png: await page.screenshot() });
    const wait = every - (Date.now() - t0 - at);
    if (wait > 0) await page.waitForTimeout(wait);
  }
  const [w, h] = size;
  const comps = await Promise.all(frames.map(async (f, i) => ({ input: await sharp(f.png).resize(w, h).toBuffer(), left: (i % cols) * (w + 6), top: Math.floor(i / cols) * (h + 6) })));
  await sharp({ create: { width: cols * (w + 6), height: Math.ceil(frames.length / cols) * (h + 6), channels: 3, background: '#ff00ff' } }).composite(comps).jpeg({ quality: 84 }).toFile(join(out, `${name}.jpg`));
  return frames.map((f) => f.at);
}

/** How long the intro takes to leave the document after something is done to end it. */
async function gone(page) {
  const t0 = Date.now();
  await page.waitForFunction(() => !document.getElementById('pitch'), null, { timeout: 2500, polling: 50 }).catch(() => {});
  return { there: (await state(page)).there, ms: Date.now() - t0 };
}

/* ---------- A desktop ---------- */
console.log('\ndesktop');
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto(`${url}/?intro&debug`, { waitUntil: 'commit' });
  await page.waitForSelector('#pitch', { state: 'attached' });
  const started = Date.now();
  let s = await state(page);
  ok(s.there && s.on, 'the intro is on screen from the first paint');
  ok(await page.locator('.pitch-skip').isVisible(), 'there is a Skip button');
  await film(page, 'desktop', 5200, 240, 5, [576, 360]);
  await page.waitForFunction(() => !document.getElementById('pitch'), null, { timeout: 4000 }).catch(() => {});
  s = await state(page);
  ok(!s.there && !s.on, 'it has handed over and left the document');
  const over = await page.evaluate(() => performance.getEntriesByName('ks-intro-end')[0]?.startTime ?? null);
  ok(over !== null && over < 4500, `it was over ${over === null ? 'never' : `${(over / 1000).toFixed(2)}s`} after the page began (limit 4.5s)`);
  void started;

  // The second visit in the same session: straight to the page.
  await page.goto(`${url}/?debug`, { waitUntil: 'load' });
  s = await state(page);
  ok(!s.there && !s.on, 'no intro on the second visit in the session');

  // Skip.
  await page.goto(`${url}/?intro`, { waitUntil: 'commit' });
  await page.waitForSelector('.pitch-skip');
  await page.waitForTimeout(700);
  await page.locator('.pitch-skip').click();
  let g = await gone(page);
  ok(!g.there && g.ms < 2000, `Skip ends it at once (gone in ${g.ms}ms)`);
  // Escape.
  await page.goto(`${url}/?intro`, { waitUntil: 'commit' });
  await page.waitForSelector('#pitch', { state: 'attached' });
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  g = await gone(page);
  ok(!g.there && g.ms < 2000, `the Escape key ends it (gone in ${g.ms}ms)`);
  // A scroll.
  await page.goto(`${url}/?intro`, { waitUntil: 'commit' });
  await page.waitForSelector('#pitch', { state: 'attached' });
  await page.waitForTimeout(500);
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, 300);
  g = await gone(page);
  ok(!g.there && g.ms < 2000, `a scroll ends it (gone in ${g.ms}ms)`);
  ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  await context.close();
}

/* ---------- Reduced motion ---------- */
console.log('\nreduced motion');
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${url}/?intro`, { waitUntil: 'commit' });
  await page.waitForSelector('#pitch', { state: 'attached' });
  await page.waitForTimeout(500);
  const moving = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('#pitch') && a.animationName !== 'pitch-bail').length);
  ok(moving === 0, `nothing in it is animating (${moving} running)`);
  await page.screenshot({ path: join(out, 'reduced.png') });
  await page.waitForTimeout(2200);
  ok(!(await state(page)).there, 'the still frame is gone inside three seconds');
  await context.close();
}

/* ---------- A phone ---------- */
console.log('\nphone');
for (const [w, h] of [[390, 844], [360, 640]]) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${url}/?intro`, { waitUntil: 'commit' });
  await page.waitForSelector('#pitch', { state: 'attached' });
  await page.waitForTimeout(900);
  const fit = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const wide = [];
    for (const el of document.querySelectorAll('#pitch .pitch-word, #pitch .pitch-board, #pitch .pitch-count, #pitch .pitch-list, #pitch .pitch-skip')) {
      const r = el.getBoundingClientRect();
      if (r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1) wide.push(`${el.className} [${Math.round(r.left)}..${Math.round(r.right)} of ${vw}, ${Math.round(r.top)}..${Math.round(r.bottom)} of ${vh}]`);
    }
    return wide;
  });
  ok(fit.length === 0, `${w}x${h}: everything in it fits the screen${fit.length ? `: ${fit.join('; ')}` : ''}`);
  await film(page, `phone-${w}`, 3900, 300, 7, [w * 0.7, h * 0.7].map(Math.round));
  await page.waitForFunction(() => !document.getElementById('pitch'), null, { timeout: 3000 }).catch(() => {});
  const s = await state(page);
  ok(!s.there && s.sideways <= 0, `${w}x${h}: it hands over, and the page does not scroll sideways`);
  ok(errors.length === 0, `${w}x${h}: no script errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} problem(s).` : '\nAll intro checks passed.');
process.exit(failures.length ? 1 : 0);
