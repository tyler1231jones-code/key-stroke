// node tools/phone-screens.mjs --routes=home,savers,products/website-build [--w=390 --h=844]   (after `npm run build`)
//
// Scrolls each page the way a thumb does and photographs every screen, laid
// side by side in shots/phone/walk/. A full-page capture repeats pinned
// sections and the header on this site, so this is the honest picture.
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { serve, launch } from './shots.mjs';
const out = 'C:/Users/User/Desktop/KEYSTROKE/shots/phone/walk';
await mkdir(out, { recursive: true });
const args = process.argv.slice(2);
const W = Number(args.find((a) => a.startsWith('--w='))?.slice(4) ?? 390);
const H = Number(args.find((a) => a.startsWith('--h='))?.slice(4) ?? 844);
const routes = (args.find((a) => a.startsWith('--routes='))?.slice(9) ?? 'home').split(',').map((r) => (r === 'home' ? '/' : `/${r}`)); // no leading slash on the command line: Git Bash rewrites it
const { server, url } = await serve();
const browser = await launch();
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await context.newPage();
for (const route of routes) {
  await page.goto(url + route, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = H - 100;
  const tiles = [];
  for (let y = 0; y < total - 60 && tiles.length < 36; y += step) {
    await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), y);
    await page.waitForTimeout(450);
    tiles.push(await page.screenshot());
  }
  const per = 6;
  const key = route === '/' ? 'home' : route.replace(/^\//, '').replace(/[/#=.]/g, '-');
  for (let s = 0; s * per < tiles.length; s++) {
    const part = tiles.slice(s * per, s * per + per);
    await sharp({ create: { width: part.length * (W + 8), height: H, channels: 3, background: '#ff00ff' } })
      .composite(part.map((input, i) => ({ input, left: i * (W + 8), top: 0 })))
      .jpeg({ quality: 82 })
      .toFile(join(out, `${key}-${W}-${s}.jpg`));
  }
  console.log(`${route}: ${total}px, ${tiles.length} screens`);
}
await browser.close();
server.close();
