// The checks every onboarding form must pass: the service forms on every
// build (index.ts), and each client form when it is sealed
// (tools/client-seal.mjs, which loads this file directly with Node, so it
// uses only syntax Node can strip: type imports and annotations).
import type { Field, Template, When } from './types';

const SECRET = /\b(password|passcode|passphrase|pin|api key|secret|authori[sz]ation code|epp code|security code|card number)\b/i;
const ID = /^[a-z][a-z0-9_]*$/;
const list = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** What is wrong with a form, one line each. An empty list means it is fine. */
export function checkTemplate(t: Template, maxFiles: number): string[] {
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
        const allowed = [...target.options, ...('other' in target && target.other ? ['Other'] : [])];
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
      if (f.type !== 'note' && f.type !== 'access' && SECRET.test(f.label)) say(where, 'looks like it asks for a password, code or card. Use an access block instead');
      if (f.type === 'note' && !f.text && !f.title && !f.items?.length) say(where, 'a note needs some text');
      if (f.type === 'file') files += f.maxFiles;
      if ((f.type === 'choice' || f.type === 'multi') && new Set(f.options).size !== f.options.length) say(where, 'a choice is listed twice');
      if (f.type === 'choice' && f.value !== undefined && !f.options.includes(f.value)) say(where, `is filled in with "${f.value}", which is not one of its choices`);
      if (f.type === 'group') {
        const sub = new Set<string>();
        for (const g of f.fields) {
          if (!ID.test(g.id) || sub.has(g.id)) say(`${where}, "${g.id}"`, 'needs a unique id of lower-case letters, digits and underscores');
          if (SECRET.test(g.label)) say(`${where}, "${g.id}"`, 'looks like it asks for a password, code or card');
          sub.add(g.id);
        }
        for (const item of f.items ?? []) for (const key of Object.keys(item)) if (!sub.has(key)) say(where, `a filled-in entry names "${key}", which is not one of its fields`);
        if ((f.items?.length ?? 0) > f.max) say(where, `fills in more entries than its maximum of ${f.max}`);
      }
      seen.set(f.id, f);
    }
  }
  if (files > maxFiles) say('uploads', `allows ${files} files in all; Formspree takes ${maxFiles} a submission`);
  if (!t.next.length) say('next', 'say what happens after sending');
  return problems;
}
