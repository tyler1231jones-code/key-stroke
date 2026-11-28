// npm run blog:build -- --drafts | --fixtures
//
// Builds the site with more posts than an ordinary build shows:
//   --drafts    every post in src/content/blog/, drafts included, for a
//               read-through before a post is published. Drafts carry noindex.
//   --fixtures  the test posts in tools/fixtures/blog/ instead of the real
//               ones, so the blog's pages and checks can be tried before any
//               real post exists.
// Neither build is for pushing. Run an ordinary `npm run build` afterwards,
// and `npm run og` too if the share images were made from this build.
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const astro = join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');
const args = process.argv.slice(2);
const env = { ...process.env };
if (args.includes('--drafts')) env.BLOG_DRAFTS = '1';
if (args.includes('--fixtures')) env.BLOG_FIXTURES = '1';
if (!env.BLOG_DRAFTS && !env.BLOG_FIXTURES) {
  console.error('Say which: --drafts or --fixtures.');
  process.exit(1);
}
const result = spawnSync(process.execPath, [astro, 'build'], { cwd: root, stdio: 'inherit', env });
process.exit(result.status ?? 1);
