// node tools/client-test.mjs [--url=http://localhost:8787]
//
// Walks through every client form sealed in clients/, the way the client
// would, at desktop and phone sizes, against the real Worker running locally
// (`npm run client:preview`, after `npm run build` and `npm run client:seal`).
// Formspree and Google are intercepted (as in onboard-test.mjs), so nothing is
// ever sent. Checks:
//   - a link without its id, and a wrong passcode, do not open the form
//   - the right passcode opens it, with the filled-in answers in place
//   - the page source holds nothing of the form before it is opened
//   - a card number in any answer, a group's included, stops the send
//   - answers survive a reload (after the passcode again)
//   - the payload: the client, every step, nothing that looks like a password
//     or card, no terms for a form without an agreement
//   - the markup drawn in the browser matches Astro's for a service form
// Screenshots of every step, both sizes, go to shots/client/<id>/.
// Exits 1 if anything fails.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './shots.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv.find((a) => a.startsWith('--url='))?.slice(6) ?? 'http://localhost:8787').replace(/\/$/, '');
const passcodes = JSON.parse(await readFile(join(root, 'clients', 'passcodes.json'), 'utf8'));
const forms = [];
for (const name of (await readdir(join(root, 'clients'))).filter((n) => n.endsWith('.ts') && !n.startsWith('_'))) {
  forms.push((await import(pathToFileURL(join(root, 'clients', name)).href)).default);
}

const failures = [];
const ok = (cond, what) => {
  if (!cond) failures.push(what);
  console.log(`${cond ? '  ok  ' : '  FAIL'} ${what}`);
};

try {
  const r = await fetch(`${base}/api/health`);
  if (!r.ok) throw new Error();
} catch {
  console.error(`Nothing is answering at ${base}. Start it with: npm run client:preview`);
  process.exit(1);
}

const browser = await launch();
const CARD = '4111 1111 1111 1111'; // A published test number: passes the Luhn check, belongs to no one.

async function stub(context, onSend) {
  await context.route(/https:\/\/www\.(google|gstatic)\.com\/recaptcha\/.*/, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: 'window.grecaptcha={ready:function(cb){cb()},execute:function(){return Promise.resolve("test-token")}};' }),
  );
  await context.route(/https:\/\/formspree\.io\/.*/, async (route) => {
    const request = route.request();
    onSend(parse(request.postDataBuffer() ?? Buffer.alloc(0), request.headers()['content-type'] ?? ''));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
}

function parse(buffer, contentType) {
  const boundary = contentType.match(/boundary=(.+)$/)?.[1];
  if (!boundary) return {};
  const out = {};
  for (const part of buffer.toString('utf8').split(`--${boundary}`).slice(1, -1)) {
    const at = part.indexOf('\r\n\r\n');
    const name = part.slice(0, at).match(/name="([^"]*)"/)?.[1];
    const file = part.slice(0, at).match(/filename="([^"]*)"/)?.[1];
    if (name) out[name] = file ? `(file) ${file}` : part.slice(at + 4).replace(/\r\n$/, '');
  }
  return out;
}

/** Fill what is visible, required and empty on the current step. Filled-in answers are left as they are. */
async function fillStep(page) {
  for (let pass = 0; pass < 3; pass++) {
    await page.evaluate(() => {
      const step = document.querySelector('.ob-step.on');
      const hidden = (el) => el.closest('[data-show-if][hidden]') || el.closest('template');
      const fire = (el) => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      for (const w of step.querySelectorAll('.ob-field')) {
        if (hidden(w)) continue;
        const kind = w.dataset.kind ?? w.querySelector('[data-kind]')?.dataset.kind;
        const inputs = Array.from(w.querySelectorAll('input, textarea')).filter((i) => !i.closest('template') && !i.closest('[data-other-for]'));
        if (kind === 'choice' || kind === 'access') {
          const radios = inputs.filter((i) => i.type === 'radio');
          if (!radios.some((r) => r.checked)) (radios[0].checked = true), fire(radios[0]);
        } else if (kind === 'multi') {
          const boxes = inputs.filter((i) => i.type === 'checkbox' && i.value !== 'Other');
          if (!boxes.some((b) => b.checked)) (boxes[0].checked = true), fire(boxes[0]);
        } else if (['tick', 'file', 'colour', 'group'].includes(kind)) {
          if (kind === 'tick' && !inputs[0].checked) (inputs[0].checked = true), fire(inputs[0]);
        } else {
          const i = inputs[0];
          if (!i || i.value || !w.querySelector('[data-required]')) continue;
          i.value = { email: 'test@example.com', tel: '0400 000 000', url: 'example.com.au', date: '2026-12-01' }[kind] ?? `Test ${i.name}`;
          fire(i);
        }
      }
    });
  }
}

async function unlock(page, id, passcode) {
  await page.goto(`${base}/onboard/client/#${id}`, { waitUntil: 'load' });
  await page.fill('#ob-passcode', passcode);
  await page.click('[data-lock-form] button[type="submit"]');
}

for (const form of forms) {
  const out = join(root, 'shots', 'client', form.id);
  await mkdir(out, { recursive: true });
  console.log(`\n${form.client} (${form.id})`);

  // The page as anyone can fetch it: nothing of the form in it.
  const html = await (await fetch(`${base}/onboard/client/`)).text();
  ok(!html.includes(form.client) && !html.includes(form.steps[0].title), 'the page source holds nothing of the form');
  ok(/noindex/.test(html), 'the page is marked noindex');
  const head = await fetch(`${base}/onboard/client/`);
  console.log(`        X-Robots-Tag: ${head.headers.get('x-robots-tag') ?? '(not set by wrangler dev; public/_headers sets it on Cloudflare)'}`);

  for (const size of [
    { name: 'desktop', viewport: { width: 1440, height: 900 } },
    { name: 'phone', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  ]) {
    const context = await browser.newContext({ viewport: size.viewport, isMobile: size.isMobile, hasTouch: size.hasTouch, deviceScaleFactor: size.deviceScaleFactor ?? 1, reducedMotion: 'reduce' });
    let sent = null;
    await stub(context, (data) => (sent = data));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const shot = (name) => page.screenshot({ path: join(out, `${size.name}-${name}.png`), fullPage: true });

    // No id in the link.
    await page.goto(`${base}/onboard/client/`, { waitUntil: 'load' });
    ok(await page.getByText('missing its last part').isVisible(), `${size.name}: a link without its id says so`);

    // A wrong passcode.
    await unlock(page, form.id, 'not the passcode at all');
    await page.waitForSelector('[data-lock-status]:not([hidden])');
    ok((await page.textContent('[data-lock-status]')).includes('does not match'), `${size.name}: a wrong passcode does not open the form`);
    await shot('00-passcode-wrong');

    // The right one, typed loosely: capitals, spaces and dashes do not matter.
    await page.fill('#ob-passcode', size.name === 'desktop' ? `  ${passcodes[form.id].toUpperCase().replace(/[\s-]+/g, '')} ` : passcodes[form.id].replace(/ /g, '-'));
    await page.click('[data-lock-form] button[type="submit"]');
    await page.waitForSelector('[data-onboard]:not([hidden]) .ob-step.on');
    ok(true, `${size.name}: the passcode opens the form`);
    ok((await page.textContent('[data-byline]')) === form.byline, `${size.name}: the byline reads "${form.byline}"`);

    // Filled-in answers are in place.
    const prefilled = form.steps.flatMap((s) => s.fields).filter((f) => typeof f.value === 'string');
    const values = await page.evaluate((ids) => ids.map((id) => document.querySelector(`[name="${id}"]`)?.value), prefilled.map((f) => f.id));
    ok(prefilled.every((f, i) => values[i] === f.value), `${size.name}: ${prefilled.length} filled-in answers are in place`);
    const groups = form.steps.flatMap((s) => s.fields).filter((f) => f.type === 'group' && f.items?.length);
    for (const g of groups) {
      const n = await page.locator(`[data-field="${g.id}"] .ob-items > .ob-item`).count();
      ok(n === g.items.length, `${size.name}: ${g.label} starts with ${g.items.length} entries`);
    }

    // Every step.
    let i = 0;
    while (!(await page.locator('[data-send]').isVisible()) && i < 30) {
      i++;
      const id = await page.getAttribute('.ob-step.on', 'data-step');
      await shot(`${String(i).padStart(2, '0')}-${id}`);
      // A card number in a group entry keeps the client on the step, with the reason.
      const role = page.locator('.ob-step.on .ob-item input[name$=".role"]').first();
      if (size.name === 'desktop' && (await role.count())) {
        const before = await role.inputValue();
        await role.fill(CARD);
        await page.click('[data-next]');
        const name = await role.getAttribute('name');
        const message = await page.textContent(`[data-field="${name}"] .field-error`);
        ok((await page.getAttribute('.ob-step.on', 'data-step')) === id && message.includes('card number'), 'desktop: a card number in a group entry is caught on its step');
        await shot(`${String(i).padStart(2, '0')}-${id}-card-blocked`);
        await role.fill(before);
      }
      await fillStep(page);
      await page.click('[data-next]');
      await page.waitForTimeout(60);
    }
    await shot(`${String(i + 1).padStart(2, '0')}-review`);
    ok(i === form.steps.length, `${size.name}: ${form.steps.length} steps, then the review`);
    ok((await page.locator('[data-agreement]').count()) === (form.agreement ? 1 : 0), `${size.name}: ${form.agreement ? 'terms to accept' : 'no terms to accept'} at the end`);

    if (size.name === 'desktop') {
      // A card number in an ordinary answer stops the send.
      const step = form.steps.findIndex((s) => s.fields.some((f) => f.id === 'brand_notes'));
      if (step >= 0) {
        await page.click(`[data-goto="${step}"]`);
        await page.fill('[name="brand_notes"]', `Card ${CARD}`);
        await page.click('[data-next]');
        ok((await page.textContent('[data-field="brand_notes"] .field-error')).includes('card number'), 'desktop: a card number in an answer is caught on its step');
        await shot('card-blocked');
        await page.fill('[name="brand_notes"]', '');
        while (!(await page.locator('[data-send]').isVisible())) await page.click('[data-next]');
      }

      // A card number in a group entry stops the send.
      await page.evaluate((card) => {
        const input = document.querySelector('.ob-item input[name$=".role"]');
        input.value = card;
      }, CARD);
      await page.click('[data-send]');
      await page.waitForSelector('[data-status]:not([hidden])');
      ok((await page.textContent('[data-status]')).includes('card number'), 'desktop: a card number in a group entry stops the send');
      ok(sent === null, 'desktop: and nothing was sent');
      await page.evaluate((v) => {
        document.querySelector('.ob-item input[name$=".role"]').value = v;
      }, form.steps.flatMap((s) => s.fields).find((f) => f.type === 'group' && f.items?.length)?.items[0].role ?? '');

      // Reload: the passcode again, then the answers are back.
      await page.waitForTimeout(500);
      await page.reload({ waitUntil: 'load' });
      await page.fill('#ob-passcode', passcodes[form.id]);
      await page.click('[data-lock-form] button[type="submit"]');
      await page.waitForSelector('[data-resume]:not([hidden])');
      ok(await page.locator('[data-send]').isVisible(), 'desktop: after a reload and the passcode, the answers and the step are back');
      await shot('resumed');
    }

    await page.click('[data-send]');
    await page.waitForSelector('[data-done]:not([hidden])', { timeout: 15000 });
    await shot(`${String(i + 2).padStart(2, '0')}-sent`);
    ok(sent !== null, `${size.name}: sent (to the intercepted Formspree)`);
    if (sent) {
      const text = Object.entries(sent).map(([k, v]) => `${k}: ${v}`).join('\n');
      ok(sent['Client form'] === `${form.client} (${form.id})`, `${size.name}: the email names the client form`);
      ok(sent._subject.includes(form.client), `${size.name}: the subject names ${form.client}`);
      ok(!('Agreement' in sent) && !('Terms' in sent), `${size.name}: no agreement or terms in the email`);
      ok(form.steps.every((s, k) => `${String(k + 1).padStart(2, '0')}. ${s.title}` in sent || s.fields.every((f) => f.type === 'note')), `${size.name}: every step with questions is in the email`);
      ok(!/\b4111\b/.test(text) && !/password|passcode/i.test(text.replace(/never type a password/gi, '')), `${size.name}: no card number, password or passcode in the email`);
      ok(!text.includes(passcodes[form.id]), `${size.name}: the passcode is not in the email`);
      await writeFile(join(out, `${size.name}-email.txt`), text);
    }
    ok(!errors.length, `${size.name}: no script errors${errors.length ? `: ${errors.join('; ')}` : ''}`);
    await context.close();
  }
}

// The markup drawn in the browser (render.ts) matches Astro's (ObField.astro),
// on every service form: same fields, names, kinds, rules and required marks.
{
  const { build } = await import('esbuild');
  const page = await browser.newPage();
  const shape = (rootSel) =>
    Array.from(document.querySelector(rootSel).querySelectorAll('.ob-step:not(.ob-final), .ob-step:not(.ob-final) [name], .ob-step:not(.ob-final) [data-field], .ob-step:not(.ob-final) [data-kind], .ob-step:not(.ob-final) [data-show-if]'))
      .map((el) => [el.closest('template') ? 'T' : '', el.tagName, el.className, el.getAttribute('name'), el.getAttribute('type'), el.dataset.field, el.dataset.kind, el.dataset.showIf, 'required' in el.dataset, el.getAttribute('value')].join('|'));
  for (const id of ['website-build', 'website-care', 'automation', 'reporting', 'branding', 'audit']) {
    const entry = `import { steps } from './src/onboarding/render.ts'; import t from './src/onboarding/templates/${id}.ts'; import s from './src/content/onboarding.json'; export default steps(t, s.accessEmail, s.files);`;
    const result = await build({ stdin: { contents: entry, resolveDir: root, loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
    const html = (await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)).default;
    await page.goto(`${base}/onboard/${id}/`, { waitUntil: 'load' });
    const astro = await page.evaluate(shape, '[data-onboard-form]');
    await page.evaluate((h) => {
      const holder = document.createElement('div');
      holder.id = 'drawn';
      holder.innerHTML = h;
      document.body.append(holder);
    }, html);
    const drawn = await page.evaluate(shape, '#drawn');
    const diff = astro.findIndex((line, k) => line !== drawn[k]);
    ok(astro.length === drawn.length && diff === -1, `${id}: the browser draws the same ${astro.length} parts as Astro${diff >= 0 ? ` (first difference:\n          astro ${astro[diff]}\n          drawn ${drawn[diff]})` : ''}`);
  }
  await page.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} failed.` : '\nAll passed.');
process.exit(failures.length ? 1 : 0);
