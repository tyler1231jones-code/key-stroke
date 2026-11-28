// npm run client:seal
//
// Seals every client form in clients/ (kept on this computer, never in git)
// into src/onboarding/sealed/, which does go to git: the repository is
// public, so a client form is only ever committed encrypted. README, "Client
// forms", has the whole procedure.
//
//   clients/<name>.ts         one client form, written by hand (see the
//                             ClientForm type in src/onboarding/types.ts)
//   clients/passcodes.json    {"<form id>": "<passcode>"}, written by hand
//   clients/.key              the sealing key, made here the first time
//
// Writes:
//   src/onboarding/sealed/<id>.json   each form, encrypted (AES-256-GCM)
//   src/onboarding/sealed/index.ts    the list the Worker reads
//   clients/cloudflare-secrets.txt    ONBOARD_KEY and ONBOARD_PASSCODES, to
//                                     paste into the Cloudflare dashboard
//   clients/dev.env                   the same, for `npm run client:preview`
//
// Prints no key and no passcode. `node tools/client-seal.mjs --new-id` prints
// a fresh random id for a new form.
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import { checkTemplate } from '../src/onboarding/check.ts';
import { seal, open, newKey } from '../src/onboarding/sealed.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const clients = join(root, 'clients');
const sealedDir = join(root, 'src', 'onboarding', 'sealed');
const settings = JSON.parse(await readFile(join(root, 'src', 'content', 'onboarding.json'), 'utf8'));
const ID = /^[a-z0-9-]{6,64}$/;

if (process.argv.includes('--new-id')) {
  // 16 random bytes, base32-ish in lower case: unguessable, and safe in a link.
  console.log(Array.from(randomBytes(16), (b) => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('').replace(/(.{4})(?!$)/g, '$1-'));
  process.exit(0);
}

await mkdir(clients, { recursive: true });
await mkdir(sealedDir, { recursive: true });

const keyFile = join(clients, '.key');
if (!existsSync(keyFile)) {
  await writeFile(keyFile, newKey() + '\n');
  console.log('Made a new sealing key in clients/.key. Keep a copy in the password manager: without it a form cannot be sealed again.');
}
const key = (await readFile(keyFile, 'utf8')).trim();

const passcodesFile = join(clients, 'passcodes.json');
const passcodes = existsSync(passcodesFile) ? JSON.parse(await readFile(passcodesFile, 'utf8')) : {};

const problems = [];
const forms = [];
for (const name of (await readdir(clients)).filter((n) => n.endsWith('.ts') && !n.startsWith('_')).sort()) {
  const form = (await import(pathToFileURL(join(clients, name)).href + `?t=${Date.now()}`)).default;
  const say = (what) => problems.push(`${name}: ${what}`);
  if (!form || typeof form !== 'object') {
    say('needs `export default` of a client form');
    continue;
  }
  if (!ID.test(form.id ?? '')) say('id must be 6 to 64 lower-case letters, digits and hyphens. `node tools/client-seal.mjs --new-id` makes one');
  if (forms.some((f) => f.id === form.id)) say(`id ${form.id} is used by another form`);
  for (const k of ['client', 'byline', 'name', 'summary', 'time']) if (typeof form[k] !== 'string' || !form[k].trim()) say(`needs ${k}`);
  if (typeof form.agreement !== 'boolean') say('needs agreement: true or false');
  if (form.brand?.logo && !/^data:image\/(png|svg\+xml|jpeg|webp);base64,/.test(form.brand.logo)) say('brand.logo must be a data: URL of an image');
  if (JSON.stringify(form).includes('TODO')) say('still has a TODO in it');
  problems.push(...checkTemplate(form, settings.files.maxFiles).map((p) => `${name}: ${p}`));
  const passcode = passcodes[form.id];
  if (typeof passcode !== 'string' || passcode.trim().length < 12) say(`needs a passcode of 12 characters or more in clients/passcodes.json, under "${form.id}"`);
  forms.push(form);
}
if (problems.length) {
  console.error(`Not sealed. Fix these first:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

// Seal each form. A form that has not changed keeps its sealed file as it is,
// so git shows a change only when the form really changed.
const kept = new Set();
for (const form of forms) {
  const file = join(sealedDir, `${form.id}.json`);
  const json = JSON.stringify(form);
  let same = false;
  if (existsSync(file)) {
    try {
      same = (await open(JSON.parse(await readFile(file, 'utf8')), key)) === json;
    } catch {
      same = false;
    }
  }
  if (!same) await writeFile(file, JSON.stringify(await seal(form.id, json, key)) + '\n');
  kept.add(`${form.id}.json`);
  console.log(`${same ? 'Unchanged' : 'Sealed   '}  ${form.client}  ->  src/onboarding/sealed/${form.id}.json  (link: /onboard/client/#${form.id})`);
}
for (const name of await readdir(sealedDir)) {
  if (name.endsWith('.json') && !kept.has(name)) {
    await rm(join(sealedDir, name));
    console.log(`Removed    src/onboarding/sealed/${name} (no form in clients/ has that id)`);
  }
}

const ids = forms.map((f) => f.id);
const ident = (id) => `form_${id.replace(/-/g, '_')}`;
await writeFile(
  join(sealedDir, 'index.ts'),
  [
    '// Written by `npm run client:seal`. Do not edit by hand.',
    "import type { Sealed } from '../sealed';",
    ...ids.map((id) => `import ${ident(id)} from './${id}.json';`),
    '',
    `export const sealedForms: Record<string, Sealed> = {${ids.length ? '\n' + ids.map((id) => `  '${id}': ${ident(id)} as Sealed,`).join('\n') + '\n' : ''}};`,
    '',
  ].join('\n'),
);

// The two secrets, for the dashboard and for the local preview. Only the forms
// sealed here, so a passcode for a form that is gone stops working.
const live = Object.fromEntries(ids.map((id) => [id, passcodes[id]]));
await writeFile(
  join(clients, 'cloudflare-secrets.txt'),
  [
    'Cloudflare dashboard > Workers & Pages > key-stroke > Settings > Variables and Secrets.',
    'Add each as type Secret, then deploy. Delete this file once they are in.',
    '',
    'ONBOARD_KEY',
    key,
    '',
    'ONBOARD_PASSCODES',
    JSON.stringify(live),
    '',
  ].join('\n'),
);
await writeFile(join(clients, 'dev.env'), `# For npm run client:preview only. Written by npm run client:seal.\nONBOARD_KEY=${key}\nONBOARD_PASSCODES='${JSON.stringify(live)}'\n`);
console.log('Wrote clients/cloudflare-secrets.txt and clients/dev.env (the key and passcodes are in there, not printed here).');
