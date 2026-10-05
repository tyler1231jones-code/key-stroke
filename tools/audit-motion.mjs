// npm run audit:motion -- --tag=before
//
// The motion audit, as measurements. For every page, at desktop and phone
// size, under a 4x CPU slowdown, it scrolls slowly from top to bottom in
// 200px steps and records at each step:
//   - what is moving: CSS transitions and animations, GSAP tweens, and
//     whether the 3D canvas drew a frame
//   - the slowest frame, and any layout shift
// From that it reports, per page:
//   - dead stretches: more than one screen of scrolling where nothing moved
//   - competition: steps where two or more separate things were moving
//   - jank: frames over 50ms, and layout shift
// It also hovers every kind of control and reports the ones that do not
// respond, and lists the sections that have no arrival at all.
//
// Writes shots/audit/motion-<tag>.json and prints a summary. The findings in
// AUDIT-motion.md are written from these files and from the contact sheets
// made by `npm run tour`.
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
const ROUTES = (val('routes') ?? 'home,services,services/automation-and-ai-agents,services/reporting-and-dashboards,services/websites-and-software,services/branding-and-graphic-design,cases,cases/002,audit,crew,savers,quiz,quiz#r=a.c.ab.c.d.c.c.a.b,counting,contact,privacy,missing')
  .split(',')
  .map((r) => (r === 'home' ? '/' : `/${r}`));
const SIZES = {
  desktop: { width: 1440, height: 900 },
  phone: { width: 390, height: 844, isMobile: true, hasTouch: true },
};
const STEP = 200;

const { server, url } = await serve();
const browser = await launch();
await mkdir(out, { recursive: true });
const report = {};

for (const route of ROUTES) {
  report[route] = {};
  for (const [sizeName, device] of Object.entries(SIZES)) {
    const context = await browser.newContext({ viewport: { width: device.width, height: device.height }, ...device });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      window.__slow = 0;
      let last = performance.now();
      const tick = (now) => { window.__slow = Math.max(window.__slow, now - last); last = now; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    const [path, hash] = route.split('#');
    await page.goto(`${url}${path}?debug${hash ? `#${hash}` : ''}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2500); // the load-in has finished: what follows is scroll-driven
    const height = await page.evaluate(() => document.documentElement.scrollHeight);

    // What is moving right now, as a list of "kind @ where".
    const sample = () => page.evaluate(() => {
      const where = (el) => {
        const host = el.closest?.('[data-demo], section[id], section[class], main > article, footer, .bar');
        const name = host ? (host.dataset?.demo ? `demo:${host.dataset.demo}` : host.id || host.className.split(' ')[0] || host.tagName.toLowerCase()) : 'page';
        return name;
      };
      const moving = new Set();
      for (const a of document.getAnimations()) {
        if (a.playState !== 'running') continue;
        const el = a.effect?.target;
        if (!el || el.closest?.('.cta-bar') || el.closest?.('.avatar')) continue; // the bar and a blink are not arrivals
        const kind = el.matches?.('[data-reveal], [data-draw]') ? 'reveal' : el.matches?.('.load-in, .line > span, .bar') ? 'load-in' : el.closest?.('.ctr') ? 'roll' : null;
        if (kind) moving.add(`${kind} @ ${where(el)}`);
      }
      const g = window.__gsap;
      if (g) {
        for (const t of g.globalTimeline.getChildren(true, true, false)) {
          if (!t.isActive() || !t.targets) continue;
          for (const el of t.targets()) {
            if (!(el instanceof Element)) continue;
            if (el.closest('.ctr')) moving.add(`roll @ ${where(el)}`);
            else if (el.closest('[data-demo]')) moving.add(`demo @ ${where(el)}`);
            else if (el.closest('.artefact')) moving.add(`artefact @ ${where(el)}`);
            else if (el.closest('.quiz-frame')) moving.add(`quiz screen @ ${where(el)}`);
          }
        }
      }
      const frame = window.__stage?.renderer?.info?.render?.frame ?? 0;
      const drew = frame !== (window.__lastFrame ?? frame);
      window.__lastFrame = frame;
      if (drew) moving.add('3D scene @ canvas');
      const slow = Math.round(window.__slow);
      window.__slow = 0;
      return { moving: [...moving], slow, cls: window.__cls };
    });

    await sample();
    const steps = [];
    for (let y = 0; y <= height - device.height + STEP; y += STEP) {
      await page.mouse.wheel(0, STEP);
      // Sample twice inside the step, so a short arrival is not missed.
      await page.waitForTimeout(140);
      const a = await sample();
      await page.waitForTimeout(160);
      const b = await sample();
      steps.push({ y: Math.min(y + STEP, height - device.height), moving: [...new Set([...a.moving, ...b.moving])], slow: Math.max(a.slow, b.slow), cls: b.cls });
    }

    // Dead stretches: more than one screen where nothing moved.
    const dead = [];
    let from = null;
    for (const s of steps) {
      if (s.moving.length === 0) from ??= s.y - STEP;
      else {
        if (from !== null && s.y - STEP - from > device.height) dead.push([from, s.y - STEP]);
        from = null;
      }
    }
    if (from !== null && steps.at(-1).y - from > device.height) dead.push([from, steps.at(-1).y]);

    // Competition: two or more separate things at one step. Arrivals in the
    // same section count as one thing; a figure rolling inside a section that
    // is arriving is the same moment too.
    const competing = [];
    for (const s of steps) {
      const things = new Set(s.moving.map((m) => (m.startsWith('reveal') || m.startsWith('roll') ? `arrival @ ${m.split(' @ ')[1]}` : m)));
      if (things.size > 1) competing.push({ y: s.y, things: [...things] });
    }

    // Sections with no arrival of any kind.
    const still = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main section'))
        .filter((s) => !s.querySelector('[data-reveal], [data-draw], .load-in, [data-roll], [data-demo], .artefact, [data-slot], .hero-h') && !s.matches('[data-reveal]'))
        .map((s) => s.id || s.className.split(' ')[0] || 'section'),
    );

    // Controls that do not respond to hover.
    const mute = sizeName === 'desktop' ? await page.evaluate(async () => {
      const kinds = { '.key': 'key button', '.card-link': 'card', '.chip': 'filter chip', '.more': 'text link', '.foot a': 'footer link', '.nav-list a': 'header link', '.faq-item > summary': 'question', '.demo-toggle': 'demo toggle', '.tag[href]': 'tag link', '.quiz-option > span': 'quiz option', 'main p a:not([class])': 'inline link' };
      const out = {};
      for (const [selector, label] of Object.entries(kinds)) {
        const el = document.querySelector(selector);
        if (!el) continue;
        const cs = getComputedStyle(el);
        out[label] = { transition: cs.transitionDuration !== '0s' };
      }
      return out;
    }) : null;
    let hover = null;
    if (mute) {
      hover = {};
      const kinds = { '.key': 'key button', '.card-link': 'card', '.chip': 'filter chip', '.more': 'text link', '.foot a': 'footer link', '.nav-list a': 'header link', '.faq-item > summary': 'question', '.demo-toggle': 'demo toggle', '.tag[href]': 'tag link', 'main p a:not([class])': 'inline link' };
      for (const [selector, label] of Object.entries(kinds)) {
        const el = page.locator(selector).first();
        if (!(await el.count()) || !(await el.isVisible().catch(() => false))) continue;
        const read = () => el.evaluate((n) => {
          const target = n.classList.contains('card-link') ? n.closest('.card') : n;
          const cs = getComputedStyle(target);
          const after = getComputedStyle(target, '::after');
          return [cs.boxShadow, cs.transform, cs.borderTopColor, cs.borderBottomColor, cs.color, cs.backgroundColor, cs.textDecorationColor, cs.textDecorationLine, after.color, after.transform].join('|');
        });
        await el.scrollIntoViewIfNeeded().catch(() => {});
        await page.mouse.move(2, 2);
        await page.waitForTimeout(250);
        const rest = await read();
        await el.hover({ force: true }).catch(() => {});
        await page.waitForTimeout(450);
        hover[label] = { responds: (await read()) !== rest, eased: mute[label]?.transition ?? false };
      }
    }

    const slowFrames = steps.filter((s) => s.slow > 50).length;
    const cls = steps.at(-1)?.cls ?? 0;
    report[route][sizeName] = { height, steps, dead, competing, still, hover, slowFrames, worstFrame: Math.max(0, ...steps.map((s) => s.slow)), cls: Number(cls.toFixed(4)) };
    const things = [...new Set(steps.flatMap((s) => s.moving))];
    console.log(`${route} ${sizeName}: ${height}px, ${things.length} moving things, dead ${dead.length ? dead.map(([a, b]) => `${a}-${b}`).join(' ') : 'none'}, competing at ${competing.length} steps, frames over 50ms at ${slowFrames}/${steps.length} steps (worst ${Math.max(0, ...steps.map((s) => s.slow))}ms), shift ${cls.toFixed(3)}${still.length ? `, no arrival: ${still.join(' ')}` : ''}`);
    await context.close();
  }
}

await writeFile(join(out, `motion-${tag}.json`), JSON.stringify(report, null, 1));
await browser.close();
server.close();
console.log(`\nwritten to shots/audit/motion-${tag}.json`);
