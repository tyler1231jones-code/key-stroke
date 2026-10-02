# Third-party skills in this kit

Copied unmodified from the repositories below on 2 October 2026. Licence texts are in `docs/licences/`; the Anthropic skill carries its own `LICENSE.txt`.

| Skills | Source | Commit | Licence |
|---|---|---|---|
| `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-utils`, `gsap-performance` | github.com/greensock/gsap-skills (official) | aed9cfd | MIT |
| `threejs-fundamentals`, `-geometry`, `-materials`, `-lighting`, `-textures`, `-animation`, `-loaders`, `-shaders`, `-postprocessing`, `-interaction` | github.com/CloudAI-X/threejs-skills | b1c6230 | MIT (stated in its README) |
| `threejs-errors-performance`, `threejs-errors-rendering`, `threejs-agents-model-optimizer` | github.com/OpenAEC-Foundation/Three.js-Claude-Skill-Package | 6c190f0 | MIT |
| `frontend-design` | github.com/anthropics/skills | 8a1541c | Apache-2.0 |
| `wrangler`, `workers-best-practices`, `web-perf` | github.com/cloudflare/skills (official) | 41e0d19 | Apache-2.0 |

Written for this kit: `scroll-storytelling`, `prerendered-3d`.

Left out on purpose:

- the React, Vue and Svelte variants of the GSAP skills, and the WebGPU, XR, physics and React Three Fiber skills, which this site does not use;
- Cloudflare's full platform skill (1.7 MB, mostly products this site does not use);
- `blender-web-pipeline` (github.com/freshtechbro/claudedesignskills): on review its three scripts either fail or do nothing, and it contradicts the optimiser skill on compression. `prerendered-3d` covers the same ground;
- Anthropic's `webapp-testing`: it is written around Python and Unix paths, and this project checks its work with `@playwright/test`.

Where the remaining skills are out of date or wrong is recorded in `docs/skill-corrections.md`.
