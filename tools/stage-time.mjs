// node tools/stage-time.mjs [url]
//
// How long the homepage's 3D key takes to appear: the time from the start of
// navigation to the stage being switched on, on a desktop-sized screen with a
// cold cache, over several loads. With no address it serves dist/ itself, so
// run `npm run build` first.
import { serve, launch } from './shots.mjs';

const given = process.argv[2];
const local = given ? null : await serve();
const url = given ?? local.url;
const browser = await launch();
const times = [];
for (let i = 0; i < 7; i++) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(url + '/', { waitUntil: 'commit' });
  const ms = await page.evaluate(
    () =>
      new Promise((ok) => {
        const done = () => document.documentElement.classList.contains('stage-on') || document.documentElement.classList.contains('no-stage');
        const tick = () => (done() ? ok(Math.round(performance.now())) : requestAnimationFrame(tick));
        tick();
      }),
  );
  times.push(ms);
  await context.close();
}
await browser.close();
local?.server.close();
times.sort((a, b) => a - b);
console.log(`3D key on screen after: median ${times[3]} ms (fastest ${times[0]}, slowest ${times[6]}) at ${url}`);
