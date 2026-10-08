// The shape of an onboarding form. Each service has one template file in
// templates/, written with defineTemplate() so the editor checks it as you
// type. README.md, "Onboarding forms", says how to add or change one.

/**
 * Show a field or a step only when an earlier answer matches.
 *   { field: 'has_site', is: 'Yes' }             a choice is one of these
 *   { field: 'site_features', has: 'Online shop' } a multiple choice includes one of these
 *   { field: 'site_url', filled: true }          anything was entered
 *   { field: 'same_person', ticked: true }       a single tick is ticked
 * A list means all of them must hold.
 */
export interface When {
  field: string;
  is?: string | string[];
  has?: string | string[];
  filled?: boolean;
  ticked?: boolean;
}
export type ShowIf = When | When[];

interface Common {
  /** Unique within the whole form, letters, digits and underscores. Never rename one once clients use the form. */
  id: string;
  label: string;
  help?: string;
  required?: boolean;
  showIf?: ShowIf;
  /** Take the full width on a wide screen. Long text, choices and groups always do. */
  wide?: boolean;
}

export type SimpleField =
  | (Common & { type: 'text' | 'email' | 'tel' | 'url' | 'date'; placeholder?: string; autocomplete?: string })
  | (Common & { type: 'longtext'; rows?: number; placeholder?: string })
  | (Common & { type: 'colour' });

export type Field =
  | SimpleField
  /** One answer from a list. `other` adds "Other" with a box to type in. */
  | (Common & { type: 'choice'; options: string[]; other?: boolean })
  /** Any number of answers from a list. */
  | (Common & { type: 'multi'; options: string[]; other?: boolean })
  /** A single tick box. */
  | (Common & { type: 'tick' })
  /** File upload. `accept` as in HTML, for example ".pdf,.png". Every upload also offers a box for a shared-folder link. */
  | (Common & { type: 'file'; accept: string; maxFiles: number })
  /** A repeatable set of fields, such as team members. `add` is the button, `item` names one entry. */
  | (Common & { type: 'group'; fields: SimpleField[]; max: number; add: string; item: string })
  /**
   * How to give us access to an account. `steps` are shown as a numbered list;
   * {access} becomes the access address in onboarding.json. The client answers
   * Done, Later or Not possible. Never a password field.
   */
  | (Common & { type: 'access'; steps: string[] })
  /** Text shown in the form, not a question. */
  | { type: 'note'; id: string; text: string; tone?: 'warn'; showIf?: ShowIf };

export interface Step {
  id: string;
  title: string;
  intro?: string;
  fields: Field[];
  showIf?: ShowIf;
}

export interface Template {
  /** The address: /onboard/<id>. */
  id: string;
  name: string;
  /** One sentence at the top of the form. */
  summary: string;
  /** How long it takes, roughly, in words. */
  time: string;
  /** What to have to hand before starting. */
  bring: string[];
  steps: Step[];
  /** Shown after sending: what happens next. */
  next: string[];
}

export const defineTemplate = (template: Template): Template => template;

/** The choices every access block offers. */
export const ACCESS_STATUS = ['Done', 'I will do it later', 'I cannot do this: please call me'] as const;
