// npm run audit:mobile -- --tag=before
//
// The mobile audit, as measurements. Every page at 360, 390 and 430 wide and
// at 768, with touch emulation, a 4x CPU slowdown and a slow 4G connection.
// For each it reports:
//   - sideways scroll, and any control cut off by the edge of the screen
//   - at 360x740: whether the headline, the first sentence and the main
//     button are all on the first screen
//   - tap targets under 48px, and how close the small ones sit to a neighbour
//   - running text under 16px
//   - form fields: type, autocomplete, text size, submit height
//   - weight: what was transferred, and whether three.js was loaded
//   - speed: Largest Contentful Paint, layout shift, and the slowest
//     response to a tap (the lab stand-in for Interaction to Next Paint)
//
// Writes shots/audit/mobile-<tag>.json and prints a summary. Lighthouse
// scores come from tools/lighthouse.mjs.
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { serve, launch } from './shots.mjs';

const args = process.argv.slice(2);
const val = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const tag = val('tag', 'now');
const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const out = join(root, 'shots', 'audit');
const ROUTES = (val('routes') ?? 'home,services,services/automation-and-ai-agents,services/reporting-and-dashboards,services/websites-and-software,services/branding-and-graphic-design,cases,cases/002,audit,crew,savers,quiz,quiz#r=a.c.ab.c.d.c.c.a.b,counting,contact,privacy,terms,missing')
  .split(',')
  .map((r) => (r === 'home' ? '/' : `/${r}`));
const SIZES = [
  { name: '360', width: 360, height: 740 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
];
// Lighthouse's "slow 4G": 1.6 Mbps down, 750 Kbps up, 150ms round trip.
const NETWORK = { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 };

const { server, url } = await serve();
const browser = await launch();
await mkdir(out, { recursive: true });
const report = {};
const totals = { sideways: 0, cut: 0, firstScreen: 0, small: 0, tiny: 0, tapsFailed: 0, lcpOver: 0, clsOver: 0, inpOver: 0 };

for (const route of ROUTES) {
  report[route] = {};
  for (const size of SIZES) {
    const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', NETWORK);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const requests = [];
    cdp.on('Network.loadingFinished', (e) => requests.push(e));
    const urls = new Map();
    cdp.on('Network.responseReceived', (e) => urls.set(e.requestId, e.response.url));
    await page.addInitScript(() => {
      window.__lcp = 0;
      window.__cls = 0;
      window.__inp = 0;
      new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__inp = Math.max(window.__inp, e.duration); }).observe({ type: 'event', durationThreshold: 16, buffered: true });
    });
    const [path, hash] = route.split('#');
    await page.goto(`${url}${path}${hash ? `#${hash}` : ''}`, { waitUntil: 'load' });
    await page.waitForTimeout(3500);

    const facts = await page.evaluate(({ first }) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const doc = document.documentElement;
      const shown = (el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden], [aria-hidden="true"]');
      };
      const label = (el) => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);

      // First screen: the headline, the sentence under it and the main button.
      let firstScreen = null;
      if (first) {
        const h1 = [document.querySelector('main h1'), ...document.querySelectorAll('main h2')].find((el) => el && shown(el));
        const lede = document.querySelector('main .lede, main h1 ~ p, main legend');
        const button = Array.from(document.querySelectorAll('main .key, .bar .key')).find(shown);
        const within = (el) => (el && shown(el) ? el.getBoundingClientRect().bottom <= vh && el.getBoundingClientRect().top >= 0 : false);
        firstScreen = { headline: within(h1), sentence: within(lede), button: within(button), buttonLabel: button ? label(button) : null };
      }

      // Tap targets. Links inside running text are exempt, as the guidance allows.
      const targets = Array.from(document.querySelectorAll('a[href], button, summary, input:not([type="hidden"]), select, textarea, label.quiz-option')).filter(shown).filter((el) => !el.closest('.cta-bar') || el.closest('.cta-bar.is-on'));
      // A control that runs past the edge of the screen, unless it sits in a strip made to scroll sideways.
      const scrolls = (el) => { for (let p = el.parentElement; p; p = p.parentElement) if (/auto|scroll/.test(getComputedStyle(p).overflowX)) return true; return false; };
      const cut = targets
        .filter((el) => !el.matches('.skip') && !scrolls(el))
        .filter((el) => { const r = el.getBoundingClientRect(); return r.right > vw + 1 || r.left < -1; })
        .map((el) => { const r = el.getBoundingClientRect(); return `${label(el)}: ${Math.round(r.left)} to ${Math.round(r.right)} of ${vw}`; });
      const small = [];
      for (const el of targets) {
        if (el.matches('a') && el.closest('p, li, dd') && !el.matches('.key, .more, .tag, .card-link') && el.closest('p, li, dd').textContent.trim().length > el.textContent.trim().length + 8) continue;
        if (el.matches('input[type="radio"], input[type="checkbox"]')) continue; // the label is the target
        // A card link's tap area is the whole card.
        const box = (el.matches('.card-link') ? el.closest('.card') : el).getBoundingClientRect();
        if (box.height < 47.5 || box.width < 47.5) small.push({ what: label(el), where: el.closest('header, footer, section, [data-demo]')?.className?.split(' ')[0] || el.closest('header, footer')?.tagName.toLowerCase() || 'main', w: Math.round(box.width), h: Math.round(box.height) });
      }

      // Running text under 16px. Labels, tags, figures' units and the insides of illustrations are not running text.
      const tiny = new Map();
      for (const el of document.querySelectorAll('main p, main li, main dd, main td, main label, main summary, footer p, footer li, footer a')) {
        if (!shown(el) || el.closest('.demo-stage, .artefact, .report, .plate, .tag, .unit, .eyebrow, .form-legal, .demo-note, .field-error, table') || el.matches('.plate, .tag, .unit, .eyebrow, .form-legal, .demo-note')) continue;
        if (!Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
        const px = parseFloat(getComputedStyle(el).fontSize);
        if (px < 15.9) {
          const key = `${el.closest('footer') ? 'footer ' : ''}${el.className.split(' ')[0] || el.tagName.toLowerCase()} ${px}px`;
          tiny.set(key, (tiny.get(key) ?? 0) + 1);
        }
      }

      // Form fields.
      const fields = Array.from(document.querySelectorAll('form[data-form] input:not([type="hidden"]):not(.form-pot), form[data-form] select, form[data-form] textarea')).map((el) => ({
        name: el.name, type: el.type, autocomplete: el.autocomplete || null, inputmode: el.inputMode || null, px: parseFloat(getComputedStyle(el).fontSize), h: Math.round(el.getBoundingClientRect().height), labelled: Boolean(el.labels?.length),
      }));
      const submits = Array.from(document.querySelectorAll('form[data-form] .form-submit')).map((el) => Math.round(el.getBoundingClientRect().height));

      return { sideways: doc.scrollWidth - vw, cut, height: doc.scrollHeight, firstScreen, small, tiny: Object.fromEntries(tiny), fields, submits };
    }, { first: size.name === '360' });

    // The slowest response to a tap: the menu, then one of each kind of control on the page.
    let taps = 0;
    const tapsFailed = [];
    for (const selector of ['details.menu > summary', '.demo-toggle[data-show="before"]', '.chip[data-value]:not([aria-pressed="true"])', '.faq-item > summary', '.quiz-option', '.tier-ask']) {
      const el = page.locator(selector).first();
      if (!(await el.count()) || !(await el.isVisible().catch(() => false))) continue;
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await el.tap({ timeout: 3000 }).catch(() => tapsFailed.push(selector)); // a tap that cannot land is a finding, not noise
      await page.waitForTimeout(500);
      taps++;
      if (selector.startsWith('details.menu')) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); }
    }
    // Scroll to the foot: a pinned section must not trap the page.
    const reached = await page.evaluate(async () => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((ok) => setTimeout(ok, 700));
      return Math.abs(window.scrollY + window.innerHeight - document.documentElement.scrollHeight) < 4;
    });
    const vitals = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), cls: Number(window.__cls.toFixed(4)), inp: Math.round(window.__inp) }));
    const transfer = requests.reduce((t, r) => t + r.encodedDataLength, 0);
    const js = requests.filter((r) => /\.js(\?|$)/.test(urls.get(r.requestId) ?? '')).reduce((t, r) => t + r.encodedDataLength, 0);
    const three = requests.some((r) => /\/_astro\/boot\./.test(urls.get(r.requestId) ?? ''));

    report[route][size.name] = { ...facts, vitals, taps, tapsFailed, reachedFoot: reached, transferKB: Math.round(transfer / 1024), jsKB: Math.round(js / 1024), three };
    if (facts.sideways > 1) totals.sideways++;
    totals.cut += facts.cut.length;
    totals.tapsFailed += tapsFailed.length;
    if (facts.firstScreen && !(facts.firstScreen.headline && facts.firstScreen.sentence && facts.firstScreen.button)) totals.firstScreen++;
    totals.small += facts.small.length;
    totals.tiny += Object.values(facts.tiny).reduce((a, b) => a + b, 0);
    if (vitals.lcp > 2500) totals.lcpOver++;
    if (vitals.cls > 0.1) totals.clsOver++;
    if (vitals.inp > 200) totals.inpOver++;
    const fs = facts.firstScreen ? ` first screen: headline ${facts.firstScreen.headline ? 'yes' : 'NO'}, sentence ${facts.firstScreen.sentence ? 'yes' : 'NO'}, button ${facts.firstScreen.button ? 'yes' : 'NO'};` : '';
    console.log(`${route} ${size.name}:${fs} sideways ${facts.sideways > 1 ? facts.sideways + 'px' : 'none'};${facts.cut.length ? ` CUT OFF: ${facts.cut.join(', ')};` : ''}${tapsFailed.length ? ` TAP DID NOT LAND: ${tapsFailed.join(', ')};` : ''} small targets ${facts.small.length}; text under 16px ${Object.values(facts.tiny).reduce((a, b) => a + b, 0)}; LCP ${(vitals.lcp / 1000).toFixed(2)}s, shift ${vitals.cls}, slowest tap ${vitals.inp}ms (${taps} taps); ${Math.round(transfer / 1024)} KB (JS ${Math.round(js / 1024)} KB${three ? ', three.js loaded' : ''})${reached ? '' : '; DID NOT REACH THE FOOT'}`);
    await context.close();
  }
}

await writeFile(join(out, `mobile-${tag}.json`), JSON.stringify(report, null, 1));
await browser.close();
server.close();
console.log(`\n${JSON.stringify(totals)}\nwritten to shots/audit/mobile-${tag}.json`);
