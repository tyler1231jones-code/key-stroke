// Run by `npm run deploy` before anything else, and on its own as
// `npm run ready`.
//
// The site no longer labels its mock content on the page, so this is where
// mock content is stopped: nothing is published while the site is in demo
// mode, while any record is still marked "demo": true, or while the contact
// email or the booking link is still TODO. Lists what has to be replaced.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const content = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content');
const read = (name) => JSON.parse(readFileSync(join(content, name), 'utf8'));
const blockers = [];

const site = read('site.json');
if (site.demo) blockers.push('site.json: "demo" is true. Set it to false once every record below is real.');
for (const key of ['email', 'bookingUrl']) {
  if (site[key] === 'TODO' || site[key] === '') blockers.push(`site.json: "${key}" is still TODO. "Book the audit" has nowhere to send people.`);
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
if (site.domain === 'TODO') notes.push('site.json: "domain" is still TODO. Set it once the domain is attached in Cloudflare.');
if (site.yearsExperience === 'TODO') notes.push('site.json: "yearsExperience" is still TODO. The experience line stays off the page until it is a number.');

if (blockers.length) {
  console.error('\nNot deploying. This site still carries mock content or missing contact details:\n');
  for (const b of blockers) console.error(`  - ${b}`);
  console.error('\nInvented cases and figures must not go live presented as real work.');
  console.error('Replace each record with a real one and set its "demo" to false, set the');
  console.error('email and booking link, then set "demo": false in site.json. See README, "Go live".\n');
  for (const n of notes) console.error(`  note: ${n}`);
  process.exit(1);
}
for (const n of notes) console.warn(`note: ${n}`);
console.log('Ready to deploy: no demo content, contact details set.');
