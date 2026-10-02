// Walks every page top to bottom at desktop and phone sizes and writes one
// contact sheet per page and size, so a whole page can be read at a glance.
//
//   node tools/tour.mjs --tag=before
//   node tools/tour.mjs --tag=after --routes=audit,crew
//   node tools/tour.mjs --tag=after --size=phone
//
// Sheets land in shots/<tag>/. Run `npm run build` first.
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { serve, launch } from './shots.mjs';

const args = process.argv.slice(2);
const val = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const tag = val('tag', 'tour');
const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const out = join(root, 'shots', tag);

// Every page in dist, unless --routes names some (no leading slash).
async function pages(dir, base = '') {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (['_astro', 'stills', 'renders', 'models', 'fonts'].includes(entry.name)) continue;
      found.push(...(await pages(join(dir, entry.name), `${base}/${entry.name}`)));
    } else if (entry.name.endsWith('.html')) {
      // A redirect written by Astro has no page of its own to look at.
      if (/http-equiv="refresh"/i.test(await readFile(join(dir, entry.name), 'utf8'))) continue;
      found.push(entry.name === 'index.html' ? base || '/' : `${base}/${entry.name.slice(0, -5)}`);
    }
  }
  return found;
}

const SIZES = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, cols: 4, thumb: 480 },
  phone: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true, cols: 8, thumb: 240 },
};

const { server, url } = await serve();
const browser = await launch();
await mkdir(out, { recursive: true });
const wanted = val('routes') ? val('routes').split(',').map((r) => (r === 'home' ? '/' : `/${r}`)) : (await pages(join(root, 'dist'))).sort();
const sizes = val('size') ? [val('size')] : ['desktop', 'phone'];
const maxFrames = Number(val('max', 40));

for (const route of wanted) {
  const name = route === '/' ? 'home' : route.replace(/[^a-z0-9#=.]+/gi, '-').replace(/^-|-$/g, '');
  for (const size of sizes) {
    const { cols, thumb, ...device } = SIZES[size];
    const context = await browser.newContext({ viewport: { width: device.width, height: device.height }, ...device });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600);
    const frames = [];
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const stops = Math.min(maxFrames, Math.max(1, Math.ceil(height / device.height)));
    const stride = stops > 1 ? (height - device.height) / (stops - 1) : 0;
    for (let i = 0; i < stops; i++) {
      // Real wheel-style scrolling in steps, so scrubbed and triggered motion both run.
      await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), Math.round(i * stride));
      await page.waitForTimeout(700);
      const file = join(out, `_${name}-${size}-${String(i).padStart(2, '0')}.png`);
      await page.screenshot({ path: file });
      frames.push(file);
    }
    await context.close();

    const sheet = await browser.newPage({ viewport: { width: cols * (thumb + 8) + 8, height: 600 } });
    const data = await Promise.all(frames.map(async (f) => (await readFile(f)).toString("base64")));
    const cells = data.map((f, i) => `<figure><img src="data:image/png;base64,${f}" width="${thumb}"><figcaption>${i}</figcaption></figure>`).join('');
    await sheet.setContent(`<style>body{margin:8px;background:#444;display:grid;grid-template-columns:repeat(${cols},${thumb}px);gap:8px;font:11px monospace;color:#fff}figure{margin:0}img{display:block}</style>${cells}`);
    await sheet.waitForLoadState('networkidle');
    await sheet.screenshot({ path: join(out, `${name}-${size}.png`), fullPage: true });
    await sheet.close();
    console.log(`${route} ${size}: ${frames.length} frames, page ${height}px${errors.length ? `, errors: ${[...new Set(errors)].join(' | ')}` : ''}`);
  }
}

await browser.close();
server.close();
console.log(`sheets written to ${out}`);
