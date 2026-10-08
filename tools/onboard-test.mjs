// node tools/onboard-test.mjs   (after `npm run build`, or `npm run build:onboard`)
//
// Fills in every onboarding form in a real browser, the way a client would,
// and presses Send. Nothing reaches Formspree or Google: both are intercepted
// here (stubNetwork), so this never puts a test in the enquiries inbox.
// Checks on the website build form:
//   - an empty required field stops Next, with a message
//   - questions show and hide as answers change (current site, platform,
//     hosting, domain access, email at a web host)
//   - a repeatable group adds an entry, and a file attaches
//   - answers survive a reload on the same device
//   - an answer that looks like a password stops the send
// Every form's payload, as it would reach Formspree, is written to
// shots/onboard/<form>.json and the email text to shots/onboard/<form>.txt.
// Screenshots of the website build form at desktop and phone size go to
// shots/onboard/ as well. Exits 1 if anything fails.
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch } from './shots.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'shots', 'onboard');
await mkdir(out, { recursive: true });

const FORMS = ['website-build', 'website-care', 'automation', 'reporting', 'branding', 'audit'];
const failures = [];
const ok = (cond, what) => {
  if (!cond) failures.push(what);
  console.log(`${cond ? '  ok  ' : '  FAIL'} ${what}`);
};

const { server, url } = await serve();
const browser = await launch();

/** Fill whatever is visible and empty on the current step with plausible test answers. */
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
          if (!radios.some((r) => r.checked)) {
            radios[0].checked = true;
            fire(radios[0]);
          }
        } else if (kind === 'multi') {
          const boxes = inputs.filter((i) => i.type === 'checkbox' && i.value !== 'Other');
          if (!boxes.some((b) => b.checked)) boxes.slice(0, 2).forEach((b) => ((b.checked = true), fire(b)));
        } else if (kind === 'tick') {
          if (!inputs[0].checked) (inputs[0].checked = true), fire(inputs[0]);
        } else if (kind === 'file' || kind === 'colour' || kind === 'group') {
          // Files are attached by the test itself; groups fill through their own text fields.
        } else {
          const i = inputs[0];
          if (!i || i.value) continue;
          i.value = { email: 'sam@example.com', tel: '0400 000 000', url: 'example.com.au', date: '2026-11-30', longtext: `Test answer: ${w.querySelector('label')?.textContent?.trim()}` }[kind] ?? `Test ${i.name}`;
          fire(i);
        }
      }
    });
  }
}

async function goToSend(page, limit = 20) {
  for (let i = 0; i < limit; i++) {
    if (await page.locator('[data-send]').isVisible()) return true;
    await fillStep(page);
    await page.locator('[data-next]').click();
    await page.waitForTimeout(80);
  }
  return false;
}

// textContent, not innerText: the titles are set in capitals by CSS.
/**
 * Nothing leaves this computer. Google's reCAPTCHA script is replaced by a
 * stand-in that hands out "test-token", and every request to Formspree is
 * answered here with a success, after reading what it would have sent.
 */
async function stubNetwork(context, onSend) {
  await context.route(/https:\/\/www\.(google|gstatic)\.com\/recaptcha\/.*/, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: 'window.grecaptcha={ready:function(cb){cb()},execute:function(){return Promise.resolve("test-token")}};' }),
  );
  await context.route(/https:\/\/formspree\.io\/.*/, async (route) => {
    const request = route.request();
    onSend(parseMultipart(request.postDataBuffer() ?? Buffer.alloc(0), request.headers()['content-type'] ?? ''));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
}

function parseMultipart(buffer, contentType) {
  const boundary = contentType.match(/boundary=(.+)$/)?.[1];
  if (!boundary) return {};
  const out = {};
  for (const part of buffer.toString('utf8').split(`--${boundary}`).slice(1, -1)) {
    const at = part.indexOf('\r\n\r\n');
    const head = part.slice(0, at);
    const body = part.slice(at + 4).replace(/\r\n$/, '');
    const name = head.match(/name="([^"]*)"/)?.[1];
    const file = head.match(/filename="([^"]*)"/)?.[1];
    if (name) out[name] = file ? `(file) ${file}` : body;
  }
  return out;
}

const stepTitle = (page) => page.locator('.ob-step.on > legend.ob-step-title').textContent();

for (const id of FORMS) {
  console.log(`\n${id}`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  let payload = null;
  let live = false;
  await stubNetwork(context, (sent) => {
    payload = sent;
    live = true;
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', async (msg) => {
    if (msg.text().includes('onboarding: development mode')) payload = await msg.args()[1]?.jsonValue();
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto(`${url}/onboard/${id}`);
  ok((await page.locator('h1').count()) === 1, 'one h1');
  ok((await page.locator('meta[name="robots"]').getAttribute('content'))?.includes('noindex'), 'noindex');
  ok(await page.locator('.ob-step.on').isVisible(), 'the first step shows');
  ok(!(await page.locator('[data-send]').isVisible()), 'Send waits for the last step');

  if (id === 'website-build') {
    // An empty required field stops Next.
    const first = await stepTitle(page);
    await page.locator('[data-next]').click();
    ok((await stepTitle(page)) === first, 'Next with empty required fields stays on the step');
    ok(await page.locator('.ob-step.on .field-error:not([hidden])').first().isVisible(), 'and says what is missing');
    await page.screenshot({ path: join(out, 'website-build-desktop-1-start.png'), fullPage: false });
    await fillStep(page);
    await page.locator('[data-next]').click();

    // The current website: show and hide.
    ok((await stepTitle(page)).startsWith('Your current website'), 'step 2 is the current website');
    ok(!(await page.locator('[data-field="site_url"]').isVisible()), 'site questions wait for "Do you have a website now?"');
    await page.getByLabel('Yes', { exact: true }).first().check();
    ok(await page.locator('[data-field="site_url"]').isVisible(), 'the address appears after Yes');
    await page.locator('[name="site_url"]').fill('oldsite.com.au');
    await page.locator('[data-field="platform"]').getByLabel('Wix', { exact: true }).check();
    ok(!(await page.locator('[data-field="host"]').isVisible()), 'no hosting questions for Wix');
    ok(!(await page.locator('[data-field="access_host"]').isVisible()), 'no hosting access for Wix');
    await page.locator('[data-field="platform"]').getByLabel('WordPress', { exact: true }).check();
    ok(await page.locator('[data-field="host"]').isVisible(), 'hosting questions for WordPress');
    ok(await page.locator('[data-field="access_host"]').isVisible(), 'hosting access for WordPress');
    ok((await page.locator('[data-field="access_site"]').innerText()).includes('tyler@key-stroke.com.au'), 'access steps name the access address');
    await page.locator('[data-field="site_does"]').getByLabel('Online shop or payments').check();
    ok(await page.locator('[data-field="shop_detail"]').isVisible(), 'shop questions after ticking a shop');
    await page.screenshot({ path: join(out, 'website-build-desktop-2-site.png'), fullPage: true });
    await fillStep(page);
    await page.locator('[data-next]').click();

    // The domain.
    ok((await stepTitle(page)).startsWith('Your domain'), 'step 3 is the domain');
    await page.locator('[data-field="has_domain"]').getByLabel('Yes', { exact: true }).check();
    await page.locator('[name="domain_main"]').fill('oldsite.com.au');
    await page.locator('[data-field="domain_how"]').getByLabel('Move the domain to an account in your name that we manage').check();
    ok(await page.locator('[data-field="transfer_note"]').isVisible(), 'transfer note: no code typed here');
    ok(!(await page.locator('[data-field="access_domain"]').isVisible()), 'no delegate block for a transfer');
    await page.locator('[data-field="domain_how"]').getByLabel('Add us as a user on the domain account (recommended)').check();
    ok(await page.locator('[data-field="access_domain"]').isVisible(), 'delegate block for added access');
    await page.locator('[data-field="access_domain"]').getByLabel('Done', { exact: true }).check();
    await page.locator('[name="access_domain_note"]').fill('Added from the VentraIP account');
    await fillStep(page);
    await page.locator('[data-next]').click();

    // Email at the domain.
    ok((await stepTitle(page)).startsWith('Email at your domain'), 'step 4 is email');
    await page.locator('[data-field="uses_mail"]').getByLabel('Yes', { exact: true }).check();
    await page.locator('[data-field="mail_provider"]').getByLabel('Our web host (webmail or cPanel email)').check();
    ok(await page.locator('[data-field="mail_host_warning"]').isVisible(), 'warning when email lives with the web host');
    await page.locator('[data-field="mail_senders"]').getByLabel('Xero').check();
    await page.locator('[data-field="mail_senders"]').getByLabel('Other', { exact: true }).check();
    ok(await page.locator('[data-other-for="mail_senders"]').isVisible(), '"Other" asks what it is');
    await page.locator('[name="mail_senders_other"]').fill('Tradify invoices');

    // Answers survive a reload.
    await page.waitForTimeout(600);
    await page.reload();
    ok(await page.locator('[data-resume]').isVisible(), 'after a reload, the answers come back');
    ok((await stepTitle(page)).startsWith('Email at your domain'), 'and the same step opens');
    ok((await page.locator('[name="mail_senders_other"]').inputValue()) === 'Tradify invoices', 'with what was typed');
    await fillStep(page);
    await page.locator('[data-next]').click();

    // Through to content: a file and a repeatable group.
    for (let i = 0; i < 6 && !(await stepTitle(page)).startsWith('Content and brand'); i++) {
      await fillStep(page);
      await page.locator('[data-next]').click();
    }
    ok((await stepTitle(page)).startsWith('Content and brand'), 'reached content and brand');
    await page.locator('[data-field="brand_state"]').getByLabel('We have a logo and brand colours').check();
    await page.locator('[name="logo_files"]').setInputFiles({ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') });
    ok((await page.locator('[data-field="logo_files"] .ob-filelist li').count()) === 1, 'a chosen file is listed');
    await page.locator('[data-field="brand_colours"] [data-add]').click();
    ok((await page.locator('[data-field="brand_colours"] .ob-item').count()) === 2, 'Add a colour adds an entry');
    await page.locator('[name="brand_colours.0.name"]').fill('Navy');
    await page.locator('[name="brand_colours.1.name"]').fill('Signal orange');
    await page.locator('[name="liked_sites.0.url"]').fill('example.org');
    await page.locator('[name="liked_sites.0.why"]').fill('Clear prices.');
    await fillStep(page);
    await page.locator('[data-next]').click();
    await fillStep(page);
    await page.locator('[name="anything_else"]').fill('Our hosting password: hunter2');
    await page.locator('[data-next]').click();
    ok(await page.locator('[data-send]').isVisible(), 'the last step is check and send');
    await page.screenshot({ path: join(out, 'website-build-desktop-3-review.png'), fullPage: true });
    await fillStep(page);
    await page.locator('[data-send]').click();
    await page.waitForTimeout(300);
    ok((await page.locator('[data-status]').innerText()).includes('password'), 'a typed password stops the send');
    ok(payload === null, 'and nothing was sent');
    await page.locator('.ob-review [data-goto]').last().click();
    await page.locator('[name="anything_else"]').fill('Please keep the old blog posts.');
    await page.locator('[data-next]').click();
  }

  ok(await goToSend(page), 'reaches the last step');
  await fillStep(page);
  await page.locator('[data-send]').click();
  await page.waitForTimeout(900);
  ok(await page.locator('[data-done]').isVisible(), 'the thank-you shows after Send');
  ok(payload !== null, 'a payload was built');
  if (payload) {
    ok(payload._subject?.startsWith('Onboarding: '), 'subject names the form');
    ok(payload.Agreement === 'Accepted' && payload['Accepted by'], 'the agreement is recorded');
    ok(Object.keys(payload).some((k) => /^\d\d\. /.test(k)), 'answers arrive one field per step');
    ok(!Object.values(payload).some((v) => typeof v === 'string' && /hunter2/.test(v)), 'no password in the payload');
    if (live) ok(payload['g-recaptcha-response'] === 'test-token', 'sent to Formspree with a reCAPTCHA token (intercepted here)');
    await writeFile(join(out, `${id}.json`), JSON.stringify(payload, null, 2));
    const text = Object.entries(payload).map(([k, v]) => `${k}:\n${v}`).join('\n\n');
    await writeFile(join(out, `${id}.txt`), text);
  }
  ok(errors.length === 0, `no script errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

// The website build form on a phone.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${url}/onboard/website-build`);
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(width <= 390, `no sideways scroll on a phone (${width}px)`);
  await page.screenshot({ path: join(out, 'website-build-phone-1-start.png') });
  await fillStep(page);
  await page.locator('[data-next]').click();
  await page.getByLabel('Yes', { exact: true }).first().check();
  await page.locator('[data-field="platform"]').getByLabel('WordPress', { exact: true }).check();
  await page.locator('[data-field="access_site"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(out, 'website-build-phone-2-access.png') });
  const wide = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(wide <= 390, `still no sideways scroll with every site question open (${wide}px)`);
  await context.close();
}
// The list of forms.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${url}/onboard`);
  ok((await page.locator('.ob-index li').count()) === FORMS.length, 'the list shows every form');
  await page.screenshot({ path: join(out, 'index-desktop.png'), fullPage: true });
  await context.close();
}

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} failed.` : '\nAll onboarding checks passed.');
process.exit(failures.length ? 1 : 0);
