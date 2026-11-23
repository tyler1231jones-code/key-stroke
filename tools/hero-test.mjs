// node tools/hero-test.mjs   (after `npm run build`)
//
// The homepage's header and hero at each size, in a real browser:
//   - at the top of the page the header has no bar behind it
//   - on a desktop the scroll sequence runs (the hero is several screens
//     long and pinned), the header stays bare all through it, and gets its
//     bar back as the hero leaves
//   - on a phone and a tablet there is no scroll sequence: the hero is a
//     plain stretch of page, the key is in it, the closing line is under it,
//     and the header gets its bar at the first scroll
//   - the header's button on a phone is a small key with room around it in
//     the bar, and still has a 48px tap area
//   - another page's header always has its bar
// Pictures go to shots/hero/. Exits 1 on a failure.
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch } from './shots.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'shots', 'hero');
await mkdir(out, { recursive: true });
const { server, url } = await serve();
const browser = await launch();
const failures = [];
const ok = (cond, what) => {
  if (!cond) failures.push(what);
  console.log(`${cond ? '  ok  ' : '  FAIL'} ${what}`);
};
const read = (page) =>
  page.evaluate(() => {
    const d = document.documentElement;
    const hero = document.getElementById('hero');
    const pin = document.querySelector('.hero-pin');
    const bar = document.querySelector('.bar');
    const plate = getComputedStyle(bar, '::before');
    const book = document.querySelector('.bar-book');
    const face = [...book.children].find((el) => getComputedStyle(el).display !== 'none');
    const rect = (el) => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, w: r.width, h: r.height }; };
    const voice = document.querySelector('.hero-voice');
    const keys = document.querySelector('.hero-count-keys');
    return {
      bare: d.classList.contains('bar-bare'),
      plate: Number(plate.opacity),
      screens: hero.offsetHeight / window.innerHeight,
      pinned: getComputedStyle(pin).position === 'sticky',
      bar: rect(bar),
      book: rect(book),
      face: face ? rect(face) : null,
      label: face?.textContent ?? '',
      menu: (() => { const m = document.querySelector('.menu > summary'); return m && getComputedStyle(m.parentElement).display !== 'none' ? rect(m) : null; })(),
      voice: getComputedStyle(voice).visibility === 'visible' && voice.getBoundingClientRect().height > 0,
      keys: keys ? getComputedStyle(keys).display !== 'none' : false,
      vw: d.clientWidth,
      sideways: d.scrollWidth - d.clientWidth,
      y: window.scrollY,
    };
  });
const scroll = async (page, y) => {
  await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), y);
  await page.waitForTimeout(700);
};

/* ---------- A desktop ---------- */
console.log('\ndesktop 1440x900');
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${url}/?debug`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  let s = await read(page);
  ok(s.bare && s.plate === 0, 'at the top the header has no bar behind it');
  ok(s.pinned && s.screens > 4, `the scroll sequence runs: the hero is pinned and ${s.screens.toFixed(1)} screens long`);
  await page.screenshot({ path: join(out, 'desktop-top.png') });
  const travel = await page.evaluate(() => document.getElementById('hero').offsetHeight - document.querySelector('.hero-pin').offsetHeight);
  await scroll(page, travel * 0.5);
  s = await read(page);
  ok(s.bare && s.plate === 0, 'half way through the sequence the header is still bare');
  await page.screenshot({ path: join(out, 'desktop-mid.png') });
  // The fades that edge the band of keys on a small screen are not for the sequence: here the keys have the
  // whole pin, and a fade would lie across them as a dark box the size of the slot.
  await page.waitForFunction(() => document.documentElement.classList.contains('stage-on'), null, { timeout: 8000 }).catch(() => {});
  const band = await page.evaluate(() => ({ on: document.documentElement.classList.contains('stage-on'), content: getComputedStyle(document.querySelector('.hero-slot'), '::after').content }));
  ok(band.on && band.content === 'none', `nothing is laid over the keys during the sequence (3D stage ${band.on ? 'running' : 'not running'}, slot overlay: ${band.content})`);
  await scroll(page, travel + 40);
  s = await read(page);
  ok(!s.bare && s.plate === 1, 'as the hero leaves, the header has its bar');
  await page.screenshot({ path: join(out, 'desktop-after.png') });
  await scroll(page, 0);
  s = await read(page);
  ok(s.bare && s.plate === 0, 'back at the top it is bare again');
  await page.goto(`${url}/services`, { waitUntil: 'load' });
  const other = await page.evaluate(() => ({ bare: document.documentElement.classList.contains('bar-bare'), plate: Number(getComputedStyle(document.querySelector('.bar'), '::before').opacity) }));
  ok(!other.bare && other.plate === 1, 'another page\'s header has its bar from the start');
  ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  await context.close();
}

/* ---------- Phones and tablets ---------- */
for (const [name, w, h] of [['phone 390x844', 390, 844], ['phone 360x640', 360, 640], ['tablet 820x1180', 820, 1180], ['tablet 1180x820', 1180, 820]]) {
  console.log(`\n${name}`);
  const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${url}/?debug`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  let s = await read(page);
  const tag = name.replace(/\s+/g, '-');
  await page.screenshot({ path: join(out, `${tag}-top.png`) });
  ok(s.bare && s.plate === 0, 'at the top the header has no bar behind it');
  ok(!s.pinned && s.screens < 2, `no scroll sequence: the hero is ${s.screens.toFixed(2)} screens of plain page`);
  ok(s.voice && !s.keys, 'the closing line is there, and the count of keys is not');
  ok(s.sideways <= 0, 'nothing is wider than the screen');
  if (s.menu) {
    ok(s.face && s.face.h <= 40 && s.face.top - s.bar.top >= 8 && s.bar.bottom - s.face.bottom >= 8, `the header's button is a small key with room in the bar (${Math.round(s.face?.h ?? 0)}px tall, ${Math.round((s.face?.top ?? 0) - s.bar.top)}px above, ${Math.round(s.bar.bottom - (s.face?.bottom ?? 0))}px below; it says "${s.label}")`);
    ok(s.book.h >= 48, `its tap area is ${Math.round(s.book.h)}px tall`);
    ok(s.menu.left - s.book.right >= 8 && s.vw - s.menu.right >= 8, `the menu has room: ${Math.round(s.menu.left - s.book.right)}px from the button, ${Math.round(s.vw - s.menu.right)}px from the edge of the screen`);
  }
  await scroll(page, 60);
  s = await read(page);
  ok(!s.bare && s.plate === 1, 'at the first scroll the header has its bar');
  await scroll(page, h * 0.6);
  await page.screenshot({ path: join(out, `${tag}-key.png`) });
  const stage = await page.evaluate(() => ({ on: document.documentElement.classList.contains('stage-on'), opacity: getComputedStyle(document.getElementById('stage')).opacity }));
  ok(!stage.on || stage.opacity === '1', 'the key does not fade while it is on screen');
  ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  await context.close();
}

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} problem(s).` : '\nAll hero checks passed.');
process.exit(failures.length ? 1 : 0);
