// node tools/wake-test.mjs   (after `npm run build`)
//
// The cursor wake, in a real browser. It belongs to the homepage hero and
// nowhere else:
//   - on any other page there is no wake, whatever the mouse does
//   - in the hero a moving mouse draws it, behind the headline
//   - the hero's greeting sends a ring out through it with no mouse at all
//   - it rests (canvas hidden, no frames) a few seconds after the mouse stops
//   - once the hero's scroll sequence has dropped its keys there is no wake,
//     and there is none in any section below the hero
//   - it never starts on a touch screen or with reduced motion
//   - the hero's own keys still answer the pointer and a click, without a
//     script error, and the page keeps its frame rate
// The homepage is opened with ?debug, which keeps the 3D stage and the wake
// running on a software renderer. Pictures go to shots/wake/. Exits 1 on a
// failure.
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { serve, launch } from './shots.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'shots', 'wake');
await mkdir(out, { recursive: true });
const { server, url } = await serve();
const browser = await launch();
const failures = [];
const ok = (cond, what) => {
  if (!cond) failures.push(what);
  console.log(`${cond ? '  ok  ' : '  FAIL'} ${what}`);
};
const state = (page) =>
  page.evaluate(() => {
    const c = document.querySelector('canvas.wake');
    return { exists: Boolean(c), visible: c ? getComputedStyle(c).visibility === 'visible' : false };
  });
/** A hand-like path: a curve across the page, in small steps. */
async function sweep(page, from, to, steps = 28, bend = 90) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    await page.mouse.move(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * bend);
    await page.waitForTimeout(14);
  }
}
/** How much of a region of two screenshots differs, 0 to 1. */
async function changed(a, b, region) {
  const raw = async (png) => sharp(png).extract(region).greyscale().raw().toBuffer();
  const [x, y] = await Promise.all([raw(a), raw(b)]);
  let n = 0;
  for (let i = 0; i < x.length; i++) if (Math.abs(x[i] - y[i]) > 6) n++;
  return n / x.length;
}
const sheet = async (files, name) => {
  const w = 720;
  const h = 450;
  const comps = await Promise.all(files.map(async (input, i) => ({ input: await sharp(input).resize(w, h).toBuffer(), left: (i % 2) * (w + 8), top: Math.floor(i / 2) * (h + 8) })));
  await sharp({ create: { width: 2 * (w + 8), height: Math.ceil(files.length / 2) * (h + 8), channels: 3, background: '#ffffff' } }).composite(comps).jpeg({ quality: 86 }).toFile(join(out, name));
};

/* ---------- A desktop with a mouse ---------- */
console.log('\ndesktop');
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  // Another page: no wake.
  await page.goto(`${url}/services`, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await sweep(page, [260, 300], [1100, 520], 30);
  await page.waitForTimeout(400);
  ok(!(await state(page)).exists, 'no wake on a page that is not the homepage');

  // The homepage. The greeting: the worn key presses itself and a ring goes out behind the headline.
  await page.goto(`${url}/?debug`, { waitUntil: 'load' });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('canvas.wake') ?? document.body).visibility === 'visible' && document.querySelector('canvas.wake'), null, { timeout: 6000 }).catch(() => {});
  let s = await state(page);
  ok(s.exists && s.visible, 'the greeting starts the wake with no mouse');
  await page.waitForTimeout(350);
  const greet = await page.screenshot({ path: join(out, 'home-greeting.png') });
  await page.waitForTimeout(6000);
  s = await state(page);
  ok(s.exists && !s.visible, 'it rests once the ring has gone: the canvas is hidden');
  const clean = await page.screenshot({ path: join(out, 'home-rest.png') });
  // The copy's corner of the hero, where there are no 3D keys.
  const corner = { left: 0, top: 80, width: 700, height: 560 };
  ok((await changed(greet, clean, corner)) > 0.01, 'the ring lit the keyboard behind the headline');

  // The mouse, across the headline. (Kept clear of the 3D keys: on the software renderer these tools use, two
  // WebGL canvases drawing in the same frame are slow in a way a graphics card is not.)
  await page.evaluate(() => {
    window.__frames = [];
    let last = performance.now();
    const tick = (now) => { window.__frames.push(now - last); last = now; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await sweep(page, [120, 200], [520, 430], 44, 70);
  const trail = await page.screenshot({ path: join(out, 'home-trail.png') });
  s = await state(page);
  ok(s.visible, 'a mouse moving in the hero draws the wake');
  ok((await changed(trail, clean, corner)) > 0.004, 'the trail is drawn behind the headline');
  await sweep(page, [520, 430], [160, 640], 26, -60);
  const frames = await page.evaluate(() => window.__frames.slice(10));
  const slow = frames.filter((f) => f > 34).length;
  ok(frames.length > 30 && slow / frames.length < 0.2, `the page keeps its frame rate with the wake running (${frames.length} frames, ${slow} over 34ms, median ${[...frames].sort((a, b) => a - b)[Math.floor(frames.length / 2)].toFixed(1)}ms)`);
  // The headline is above the wake: the text under the pointer is the page's own, not the canvas.
  const top = await page.evaluate(() => document.elementFromPoint(200, 190)?.closest('.hero-copy') !== null);
  ok(top, 'the headline sits above it');

  // Pulled back to the field: the hero's own keys answer the pointer, and a click sends a ring out.
  await page.mouse.wheel(0, 1300);
  await page.waitForTimeout(1600);
  await sweep(page, [300, 760], [1280, 520], 30, -60);
  const field = await page.screenshot({ path: join(out, 'home-field-wake.png') });
  await page.mouse.click(1040, 470);
  await page.waitForTimeout(230);
  const ripple = await page.screenshot({ path: join(out, 'home-field-ring.png') });
  await page.waitForTimeout(4200);

  // The keys have dropped away: no wake.
  await page.mouse.wheel(0, 2100);
  await page.waitForTimeout(1800);
  await sweep(page, [120, 300], [1100, 600], 26, 60);
  await page.waitForTimeout(200);
  ok(!(await state(page)).visible, 'no wake once the scroll sequence has dropped its keys');
  // Below the hero: no wake.
  await page.mouse.wheel(0, 1800);
  await page.waitForTimeout(1500);
  await sweep(page, [120, 300], [1100, 600], 26, 60);
  await page.waitForTimeout(200);
  ok(!(await state(page)).visible, 'no wake in the sections below the hero');
  await page.screenshot({ path: join(out, 'home-below.png') });
  ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  await sheet([greet, trail, field, ripple], 'sheet.jpg');
  await context.close();
}

/* ---------- Where there must be no wake ---------- */
console.log('\nno wake');
for (const [label, options] of [
  ['a touch screen', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ['reduced motion', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }],
]) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.goto(`${url}/`, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  if (options.hasTouch) {
    await page.touchscreen.tap(200, 500);
  } else {
    await sweep(page, [200, 300], [900, 500], 12);
  }
  await page.waitForTimeout(1800);
  ok(!(await state(page)).exists, `no wake with ${label}`);
  await context.close();
}

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} problem(s).` : '\nAll wake checks passed.');
process.exit(failures.length ? 1 : 0);
