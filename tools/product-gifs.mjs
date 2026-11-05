// node tools/product-gifs.mjs --only=inbox-intake,reconciliation   (after `npm run build`)
//
// Redraws products' share GIFs (public/img/products/<animation>.gif) from the
// loop script the site serves, so a change to a loop reaches its share image.
// Each tick of the loop is one frame, 480 by 300 (the loop at twice its size)
// on the page ground, 180ms a frame, looping. Without --only it redraws every
// live product's GIF.
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { serve, launch } from './shots.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogue = JSON.parse(await readFile(join(root, 'src', 'content', 'catalogue.json'), 'utf8'));
const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',');
const names = only ?? catalogue.products.filter((p) => p.live).map((p) => p.animation);

const { server, url } = await serve();
const browser = await launch();
const context = await browser.newContext({ viewport: { width: 600, height: 400 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const page = await context.newPage();
// A product page: it carries the fonts, the token mapping and the loop script.
await page.goto(`${url}/products/${catalogue.products.find((p) => p.live).slug}`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);

for (const name of names) {
  const ticks = await page.evaluate((n) => {
    document.getElementById('gif-stage')?.remove();
    const stage = document.createElement('div');
    stage.id = 'gif-stage';
    stage.className = 'ks-anim-host';
    stage.style.cssText = 'position:fixed;left:0;top:0;z-index:99;width:240px;height:150px;background:var(--base-000)';
    const host = document.createElement('div');
    host.dataset.ks = n;
    host.className = 'ks-reset';
    host.style.cssText = 'width:240px;height:150px';
    stage.appendChild(host);
    document.body.appendChild(stage);
    window.__gif = window.KSAnim.build(host);
    host.classList.add('ks-reset'); // no transitions: each frame is a settled tick
    return window.KSAnim.defs[n].ticks;
  }, name);
  const frames = [];
  for (let t = 0; t < ticks; t++) {
    await page.evaluate((tick) => window.__gif.set(tick), t);
    frames.push(await page.locator('#gif-stage').screenshot());
  }
  const file = join(root, 'public', 'img', 'products', `${name}.gif`);
  await sharp(frames, { join: { animated: true } }).gif({ delay: 180, loop: 0 }).toFile(file);
  const m = await sharp(file, { animated: true }).metadata();
  console.log(`${name}.gif: ${m.width}x${m.pageHeight}, ${m.pages} frames`);
}

await browser.close();
server.close();
