# KEYSTROKE website: build kit

Everything Fable needs in the project folder before it starts on the site. Unzip this so that `CLAUDE.md`, `.claude/` and `docs/` sit at the top of the project folder, then open that folder in Claude Code and give it `docs/build-brief.md`.

## What is here

```
CLAUDE.md               Standing rules. Claude Code reads this by itself in every session.
.claude/skills/         25 skills. Claude Code finds them here without any setup.
docs/
  build-brief.md        The build prompt, draft 3.
  stack.md              Packages, versions, tools on the machine, deploy target.
  skill-corrections.md  Where the third-party skills are out of date or wrong.
  THIRD-PARTY.md        Where each skill came from, at which commit, under which licence.
  licences/             Licence texts for the third-party skills.
  KEYSTROKE - Business plan 2026-27.pdf
  KEYSTROKE - Design system.pdf
```

## The skills

| For | Skills |
|---|---|
| Scroll choreography | `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-utils`, `gsap-performance` (GreenSock's own) |
| Real-time 3D | `threejs-fundamentals`, `-geometry`, `-materials`, `-lighting`, `-textures`, `-animation`, `-loaders`, `-shaders`, `-postprocessing`, `-interaction` |
| 3D that misbehaves | `threejs-errors-rendering`, `threejs-errors-performance` |
| 3D modelling and assets | `prerendered-3d` (written for this kit), `threejs-agents-model-optimizer` |
| The three reference sites | `scroll-storytelling` (written for this kit): layered parallax as on Firewatch, one canvas with a scene per section as on The Boat, scrubbed rendered frames in the manner of Melanie Daveid's site, with a teardown of how each site is built |
| Design and performance | `frontend-design`, `web-perf` |
| Cloudflare | `wrangler`, `workers-best-practices` (Cloudflare's own) |

## What was checked

- The three reference sites were opened in a browser and inspected: scripts, layers, canvases, libraries.
- Every skill's frontmatter parses. Claude Code picked up 24 of the 25 from this folder layout while the kit was being assembled; `prerendered-3d` was added after that scan and could not be confirmed the same way, so check that it is listed when the project is first opened.
- The three recipes in `scroll-storytelling` were run in headless Chromium against GSAP 3.15.0 and three 0.186.1: 36 checks, all passing, including at device pixel ratio 2 and with reduced motion.
- The ffmpeg commands in `prerendered-3d` were run on test frames with ffmpeg 6.1, including the ones that flatten transparent frames onto a ground colour.
- The 23 third-party skills were read in full by a reviewer and checked against the three 0.186.1 and GSAP 3.15.0 source. Nothing harmful was found. What is out of date or wrong is in `skill-corrections.md`.
- The brief was reviewed against both PDFs, and its mock data is checked by script: ledger against cases, counter totals, price ranges against the published bands, quiz items, the shift report.

## What was not checked

- The npm packages in `stack.md` were not installed together, and the Astro scaffold steps were not run. The session that built this kit had no access to npm. Versions were read from the registry.
- `prerendered-3d/scripts/render_object.py` has not been run. Blender was not available. Its header says so and lists what to look at on the first frame.
- Nothing was run on a phone or with Lenis attached.
- The `gltf-transform` commands in `threejs-agents-model-optimizer` were not run; some may not exist in the current CLI.
