// Every onboarding form, in the order /onboard lists them, and the checks
// that stop the build when a template has a mistake in it. To add a form,
// write its template in templates/ and add it to the list below.
import settings from '../content/onboarding.json';
import site from '../content/site.json';
import type { Template } from './types';
import { checkTemplate } from './check';
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

/* ---------- Checks, run on every build (check.ts) ---------- */
const problems = [
  ...templates.flatMap((t) => checkTemplate(t, settings.files.maxFiles)),
  ...(new Set(templates.map((t) => t.id)).size !== templates.length ? ['two templates share an id'] : []),
  // /onboard/client is the page for client forms.
  ...(templates.some((t) => t.id === 'client') ? ['no template may have the id "client"'] : []),
];
if (problems.length) throw new Error(`Onboarding templates need fixing:\n- ${problems.join('\n- ')}`);
