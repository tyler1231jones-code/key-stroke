// Run by `npm run deploy` before anything else, and on its own as
// `npm run ready`.
//
// The site no longer labels its mock content on the page, so this is where
// mock content is stopped: nothing is published while the site is in demo
// mode, while any record is still marked "demo": true, or while the contact
// email, the domain, either Formspree form id or the reCAPTCHA site key is
// still TODO. Lists what has to be replaced.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const content = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content');
const read = (name) => JSON.parse(readFileSync(join(content, name), 'utf8'));
const blockers = [];

const site = read('site.json');
if (site.demo) blockers.push('site.json: "demo" is true. Set it to false once every record below is real.');
const unset = (value) => value === undefined || value === 'TODO' || value === '';
if (unset(site.email)) blockers.push('site.json: "email" is still TODO. It is the fallback shown when a form does not send.');
if (unset(site.domain)) blockers.push('site.json: "domain" is still TODO. Canonical addresses, the sitemap and share images need it.');
const why = {
  formspreeContactId: 'The consultation and Savers forms have nowhere to post.',
  formspreeQuizId: 'The form under the quiz result has nowhere to post.',
  recaptchaSiteKey: 'The forms cannot get a reCAPTCHA token. (The secret key goes into Formspree, never into this project.)',
};
for (const [key, reason] of Object.entries(why)) {
  if (unset(site.forms?.[key])) blockers.push(`site.json: "forms.${key}" is still TODO. ${reason}`);
}

/** Every object marked "demo": true, with a name a person can find it by. */
function demoRecords(value, path, out) {
  if (Array.isArray(value)) value.forEach((v, i) => demoRecords(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    if (value.demo === true) out.push(String(value.id ?? value.name ?? (path || 'the whole file')));
    for (const [k, v] of Object.entries(value)) demoRecords(v, path ? `${path}.${k}` : k, out);
  }
}
for (const file of readdirSync(content).filter((f) => f.endsWith('.json') && f !== 'site.json')) {
  const found = [];
  demoRecords(read(file), '', found);
  if (found.length) blockers.push(`${file}: ${found.length} record${found.length === 1 ? '' : 's'} still marked "demo": true: ${found.map((f) => f.replace(/^\[/, 'row [')).join(', ')}`);
}

const notes = [];
for (const key of ['location', 'serviceArea']) {
  if (unset(site[key])) notes.push(`site.json: "${key}" is still TODO. It stays out of the footer and the structured data until it is set.`);
}
if (unset(site.analyticsToken)) notes.push('site.json: "analyticsToken" is still TODO. No analytics script is loaded until it is set.');
if (site.yearsExperience === 'TODO') notes.push('site.json: "yearsExperience" is still TODO. The experience line stays off the page until it is a number.');

if (blockers.length) {
  console.error('\nNot deploying. This site still carries mock content or missing contact details:\n');
  for (const b of blockers) console.error(`  - ${b}`);
  console.error('\nInvented cases and figures must not go live presented as real work.');
  console.error('Replace each record with a real one and set its "demo" to false, set the');
  console.error('email, the domain and the three form values, then set "demo": false in');
  console.error('site.json. See README, "Go live".\n');
  for (const n of notes) console.error(`  note: ${n}`);
  process.exit(1);
}
for (const n of notes) console.warn(`note: ${n}`);
console.log('Ready to deploy: no demo content, and the email, domain and forms are set.');
