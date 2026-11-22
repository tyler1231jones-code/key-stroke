// node tools/phone-walk.mjs   (after `npm run build`)
//
// Walks the site the way a phone visitor does and photographs it, into
// shots/phone/: every kind of page in full at 360 and 390 wide, the menu open,
// and each page reached by tapping through the menu (not loaded fresh), since
// that is how a visitor arrives. For each page it also measures what a
// screenshot can hide: sideways scroll, anything wider than the screen, text
// cut off by its box, and anything that sticks out past the right edge.
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch } from './shots.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'shots', 'phone');
await mkdir(out, { recursive: true });
const { server, url } = await serve();
const browser = await launch();

const ROUTES = ['/', '/services', '/services/automation-and-ai-agents', '/services/reporting-and-dashboards', '/services/websites-and-software', '/services/branding-and-graphic-design', '/products', '/products/inbox-intake', '/products/website-build', '/cases', '/cases/002', '/cases/011', '/audit', '/savers', '/quiz', '/counting', '/contact', '/privacy', '/terms', '/missing-page'];
const SIZES = [
  { name: '360', width: 360, height: 740 },
  { name: '390', width: 390, height: 844 },
];
const keyOf = (route) => (route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-'));

/** What is wrong with the layout of the page as it stands, measured in the page. */
const measure = () => {
  const vw = document.documentElement.clientWidth;
  const label = (el) => {
    const cls = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls} "${(el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)}"`;
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // Inside something that scrolls sideways on purpose (a table frame), wide content is expected.
  const inScroller = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if ((o === 'auto' || o === 'scroll') && p.scrollWidth > p.clientWidth) return true;
      if (o === 'hidden' || o === 'clip') return true;
    }
    return false;
  };
  const past = [];
  const clipped = [];
  const squeezed = [];
  for (const el of document.querySelectorAll('main *, header *, footer *')) {
    if (!visible(el) || el.closest('svg, canvas, [aria-hidden="true"]')) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !inScroller(el) && getComputedStyle(el).position !== 'fixed') past.push(`${label(el)} [${Math.round(r.left)}..${Math.round(r.right)} of ${vw}]`);
    // Text that does not fit its own box.
    const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (own) {
      const s = getComputedStyle(el);
      if (el.scrollWidth > el.clientWidth + 2 && s.overflowX !== 'visible' && el.clientWidth > 0) clipped.push(`${label(el)} [needs ${el.scrollWidth}, has ${el.clientWidth}]`);
      // A column so narrow its words break mid-word or run one to a line.
      if (r.width < 64 && (el.textContent ?? '').trim().length > 18 && s.display !== 'inline') squeezed.push(`${label(el)} [${Math.round(r.width)}px wide]`);
    }
  }
  return {
    sideways: document.documentElement.scrollWidth - vw,
    past: [...new Set(past)].slice(0, 12),
    clipped: [...new Set(clipped)].slice(0, 12),
    squeezed: [...new Set(squeezed)].slice(0, 12),
  };
};

const report = {};
for (const size of SIZES) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // 1. Every page, loaded fresh, in full.
  for (const route of ROUTES) {
    await page.goto(url + route, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    // Scroll through once so everything that arrives on scroll has arrived.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));
    });
    const m = await page.evaluate(measure);
    report[`${size.name} ${route}`] = m;
    await page.screenshot({ path: join(out, `${keyOf(route)}-${size.name}.png`), fullPage: true });
  }

  // 2. The menu, open.
  await page.goto(url + '/', { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const summary = page.locator('.menu > summary');
  if (await summary.count()) {
    await summary.tap();
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(out, `menu-open-${size.name}.png`) });
    report[`${size.name} menu`] = await page.evaluate(() => {
      const list = document.querySelector('.menu-list');
      const r = list?.getBoundingClientRect();
      const links = Array.from(document.querySelectorAll('.menu-list a')).map((a) => {
        const b = a.getBoundingClientRect();
        return { text: a.textContent.trim(), h: Math.round(b.height), bottom: Math.round(b.bottom) };
      });
      return { list: r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), h: window.innerHeight } : null, links, bodyScrolls: document.documentElement.scrollHeight > window.innerHeight };
    });

    // 3. Each page reached by tapping its menu link, then photographed at the top.
    const labels = await page.$$eval('.menu-list a', (as) => as.map((a) => a.textContent.trim()));
    for (const text of labels) {
      await page.goto(url + '/', { waitUntil: 'load' });
      await page.waitForTimeout(300);
      await page.locator('.menu > summary').tap();
      await page.waitForTimeout(200);
      await page.locator('.menu-list a', { hasText: text }).first().tap();
      await page.waitForLoadState('load');
      await page.waitForTimeout(700);
      const state = await page.evaluate(() => ({ path: location.pathname + location.hash, y: Math.round(window.scrollY), menuOpen: Boolean(document.querySelector('.menu[open]')), sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
      report[`${size.name} via menu: ${text}`] = state;
      await page.screenshot({ path: join(out, `via-menu-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${size.name}.png`) });
    }
  }
  report[`${size.name} script errors`] = errors;
  await context.close();
}

await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2));
for (const [key, m] of Object.entries(report)) {
  const problems = [];
  if (Array.isArray(m)) { if (m.length) problems.push(`script errors: ${m.join(' | ')}`); }
  else {
    if (m.sideways > 0) problems.push(`scrolls sideways by ${m.sideways}px`);
    for (const k of ['past', 'clipped', 'squeezed']) if (m[k]?.length) problems.push(`${k}:\n      ${m[k].join('\n      ')}`);
    if (m.menuOpen) problems.push('the menu is still open after navigating');
    if (m.list && m.list.bottom > m.list.h + 1) problems.push(`menu runs past the screen (${m.list.bottom} of ${m.list.h})`);
    if (m.links?.some((l) => l.h < 48)) problems.push(`menu links under 48px: ${m.links.filter((l) => l.h < 48).map((l) => `${l.text} ${l.h}`).join(', ')}`);
  }
  if (problems.length) console.log(`${key}\n    ${problems.join('\n    ')}`);
}
console.log(`\nshots and report.json written to ${out}`);
await browser.close();
server.close();
