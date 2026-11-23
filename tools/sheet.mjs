// node tools/sheet.mjs <prefix> [cols] [width]
//
// Lays the screenshots in shots/ whose names start with <prefix> side by side
// in one picture, shots/<prefix>sheet.jpg, so a scroll sequence can be read at
// a glance. Works with what tools/shots.mjs writes, for example:
//   node tools/shots.mjs --size=desktop --at=0,1,2,3 --tag=-after
//   node tools/sheet.mjs home-desktop-after- 3
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const [prefix, colsArg, widthArg] = process.argv.slice(2);
if (!prefix) {
  console.error('usage: node tools/sheet.mjs <prefix> [cols] [width]');
  process.exit(1);
}
const files = (await readdir(dir)).filter((n) => n.startsWith(prefix) && /\d+\.png$/.test(n)).sort();
if (!files.length) {
  console.error(`no shots start with ${prefix}`);
  process.exit(1);
}
const cols = Number(colsArg) || 3;
const meta = await sharp(join(dir, files[0])).metadata();
const w = Number(widthArg) || 640;
const h = Math.round((w * meta.height) / meta.width);
const comps = await Promise.all(files.map(async (n, i) => ({ input: await sharp(join(dir, n)).resize(w, h).toBuffer(), left: (i % cols) * (w + 6), top: Math.floor(i / cols) * (h + 6) })));
const out = join(dir, `${prefix}sheet.jpg`);
await sharp({ create: { width: cols * (w + 6), height: Math.ceil(files.length / cols) * (h + 6), channels: 3, background: '#ff00ff' } }).composite(comps).jpeg({ quality: 84 }).toFile(out);
console.log(`${files.length} shots in ${out}`);
