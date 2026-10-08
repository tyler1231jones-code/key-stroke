# KEYSTROKE website

A scroll-driven site with real-time and pre-rendered 3D, built with Astro, three.js and GSAP, deployed to Cloudflare Workers.

## Where things are

- `docs/build-brief.md` is the brief. It says what to build and what content to use.
- `docs/KEYSTROKE - Design system.pdf` and `docs/KEYSTROKE - Business plan 2026-27.pdf` are the sources the brief is built on. The GitHub repository is public, so these, `HANDOVER.md` and anything personal stay out of git (see `.gitignore` and the README's "What stays out of git"). Check what is staged before every commit.
- `docs/stack.md` lists the packages, versions and tools.
- `docs/skill-corrections.md` lists where the skills in `.claude/skills/` are out of date or wrong. Read it before using any `threejs-*` or `gsap-*` skill.
- `docs/revision-1.md` is the first revision of the build. Where it disagrees with the build brief or the design system, the revision wins.
- `docs/onboarding-brief.md` is the brief for the client onboarding forms (`/onboard`). It wins on anything about onboarding.
- `docs/revision-2.md` is the second revision. Where it disagrees with revision 1, the build brief or the design system, revision 2 wins.

Precedence: the brief, then the design system, then the business plan.

## Standing rules

- This is a Windows PC. Skills that show bash, `/tmp` or other Unix paths need translating; keep every file you write inside this project folder.
- Ask before installing anything outside the project (Node, ffmpeg, Blender, any global npm package, Playwright's browser download) and before adding an MCP server. `npm install` inside the project needs no permission.
- Never run `wrangler login`, `wrangler deploy` or `wrangler secret`, and never create an account. Those are for the person. Leave a repo that deploys with one command.
- Never overwrite or delete this file. If a scaffolding tool generates its own `CLAUDE.md` or `AGENTS.md`, discard the generated one.
- Never run `npx gltf-transform` unless `@gltf-transform/cli` is installed in the project. The bare name is a different, unclaimed package on npm.
- The installed version of a library outranks any skill. When they disagree, read `node_modules/` and the current documentation.
- Look at what you build. After each stage, load the page in a real browser with `@playwright/test`, take screenshots at desktop and phone sizes, and read them. Until Playwright's own browser is installed, drive the Edge that ships with Windows (`channel: 'msedge'`).
