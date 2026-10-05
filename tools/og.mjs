// npm run og
//
// Makes one share image per page, 1200 by 630, in the site's own style: the
// Drum logotype, the page's headline in the display face, and its
// description, on the dark ground. Each built page is opened in a browser and
// its own tokens and fonts are used, so the images cannot drift from the site.
// Also makes public/og/logo.png, the mark, for the Organization data.
//
// Images land in public/og/, named after the page's address: / is home.png,
// /services/x is services-x.png. Run after `npm run build`, then build again
// so they are copied into dist/. Run it again whenever a page's title or
// description changes, or a page is added.
import { mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { serve, launch } from './shots.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const out = join(root, 'public', 'og');

async function pages(dir, base = '') {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (['_astro', 'stills', 'og', 'fonts'].includes(entry.name)) continue;
      found.push(...(await pages(join(dir, entry.name), `${base}/${entry.name}`)));
    } else if (entry.name.endsWith('.html')) {
      const html = await readFile(join(dir, entry.name), 'utf8');
      if (/http-equiv="refresh"/i.test(html) || entry.name === '404.html') continue;
      found.push(entry.name === 'index.html' ? base || '/' : `${base}/${entry.name.slice(0, -5)}`);
    }
  }
  return found;
}
const keyOf = (route) => (route === '/' ? 'home' : route.replace(/^\/+/, '').replace(/\//g, '-'));

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const { server, url } = await serve();
const browser = await launch();
const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await context.newPage();
let total = 0;

for (const route of (await pages(dist)).sort()) {
  await page.goto(url + route, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const text = (sel) => document.querySelector(sel)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const headline = text('main h1');
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    const logo = document.querySelector('.bar-home .lockup')?.outerHTML ?? '';
    // The headline is set as large as it can be and still fit three lines.
    const size = headline.length > 44 ? 64 : headline.length > 28 ? 80 : 104;
    document.documentElement.removeAttribute('data-theme');
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;background:var(--base-900);color:var(--ink-inverse);padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden">
        <div style="width:300px;color:var(--readout)">${logo}</div>
        <div>
          <p style="margin:0;font-family:var(--font-display);font-weight:600;text-transform:uppercase;font-size:${size}px;line-height:${Math.round(size * 0.94)}px;letter-spacing:-0.01em;max-width:1000px;text-wrap:balance">${headline}</p>
          <p style="margin:28px 0 0;font-family:var(--font-body);font-size:27px;line-height:38px;max-width:900px;color:var(--readout)">${description}</p>
        </div>
        <div style="height:6px;background:var(--readout)"></div>
      </div>`;
    const lockup = document.querySelector('.lockup');
    if (lockup) { lockup.style.display = 'block'; lockup.style.width = '300px'; lockup.style.height = 'auto'; }
  });
  await page.waitForTimeout(80);
  const png = await page.screenshot({ type: 'png' });
  const small = await sharp(png).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
  await writeFile(join(out, `${keyOf(route)}.png`), small);
  total += small.length;
  console.log(`${keyOf(route)}.png  ${(small.length / 1024).toFixed(1)} KB`);
}

// The mark on its ground, for the Organization logo.
await page.goto(url + '/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.setViewportSize({ width: 512, height: 512 });
await page.evaluate(() => {
  const mark = document.querySelector('.bar-home .mark')?.outerHTML ?? '';
  document.body.innerHTML = `<div style="position:fixed;inset:0;background:var(--base-900);display:flex;align-items:center;justify-content:center"><div style="width:320px;height:320px">${mark}</div></div>`;
  const svg = document.querySelector('.mark');
  if (svg) { svg.style.display = 'block'; svg.style.width = '320px'; svg.style.height = '320px'; }
});
await page.waitForTimeout(80);
await writeFile(join(out, 'logo.png'), await sharp(await page.screenshot({ type: 'png' })).png({ palette: true, compressionLevel: 9 }).toBuffer());

await browser.close();
server.close();
console.log(`share images written to public/og/ (${(total / 1024).toFixed(0)} KB). Build again to include them.`);
