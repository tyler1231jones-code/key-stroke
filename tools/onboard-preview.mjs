// npm run build:onboard
//
// Builds the site with the onboarding forms included even though
// forms.formspreeOnboardId in site.json is still TODO, so they can be looked
// at and tested on this computer. In that state the forms send nothing: they
// print what they would have sent to the browser console. A normal
// `npm run build` (and Cloudflare's build) leaves them out until the id is set.
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const astro = join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');
const result = spawnSync(process.execPath, [astro, 'build'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, ONBOARD_PREVIEW: '1' },
});
process.exit(result.status ?? 1);
