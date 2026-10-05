// npm run audit:contrast
//
// Contrast of every piece of text inside the four service demonstrations, in
// the "before" state and in the "after" state, at desktop and phone size.
// The demonstrations are the one place on the site with colour of their own,
// and Lighthouse only sees whichever state a demonstration happens to be in
// when it looks. This checks both.
//
// Uses axe-core, which comes with Lighthouse. Run `npm run build` first.
// Exits 1 if any text fails.
import { readFileSync } from 'node:fs';
import { serve, launch } from './shots.mjs';

const axe = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const { server, url } = await serve();
const browser = await launch();
const routes = ['services/automation-and-ai-agents', 'services/reporting-and-dashboards', 'services/websites-and-software', 'services/branding-and-graphic-design'];
let total = 0;
for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844, isMobile: true, hasTouch: true }]) {
  for (const route of routes) {
    const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, ...size });
    const page = await context.newPage();
    await page.goto(`${url}/${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(9000); // the first play has finished
    await page.addScriptTag({ content: axe });
    for (const state of ['after', 'before']) {
      await page.locator(`.demo-toggle[data-show="${state}"]`).first().click();
      await page.waitForTimeout(2500);
      const found = await page.evaluate(async () => {
        const r = await window.axe.run('.demo-stage', { runOnly: ['color-contrast'] });
        return r.violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(' ')}: ${(n.any[0]?.message ?? '').replace(/\s+/g, ' ').slice(0, 170)}`));
      });
      total += found.length;
      console.log(`/${route} at ${size.width}, ${state}: ${found.length ? `\n  ${found.join('\n  ')}` : 'clear'}`);
    }
    await context.close();
  }
}
await browser.close();
server.close();
console.log(total ? `\n${total} piece(s) of text fail contrast.` : '\ncontrast passed.');
process.exit(total ? 1 : 0);
