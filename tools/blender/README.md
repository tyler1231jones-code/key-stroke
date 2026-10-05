# Offline renders

Blender was not on the machine when the site was built, so the two 3D scenes
are built real-time in three.js: the worn `K` key and its field in the
homepage hero (`src/three/scenes/hero.ts`) and the stack of forms on the audit
page (`src/three/scenes/audit.ts`). This folder is where offline renders would
come from once Blender is installed. The object most worth rendering is the
one with wear: the worn `K` key.

Revision 2 replaced the 3D objects on the four service pages with HTML
demonstrations, and removed the `assets.json` hooks that swapped those objects
for renders or GLB models. Nothing on the site reads a render today.

## What is here

- `render_object.py`: the starter script from the `prerendered-3d` skill,
  copied unmodified. It has **not been run**. Its header lists what to look at
  on the first frame. Treat the first run as part of the work.

## The pipeline, if a render is wanted

1. Install Blender 4.2 LTS or later and ffmpeg
   (`winget install BlenderFoundation.Blender`, `winget install Gyan.FFmpeg`).
2. Write one script per object here (start from `render_object.py`). Follow
   the photography brief: orthographic camera, square-on or exactly overhead,
   one large area light, matte neutral greys, `view_transform = 'Standard'`,
   transparent film. No colour, no warmth, no grain.
3. Render headless, and look at the first PNG before rendering the rest:

   ```
   blender -b -P tools/blender/keycap.py -- --out renders/key-worn --frames 1 --size 1600 --overhead
   ```

   `renders/` is ignored by git and is not part of the built site.
4. Encode to WebP (keeps the transparency) into `public/renders/`:

   ```
   ffmpeg -i renders/key-worn/%04d.png -vf "scale=1600:-2" -c:v libwebp -quality 72 public/renders/key-worn/%04d.webp
   ```

5. A rendered hero key goes in as a frame sequence scrubbed by scroll, using
   `.claude/skills/scroll-storytelling/recipes/image-sequence.js`, in place of
   the scene in `src/three/scenes/hero.ts`. Read `docs/skill-corrections.md`
   first.

A GLB exported from the same Blender script can be optimised with the
project's `@gltf-transform/cli` (`npx @gltf-transform/cli --help`). Never run
the bare `npx gltf-transform`: that name is a different package.
