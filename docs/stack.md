# Stack and tools

Versions are the latest published on 2 October 2026, read from the npm registry. They were not installed together in the session that assembled this kit (it had no access to npm), so the first `npm install` in the project is the compatibility check. If a pinned version fails to resolve, take the nearest one that does and record it in `NOTES.md`. GSAP 3.15.0 and three 0.186.1 were fetched from GitHub and the recipes in `scroll-storytelling` were run against them.

## Packages

| Package | Version | For | Licence |
|---|---|---|---|
| `astro` | 7.3.5 | Static site build. Needs Node 22.12 or later | MIT |
| `three` | 0.186.1 | Real-time 3D | MIT |
| `@types/three` | 0.186.0 | Types for three | MIT |
| `gsap` | 3.15.0 | Timelines, ScrollTrigger, SplitText. Every plugin is in this one package | GSAP standard licence, no charge, commercial use allowed |
| `lenis` | 1.3.26 | Smooth scrolling. Use this, not GSAP ScrollSmoother, which breaks `position: sticky` | MIT |
| `@fontsource/oswald` | 5.3.0 | Display face, self-hosted. Import `400.css` to `700.css` | OFL-1.1 |
| `@fontsource/archivo` | 5.3.0 | Body face, self-hosted. Import `400.css` to `700.css` | OFL-1.1 |
| `@fontsource/ibm-plex-mono` | 5.3.0 | Data face, self-hosted. Import `400.css` to `600.css` | OFL-1.1 |
| `wrangler` | 4.146.0 | Cloudflare deploy. Needs Node 22 or later | MIT or Apache-2.0 |
| `typescript` | latest 6.x (`typescript@^6`) | Types. Not TypeScript 7: `@astrojs/check` accepts only 5.x and 6.x | Apache-2.0 |
| `@astrojs/check` | 0.9.10 | `astro check` | MIT |
| `@playwright/test` | 1.63.0 | Screenshots and checks in a real browser. Its browser download goes outside the project, so ask first | Apache-2.0 |
| `sharp` | 0.35.5 | Image resizing and AVIF/WebP at build time | Apache-2.0 |
| `@gltf-transform/cli` | 4.4.2 | Optimise and compress GLB files | MIT |
| `vite-plugin-glsl` | 1.6.1 | Import `.glsl` shader files | MIT |

Use the plain font packages, not the `@fontsource-variable` ones. The variable packages register the families as "Oswald Variable" and "Archivo Variable", which do not match the names in the design system's token block, and the site would fall back to Arial without any error.

### Scaffolding into this folder

`npm create astro@latest` will not scaffold into a folder that already holds `.claude/` and `CLAUDE.md`. Scaffold into a temporary subfolder and move the result up, then install:

```bash
npm create astro@latest scaffold-tmp -- --template minimal --yes --no-install --no-git --no-ai
# move everything in scaffold-tmp, including dotfiles, up into the project folder, then delete scaffold-tmp
# do NOT move a generated CLAUDE.md or AGENTS.md: the project's own CLAUDE.md stays as it is
npm install
npm install three@0.186.1 gsap@3.15.0 lenis@1.3.26 @fontsource/oswald@5.3.0 @fontsource/archivo@5.3.0 @fontsource/ibm-plex-mono@5.3.0
npm install -D typescript@^6 @astrojs/check@0.9.10 wrangler@4.146.0 @types/three@0.186.0 @playwright/test@1.63.0 sharp@0.35.5 @gltf-transform/cli@4.4.2 vite-plugin-glsl@1.6.1
```

The `create astro` flags were read from its source, not run. If they have changed, run `npm create astro@latest -- --help`, or write the minimal files by hand (`package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`).

After the user agrees to the browser download: `npx playwright install chromium`. Until then, run Playwright against the Edge already on the machine with `channel: 'msedge'`.

## Tools on the machine

| Tool | Needed for | Check |
|---|---|---|
| Node 22.12 or later | Everything | `node -v` |
| Git | Version control | `git --version` |
| ffmpeg | Encoding loops and frame sequences | `ffmpeg -version` |
| Blender 4.2 LTS or later | Pre-rendered 3D and authoring GLB models. Optional: without it, 3D is built in three.js only | `blender --version`, or look in `C:\Program Files\Blender Foundation\` |

Ask before installing any of these. On Windows: `winget install OpenJS.NodeJS.LTS`, `winget install Gyan.FFmpeg`, `winget install BlenderFoundation.Blender`.

## Deploy

Cloudflare Workers with static assets, not Pages: Cloudflare now directs new projects there. The repo carries a `wrangler.jsonc` whose `assets.directory` is the build output, and `npm run deploy` runs the build and then `wrangler deploy`. Logging in (`npx wrangler login`) and the first deploy are done by a person, in their own browser.

## Notes on versions

- The `threejs-*` skills were written against three r160. The project installs r186. `docs/skill-corrections.md` lists the differences found. Where a snippet and the installed package disagree, the package wins.
- The Cloudflare skills tell you to read current documentation before writing configuration. Do that; Wrangler's configuration fields change.
- GSAP's licence is not MIT. It allows free use on commercial sites. Read https://gsap.com/standard-license once before shipping.
