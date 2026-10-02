"""
Headless Blender: build one object in code, render it as a still or a
turntable, and export the same mesh as a GLB.

    blender -b -P render_object.py -- --out renders/keycap --frames 48 --size 1600

STATUS: written from the Blender Python API but NOT RUN in the session that
assembled this kit (Blender was not available there). On first use, run it,
open the first PNG it writes, and fix anything your Blender version rejects
before building on it. Things to look at on that first frame: that no face is
blown out to white (lower --energy if one is), that the contact shadow is
there in the overhead view, and that flat faces look flat. The frame loop deliberately avoids the
animation API, which changed between Blender 4 and 5.

Output is always on a transparent film, so the page supplies the ground. A
shadow catcher lies under the object: it shows the contact shadow in the
--overhead view only. Side-on, the camera looks along the ground plane and
sees it edge-on, so there is no ground shadow in that view. Scale: the
object is 1 unit wide; scale it when you load the GLB.
"""
import argparse
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument("--out", default="renders/object")
parser.add_argument("--frames", type=int, default=1, help="1 = a still; more = one full turn")
parser.add_argument("--size", type=int, default=1600, help="square output, pixels")
parser.add_argument("--samples", type=int, default=96)
parser.add_argument("--color", default="d6dee6", help="object colour, sRGB hex")
parser.add_argument("--ground", default="07090b",
                    help="the page ground the render will sit on, sRGB hex; sets how much light bounces up")
parser.add_argument("--overhead", action="store_true", help="camera at 90 degrees, straight down")
parser.add_argument("--energy", type=float, default=None,
                    help="key light power in watts; default 700 side-on, 450 overhead")
args = parser.parse_args(argv)

out = Path(args.out).resolve()
out.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def linear(hex_string):
    """sRGB hex to the linear RGBA Blender expects."""
    value = int(hex_string, 16)

    def channel(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (channel((value >> 16) & 255), channel((value >> 8) & 255), channel(value & 255), 1.0)


def node_of_type(tree, node_type):
    """Find a node in a default node tree by type."""
    for node in tree.nodes:
        if node.type == node_type:
            return node
    raise RuntimeError(
        f"No {node_type} node in the default tree. This Blender version builds "
        "default node trees differently: create and link the nodes explicitly."
    )


def matte(name, hex_string, roughness=0.72):
    material = bpy.data.materials.new(name)
    material.use_nodes = True                  # a no-op that warns on Blender 5; needed on 4
    bsdf = node_of_type(material.node_tree, "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = linear(hex_string)
    bsdf.inputs["Roughness"].default_value = roughness
    return material


def aim(obj, target=(0.0, 0.0, 0.25)):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


# --- the object: replace this block with whatever the scene needs -----------
# A keycap: a unit cube, flattened, tapered toward the top, edges bevelled.
mesh = bpy.data.meshes.new("object")
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1.0)
for vert in bm.verts:
    vert.co.z = vert.co.z * 0.55 + 0.275       # 0.55 tall, sitting on z = 0
    if vert.co.z > 0.3:
        vert.co.x *= 0.78                      # taper the top face
        vert.co.y *= 0.78
bm.to_mesh(mesh)
bm.free()
for polygon in mesh.polygons:
    polygon.use_smooth = True

obj = bpy.data.objects.new("object", mesh)
scene.collection.objects.link(obj)
bevel = obj.modifiers.new("bevel", "BEVEL")
bevel.width = 0.06
bevel.segments = 6
bevel.harden_normals = True                    # keep the large faces flat under smooth shading

mesh.materials.append(matte("object", args.color))
# ----------------------------------------------------------------------------

# Shadow catcher: invisible itself, it records the contact shadow into alpha.
ground_mesh = bpy.data.meshes.new("ground")
ground_mesh.from_pydata(
    [(-6.0, -6.0, 0.0), (6.0, -6.0, 0.0), (6.0, 6.0, 0.0), (-6.0, 6.0, 0.0)], [], [(0, 1, 2, 3)],
)
ground = bpy.data.objects.new("ground", ground_mesh)
scene.collection.objects.link(ground)
ground.is_shadow_catcher = True
ground_mesh.materials.append(matte("ground", args.ground, 0.9))  # so it bounces as the page ground would

# Camera: orthographic, square-on or straight down. No three-quarter angles.
camera_data = bpy.data.cameras.new("camera")
camera_data.type = "ORTHO"
camera_data.ortho_scale = 2.2
camera = bpy.data.objects.new("camera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
if args.overhead:
    camera.location = (0.0, 0.0, 6.0)
    camera.rotation_euler = (0.0, 0.0, 0.0)    # a camera looks down -Z by default
else:
    camera.location = (0.0, -6.0, 0.25)
    aim(camera)

# One large soft source, above and slightly in front. Flat, even, no drama.
light_data = bpy.data.lights.new("key", "AREA")
light_data.energy = args.energy if args.energy is not None else (450 if args.overhead else 700)
light_data.size = 7
light = bpy.data.objects.new("key", light_data)
scene.collection.objects.link(light)
light.location = (0.0, -2.5, 5.0)
aim(light)

# A little neutral fill so the unlit sides are grey, not black.
world = bpy.data.worlds.new("world")
world.use_nodes = True
scene.world = world
background = node_of_type(world.node_tree, "BACKGROUND")
background.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
background.inputs["Strength"].default_value = 0.12

render = scene.render
render.engine = "CYCLES"
scene.cycles.samples = args.samples
scene.cycles.use_denoising = True
render.resolution_x = args.size
render.resolution_y = args.size
render.resolution_percentage = 100
render.film_transparent = True                 # alpha out, so the page supplies the ground
render.image_settings.file_format = "PNG"
render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Standard"  # no filmic curve: greys stay the greys you set

frames = max(1, args.frames)
for index in range(frames):
    obj.rotation_euler.z = 2 * math.pi * index / frames
    render.filepath = str(out / f"{index + 1:04d}.png")
    bpy.ops.render.render(write_still=True)

obj.rotation_euler.z = 0.0
bpy.data.objects.remove(ground, do_unlink=True)  # the catcher is not part of the model
bpy.ops.export_scene.gltf(
    filepath=str(out / "object.glb"),
    export_format="GLB",
    export_apply=True,                          # bake the bevel into the mesh
)
print(f"wrote {frames} frame(s) and object.glb to {out}")
