# Corrections to the third-party skills

The skills in `.claude/skills/` are copied unmodified from their authors. They were read in full and checked against three 0.186.1 and GSAP 3.15.0. Nothing harmful was found. The points below are where they are out of date, wrong, or disagree with each other. Where a skill and this file disagree, this file wins; where this file and the installed package disagree, the package wins.

## three.js: the skills were written for r160, the project uses r186

| The skill says | In r186 |
|---|---|
| End an `EffectComposer` chain with a `GammaCorrectionShader` pass, or nothing (`threejs-postprocessing`) | End every chain with `OutputPass` from `three/addons/postprocessing/OutputPass.js`. It applies the renderer's tone mapping and colour space. FXAA, if used, goes after it. Without it the picture is dark and tone mapping is ignored |
| Set `renderer.outputColorSpace` to linear for post-processing (`threejs-errors-rendering`) | Leave it as sRGB; `OutputPass` reads it |
| `new FilmPass(0.35, 0.5, 648, false)` | `new FilmPass(intensity, grayscale)`. The old call turns the image black and white |
| `new HalftonePass(width, height, params)` | `new HalftonePass(params)` |
| `THREE.Clock` (used throughout) | Deprecated and warns. Use `THREE.Timer`: call `timer.update()` once per frame, then `getDelta()` and `getElapsed()` |
| `RGBELoader` | Deprecated and warns. Use `HDRLoader` from `three/addons/loaders/HDRLoader.js` |
| `THREE.PCFSoftShadowMap` | Removed; falls back with a warning. Use `PCFShadowMap` |
| `#include <output_fragment>` in `onBeforeCompile` (`threejs-shaders`) | The chunk is `opaque_fragment`. A replace on the old name silently does nothing |
| `scene.add(transformControls)` | `scene.add(transformControls.getHelper())` |
| `BufferGeometryUtils.computeTangents(geometry)` | `geometry.computeTangents()` |
| `aoMap` needs a `uv2` attribute | It reads the set named by `aoMap.channel`, default `uv`. A second set is `uv1` |
| Import `ContactShadows` from three's examples (`threejs-lighting`) | No such file. It is a React component from another library |
| `lightProbe.copy(LightProbeGenerator.fromCubeRenderTarget(...))` | That method is async; await it |
| Set a Draco decoder path or a Basis transcoder path, usually to a CDN | Not needed with a bundler. `DRACOLoader` and `KTX2Loader` default to the copies shipped inside three. Do not load decoders from a CDN |
| `DRACOLoader.setDecoderConfig(...)` | Deprecated |
| The WebGPU post-processing block that imports `three/addons/nodes/Nodes.js` | Unusable. This project uses `WebGLRenderer`; skip the WebGPU sections |
| `ShaderMaterial.extensions.derivatives`, `fragDepth`, `drawBuffers` | Ignored; always on in WebGL 2 |
| Textures must be power-of-two for mipmaps | Not in WebGL 2, which is all r186 supports |
| "Always call `lod.update(camera)`" | The renderer does it (`LOD.autoUpdate`) |
| Point and spot lights at intensity 1 | Lights use physical units; expect to need far higher values. Judge by looking |

Import addons from `three/addons/...` everywhere. Some skills use `three/examples/jsm/...`; both resolve, but pick one.

One bug that is not version-related: `threejs-animation` calls `clock.getElapsedTime()` and then `clock.getDelta()` in the same frame, which gives the mixer a delta of about zero. Take one delta per frame.

## GSAP 3.15.0: seven errors in otherwise sound skills

- `gsap-scrolltrigger` says a lower `refreshPriority` refreshes first. It is the reverse: higher refreshes first. Create triggers top to bottom and you will not need it.
- `gsap-scrolltrigger`'s horizontal-scroll example has `Max.max` for `Math.max`, omits the `scrub` its own step requires, and its `xPercent` evaluates to 0. Do not copy it. (This site has no horizontal scrolling.)
- `gsap-utils`: `unitize(100, "px")` is wrong. `unitize(fn, unit)` wraps a function and returns a function.
- `gsap-plugins`: `MotionPathHelperPlugin` does not exist; the export is `MotionPathHelper`, and `create` takes `(target, vars)`.
- `gsap-plugins`: `Observer`'s default `type` is `"wheel,touch,pointer"`.
- `gsap-plugins`: Flip's `scale` has no default of `true`.
- `gsap-plugins`: `scrollTo` has no `element` option; pass the selector as `y`.

## Where the skills disagree with each other, and what to do

- **Draco.** Export uncompressed from Blender and compress afterwards with `@gltf-transform/cli`, as `threejs-agents-model-optimizer` says.
- **Texture format.** Export PNG from Blender, compress once at the end. Do not go through JPEG first.
- **Data texture colour space.** Leave it at the default for normal, roughness and other data maps. Set `SRGBColorSpace` only on colour maps.
- **Entrances.** `gsap-scrolltrigger` teaches fade-and-slide-up on every section with `ScrollTrigger.batch`; `frontend-design` says that pattern reads as generated. For this site the brief's motion rules settle it: no generic entrances.

## Cautions

- `threejs-agents-model-optimizer` tells you to `npm i -g gltfpack` and to run `npx gltf-transform`. Do neither as written: no global installs without asking, and use the project's `@gltf-transform/cli` (see `CLAUDE.md`). Its `gltf-transform ktx2 ...` commands may not exist in the current CLI; run `npx @gltf-transform/cli --help` and use what it lists. Its shell snippets are bash-only.
- `web-perf` shows an MCP server entry that runs `npx -y chrome-devtools-mcp@latest`. Do not add it without asking.
- `wrangler` and `workers-best-practices` cover commands that publish to the internet and act on a Cloudflare account. Use them to write configuration. Login, deploy and secrets are for the person, not for you.
- Several skills mention other skills that are not in this kit (`gsap-react`, `threejs-impl-shadows`, `react-three-fiber` and others). Ignore those references.
