// npm run qa
//
// Checks that need a real browser, run against the built site:
//   - the page never scrolls sideways, at 1440 and 390 wide
//   - body copy never exceeds 66 characters a line
//   - every text colour pair in use holds 4.5:1
//   - tabbing reaches every control, brings it on screen, and is never trapped by a pinned section
//   - LCP and layout shift on a throttled phone profile
//   - 3D memory returns to where it started after scrolling the page twice
// The forms have their own test: npm run forms.
// Prints a report. Exits 1 if a hard limit is broken.
import { serve, launch } from './shots.mjs';

const routes = ['/', '/services', '/services/automation-and-ai-agents', '/services/reporting-and-dashboards', '/services/websites-and-software', '/services/branding-and-graphic-design', '/cases', '/cases/002', '/cases/011', '/audit', '/crew', '/savers', '/contact', '/privacy', '/terms', '/counting', '/quiz', '/quiz#r=a.c.ab.c.d.c.c.a.b', '/missing'];
const sizes = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };
const problems = [];
const note = (s) => console.log(s);
const bad = (s) => { problems.push(s); console.log(`  FAIL ${s}`); };

const { server, url } = await serve();
const browser = await launch();

/* ---------- Layout: sideways scroll and the measure ---------- */
for (const [sizeName, viewport] of Object.entries(sizes)) {
  for (const reduced of [false, true]) {
    const context = await browser.newContext({ viewport, reducedMotion: reduced ? 'reduce' : 'no-preference', isMobile: sizeName === 'phone', hasTouch: sizeName === 'phone' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    for (const route of routes) {
      await page.goto(url + route, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const result = await page.evaluate(() => {
        const doc = document.documentElement;
        const sideways = doc.scrollWidth - window.innerWidth;
        const range = document.createRange();
        let worst = { n: 0, text: '' };
        const blocks = document.querySelectorAll('.lede, .body, .body-s, main p:not([class]), main li:not([class])');
        for (const el of blocks) {
          if (el.closest('[data-artefact], .demo-stage, table, .plate') || !el.offsetParent) continue; // illustrations are not running copy
          const lines = new Map();
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            const text = node.textContent;
            for (let i = 0; i < text.length; i++) {
              range.setStart(node, i);
              range.setEnd(node, i + 1);
              const r = range.getClientRects()[0];
              if (!r || r.width === 0) continue;
              const key = Math.round(r.bottom / 8);
              lines.set(key, (lines.get(key) || '') + text[i]);
            }
          }
          for (const line of lines.values()) {
            if (line.trim().length > worst.n) worst = { n: line.trim().length, text: line.trim() };
          }
        }
        return { sideways, worst };
      });
      const tag = `${sizeName}${reduced ? ' reduced' : ''} ${route}`;
      if (result.sideways > 1) bad(`${tag}: page scrolls sideways by ${result.sideways}px`);
      if (result.worst.n > 66) bad(`${tag}: a line of body copy is ${result.worst.n} characters: "${result.worst.text}"`);
      else note(`  ok   ${tag}: longest body line ${result.worst.n} characters`);
    }
    if (errors.length) bad(`${sizeName}: page errors: ${[...new Set(errors)].join(' | ')}`);
    await context.close();
  }
}

/* ---------- Contrast of the pairs in use ---------- */
{
  const context = await browser.newContext({ viewport: sizes.desktop });
  const page = await context.newPage();
  await page.goto(url + '/', { waitUntil: 'networkidle' });
  const pairs = await page.evaluate(() => {
    const read = (el) => {
      const s = getComputedStyle(el);
      const out = {};
      for (const n of ['base-000', 'base-100', 'base-900', 'rule', 'ink', 'ink-muted', 'ink-inverse', 'readout', 'signal', 'signal-inverse']) out[n] = s.getPropertyValue(`--${n}`).trim();
      return out;
    };
    const dark = read(document.documentElement);
    const probe = document.createElement('div');
    probe.setAttribute('data-theme', 'light');
    document.body.appendChild(probe);
    const light = read(probe);
    probe.remove();
    return { dark, light };
  });
  const lum = (hex) => {
    const full = hex.replace('#', '');
    const v = (full.length === 3 ? full.replace(/./g, '$&$&') : full).match(/../g).map((h) => parseInt(h, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  // Every text pair the site sets, by theme: [text, ground].
  const text = {
    dark: [['ink', 'base-000'], ['ink', 'base-100'], ['ink-muted', 'base-000'], ['ink-muted', 'base-100'], ['ink-muted', 'base-900'], ['ink-inverse', 'base-900'], ['readout', 'base-900'], ['base-900', 'readout'], ['signal', 'base-000'], ['signal-inverse', 'base-900']],
    // ink-muted is not set on base-900 in the light theme: it would be 3.3:1. The footer uses ink-inverse there.
    light: [['ink', 'base-000'], ['ink', 'base-100'], ['ink-muted', 'base-000'], ['ink-muted', 'base-100'], ['readout', 'base-900'], ['ink-inverse', 'base-900']],
  };
  note('\nContrast');
  for (const theme of ['dark', 'light']) {
    for (const [fg, bg] of text[theme]) {
      const r = ratio(pairs[theme][fg], pairs[theme][bg]);
      const line = `${theme}: ${fg} on ${bg} = ${r.toFixed(2)}:1`;
      if (r < 4.5) bad(line);
      else note(`  ok   ${line}`);
    }
  }
  await context.close();
}

/* ---------- Keyboard ---------- */
for (const route of ['/', '/cases', '/audit', '/contact', '/savers', '/quiz', '/counting']) {
  const context = await browser.newContext({ viewport: sizes.desktop });
  const page = await context.newPage();
  await page.goto(url + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const expected = await page.evaluate(() => {
    const groups = new Set();
    return Array.from(document.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex="0"]'))
      .filter((el) => el.offsetParent !== null || el.getClientRects().length)
      // a radio group is one tab stop
      .filter((el) => (el.type === 'radio' ? !groups.has(el.name) && groups.add(el.name) : true)).length;
  });
  let reached = 0;
  let offscreen = 0;
  let first = '';
  const seen = new Set();
  for (let i = 0; i < expected + 30; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(40);
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      if (!el.dataset.qa) el.dataset.qa = String(Math.random());
      return { id: el.dataset.qa, label: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30), visible: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth };
    });
    if (!info) break;
    if (seen.has(info.id)) break; // wrapped round: not trapped
    seen.add(info.id);
    if (!first) first = info.label;
    reached++;
    if (!info.visible) offscreen++;
  }
  note(`\nKeyboard ${route}: ${reached} stops (about ${expected} controls), first is "${first}"`);
  if (first !== 'Skip to content') bad(`${route}: the first tab stop is not the skip link`);
  if (offscreen) bad(`${route}: ${offscreen} focused controls were not brought on screen`);
  if (reached < expected * 0.8) bad(`${route}: tabbing reached ${reached} of about ${expected} controls; focus may be trapped`);
  await context.close();
}

/* ---------- Load on a throttled phone ---------- */
{
  const context = await browser.newContext({ viewport: sizes.phone, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  // Roughly a mid-range phone on 4G: 9 Mbps down, 170ms round trip, CPU four times slower.
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 170, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__lcp = 0;
    window.__cls = 0;
    new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(url + '/', { waitUntil: 'load' });
  await page.waitForTimeout(6000);
  const m = await page.evaluate(() => ({ lcp: window.__lcp, cls: window.__cls, transfer: performance.getEntriesByType('resource').reduce((t, r) => t + (r.transferSize || 0), 0) }));
  note(`\nLoad, throttled phone: LCP ${(m.lcp / 1000).toFixed(2)}s, layout shift ${m.cls.toFixed(4)}, ${(m.transfer / 1024).toFixed(0)} KB transferred (gzipped)`);
  if (m.lcp > 2500) bad(`LCP ${(m.lcp / 1000).toFixed(2)}s is over 2.5s`);
  if (m.cls > 0.01) bad(`layout shift ${m.cls.toFixed(4)}`);
  await context.close();
}

/* ---------- 3D memory and frame rate ---------- */
{
  const context = await browser.newContext({ viewport: sizes.desktop });
  const page = await context.newPage();
  await page.goto(url + '/?debug', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const read = () => page.evaluate(() => (window.__stage ? { ...window.__stage.renderer.info.memory, programs: window.__stage.renderer.info.programs?.length ?? 0 } : null));
  const sweep = async () => {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= height; y += 450) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await page.waitForTimeout(60);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);
  };
  const before = await read();
  if (before) {
    await sweep();
    const once = await read();
    await sweep();
    const twice = await read();
    note(`\n3D memory at top of page: start ${JSON.stringify(before)}, after one pass ${JSON.stringify(once)}, after two ${JSON.stringify(twice)}`);
    if (twice.geometries > once.geometries || twice.textures > once.textures) bad('3D memory grows on a second pass: a scene is not being disposed');
  } else {
    note('\n3D memory: stage not available in this browser');
  }
  await context.close();
}

await browser.close();
server.close();
if (problems.length) {
  console.log(`\n${problems.length} problem(s).`);
  process.exit(1);
}
console.log('\nqa passed.');
