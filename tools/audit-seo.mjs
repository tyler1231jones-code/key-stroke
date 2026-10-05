// npm run audit:seo -- --dir=dist
//
// The technical SEO audit, read from the built HTML files, not from a
// browser: what is in these files is what a crawler gets without running any
// script. For every page it checks:
//   - title: present, unique, 60 characters or fewer
//   - meta description: present, unique, 155 characters or fewer
//   - one h1; headings in order, with no level skipped
//   - lang="en-AU"; a canonical address; robots
//   - Open Graph and Twitter card tags, and that the share image exists
//   - JSON-LD: parses, and which types it declares
//   - images: every img has an alt attribute
//   - links: every internal link resolves to a built page; link text says
//     where the link goes
//   - how many words a crawler can read, and how many internal links
// Then it checks the sitemap and robots.txt, and that every page is linked
// from somewhere.
//
// Prints one line a page and writes shots/audit/seo-<tag>.json. Exits 1 if a
// hard rule is broken.
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

const args = process.argv.slice(2);
const val = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, val('dir', 'dist'));
const tag = val('tag', 'now');
const problems = [];
const bad = (where, what) => problems.push(`${where}: ${what}`);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const textOf = (node) => (node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(textOf).join(''));
const routeOf = (file) => {
  const rel = relative(dist, file).replace(/\\/g, '/').replace(/\.html$/, '');
  return rel === 'index' ? '/' : `/${rel.replace(/\/index$/, '')}`;
};

const files = walk(dist);
const built = new Set(files.map(routeOf));
const pages = {};
const linkedFrom = new Map();
const GENERIC = /^(click here|here|read more|more|learn more|this|link)$/i;

for (const file of files) {
  const route = routeOf(file);
  const doc = parse(readFileSync(file, 'utf8'), { scriptingEnabled: false });
  const p = { title: '', description: '', robots: null, canonical: null, lang: null, h1: [], headings: [], og: {}, twitter: {}, jsonld: [], imgNoAlt: 0, imgs: 0, links: [], words: 0, redirect: false, firstSentence: '' };
  let inMain = false;
  let text = '';
  const visit = (node, main) => {
    const tag = node.tagName;
    if (tag === 'html') p.lang = attr(node, 'lang') ?? null;
    if (tag === 'title') p.title = textOf(node).trim();
    if (tag === 'meta') {
      const name = attr(node, 'name');
      const prop = attr(node, 'property');
      const content = attr(node, 'content') ?? '';
      if (name === 'description') p.description = content;
      if (name === 'robots') p.robots = content;
      if (name?.startsWith('twitter:')) p.twitter[name.slice(8)] = content;
      if (prop?.startsWith('og:')) p.og[prop.slice(3)] = content;
      if ((attr(node, 'http-equiv') ?? '').toLowerCase() === 'refresh') p.redirect = true;
    }
    if (tag === 'link' && attr(node, 'rel') === 'canonical') p.canonical = attr(node, 'href');
    if (tag === 'script' && attr(node, 'type') === 'application/ld+json') {
      try { p.jsonld.push(JSON.parse(textOf(node))); } catch { bad(route, 'a JSON-LD block does not parse'); }
    }
    if (tag === 'script' || tag === 'style' || tag === 'template') return;
    if (/^h[1-6]$/.test(tag ?? '')) {
      const level = Number(tag[1]);
      const label = textOf(node).replace(/\s+/g, ' ').trim();
      if (level === 1) p.h1.push(label);
      p.headings.push({ level, label, inFooter: Boolean(main === 'footer') });
    }
    if (tag === 'img') {
      p.imgs++;
      if (attr(node, 'alt') === undefined) p.imgNoAlt++;
    }
    if (tag === 'a' && attr(node, 'href')) p.links.push({ href: attr(node, 'href'), text: (textOf(node) || attr(node, 'aria-label') || '').replace(/\s+/g, ' ').trim(), aria: attr(node, 'aria-label') ?? null });
    const where = tag === 'main' ? 'main' : tag === 'footer' ? 'footer' : main;
    if (node.nodeName === '#text' && where === 'main' && tag !== 'svg') text += ` ${node.value}`;
    if (tag === 'svg') return;
    for (const child of node.childNodes ?? []) visit(child, where);
  };
  visit(doc, null);
  void inMain;
  p.words = text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  pages[route] = p;
  if (p.redirect) continue;
  for (const l of p.links) {
    if (!l.href.startsWith('/')) continue;
    const target = l.href.split('#')[0].split('?')[0].replace(/(.)\/$/, '$1') || '/';
    if (!linkedFrom.has(target)) linkedFrom.set(target, new Set());
    linkedFrom.get(target).add(route);
    if (!built.has(target) && !existsSync(join(dist, target))) bad(route, `link to ${l.href} does not resolve to a built page`);
    if (!l.text) bad(route, `a link to ${l.href} has no text`);
    else if (GENERIC.test(l.text)) bad(route, `link text "${l.text}" does not say where it goes`);
  }
}

const real = Object.entries(pages).filter(([route, p]) => !p.redirect && route !== '/404');
const titles = new Map();
const descriptions = new Map();
for (const [route, p] of real) {
  if (!p.title) bad(route, 'no title');
  else if (p.title.length > 60) bad(route, `title is ${p.title.length} characters: "${p.title}"`);
  if (!p.description) bad(route, 'no meta description');
  else if (p.description.length > 155) bad(route, `description is ${p.description.length} characters`);
  if (titles.has(p.title)) bad(route, `title is the same as ${titles.get(p.title)}`);
  if (descriptions.has(p.description)) bad(route, `description is the same as ${descriptions.get(p.description)}`);
  titles.set(p.title, route);
  descriptions.set(p.description, route);
  if (p.h1.length !== 1) bad(route, `${p.h1.length} h1 elements`);
  if (p.lang !== 'en-AU') bad(route, `lang is "${p.lang}"`);
  // Headings in order: a heading may go one level deeper than the one before it, never more.
  let last = 0;
  for (const h of p.headings) {
    if (h.level > last + 1 && last !== 0) bad(route, `heading "${h.label.slice(0, 40)}" is an h${h.level} straight after an h${last}`);
    if (last === 0 && h.level !== 1) bad(route, `the first heading is an h${h.level}, not the h1`);
    last = h.level;
  }
  for (const key of ['type', 'title', 'description', 'image']) if (!p.og[key]) bad(route, `no og:${key}`);
  if (p.twitter.card !== 'summary_large_image') bad(route, 'no twitter:card');
  if (p.og.image) {
    const path = p.og.image.replace(/^https?:\/\/[^/]+/, '');
    if (!existsSync(join(dist, path))) bad(route, `share image ${path} is not in the build`);
  }
  if (p.imgNoAlt) bad(route, `${p.imgNoAlt} img without an alt attribute`);
  const types = p.jsonld.map((j) => j['@type']);
  for (const need of ['Organization', 'WebSite']) if (!types.includes(need)) bad(route, `no ${need} JSON-LD`);
  if (route !== '/' && !types.includes('BreadcrumbList')) bad(route, 'no BreadcrumbList JSON-LD');
  if (types.some((t) => /Review|Rating/.test(String(t))) || JSON.stringify(p.jsonld).match(/aggregateRating|"review"/)) bad(route, 'review or rating markup is present');
  if (!linkedFrom.has(route) && route !== '/') bad(route, 'no page links to this one');
  const indexable = !/noindex/.test(p.robots ?? '');
  if (indexable && !p.canonical) bad(route, 'indexable but has no canonical address');
}

// Sitemap and robots.
const sitemap = existsSync(join(dist, 'sitemap.xml')) ? readFileSync(join(dist, 'sitemap.xml'), 'utf8') : null;
const robots = existsSync(join(dist, 'robots.txt')) ? readFileSync(join(dist, 'robots.txt'), 'utf8') : null;
if (!sitemap) bad('sitemap.xml', 'missing');
if (!robots) bad('robots.txt', 'missing');
const inSitemap = sitemap ? [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, '') || '/') : [];
for (const [route] of real) if (sitemap && !inSitemap.includes(route)) bad('sitemap.xml', `${route} is not listed`);
for (const loc of inSitemap) if (!built.has(loc)) bad('sitemap.xml', `${loc} is listed but not built`);
if (!existsSync(join(dist, '404.html'))) bad('404', 'no 404 page');

for (const [route, p] of real.sort()) {
  const types = [...new Set(p.jsonld.map((j) => j['@type']))].join(', ');
  console.log(`${route}\n  title (${p.title.length}): ${p.title}\n  description (${p.description.length}): ${p.description}\n  h1: ${p.h1.join(' | ')}\n  robots: ${p.robots ?? 'index'}; canonical: ${p.canonical ?? 'none'}; words in main: ${p.words}; internal links: ${p.links.filter((l) => l.href.startsWith('/')).length}; JSON-LD: ${types}`);
}
console.log(`\nsitemap.xml: ${inSitemap.length} addresses${sitemap ? '' : ' (missing)'}; robots.txt: ${robots ? JSON.stringify(robots.trim()) : 'missing'}`);
mkdirSync(join(root, 'shots', 'audit'), { recursive: true });
writeFileSync(join(root, 'shots', 'audit', `seo-${tag}.json`), JSON.stringify({ pages, sitemap: inSitemap, robots, problems }, null, 1));
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of [...new Set(problems)]) console.log(`  ${p}`);
  process.exit(1);
}
console.log('\nseo audit passed.');
