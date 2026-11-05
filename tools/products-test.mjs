// node tools/products-test.mjs   (after `npm run build`)
//
// Checks the products showcase in a real browser against the built site:
//   - /products shows every live product (6 / 7 / 6 / 8 by practice) and no others
//   - every name, headline and price on /products and on each product page
//     matches src/content/catalogue.json exactly, and no standard price shows
//   - products that are not live have no page (404) and are not in the sitemap
//   - the filter row and #count ... #face links; all groups without script
//   - at 400px: no sideways scroll, one column of cards, loops fully visible
//   - reduced motion: every loop shows a still finished frame
//   - no console errors on /products, a product page and a quiz result
//   - quiz result: a loop and product link beside each mapped item
// Screenshots go to shots/products/. Google's reCAPTCHA script is replaced by
// a stand-in and /api/quiz is not served here, so the quiz shows its own
// result, as it does when Claude cannot be reached. Exits 1 on any failure.
import { mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch } from './shots.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'shots', 'products');
await mkdir(out, { recursive: true });
const catalogue = JSON.parse(await readFile(join(root, 'src', 'content', 'catalogue.json'), 'utf8'));
const order = catalogue.practices.map((p) => p.id);
const live = catalogue.products.filter((p) => p.live).sort((a, b) => order.indexOf(a.practice) - order.indexOf(b.practice) || a.order - b.order);
const hidden = catalogue.products.filter((p) => !p.live);

const failures = [];
const ok = (cond, what) => {
  if (!cond) failures.push(what);
  console.log(`${cond ? '  ok  ' : '  FAIL'} ${what}`);
};

const { server, url } = await serve();
const browser = await launch();
const stub = async (context) => {
  await context.route(/https:\/\/www\.(google|gstatic)\.com\/recaptcha\/.*/, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: 'window.grecaptcha={ready:function(cb){cb()},execute:function(){return Promise.resolve("test-token")}};' }),
  );
};
const watch = (page) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
};

/* ---------- /products at desktop ---------- */
console.log('\n/products');
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await stub(context);
  const page = await context.newPage();
  const errors = watch(page);
  // Layout shift while the page and its loops load.
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => list.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(`${url}/products`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const cards = await page.$$eval('.pcard', (els) => els.map((c) => ({
    practice: c.dataset.practice,
    name: c.querySelector('.pcard-name')?.textContent?.trim(),
    headline: c.querySelector('.pcard-headline')?.textContent?.trim(),
    price: c.querySelector('.pcard-figure')?.textContent?.trim(),
    kind: c.querySelector('.pcard-kind')?.textContent?.trim(),
  })));
  ok(cards.length === live.length && live.length === 27, `${cards.length} cards (expected 27)`);
  const per = Object.fromEntries(order.map((id) => [id, cards.filter((c) => c.practice === id).length]));
  ok(per.count === 6 && per.clear === 7 && per.build === 6 && per.face === 8, `by practice: ${order.map((id) => per[id]).join(' / ')} (expected 6 / 7 / 6 / 8)`);
  const mismatch = live.filter((p, i) => {
    const c = cards[i];
    return !c || c.name !== p.name || c.headline !== p.headline || c.price !== p.price || c.kind !== `${p.priceType} · ex GST`;
  });
  ok(mismatch.length === 0, `every card's name, headline, price and price type match the catalogue, in catalogue order${mismatch.length ? `: ${mismatch.map((p) => p.slug).join(', ')}` : ''}`);
  ok(!cards.some((c) => hidden.some((h) => h.name === c.name)), 'products that are not live are not listed');
  ok((await page.$$eval('.pcard [data-ks] svg', (s) => s.length)) === 27, 'every card has its loop drawn');
  const cls = await page.evaluate(() => window.__cls);
  ok(cls < 0.01, `layout shift while loading: ${cls.toFixed(4)}`);

  // The filter.
  await page.locator('[data-filter="clear"]').click();
  const shown = await page.$$eval('.pgroup', (g) => g.filter((x) => !x.hidden).map((x) => x.id));
  ok(shown.length === 1 && shown[0] === 'clear', `Clear chosen: shows ${shown.join(', ')}`);
  ok(page.url().endsWith('#clear'), 'the address follows the filter');
  await page.locator('[data-filter="all"]').click();
  ok((await page.$$eval('.pgroup', (g) => g.filter((x) => !x.hidden).length)) === 4, 'All shows the four groups again');
  await page.screenshot({ path: join(out, 'products-desktop-top.png') });
  await page.locator('#build').scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(out, 'products-desktop-grid.png') });
  ok(errors.length === 0, `no console errors on /products${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

/* ---------- #count ... #face, and no script ---------- */
for (const id of order) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${url}/products#${id}`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const state = await page.evaluate((want) => ({
    shown: Array.from(document.querySelectorAll('.pgroup')).filter((g) => !g.hidden).map((g) => g.id),
    top: document.getElementById(want)?.getBoundingClientRect().top ?? 9999,
  }), id);
  ok(state.shown.length === 1 && state.shown[0] === id && state.top < 300, `/products#${id} shows ${id} alone, scrolled to it (top at ${Math.round(state.top)}px)`);
  await context.close();
}
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${url}/products#clear`, { waitUntil: 'load' });
  const visible = await page.$$eval('.pgroup', (g) => g.filter((x) => getComputedStyle(x).display !== 'none').length);
  ok(visible === 4, 'without script, all four groups show');
  await context.close();
}

/* ---------- Every product page ---------- */
console.log('\nproduct pages');
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = watch(page);
  const wrong = [];
  for (const p of live) {
    const res = await page.goto(`${url}/products/${p.slug}`, { waitUntil: 'load' });
    const seen = await page.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent?.trim(),
      lede: document.querySelector('.page-head .lede')?.textContent?.trim(),
      price: document.querySelector('.prod-price-figure')?.textContent?.trim(),
      text: document.querySelector('main')?.textContent ?? '',
      og: document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '',
    }));
    const fields = [p.whatWeBuild, p.forWho, p.deliverable, p.tools.join(' / ')];
    if (res?.status() !== 200 || seen.h1 !== p.name || seen.lede !== p.headline || seen.price !== p.price || !fields.every((f) => seen.text.includes(f)) || !seen.og.endsWith(`/img/products/${p.animation}.gif`)) wrong.push(p.slug);
    if (p.standardPrice && seen.text.includes(p.standardPrice)) wrong.push(`${p.slug} shows its standard price`);
  }
  ok(wrong.length === 0, `all 27 product pages match the catalogue (name, headline, price, what we build, who for, deliverable, tools, share image)${wrong.length ? `: ${wrong.join(', ')}` : ''}`);
  await page.goto(`${url}/products/inbox-intake`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(out, 'product-desktop.png'), fullPage: true });
  ok(errors.length === 0, `no console errors on the product pages${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  for (const h of hidden) {
    const res = await page.goto(`${url}/products/${h.slug}`);
    ok(res?.status() === 404, `/products/${h.slug} is 404`);
  }
  const sitemap = await (await page.goto(`${url}/sitemap.xml`)).text();
  ok(live.every((p) => sitemap.includes(`/products/${p.slug}<`)) && hidden.every((h) => !sitemap.includes(`/products/${h.slug}<`)) && sitemap.includes('/products<'), 'the sitemap lists /products and every live product, and no other');
  // No standard price anywhere on the site.
  const everywhere = [];
  for (const path of ['/', '/products', '/savers', '/quiz', '/services']) {
    const text = await (await page.goto(`${url}${path}`)).text();
    for (const p of catalogue.products) if (p.standardPrice && text.includes(p.standardPrice)) everywhere.push(`${path}: ${p.slug}`);
  }
  ok(everywhere.length === 0, `no standard price on the main pages${everywhere.length ? `: ${everywhere.join(', ')}` : ''}`);
  await context.close();
}

/* ---------- 400px ---------- */
console.log('\n400px');
for (const path of ['/products', '/products/reporting-pack', '/products/website-build']) {
  const context = await browser.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(`${url}${path}`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.pcard')).map((c) => c.getBoundingClientRect());
    const loops = Array.from(document.querySelectorAll('[data-ks] svg')).map((s) => s.getBoundingClientRect());
    return {
      sideways: document.documentElement.scrollWidth - innerWidth,
      columns: new Set(cards.map((r) => Math.round(r.left))).size,
      loopsOut: loops.filter((r) => r.left < 0 || r.right > innerWidth + 0.5 || r.width < 50).length,
      loops: loops.length,
    };
  });
  ok(m.sideways <= 0, `${path}: no sideways scroll at 400px`);
  if (path === '/products') ok(m.columns === 1, '/products: one column of cards at 400px');
  ok(m.loops > 0 && m.loopsOut === 0, `${path}: ${m.loops} loops, all fully on screen`);
  const name = path === '/products' ? 'products-400' : `product-400-${path.split('/').pop()}`;
  await page.screenshot({ path: join(out, `${name}.png`) });
  if (path === '/products') {
    await page.locator('#clear').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(out, 'products-400-grid.png') });
  }
  await context.close();
}

/* ---------- Reduced motion, and motion ---------- */
console.log('\nmotion');
for (const reduce of [true, false]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  await page.goto(`${url}/products`, { waitUntil: 'load' });
  // Loops run only while on screen: bring the first group's cards into view.
  await page.locator('#count .pgrid').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const snap = () => page.$$eval('#count .pcard [data-ks]', (els) => els.slice(0, 3).map((e) => e.innerHTML));
  const a = await snap();
  await page.waitForTimeout(2500);
  const b = await snap();
  const changed = a.filter((x, i) => x !== b[i]).length;
  if (reduce) ok(changed === 0 && a.every((x) => x.includes('<svg')), 'reduced motion: loops drawn and still');
  else ok(changed > 0, `motion on: loops move (${changed} of ${a.length} changed in 2.5s)`);
  await context.close();
}

/* ---------- Quiz result ---------- */
console.log('\nquiz');
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await stub(context);
  const page = await context.newPage();
  const errors = watch(page).filter(() => true);
  await page.goto(`${url}/quiz`, { waitUntil: 'load' });
  // A tap on a single-choice answer moves on by itself; a multiple choice needs Next.
  for (let i = 0; i < 12; i++) {
    if (!(await page.locator('#quiz-result').isHidden())) break;
    const screen = page.locator('.quiz-screen:not([hidden])').first();
    if (!(await screen.count())) break;
    const q = await screen.getAttribute('data-q');
    const multi = (await screen.getAttribute('data-type')) === 'multi';
    await screen.locator('.quiz-option').first().click();
    if (multi) await page.locator('#quiz-next').click();
    await page
      .waitForFunction((id) => !document.querySelector(`.quiz-screen[data-q="${id}"]:not([hidden])`) || !document.getElementById('quiz-result').hidden, q, { timeout: 5000 })
      .catch(() => {});
  }
  await page.locator('#quiz-result:not([hidden])').waitFor({ timeout: 30000 });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => ({
    items: document.querySelectorAll('.result-item').length,
    loops: Array.from(document.querySelectorAll('.result-item-loop')).map((l) => ({ href: l.querySelector('a')?.getAttribute('href'), drawn: Boolean(l.querySelector('svg')), width: l.querySelector('.ks-loop')?.getBoundingClientRect().width ?? 0 })),
    all: document.querySelector('.result-all')?.getAttribute('href'),
  }));
  ok(r.items > 0, `${r.items} recommended items`);
  ok(r.loops.length > 0 && r.loops.every((l) => l.drawn && l.href?.startsWith('/products/') && l.width <= 200), `loops beside the mapped items: ${r.loops.map((l) => l.href).join(', ')}`);
  ok(r.all === '/products', '"See everything we build" links to /products');
  // reCAPTCHA is stubbed and /api/quiz is not served here, so a 404 for it is expected.
  const real = errors.filter((e) => !/404|Failed to load resource/.test(e));
  ok(real.length === 0, `no console errors on the quiz result${real.length ? `: ${real.join(' | ')}` : ''}`);
  await page.screenshot({ path: join(out, 'quiz-result.png'), fullPage: true });
  await context.close();
}

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} failed.` : '\nAll products checks passed.');
process.exit(failures.length ? 1 : 0);
