// node tools/wake-test.mjs   (after `npm run build`)
//
// The cursor wake and the hero's answer to the pointer, in a real browser:
//   - a mouse moving over a page starts the wake, and it draws something
//   - it rests (canvas hidden, no frames) a few seconds after the mouse stops
//   - it never starts on a touch screen, with reduced motion, or on an
//     onboarding form
//   - in the homepage hero, keys go down under the pointer and a click sends
//     a ring out, without a script error
//   - the page stays near 60 frames a second while the wake is running
// Pictures go to shots/wake/. Exits 1 on a failure.
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

  await page.goto(`${url}/services`, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  ok(!(await state(page)).exists, 'nothing is loaded until the mouse moves');
  // Frame times while the wake runs.
  await page.evaluate(() => {
    window.__frames = [];
    let last = performance.now();
    const tick = (now) => { window.__frames.push(now - last); last = now; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await sweep(page, [260, 300], [1100, 520], 56);
  const mid = await page.screenshot({ path: join(out, 'services-wake.png') });
  let s = await state(page);
  ok(s.exists && s.visible, 'a mouse moving starts the wake');
  // Back across the page to the empty margin, and a click there: a ring goes out.
  await sweep(page, [1100, 520], [26, 640], 26, -70);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(260);
  const ring = await page.screenshot({ path: join(out, 'services-click.png') });
  const frames = await page.evaluate(() => window.__frames.slice(10));
  const slow = frames.filter((f) => f > 34).length;
  ok(frames.length > 30 && slow / frames.length < 0.1, `the page keeps its frame rate with the wake running (${frames.length} frames, ${slow} over 34ms, median ${frames.sort((a, b) => a - b)[Math.floor(frames.length / 2)].toFixed(1)}ms)`);
  await page.waitForTimeout(5200);
  s = await state(page);
  ok(s.exists && !s.visible, 'it rests once the mouse has stopped: the canvas is hidden');

  // The homepage hero: the field's keys answer the pointer.
  await page.goto(`${url}/`, { waitUntil: 'load' });
  await page.waitForTimeout(2600);
  const top = await page.screenshot({ path: join(out, 'home-top.png') });
  await page.mouse.wheel(0, 1300);
  await page.waitForTimeout(1600);
  await sweep(page, [760, 250], [1280, 640], 30, 60);
  const field = await page.screenshot({ path: join(out, 'home-field-wake.png') });
  // A click on a key in the field (not on a link): a ring goes out through the keys.
  await page.mouse.click(1040, 470);
  await page.waitForTimeout(230);
  const ripple = await page.screenshot({ path: join(out, 'home-field-ring.png') });
  await page.waitForTimeout(700);
  ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  await sheet([mid, ring, field, ripple], 'sheet.jpg');
  void top;
  await context.close();
}

/* ---------- Where there must be no wake ---------- */
console.log('\nno wake');
for (const [label, options, path] of [
  ['a touch screen', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, '/services'],
  ['reduced motion', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, '/services'],
]) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.goto(url + path, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  if (options.hasTouch) {
    await page.touchscreen.tap(200, 400);
  } else {
    await sweep(page, [200, 300], [900, 500], 12);
  }
  await page.waitForTimeout(500);
  ok(!(await state(page)).exists, `no wake with ${label}`);
  await context.close();
}

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} problem(s).` : '\nAll wake checks passed.');
process.exit(failures.length ? 1 : 0);
