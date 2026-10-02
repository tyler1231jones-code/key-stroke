// npm run stills
//
// Renders the fallback stills that a browser without WebGL is shown: one per
// 3D slot, captured from the real scenes in their resting state. Blender is
// not involved: the page is loaded in a browser with reduced motion, which
// makes every scene draw one settled frame into its slot, and those frames
// are saved as WebP in public/stills/. Run after `npm run build`, then build
// again so the stills are copied into dist/.
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { serve, launch } from './shots.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'stills');
const routes = ['/audit', '/services/automation', '/services/reporting', '/services/web-software', '/services/brand-design'];

await mkdir(out, { recursive: true });
const { server, url } = await serve();
const browser = await launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const page = await context.newPage();
let count = 0;

for (const route of routes) {
  await page.goto(url + route, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Walk the page so every slot comes near the viewport and draws its still.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(600);
  const stills = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-slot]')).map((slot) => {
      const canvas = slot.querySelector('canvas.still-canvas');
      const img = slot.querySelector('img.slot-still');
      if (!canvas || !img) return null;
      return { name: img.getAttribute('src').split('/').pop().replace(/\.webp$/, ''), data: canvas.toDataURL('image/png') };
    }).filter(Boolean),
  );
  for (const still of stills) {
    const png = Buffer.from(still.data.split(',')[1], 'base64');
    const webp = await sharp(png).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80, alphaQuality: 90 }).toBuffer();
    await writeFile(join(out, `${still.name}.webp`), webp);
    console.log(`${still.name}.webp  ${(webp.length / 1024).toFixed(1)} KB`);
    count++;
  }
}

await browser.close();
server.close();
console.log(`${count} stills written to public/stills/. Build again to include them.`);
