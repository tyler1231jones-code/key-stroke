// Development probe: scroll with the wheel, as a visitor would, and capture
// frames while the page is moving. Triggered mechanisms (key strikes, digit
// rolls, tally strokes) only show mid-flight, so tools/shots.mjs misses them.
//
//   node tools/probe.mjs --from=0.6 --steps=6 --delta=120 --every=3 --tag=wave
//   --route=practice/clear  --size=phone  --sel=#audit (start at an element)
import { mkdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch } from './shots.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const s = a.replace(/^--/, '');
  const i = s.indexOf('=');
  return i < 0 ? [s, 'true'] : [s.slice(0, i), s.slice(i + 1)];
}));
const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
await mkdir(out, { recursive: true });
const sizes = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };
const size = sizes[args.size ?? 'desktop'];
const { server, url } = await serve();
const browser = await launch();
const page = await browser.newPage({ viewport: size });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${url}/${args.route ?? ''}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(700);
let start = Number(args.from ?? 0) * size.height;
if (args.sel) start += await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, args.sel);
await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), start);
await page.waitForTimeout(900);
await page.mouse.move(size.width / 2, size.height / 2);
if (args.click) {
  await page.click(args.click);
  await page.waitForTimeout(Number(args.after ?? 200));
  await page.screenshot({ path: join(out, `probe-${args.tag ?? 'x'}-click.png`) });
}
const steps = Number(args.steps ?? 6);
const every = Number(args.every ?? 2);
let shot = 0;
for (let i = 0; i < steps * every; i++) {
  await page.mouse.wheel(0, Number(args.delta ?? 100));
  await page.waitForTimeout(Number(args.gap ?? 70));
  if (i % every === every - 1) await page.screenshot({ path: join(out, `probe-${args.tag ?? 'x'}-${String(shot++).padStart(2, '0')}.png`) });
}
if (errors.length) console.log('errors:', [...new Set(errors)].join('\n'));
await browser.close();
server.close();
console.log(`${shot} frames written to shots/`);
