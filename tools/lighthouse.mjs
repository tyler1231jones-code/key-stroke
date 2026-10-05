// npm run lighthouse -- --tag=before
//
// Lighthouse on every built page at its phone profile (a mid-range phone on
// slow 4G, simulated: 4x CPU slowdown, 1.6 Mbps, 150ms round trip). Uses the
// Chromium that Playwright already has, so nothing is downloaded. Serves
// dist/ itself, gzipped, as Cloudflare would.
//
// Writes shots/audit/lighthouse-<tag>.json and prints one line a page:
// performance, accessibility, best practices and SEO scores, then LCP, total
// blocking time and layout shift.
//
// The SEO score is lower than it will be live while demo mode is on, because
// every page then carries noindex on purpose.
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { serve } from './shots.mjs';

const args = process.argv.slice(2);
const val = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const tag = val('tag', 'now');
const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const out = join(root, 'shots', 'audit');
const ROUTES = (val('routes') ?? 'home,services,services/automation-and-ai-agents,services/reporting-and-dashboards,services/websites-and-software,services/branding-and-graphic-design,cases,cases/002,cases/011,audit,crew,savers,quiz,counting,contact,privacy,terms')
  .split(',')
  .map((r) => (r === 'home' ? '/' : `/${r}`));

// --dir serves another build, such as a demo-off build made to check what goes live.
const { server, url } = await serve(val('dir') ? resolve(root, val('dir')) : undefined);
await mkdir(out, { recursive: true });
const chrome = await chromeLauncher.launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-first-run'],
});
const results = {};
try {
  for (const route of ROUTES) {
    const run = await lighthouse(`${url}${route}`, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
    const lhr = run.lhr;
    const score = (id) => Math.round((lhr.categories[id]?.score ?? 0) * 100);
    const num = (id) => lhr.audits[id]?.numericValue ?? null;
    const failed = (id) => lhr.categories[id].auditRefs.map((r) => lhr.audits[r.id]).filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'manual').map((a) => a.id);
    results[route] = {
      performance: score('performance'), accessibility: score('accessibility'), bestPractices: score('best-practices'), seo: score('seo'),
      fcp: Math.round(num('first-contentful-paint')), lcp: Math.round(num('largest-contentful-paint')), tbt: Math.round(num('total-blocking-time')), cls: Number((num('cumulative-layout-shift') ?? 0).toFixed(3)), si: Math.round(num('speed-index')),
      failing: { accessibility: failed('accessibility'), bestPractices: failed('best-practices'), seo: failed('seo') },
      // The elements behind each failing accessibility audit.
      nodes: Object.fromEntries(failed('accessibility').map((id) => [id, (lhr.audits[id].details?.items ?? []).slice(0, 8).map((item) => [item.node?.selector ?? item.node?.snippet ?? '', (item.node?.explanation ?? '').replace(/s+/g, ' ').slice(0, 200)].join(' :: '))])),
    };
    const r = results[route];
    console.log(`${route}: performance ${r.performance}, accessibility ${r.accessibility}, best practices ${r.bestPractices}, SEO ${r.seo}; LCP ${(r.lcp / 1000).toFixed(2)}s, TBT ${r.tbt}ms, CLS ${r.cls}${[...r.failing.accessibility, ...r.failing.bestPractices, ...r.failing.seo].length ? `; failing: ${[...r.failing.accessibility, ...r.failing.bestPractices, ...r.failing.seo].join(', ')}` : ''}`);
  }
} finally {
  await chrome.kill();
  server.close();
}
await writeFile(join(out, `lighthouse-${tag}.json`), JSON.stringify(results, null, 1));
const scores = Object.values(results).map((r) => r.performance);
console.log(`\nperformance: lowest ${Math.min(...scores)}, pages under 90: ${Object.entries(results).filter(([, r]) => r.performance < 90).map(([k]) => k).join(', ') || 'none'}\nwritten to shots/audit/lighthouse-${tag}.json`);
