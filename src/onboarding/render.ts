// A client form, drawn in the browser once its passcode has opened it
// (src/scripts/client-form.ts). The service forms are drawn by Astro
// (ObField.astro and ObInput.astro); this writes the same markup from the
// same template shape, so src/scripts/onboard.ts runs both the same way.
// Keep the two in step: tools/client-test.mjs compares them on a service form.
import type { ClientForm, Field, GroupField, ShowIf, SimpleField, Template } from './types';
import { ACCESS_STATUS } from './types';
import { figureRuns } from '../lib/format';
import type { Definition } from '../scripts/onboard';

export interface Settings {
  accessEmail: string;
  files: { maxFiles: number; maxFileMb: number; maxTotalMb: number };
  formId: string;
  live: boolean;
  termsVersion: string;
  terms: string[];
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const attrs = (a: Record<string, string | number | boolean | undefined>) =>
  Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join('');
const list = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const showIf = (s: ShowIf | undefined) =>
  s ? JSON.stringify(list(s).map((w) => ({ ...w, is: w.is === undefined ? undefined : list(w.is), has: w.has === undefined ? undefined : list(w.has) }))) : undefined;
const optional = (required: boolean | undefined) => (required ? '' : '<span class="opt"> optional</span>');

/** Numerals in the data family, as Fig.astro does. */
export const fig = (text: string) => figureRuns(text).map((r) => (r.fig ? `<span class="fig">${esc(r.text)}</span>` : esc(r.text))).join('');

const TYPES: Record<string, string> = { text: 'text', email: 'email', tel: 'tel', url: 'text', date: 'date', colour: 'color' };

/** ObInput.astro. */
function input(f: SimpleField, name: string, uid: string, wrap: Record<string, string | undefined> = {}, value?: string): string {
  const helpId = f.help ? `${uid}-help` : undefined;
  const errId = `${uid}-error`;
  const describedBy = [helpId, errId].filter(Boolean).join(' ');
  const wide = f.type === 'longtext' || f.wide;
  const v = value ?? f.value;
  let control: string;
  if (f.type === 'longtext') {
    control = `<textarea${attrs({ id: uid, name, rows: f.rows ?? 5, placeholder: f.placeholder, 'aria-describedby': describedBy, 'data-required': f.required ? '' : undefined, 'data-kind': 'longtext' })}>${esc(v ?? '')}</textarea>`;
  } else if (f.type === 'colour') {
    control = `<input${attrs({ id: uid, name, type: 'color', value: v ?? '#0b0d10', class: 'ob-colour', 'aria-describedby': describedBy, 'data-kind': 'colour', 'data-touched': v ? '1' : undefined })} />`;
  } else {
    control = `<input${attrs({
      id: uid,
      name,
      type: TYPES[f.type] ?? 'text',
      inputmode: f.type === 'url' ? 'url' : f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : undefined,
      spellcheck: f.type === 'url' || f.type === 'email' ? 'false' : undefined,
      autocomplete: f.autocomplete,
      placeholder: f.placeholder,
      'aria-describedby': describedBy,
      'data-required': f.required ? '' : undefined,
      'data-kind': f.type,
      value: v,
    })} />`;
  }
  return `<div${attrs({ class: ['field', 'ob-field', wide && 'field-wide'].filter(Boolean).join(' '), 'data-field': name, ...wrap })}>`
    + `<label for="${esc(uid)}">${esc(f.label)}${optional(f.required)}</label>`
    + (f.help ? `<p class="ob-help" id="${esc(helpId)}">${esc(f.help)}</p>` : '')
    + control
    + `<p class="field-error" id="${esc(errId)}" hidden></p></div>`;
}

function groupEntry(f: Extract<Field, { type: 'group' }>, uid: string, n: string, label: string, values: Record<string, string | string[]> = {}, removable = false): string {
  const sub = (g: GroupField) => {
    const name = `${f.id}.${n}.${g.id}`;
    if (g.type === 'multi') {
      const ticked = list(values[g.id]);
      return `<fieldset class="field ob-sub-multi field-wide" data-field="${esc(name)}"><legend>${esc(g.label)}</legend><div class="ob-options">`
        + g.options.map((o) => `<label class="ob-option"><input${attrs({ type: 'checkbox', name, value: o, checked: ticked.includes(o) })} /><span>${esc(o)}</span></label>`).join('')
        + '</div></fieldset>';
    }
    const v = values[g.id];
    return input({ ...g, required: false }, name, `${uid}-${n}-${g.id}`, {}, typeof v === 'string' ? v : undefined);
  };
  return `<div class="ob-item" data-item-index="${esc(n)}"><p class="plate ob-item-label">${esc(f.item)} <span class="fig">${esc(label)}</span></p>`
    + `<div class="form-fields">${f.fields.map(sub).join('')}</div>`
    + (removable ? '<button class="key key-2 ob-remove" type="button" data-remove>Remove</button>' : '')
    + '</div>';
}

/** ObField.astro. */
export function field(f: Field, accessEmail: string, files: Settings['files']): string {
  const uid = `ob-${f.id}`;
  const errId = `${uid}-error`;
  const wrap = { 'data-show-if': showIf(f.showIf) };
  const help = 'help' in f && f.help ? `<p class="ob-help">${esc(f.help)}</p>` : '';
  const required = 'required' in f && Boolean(f.required);
  const error = `<p class="field-error" id="${esc(errId)}" hidden></p>`;

  switch (f.type) {
    case 'note':
      return `<div${attrs({ class: ['ob-note', 'field-wide', f.tone === 'warn' && 'ob-warn', f.tone === 'safe' && 'ob-safe'].filter(Boolean).join(' '), 'data-field': f.id, ...wrap })}>`
        + (f.title ? `<p class="ob-note-title">${esc(f.title)}</p>` : '')
        + (f.text ? `<p>${fig(f.text)}</p>` : '')
        + (f.items?.length ? `<ul class="ticks">${f.items.map((i) => `<li>${fig(i)}</li>`).join('')}</ul>` : '')
        + '</div>';
    case 'choice':
    case 'multi': {
      const options = [...f.options, ...(f.other ? ['Other'] : [])];
      return `<fieldset${attrs({ class: 'field ob-field ob-choice field-wide', 'data-field': f.id, 'data-kind': f.type, 'data-required': required ? '' : undefined, 'aria-describedby': errId, ...wrap })}>`
        + `<legend>${esc(f.label)}${optional(required)}</legend>${help}<div class="ob-options">`
        + options.map((o, i) => `<label class="ob-option"><input${attrs({ type: f.type === 'choice' ? 'radio' : 'checkbox', name: f.id, value: o, id: `${uid}-${i}`, checked: f.type === 'choice' && f.value === o })} /><span>${esc(o)}</span></label>`).join('')
        + '</div>'
        + (f.other ? `<div class="field ob-other" data-other-for="${esc(f.id)}" hidden><label for="${esc(uid)}-other">Other: please say</label><input id="${esc(uid)}-other" name="${esc(f.id)}_other" type="text" /></div>` : '')
        + `${error}</fieldset>`;
    }
    case 'tick':
      return `<div${attrs({ class: 'field ob-field ob-tick field-wide', 'data-field': f.id, 'data-kind': 'tick', 'data-required': required ? '' : undefined, ...wrap })}>`
        + `<label class="ob-option"><input type="checkbox" name="${esc(f.id)}" value="Yes" id="${esc(uid)}" aria-describedby="${esc(errId)}" /><span>${esc(f.label)}</span></label>${help}${error}</div>`;
    case 'file':
      return `<div${attrs({ class: 'field ob-field ob-file field-wide', 'data-field': f.id, 'data-kind': 'file', 'data-max': f.maxFiles, ...wrap })}>`
        + `<label for="${esc(uid)}">${esc(f.label)}${optional(required)}</label>`
        + (f.help ? `<p class="ob-help" id="${esc(uid)}-help">${esc(f.help)}</p>` : '')
        + `<input${attrs({ id: uid, name: f.id, type: 'file', accept: f.accept, multiple: f.maxFiles > 1, 'aria-describedby': `${uid}-help ${uid}-limits ${errId}` })} />`
        + `<p class="ob-help" id="${esc(uid)}-limits">Up to <span class="fig">${f.maxFiles}</span> ${f.maxFiles === 1 ? 'file' : 'files'}, <span class="fig">${files.maxFileMb}</span> MB each. Larger files: use a shared-folder link.</p>`
        + `<ul class="ob-filelist" aria-live="polite"></ul>${error}</div>`;
    case 'group': {
      const items = f.items?.length ? f.items : [{}];
      return `<fieldset${attrs({ class: 'field ob-field ob-group field-wide', 'data-field': f.id, 'data-kind': 'group', 'data-max': f.max, 'data-item': f.item, 'data-required': required ? '' : undefined, 'aria-describedby': errId, ...wrap })}>`
        + `<legend>${esc(f.label)}${optional(required)}</legend>${help}`
        + `<div class="ob-items">${items.map((values, i) => groupEntry(f, uid, String(i), String(i + 1), values, i > 0)).join('')}</div>`
        + `<template data-item-template>${groupEntry(f, uid, '__n__', '__label__', {}, true)}</template>`
        + `<button class="key key-2 ob-add" type="button" data-add>${esc(f.add)}</button>${error}</fieldset>`;
    }
    case 'access':
      return `<fieldset${attrs({ class: 'field ob-field ob-access field-wide', 'data-field': f.id, 'data-kind': 'access', 'data-required': required ? '' : undefined, 'aria-describedby': errId, ...wrap })}>`
        + `<legend>${esc(f.label)}</legend>${help}<ol class="ob-access-steps">`
        + f.steps.map((s) => `<li>${s.split('{access}').map(esc).join(`<strong class="ob-access-email">${esc(accessEmail)}</strong>`)}</li>`).join('')
        + '</ol><p class="ob-help">Do not type passwords or codes into this form.</p><p class="ob-ask">Where are you up to?</p><div class="ob-options">'
        + ACCESS_STATUS.map((o, i) => `<label class="ob-option"><input type="radio" name="${esc(f.id)}" value="${esc(o)}" id="${esc(uid)}-${i}" /><span>${esc(o)}</span></label>`).join('')
        + `</div><div class="field"><label for="${esc(uid)}-note">Anything we should know <span class="opt">optional</span></label><p class="ob-help">Such as the account name, or the address you added us from.</p><input id="${esc(uid)}-note" name="${esc(f.id)}_note" type="text" /></div>${error}</fieldset>`;
    default:
      return input(f, f.id, uid, wrap);
  }
}

/** Every step of a form, as [...service].astro writes them before the final step. */
export function steps(t: Template, accessEmail: string, files: Settings['files']): string {
  return t.steps
    .map((step, i) =>
      `<fieldset${attrs({ class: i === 0 ? 'ob-step on' : 'ob-step', 'data-step': step.id, 'data-show-if': showIf(step.showIf) })}>`
      + `<legend class="display-l ob-step-title" tabindex="-1">${esc(step.title)}.</legend>`
      + (step.intro ? `<p class="body ob-step-intro">${fig(step.intro)}</p>` : '')
      + `<div class="form-fields">${step.fields.map((f) => field(f, accessEmail, files)).join('')}</div></fieldset>`,
    )
    .join('');
}

/** What the page script needs to write the email, as [...service].astro builds it. */
export function definitionOf(t: Template | ClientForm, s: Settings): Definition {
  const client = 'client' in t ? t : null;
  return {
    id: t.id,
    name: t.name,
    formId: s.formId,
    live: s.live,
    files: s.files,
    termsVersion: s.termsVersion,
    terms: s.terms,
    client: client?.client,
    agreement: client ? client.agreement : true,
    steps: t.steps.map((step) => ({
      id: step.id,
      title: step.title,
      fields: step.fields
        .filter((f) => f.type !== 'note')
        .map((f) => ({
          id: f.id,
          type: f.type,
          label: 'label' in f ? f.label : '',
          item: f.type === 'group' ? f.item : undefined,
          fields: f.type === 'group' ? f.fields.map((g) => ({ id: g.id, label: g.label, type: g.type })) : undefined,
        })),
    })),
  };
}
