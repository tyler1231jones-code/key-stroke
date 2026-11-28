// node tools/blog-shots.mjs [--routes=blog,about,index#blog]
//
// Full-page screenshots of the blog's pages and /about at a desktop and a
// phone, into shots/blog/, and of the blog's section on the homepage and on a
// service page (a route ending #id is shot as that element only). Run after a
// build; to see the blog before any real post exists, build with
// `npm run blog:build -- --fixtures` first. Motion is reduced so every block
// is in place. Reports sideways scroll, the widest line of a post's text,
// script errors, and anything a page loads from another site.
import { mkdir } from 'node:fs/promises';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch } from './shots.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'shots', 'blog');
const arg = process.argv.find((a) => a.startsWith('--routes='))?.slice(9);
const posts = existsSync(join(root, 'dist', 'blog')) ? readdirSync(join(root, 'dist', 'blog')).filter((f) => f.endsWith('.html')).map((f) => `blog/${f.slice(0, -5)}`) : [];
const routes = arg ? arg.split(',') : ['blog', ...posts.slice(0, 2), 'about', 'index#blog', 'services/reporting-and-dashboards#blog'];
const SIZES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

await mkdir(out, { recursive: true });
const { server, url } = await serve();
const browser = await launch();
let problems = 0;
for (const [size, opts] of Object.entries(SIZES)) {
  const context = await browser.newContext({ ...opts, reducedMotion: 'reduce' });
  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    const outside = new Set();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => {
      const u = r.url();
      if (!u.startsWith('data:') && !u.startsWith(url)) outside.add(new URL(u).host);
    });
    const [path, part] = route.split('#');
    await page.goto(`${url}/${path === 'index' ? '' : path}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const m = await page.evaluate(() => {
      const sideways = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      // The longest line of running copy in a post, in characters.
      let widest = 0;
      for (const p of document.querySelectorAll('[data-post-body] p, [data-post-body] li')) {
        // Count the characters on each line by where each one sits.
        const lines = new Map();
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const n = walker.currentNode;
          for (let k = 0; k < n.length; k++) {
            const r = document.createRange();
            r.setStart(n, k);
            r.setEnd(n, k + 1);
            const top = Math.round(r.getBoundingClientRect().top);
            lines.set(top, (lines.get(top) ?? 0) + 1);
          }
        }
        for (const count of lines.values()) widest = Math.max(widest, count);
      }
      return { sideways, widest };
    });
    const file = join(out, `${route.replace(/[/#]/g, '-')}-${size}.png`);
    const flags = [];
    if (part) {
      const el = page.locator(`#${part}`);
      if (await el.count()) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForLoadState('networkidle');
        await el.screenshot({ path: file });
      } else flags.push(`no #${part} on the page`);
    } else await page.screenshot({ path: file, fullPage: true });
    if (m.sideways > 0) flags.push(`${m.sideways}px sideways scroll`);
    // Post text runs the full width of its column (the owner's choice, 28 November 2026), so only a line past 100 characters is flagged.
    if (m.widest > 100) flags.push(`a line of ${m.widest} characters`);
    if (errors.length) flags.push(`script errors: ${errors.join('; ')}`);
    if (outside.size) flags.push(`loads from another site: ${[...outside].join(', ')}`);
    problems += flags.length;
    console.log(`${size.padEnd(7)} /${route}${m.widest ? ` (widest line ${m.widest} characters)` : ''}${flags.length ? `  PROBLEM: ${flags.join(', ')}` : ''}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
server.close();
console.log(`\n${problems ? `${problems} problem(s)` : 'no problems'}; pictures in shots/blog/`);
process.exit(problems ? 1 : 0);
