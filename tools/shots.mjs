// Screenshots of the built site at desktop and phone sizes, at several scroll
// positions. Serves dist/ itself, so only `npm run build` is needed first.
//
//   node tools/shots.mjs                      homepage, both sizes, default stops
//   node tools/shots.mjs --route=quiz         another route
//   node tools/shots.mjs --at=0,0.5,1.2     stops in viewport heights
//   node tools/shots.mjs --sel=#audit       stops at an element (plus offsets in vh: --off=0,1,2)
//   node tools/shots.mjs --size=desktop     one size only
//   node tools/shots.mjs --reduced          prefers-reduced-motion
//   node tools/shots.mjs --full             one full-page shot
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), 'dist');
const out = resolve(root, '..', 'shots');
const args = process.argv.slice(2);
// --route=practice/count (no leading slash: Git Bash rewrites arguments that start with one)
const routeArg = args.find((a) => a.startsWith('--route='));
const route = routeArg ? '/' + routeArg.slice(8).replace(/^\/+/, '') : '/';
const flag = (name) => args.find((a) => a.startsWith(`--${name}`));
const val = (name, fallback) => (flag(name)?.includes('=') ? flag(name).split('=')[1] : fallback);

// Text is sent gzipped when the browser accepts it, so transfer sizes and load
// timings are close to what Cloudflare serves, not several times larger.
const COMPRESS = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt', '.xml']);
const zipped = new Map();
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp', '.png': 'image/png', '.glb': 'model/gltf-binary', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml' };

export function serve(dir = root) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const candidates = [join(dir, path), join(dir, path, 'index.html'), join(dir, `${path}.html`)];
    for (const file of candidates) {
      try {
        let body = await readFile(file);
        const headers = { 'content-type': TYPES[extname(file)] || 'application/octet-stream' };
        // Fingerprinted files are cached for good, as public/_headers asks Cloudflare to do.
        if (path.startsWith('/_astro/')) headers['cache-control'] = 'public, max-age=31536000, immutable';
        if (COMPRESS.has(extname(file)) && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))) {
          if (!zipped.has(file)) zipped.set(file, gzipSync(body));
          body = zipped.get(file);
          headers['content-encoding'] = 'gzip';
        }
        res.writeHead(200, headers);
        res.end(body);
        return;
      } catch {}
    }
    try {
      res.writeHead(404, { 'content-type': 'text/html' });
      res.end(await readFile(join(dir, '404.html')));
    } catch {
      res.end('not found');
    }
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

export async function launch() {
  try {
    return await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  } catch {
    return await chromium.launch({ channel: 'msedge' });
  }
}

const SIZES = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

async function main() {
  await mkdir(out, { recursive: true });
  const { server, url } = await serve();
  const browser = await launch();
  // --size=desktop|phone, or any WIDTHxHEIGHT such as --size=1366x768
  const custom = /^(\d+)x(\d+)$/.exec(val('size', ''));
  if (custom) SIZES[val('size')] = { width: Number(custom[1]), height: Number(custom[2]), deviceScaleFactor: 1 };
  const sizes = val('size') ? [val('size')] : ['desktop', 'phone'];
  const name = route === '/' ? 'home' : route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  const tag = val('tag', '');
  for (const size of sizes) {
    const context = await browser.newContext({ viewport: SIZES[size], ...SIZES[size], reducedMotion: flag('reduced') ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    const vh = SIZES[size].height;
    if (flag('full')) {
      await page.screenshot({ path: join(out, `${name}-${size}${tag}-full.png`), fullPage: true });
    } else {
      let stops;
      if (val('sel')) {
        const top = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + window.scrollY, val('sel'));
        stops = val('off', '0').split(',').map((o) => top + Number(o) * vh);
      } else {
        stops = val('at', '0,1,2,3').split(',').map((o) => Number(o) * vh);
      }
      let i = 0;
      for (const y of stops) {
        await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), y);
        await page.waitForTimeout(Number(val('wait', 900)));
        await page.screenshot({ path: join(out, `${name}-${size}${tag}-${String(i++).padStart(2, '0')}.png`) });
      }
    }
    if (errors.length) console.log(`[${size}] errors:\n  ${[...new Set(errors)].join('\n  ')}`);
    await context.close();
  }
  await browser.close();
  server.close();
  console.log(`shots written to ${out}`);
}

if (process.argv[1] && process.argv[1].endsWith('shots.mjs')) main();
