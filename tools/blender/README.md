# Offline renders

Blender was not on the machine when the site was built, so every 3D object is
built real-time in three.js (`src/three/objects/`). This folder is where the
offline renders come from once Blender is installed. The object most worth
rendering is the one with wear: the worn `K` key in the homepage hero.

## What is here

- `render_object.py`: the starter script from the `prerendered-3d` skill,
  copied unmodified. It has **not been run**. Its header lists what to look at
  on the first frame. Treat the first run as part of the work.

## The pipeline

1. Install Blender 4.2 LTS or later and ffmpeg
   (`winget install BlenderFoundation.Blender`, `winget install Gyan.FFmpeg`).
2. Write one script per object here (start from `render_object.py`). Follow
   the photography brief: orthographic camera, square-on or exactly overhead,
   one large area light, matte neutral greys, `view_transform = 'Standard'`,
   transparent film. No colour, no warmth, no grain.
3. Render headless, look at the first PNG before rendering the rest:

   ```
   blender -b -P tools/blender/keycap.py -- --out renders/key-worn --frames 1 --size 1600 --overhead
   ```

   `renders/` is ignored by git and is not part of the built site.
4. Encode to WebP (keeps the transparency) into `public/renders/`:

   ```
   ffmpeg -i renders/key-worn/0001.png -frames:v 1 -c:v libwebp -quality 82 public/renders/key-worn.webp
   ffmpeg -i renders/key-worn/%04d.png -vf "scale=1600:-2" -c:v libwebp -quality 72 public/renders/key-worn/%04d.webp
   ```

5. Register the render in `src/content/assets.json`. The object library then
   draws it as a flat plane in place of the real-time mesh. Every camera on
   the site is square-on or exactly overhead, so the swap needs no other
   change.

   ```json
   {
     "models": {},
     "renders": {
       "sheet": { "still": "/renders/sheet.webp", "width": 210, "height": 297 },
       "key-field": { "frames": ["/renders/key-field/0001.webp", "/renders/key-field/0002.webp"], "width": 8.75, "height": 4 }
     }
   }
   ```

   `width` and `height` are the object's footprint in its own units (see the
   `size` each object reports in `src/three/objects/index.ts`). A `frames`
   list is scrubbed by scroll: one frame is requested when the scene is built
   and the rest when the object is first driven.

Object names: `drum`, `key-field`, `forms-stack`, `sheet`. These are the
objects on the four service pages, named in `src/content/services.json`. The
hero's worn key is drawn by its own scene
(`src/three/scenes/hero.ts`) and is not replaced by `assets.json`; a rendered
hero key would go in as a frame sequence using
`.claude/skills/scroll-storytelling/recipes/image-sequence.js`.

## GLB models

Export the same mesh from the Blender script as a GLB (uncompressed), optimise
it with the project's `@gltf-transform/cli` (`npx @gltf-transform/cli --help`),
put it in `public/models/`, and name it in `assets.json`:

```json
{ "models": { "sheet": "/models/sheet.glb" }, "renders": {} }
```

The loader is only fetched when a model is named.
