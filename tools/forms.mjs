// npm run forms
//
// Fills and sends every enquiry form on the built site with the keyboard
// alone, and prints the payload each one produced. While the Formspree ids
// and the reCAPTCHA site key are TODO the forms are in development mode, so
// nothing leaves the machine: the payload is what the form logs to the
// console. Also checks that an empty form is stopped with messages, that no
// request goes to Formspree or Google before a form is approached, and that
// the thank-you takes the form's place.
//
// Exits 1 if a form does not behave.
import { serve, launch } from './shots.mjs';

const problems = [];
const bad = (s) => { problems.push(s); console.log(`  FAIL ${s}`); };
const { server, url } = await serve();
const browser = await launch();

async function open(route, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const payloads = [];
  const external = [];
  page.on('console', async (m) => {
    if (!m.text().includes('[KEYSTROKE form')) return;
    const args = m.args();
    payloads.push(args.length > 1 ? await args[1].jsonValue() : null);
  });
  page.on('request', (r) => { if (/formspree\.io|google\.com\/recaptcha|gstatic\.com\/recaptcha/.test(r.url())) external.push(r.url()); });
  await page.goto(url + route, { waitUntil: 'networkidle' });
  return { context, page, payloads, external };
}

/** Tab to a field and type into it: the keyboard alone, no clicks. */
async function tabTo(page, selector, max = 80) {
  for (let i = 0; i < max; i++) {
    if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) return true;
    await page.keyboard.press('Tab');
  }
  return false;
}

async function fillAndSend(page, formId, label) {
  const sel = (name) => `#${formId} [name="${name}"]`;
  if (!(await tabTo(page, sel('name')))) return bad(`${label}: tabbing never reached the name field`);
  // An empty form is stopped, with a message beside each field that needs one.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const errors = await page.locator(`#${formId} .field-error:not([hidden])`).allTextContents();
  if (errors.length !== 2) bad(`${label}: an empty form showed ${errors.length} messages, expected 2`);
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('name'));
  if (focused !== 'name') bad(`${label}: focus went to "${focused}" after an empty submit, expected the name field`);
  await page.keyboard.type('Test Person');
  await page.keyboard.press('Tab');
  await page.keyboard.type('test.person@example.com');
  await page.keyboard.press('Tab');
  await page.keyboard.type('0400 000 000');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Example Pty Ltd');
  await page.keyboard.press('Tab'); // the service select: leave it as it arrived
  await page.keyboard.press('Tab');
  await page.keyboard.type('We retype every invoice.');
  await page.keyboard.press('Tab'); // the submit button
  const onButton = await page.evaluate((id) => document.activeElement?.closest('form')?.id === id && document.activeElement?.matches('.form-submit'), formId);
  if (!onButton) bad(`${label}: the submit button is not the next tab stop after the message`);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  const thanks = await page.locator(`#${formId}`).evaluate((f) => {
    const t = f.closest('[data-form-wrap]')?.querySelector('.form-thanks');
    return { formHidden: f.hidden, thanksShown: t ? !t.hidden : false, focusOnThanks: document.activeElement === t };
  });
  if (!thanks.formHidden || !thanks.thanksShown) bad(`${label}: the thank-you did not take the form's place`);
  if (!thanks.focusOnThanks) bad(`${label}: focus did not move to the thank-you`);
}

function report(label, payloads, expect) {
  const p = payloads.at(-1);
  if (!p) return bad(`${label}: no payload was produced`);
  console.log(`\n${label}`);
  for (const [k, v] of Object.entries(p)) console.log(`  ${k}: ${String(v).replace(/\n/g, ' / ')}`);
  for (const [k, test] of Object.entries(expect)) {
    if (!test(p[k])) bad(`${label}: field "${k}" is wrong: ${JSON.stringify(p[k])}`);
  }
}
const base = {
  name: (v) => v === 'Test Person',
  email: (v) => v === 'test.person@example.com',
  'g-recaptcha-response': (v) => typeof v === 'string' && v.length > 0,
  _gotcha: (v) => v === '',
};

/* Consultation, on /contact, arriving from a service page */
{
  const { context, page, payloads, external } = await open('/contact?service=reporting');
  if (external.length) bad(`/contact: requests before the form was touched: ${external.join(', ')}`);
  await fillAndSend(page, 'contact-form', 'Consultation, /contact');
  report('Consultation, /contact?service=reporting', payloads, { ...base, page: (v) => v === '/contact', service: (v) => v === 'Reporting and dashboards', plan: (v) => v === '' });
  await context.close();
}

/* Consultation, in the booking block on /audit */
{
  const { context, page, payloads, external } = await open('/audit');
  if (external.length) bad(`/audit: requests on page load: ${external.join(', ')}`);
  await fillAndSend(page, 'audit-form', 'Consultation, /audit');
  report('Consultation, /audit', payloads, { ...base, page: (v) => v === '/audit', service: (v) => v === 'Not sure yet' });
  await context.close();
}

/* Savers, with a plan chosen from its card */
{
  const { context, page, payloads } = await open('/savers');
  await tabTo(page, '[data-plan="Run"]');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await fillAndSend(page, 'savers-form', 'Savers');
  report('Savers, plan chosen: Run', payloads, { ...base, page: (v) => v === '/savers', plan: (v) => v === 'Run' });
  await context.close();
}

/* Quiz: nothing is sent until the form under the result is sent */
{
  const { context, page, payloads, external } = await open('/quiz#r=a.c.ab.c.d.c.c.a.b');
  await page.waitForTimeout(400);
  if (payloads.length) bad('Quiz: a payload was produced before the form was sent');
  if (external.length) bad(`Quiz: requests before the form was touched: ${external.join(', ')}`);
  const order = await page.evaluate(() => {
    const result = document.getElementById('quiz-result');
    const form = document.getElementById('quiz-contact');
    return result && form ? Boolean(result.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
  });
  if (!order) bad('Quiz: the form is not below the result');
  await fillAndSend(page, 'quiz-contact', 'Quiz');
  report('Quiz result', payloads, {
    ...base,
    page: (v) => v === '/quiz',
    quiz_answers: (v) => typeof v === 'string' && v.split('\n').length === 9,
    quiz_recommended: (v) => typeof v === 'string' && v.includes('1.'),
    quiz_result: (v) => typeof v === 'string' && v.includes('#r=a.c.ab.c.d.c.c.a.b'),
  });
  await context.close();
}

await browser.close();
server.close();
if (problems.length) {
  console.log(`\n${problems.length} problem(s).`);
  process.exit(1);
}
console.log('\nforms passed.');
