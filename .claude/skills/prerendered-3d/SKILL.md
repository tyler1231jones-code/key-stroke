---
name: prerendered-3d
description: Make 3D imagery offline and ship it as stills, loops, frame sequences or GLB models - Blender run headless from the command line, then encoded for the web. Use when a 3D look is too heavy or too exact for real-time WebGL, when asked for 3D renders, a turntable, a rendered hero still or background loop, a look "like melaniedaveid.com", or when a GLB has to be authored rather than downloaded.
---

# Pre-rendered 3D

Some 3D should not be computed in the visitor's browser. Render it once, on this machine, and ship the pictures. The result looks identical on every device and costs nothing at run time.

## Real-time or pre-rendered

| Use real-time (three.js) when | Use pre-rendered when |
|---|---|
| The visitor's input changes the view freely | The camera path is fixed or one-dimensional (a scrub) |
| There are many simple, repeated objects | One object must look exactly right: soft shadows, bevel highlights, surface wear |
| The scene must respond to live data | The look needs path tracing or heavy geometry |
| It has to stay sharp at any size | A fixed resolution is acceptable |

The two combine well. Render the hero object offline as a still and a scrubbed sequence, and export the same mesh as a GLB for the scenes where it is instanced live.

## The pipeline

1. **Find Blender.** Run `blender --version`. On Windows it is usually not on PATH; look in `C:\Program Files\Blender Foundation\`. If it is not installed, tell the user, ask whether to install it (`winget install BlenderFoundation.Blender`), and carry on with the fallback at the end of this file while you wait.
2. **Write the scene as a Python script** under `tools/blender/` in the project, so every render can be reproduced from the repo. Start from `scripts/render_object.py`. No `.blend` files edited by hand.
3. **Render headless.** `blender -b -P tools/blender/keycap.py -- --out renders/keycap --frames 48 --size 1600`. Everything after `--` goes to the script. Keep `renders/` out of git and out of the built site.
4. **Look at the output.** Open the first PNG with the Read tool before rendering the rest. Check the silhouette, the light, the greys, the edges, and in an overhead view the contact shadow. Fix the script and render again. A sequence of 48 wrong frames is 48 times the wait.
5. **Encode** with the commands below.
6. **Export the GLB** from the same script, then optimise it with the `threejs-agents-model-optimizer` skill.
7. **Put it on the page** using the markup below, or `scroll-storytelling/recipes/image-sequence.js` for a scrub.

`scripts/render_object.py` has not been run; its header says so and lists what to check on the first frame. Treat the first run as part of the work.

## The look

The reference is monochrome studio rendering: simple forms, matte surfaces, long soft gradients.

- One large area light, above and slightly forward. No rim light, no coloured light, no visible environment.
- Matte materials: roughness 0.6 to 0.8, no metal, no clearcoat.
- Orthographic camera, square-on or straight down. Choose one angle per object and keep it.
- `view_transform = 'Standard'`, so a grey renders as the grey you set. That transform has no highlight roll-off, so a face that receives too much light clips to white: check the brightest face on the first frame and lower the light, not the material.
- Render on a transparent film. The page supplies the ground colour, so one render works on any background. A shadow catcher under the object gives a contact shadow in overhead views; a square-on camera sees the ground edge-on and shows none.
- Do not bake film grain into renders. Grain destroys video compression.

## Encoding

Blender writes `0001.png`, `0002.png`, and so on, with transparency. Only WebP keeps that transparency. Every video format and AVIF must be laid over the ground colour as it is encoded; encode a transparent frame straight to video and the ground comes out pure black with a hard, fringed edge.

Run with ffmpeg 6.1 on 1920×1080 frames. Set `s=` to the frame size and `c=` to the ground colour.

```bash
# Transparent outputs: WebP keeps alpha
ffmpeg -i renders/keycap/%04d.png -vf "scale=1600:-2" -c:v libwebp -quality 72 public/seq/keycap/%04d.webp
ffmpeg -i renders/keycap/0001.png -frames:v 1 -c:v libwebp -quality 82 public/img/keycap.webp

# Flattened outputs: lay the frames over the ground colour, then encode
GROUND="color=c=0x07090b:s=1920x1080:r=30"
FLAT="[0][1]overlay=shortest=1,format=yuv420p"

ffmpeg -f lavfi -i "$GROUND" -framerate 30 -i renders/keycap/%04d.png -filter_complex "$FLAT" \
  -c:v libvpx-vp9 -b:v 0 -crf 34 -an public/loops/keycap.webm
ffmpeg -f lavfi -i "$GROUND" -framerate 30 -i renders/keycap/%04d.png -filter_complex "$FLAT" \
  -c:v libx264 -crf 23 -preset slow -movflags +faststart -an public/loops/keycap.mp4
ffmpeg -f lavfi -i "$GROUND" -framerate 30 -i renders/keycap/%04d.png -filter_complex "$FLAT" \
  -c:v libsvtav1 -crf 38 -preset 6 -an public/loops/keycap.av1.mp4

# Flattened stills: an AVIF, and the poster for the loop
ffmpeg -f lavfi -i "color=c=0x07090b:s=1920x1080" -i renders/keycap/0001.png \
  -filter_complex "[0][1]overlay,format=yuv420p" -frames:v 1 -c:v libaom-av1 -still-picture 1 -crf 28 public/img/keycap.avif
ffmpeg -f lavfi -i "color=c=0x07090b:s=1920x1080" -i renders/keycap/0001.png \
  -filter_complex "[0][1]overlay" -frames:v 1 -c:v libwebp -quality 80 public/loops/keycap-poster.webp
```

These are written for a POSIX shell. In PowerShell, assign the two variables with `$GROUND = "..."` and put each command on one line.

H.264 needs even pixel dimensions. Budgets: a hero still under 150 KB; a background loop under 1.5 MB and under 6 seconds; a scrub sequence of 60 to 120 frames under 60 KB each, with a half-width set for phones.

## On the page

```html
<video class="loop" muted playsinline loop preload="metadata" poster="/loops/keycap-poster.webp"
       width="1920" height="1080" aria-hidden="true">
  <source src="/loops/keycap.av1.mp4" type='video/mp4; codecs="av01.0.08M.08"'>
  <source src="/loops/keycap.webm" type="video/webm">
  <source src="/loops/keycap.mp4" type="video/mp4">
</video>
```

- The AV1 `codecs` string above is for 1920×1080 at 30 fps (level 4.0). A different size needs a different level; if unsure, drop the AV1 source.
- Do not set `autoplay`. Start the loop with an `IntersectionObserver` when it is on screen and pause it when it leaves.
- With `prefers-reduced-motion: reduce`, never call `play()`; the poster is the image.
- Give the element `width` and `height` so nothing shifts when it loads.
- The loop is decoration. Anything a reader needs is in the HTML beside it.

## Grain

If the project's design rules allow a texture over the page (check; many forbid background patterns), add it once, in the browser, as a fixed overlay: a 128px tile of random greys generated in code, at 4 to 8 percent opacity, `pointer-events: none`. Keep it still. An animated full-page blend layer repaints the whole viewport every frame.

## Without Blender

Build the object in three.js, load the page in Playwright at a device scale factor of 2 or 3, step the scene through its positions, and screenshot the canvas each time. The frames go through the same encoding commands. Live rasterised shading is harder to get soft, so use a large `RectAreaLight` or a neutral studio environment map and a matte `MeshStandardMaterial`, and compare against the reference before committing to a sequence.
