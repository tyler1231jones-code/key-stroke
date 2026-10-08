// Every onboarding form, in the order /onboard lists them, and the checks
// that stop the build when a template has a mistake in it. To add a form,
// write its template in templates/ and add it to the list below.
import settings from '../content/onboarding.json';
import site from '../content/site.json';
import type { Field, Template, When } from './types';
import websiteBuild from './templates/website-build';
import websiteCare from './templates/website-care';
import automation from './templates/automation';
import reporting from './templates/reporting';
import branding from './templates/branding';
import audit from './templates/audit';

export const templates: Template[] = [websiteBuild, websiteCare, automation, reporting, branding, audit];
export const onboarding = settings;

const isSet = (v: unknown) => typeof v === 'string' && v !== '' && v !== 'TODO';
/** The Formspree form that receives every onboarding submission. */
export const onboardFormId: string = (site.forms as Record<string, string>).formspreeOnboardId ?? 'TODO';
/** The forms send for real only with their Formspree id and the reCAPTCHA site key set. */
export const onboardLive = isSet(onboardFormId) && isSet(site.forms.recaptchaSiteKey);
/**
 * The pages are built only once the Formspree form exists, so a client can
 * never reach a form that would not send. `npm run build:onboard` builds them
 * anyway, for a look on this computer.
 */
export const onboardBuilt = onboardLive || process.env.ONBOARD_PREVIEW === '1';

/* ---------- Checks, run on every build ---------- */
const SECRET = /\b(password|passcode|passphrase|pin|api key|secret|authori[sz]ation code|epp code|security code)\b/i;
const ID = /^[a-z][a-z0-9_]*$/;
const list = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

function check(t: Template): string[] {
  const problems: string[] = [];
  const seen = new Map<string, Field>();
  let files = 0;
  const say = (where: string, what: string) => problems.push(`${t.id}, ${where}: ${what}`);

  const checkWhen = (where: string, conditions: When[]) => {
    for (const c of conditions) {
      const target = seen.get(c.field);
      if (!target) {
        say(where, `shows only when "${c.field}" matches, but no earlier field has that id`);
        continue;
      }
      const wanted = [...list(c.is), ...list(c.has)];
      if (wanted.length && 'options' in target) {
        const allowed = [...target.options, ...(target.other ? ['Other'] : [])];
        for (const w of wanted) if (!allowed.includes(w)) say(where, `waits for "${w}", which is not one of the choices in "${c.field}"`);
      }
    }
  };

  if (!ID.test(t.id.replace(/-/g, '_'))) say('id', 'use lower-case letters, digits and hyphens');
  const stepIds = new Set<string>();
  for (const step of t.steps) {
    if (stepIds.has(step.id)) say(step.id, 'two steps share this id');
    stepIds.add(step.id);
    checkWhen(`step "${step.id}"`, list(step.showIf));
    for (const f of step.fields) {
      const where = `field "${f.id}"`;
      if (!ID.test(f.id)) say(where, 'ids use lower-case letters, digits and underscores');
      if (seen.has(f.id)) say(where, 'two fields share this id');
      checkWhen(where, list(f.showIf));
      if (f.type !== 'note' && f.type !== 'access' && SECRET.test(f.label)) say(where, 'looks like it asks for a password or code. Use an access block instead');
      if (f.type === 'file') files += f.maxFiles;
      if ((f.type === 'choice' || f.type === 'multi') && new Set(f.options).size !== f.options.length) say(where, 'a choice is listed twice');
      if (f.type === 'group') {
        const sub = new Set<string>();
        for (const g of f.fields) {
          if (!ID.test(g.id) || sub.has(g.id)) say(`${where}, "${g.id}"`, 'needs a unique id of lower-case letters, digits and underscores');
          if (SECRET.test(g.label)) say(`${where}, "${g.id}"`, 'looks like it asks for a password or code');
          sub.add(g.id);
        }
      }
      seen.set(f.id, f);
    }
  }
  if (files > settings.files.maxFiles) say('uploads', `allows ${files} files in all; Formspree takes ${settings.files.maxFiles} a submission`);
  if (!t.next.length) say('next', 'say what happens after sending');
  return problems;
}

const problems = [
  ...templates.flatMap(check),
  ...(new Set(templates.map((t) => t.id)).size !== templates.length ? ['two templates share an id'] : []),
];
if (problems.length) throw new Error(`Onboarding templates need fixing:\n- ${problems.join('\n- ')}`);
