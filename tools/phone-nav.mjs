// node tools/phone-nav.mjs   (after `npm run build`)
//
// Moving around the site on a phone, as a visitor does: in-page buttons that
// jump to a form, links to another page's section, the back button, and the
// menu. For each it reports where the page ended up and photographs it into
// shots/phone/nav/. A jump is right when its target sits just under the
// header; a return is right when the page is back where it was left.
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch } from './shots.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'shots', 'phone', 'nav');
await mkdir(out, { recursive: true });
const { server, url } = await serve();
const browser = await launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const failures = [];
const ok = (cond, what) => {
  if (!cond) failures.push(what);
  console.log(`${cond ? '  ok  ' : '  FAIL'} ${what}`);
};
const settle = async (ms = 1400) => {
  await page.waitForLoadState('load');
  await page.waitForTimeout(ms);
};
/** Where an element's top sits in the viewport, and the header's height. */
const where = (sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    const bar = document.querySelector('.bar');
    return { top: el ? Math.round(el.getBoundingClientRect().top) : null, bar: bar ? Math.round(bar.getBoundingClientRect().bottom) : 0, y: Math.round(window.scrollY), path: location.pathname + location.hash, sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  }, sel);
const shot = (name) => page.screenshot({ path: join(out, `${name}.png`) });

// 1. A plan button on /savers jumps to the enquiry form.
await page.goto(`${url}/savers`, { waitUntil: 'load' });
await settle(800);
await page.locator('.tier-ask').first().scrollIntoViewIfNeeded();
await page.locator('.tier-ask').first().tap();
await settle();
let w = await where('#enquire');
ok(w.top !== null && w.top >= w.bar - 4 && w.top < 320, `/savers "Ask about" lands on the form (form top at ${w.top}px, header ends at ${w.bar}px)`);
await shot('savers-ask');

// 2. The audit page's own button jumps to its form.
await page.goto(`${url}/audit`, { waitUntil: 'load' });
await settle(1200);
await page.locator('.phero-copy .key').first().tap();
await settle();
w = await where('#book');
ok(w.top !== null && w.top >= w.bar - 4 && w.top < 320, `/audit "Book a free consultation" lands on the form (form top at ${w.top}px, header ends at ${w.bar}px)`);
await shot('audit-book');

// 3. Arriving on another page at a section: /savers#enquire and /products#clear, loaded cold.
for (const [path, sel] of [['/savers#enquire', '#enquire'], ['/products#clear', '#clear'], ['/audit#book', '#book']]) {
  await page.goto(`${url}/`, { waitUntil: 'load' });
  await page.goto(url + path, { waitUntil: 'load' });
  await settle(1800);
  w = await where(sel);
  ok(w.top !== null && w.top >= w.bar - 8 && w.top < 360, `${path} opens at its section (top at ${w.top}px, header ends at ${w.bar}px)`);
  await shot(`arrive-${path.replace(/[^a-z]+/g, '-')}`);
}

// 4. Home, scroll well down, follow a link, come back: the page is where it was left.
await page.goto(`${url}/`, { waitUntil: 'load' });
await settle(1500);
const more = page.locator('a.more[href="/cases"]').first();
await more.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
const before = await where('a.more[href="/cases"]');
await shot('home-before-leaving');
await more.tap();
await settle();
ok((await where('h1')).path === '/cases', 'the link opens /cases');
await page.goBack();
await settle(1800);
const after = await where('a.more[href="/cases"]');
ok(after.path === '/' && Math.abs(after.y - before.y) < 120, `back returns to the same place on the homepage (was ${before.y}px down, now ${after.y}px)`);
ok(after.sideways <= 0, 'no sideways scroll after coming back');
await shot('home-after-back');

// 5. The menu: stays up until the next page is there, and is closed after coming back.
await page.goto(`${url}/`, { waitUntil: 'load' });
await settle(800);
await page.locator('.menu > summary').tap();
await page.waitForTimeout(250);
const tapped = page.locator('.menu-list a', { hasText: 'Savers' }).first();
// Watch what the old page shows between the tap and leaving.
await page.evaluate(() => {
  window.__menuAtLeave = null;
  window.addEventListener('pagehide', () => { sessionStorage.setItem('ks-test-menu', String(Boolean(document.querySelector('.menu[open]')))); });
});
await tapped.tap();
await settle();
const atLeave = await page.evaluate(() => sessionStorage.getItem('ks-test-menu'));
ok(atLeave === 'true', 'the menu stays open until the old page is gone (no flash of the page underneath)');
ok(!(await page.evaluate(() => Boolean(document.querySelector('.menu[open]')))), 'the menu is closed on the page that opens');
await page.goBack();
await settle(1200);
ok(!(await page.evaluate(() => Boolean(document.querySelector('.menu[open]')))), 'the menu is closed after going back');
await shot('home-after-menu-back');

ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} problem(s).` : '\nAll phone navigation checks passed.');
process.exit(failures.length ? 1 : 0);
