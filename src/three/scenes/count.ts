// The count. A macro of odometer drums, square-on, the camera tracking along
// the axle. The row spells the same four ledger figures as the counters
// above it; each group of drums lands as its counter settles, and the row has
// left the frame by the end of the section.
import * as THREE from 'three';
import { addRig, pixelCamera, centreOf, type SceneFactory, type LiveScene } from '../stage';
import { makeDrums, DRUM_R } from '../objects/drums';
import { bus } from '../../scripts/bus';

const span = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const smooth = (t: number) => t * t * (3 - 2 * t);

export const countScene: SceneFactory = (ctx) => {
  const { t, env, el } = ctx;
  const scene = new THREE.Scene();
  addRig(scene, env, 'square');
  const camera = pixelCamera();
  const slot = el.querySelector<HTMLElement>('.count-slot')!;

  // One drum per digit, a blank pitch between figures.
  const figures = Array.from(el.querySelectorAll<HTMLElement>('.count-item')).map((item) => String(item.dataset.figure ?? '0'));
  const cells: { digit: number; group: number }[] = [];
  const centres: number[] = [];
  figures.forEach((fig, g) => {
    const start = cells.length + g;
    fig.split('').forEach((ch) => cells.push({ digit: Number(ch), group: g }));
    centres.push(start + (fig.length - 1) / 2);
  });
  const drums = makeDrums(t, cells.length);
  // Open the row out with the gaps between figures.
  drums.units.forEach((unit, i) => {
    unit.position.x = i + cells[i].group;
  });
  scene.add(drums.group);

  // Where the camera is along the axle, in pitches, for a given progress.
  const first = centres[0] ?? 0;
  const last = centres[centres.length - 1] ?? 0;
  const landing = (g: number) => 0.1 + g * 0.17 + 0.07;
  const slope = centres.length > 1 ? (last - first) / (landing(centres.length - 1) - landing(0)) : 30;
  const along = (p: number) => first + (p - landing(0)) * slope;

  const live: LiveScene = {
    scene,
    camera,
    clip: null,
    update() {
      const size = ctx.size();
      const r = ctx.rect(slot);
      const c = centreOf(r, size);
      live.clip = r; // a macro band: the drums are cropped top and bottom by the slot
      const p = ctx.still ? landing(1) + 0.02 : bus.count.p;
      // Macro: the drum is taller than the band, so the band crops it top and bottom.
      const s = (r.h * 1.5) / (2 * DRUM_R);
      drums.group.scale.setScalar(s);
      drums.group.position.set(c.x - along(p) * s, c.y - r.h * 0.12, 0);
      for (let i = 0; i < cells.length; i++) {
        const land = landing(cells[i].group) + (i % 6) * 0.004;
        // Spinning down toward its digit until it lands, then still.
        const k = 1 - smooth(span(p, land - 0.16, land));
        drums.show(i, cells[i].digit + k * (6 + (i % 4) * 2));
      }
    },
    dispose() {
      drums.dispose();
    },
  };
  return live;
};
