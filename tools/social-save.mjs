// npm run social:save -- <posts.json> [--fixtures]
//
// Saves social posts into the site for the grid on /blog and the homepage
// (src/lib/social.ts, README "Social grid"). <posts.json> lists the posts to
// add:
//   [{ "network": "instagram", "url": "https://www.instagram.com/p/...",
//      "date": "2026-12-02", "image": "<the picture: a web address or a file>",
//      "alt": "What the picture shows" }]
// Each picture is cut square, 640 by 640, and saved as WebP in public/social/,
// named after its network and post. The posts are merged with those already
// in src/content/social.json (one already there, by its address, is
// replaced), the newest six are kept, and any picture no longer used is
// deleted. The profiles in social.json are left as they are.
//
// With --fixtures it writes the test posts in tools/fixtures/ instead, which
// only a fixtures build shows (npm run blog:build -- --fixtures).
//
// Claude fills <posts.json> from Metricool after each blog post and in the
// monthly routine. Nothing here posts anything; the only thing it fetches is
// each picture it is given.
import { readFile, writeFile, readdir, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = process.argv.includes('--fixtures');
const input = process.argv.slice(2).find((a) => !a.startsWith('--'));
const KEEP = 6;
const SIZE = 640;
const NETWORKS = ['instagram', 'tiktok', 'facebook', 'linkedin'];

if (!input) {
  console.error('Usage: npm run social:save -- <posts.json> [--fixtures]');
  process.exit(1);
}
const file = fixtures ? join(root, 'tools', 'fixtures', 'social.json') : join(root, 'src', 'content', 'social.json');
const dir = fixtures ? join(root, 'tools', 'fixtures', 'social') : join(root, 'public', 'social');

async function picture(src) {
  if (!/^https?:\/\//.test(src)) return readFile(resolve(src));
  const r = await fetch(src);
  if (!r.ok) throw new Error(`${src}: ${r.status} ${r.statusText}`);
  return Buffer.from(await r.arrayBuffer());
}

const saved = existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : { profiles: {}, posts: [] };
const adding = JSON.parse(await readFile(resolve(input), 'utf8'));
if (!Array.isArray(adding)) throw new Error(`${input} should hold a list of posts`);

await mkdir(dir, { recursive: true });
const fresh = [];
for (const p of adding) {
  if (!NETWORKS.includes(p.network)) throw new Error(`"${p.network}" is not one of ${NETWORKS.join(', ')}`);
  if (!/^https:\/\//.test(p.url ?? '')) throw new Error(`a post needs its https address; got "${p.url}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date ?? '')) throw new Error(`${p.url}: write the date YYYY-MM-DD; got "${p.date}"`);
  if (!p.alt?.trim()) throw new Error(`${p.url}: needs alt text, saying what the picture shows`);
  if (!p.image) throw new Error(`${p.url}: needs its picture`);
  const raw = await picture(p.image);
  const name = `${p.network}-${createHash('sha1').update(p.url).digest('hex').slice(0, 10)}.webp`;
  const webp = await sharp(raw).resize(SIZE, SIZE, { fit: 'cover', position: 'attention' }).webp({ quality: 78 }).toBuffer();
  await writeFile(join(dir, name), webp);
  fresh.push({ network: p.network, url: p.url, date: p.date, image: name, alt: p.alt.trim() });
  console.log(`saved ${name}  ${(webp.length / 1024).toFixed(1)} KB  ${p.network} ${p.date}`);
}

const urls = new Set(fresh.map((p) => p.url));
const posts = [...fresh, ...saved.posts.filter((p) => !urls.has(p.url))]
  .sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url))
  .slice(0, KEEP);
const used = new Set(posts.map((p) => p.image));
for (const f of await readdir(dir)) {
  if (f.endsWith('.webp') && !used.has(f)) {
    await rm(join(dir, f));
    console.log(`deleted ${f}, no longer in the newest ${KEEP}`);
  }
}
await writeFile(file, `${JSON.stringify({ profiles: saved.profiles ?? {}, posts }, null, 2)}\n`);
console.log(`${posts.length} post(s) in ${fixtures ? 'tools/fixtures/social.json' : 'src/content/social.json'}`);
