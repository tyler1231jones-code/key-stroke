// Textures are generated here, in code, on a 2D canvas, from the tokens.
// Wear is seeded noise: asymmetric, never tiled, the same on every visit.
import * as THREE from 'three';
import { fontFamily, type Tokens } from './tokens';

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth value noise with a few octaves, 0..1. */
export function fbm(seed: number): (x: number, y: number) => number {
  const N = 64;
  const r = rng(seed);
  const grid = new Float32Array(N * N);
  for (let i = 0; i < grid.length; i++) grid[i] = r();
  const at = (ix: number, iy: number) => grid[((iy % N) + N) % N * N + (((ix % N) + N) % N)];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const noise = (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = smooth(x - ix);
    const fy = smooth(y - iy);
    const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * fx;
    const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * fx;
    return a + (b - a) * fy;
  };
  return (x, y) => {
    let v = 0;
    let amp = 0.5;
    let f = 1;
    for (let o = 0; o < 4; o++) {
      v += noise(x * f, y * f) * amp;
      f *= 2.03;
      amp *= 0.5;
    }
    return v / 0.9375;
  };
}

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })!];
}

function colourTexture(c: HTMLCanvasElement, aniso = 8): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

function dataTexture(c: HTMLCanvasElement): THREE.CanvasTexture {
  // Data map: colour space left at the default.
  return new THREE.CanvasTexture(c);
}

export interface FaceTextures {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture | null;
}

export interface WearSpec {
  /** Centre of the worn patch on the face, 0..1 from the top left. */
  at: [number, number];
  radius: number;
  seed: number;
  /** A second, smaller chip. */
  chip?: [number, number, number];
}

/** A worn face part-way through being drawn. */
interface WearJob {
  t: Tokens;
  wear: WearSpec;
  w: number;
  size: number;
  c: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  rc: HTMLCanvasElement;
  rctx: CanvasRenderingContext2D;
  img: ImageData;
  rough: ImageData;
  face: Uint8ClampedArray;
  noise: (x: number, y: number) => number;
  fine: (x: number, y: number) => number;
  /** The next row to draw. */
  y: number;
}

/** Worn faces already drawn, by what they show. Drawing one is the most expensive thing the stage does. */
const worn = new Map<string, { c: HTMLCanvasElement; rc: HTMLCanvasElement }>();
const wornKey = (legend: string, size: number, wear: WearSpec, aspect: number) => [legend, size, aspect, wear.seed, wear.at, wear.radius, wear.chip].join(':');

function drawLegend(t: Tokens, legend: string, size: number, aspect: number): [HTMLCanvasElement, CanvasRenderingContext2D, number] {
  const w = Math.round(size * aspect);
  const [c, ctx] = canvas(w, size);
  ctx.fillStyle = t.css.readout;
  ctx.fillRect(0, 0, w, size);
  if (legend) {
    ctx.fillStyle = t.css.base900;
    const px = legend.length > 2 ? size * 0.2 : legend.length > 1 ? size * 0.3 : size * 0.54;
    ctx.font = `600 ${px}px ${fontFamily('body')}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(legend, w / 2, size * 0.5 + px * 0.36);
  }
  return [c, ctx, w];
}

function startWear(t: Tokens, legend: string, size: number, wear: WearSpec, aspect: number): WearJob {
  const [c, ctx, w] = drawLegend(t, legend, size, aspect);
  const [rc, rctx] = canvas(w, size);
  return {
    t, wear, w, size, c, ctx, rc, rctx,
    img: ctx.getImageData(0, 0, w, size),
    rough: rctx.createImageData(w, size),
    face: ctx.getImageData(0, 0, 1, 1).data, // readout as the canvas stores it
    noise: fbm(wear.seed),
    fine: fbm(wear.seed + 7),
    y: 0,
  };
}

/** Draw the next `rows` rows of wear. True once the last row is done. */
function wearRows(job: WearJob, rows: number): boolean {
  const { wear, w, size, img, rough, face, noise, fine } = job;
  const end = Math.min(size, job.y + rows);
  for (let y = job.y; y < end; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x / w;
      const ny = y / size;
      const n = noise(nx * 5, ny * 5);
      const f = fine(nx * 22, ny * 22);
      // The patch is stretched along the direction a fingertip slides.
      const dx = (nx - wear.at[0]) * 0.85 + (ny - wear.at[1]) * 0.25;
      const dy = (ny - wear.at[1]) * 1.1 - (nx - wear.at[0]) * 0.2;
      const d = Math.hypot(dx, dy);
      let m = 1 - smoothstep(wear.radius * 0.45, wear.radius, d + (n - 0.5) * wear.radius * 0.9);
      if (wear.chip) {
        const dc = Math.hypot(nx - wear.chip[0], ny - wear.chip[1]);
        m = Math.max(m, (1 - smoothstep(wear.chip[2] * 0.4, wear.chip[2], dc + (f - 0.5) * wear.chip[2] * 1.4)) * 0.92);
      }
      // Erosion is patchy at its edge: the legend survives in flecks.
      const erode = m * smoothstep(0.25, 0.6, m + (f - 0.5) * 0.5);
      const i = (y * w + x) * 4;
      img.data[i] = img.data[i] + (face[0] - img.data[i]) * erode;
      img.data[i + 1] = img.data[i + 1] + (face[1] - img.data[i + 1]) * erode;
      img.data[i + 2] = img.data[i + 2] + (face[2] - img.data[i + 2]) * erode;
      // Matte everywhere, polished where the finish has gone.
      const r = 0.82 - m * 0.56 + (f - 0.5) * 0.08;
      const v = Math.round(Math.min(1, Math.max(0.12, r)) * 255);
      rough.data[i] = rough.data[i + 1] = rough.data[i + 2] = v;
      rough.data[i + 3] = 255;
    }
  }
  job.y = end;
  return end >= size;
}

function finishWear(job: WearJob): { c: HTMLCanvasElement; rc: HTMLCanvasElement } {
  const { t, wear, w, size, c, ctx, rc, rctx } = job;
  ctx.putImageData(job.img, 0, 0);
  rctx.putImageData(job.rough, 0, 0);
  // A few hairline scratches, each different.
  const r = rng(wear.seed + 3);
  ctx.lineCap = 'round';
  for (let k = 0; k < 26; k++) {
    const x0 = (wear.at[0] + (r() - 0.5) * 0.7) * w;
    const y0 = (wear.at[1] + (r() - 0.5) * 0.7) * size;
    const ang = -0.9 + (r() - 0.5) * 1.1;
    const len = (0.04 + r() * 0.16) * size;
    ctx.globalAlpha = 0.05 + r() * 0.09;
    ctx.strokeStyle = r() > 0.5 ? t.css.base900 : t.css.rule;
    ctx.lineWidth = Math.max(1, size / 700);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return { c, rc };
}

/**
 * Draw a worn face ahead of time, a few rows at a turn, so the page stays
 * responsive while it happens. keyFace() then finds it ready. The stage calls
 * this for the hero key before it builds anything.
 */
export async function prepareKeyFace(t: Tokens, legend: string, size: number, wear: WearSpec, aspect = 1): Promise<void> {
  const key = wornKey(legend, size, wear, aspect);
  if (worn.has(key)) return;
  const job = startWear(t, legend, size, wear, aspect);
  // Rows are drawn for about a frame's worth of time, then the page gets a
  // turn. A fixed handful of rows a turn spent longer waiting than drawing.
  for (;;) {
    const until = performance.now() + 12;
    let done = false;
    while (!done && performance.now() < until) done = wearRows(job, 16);
    if (done) break;
    await new Promise<void>((ok) => setTimeout(ok, 0));
  }
  worn.set(key, finishWear(job));
}

/**
 * The lit face of a key: readout ground, legend in base-900. With wear, part
 * of the legend is gone and the surface under the finger is polished. A worn
 * face is drawn once and kept, so a scene that is rebuilt does not pay again.
 */
export function keyFace(t: Tokens, legend: string, size = 512, wear?: WearSpec, aspect = 1): FaceTextures {
  if (!wear) return { map: colourTexture(drawLegend(t, legend, size, aspect)[0]), roughnessMap: null };
  const key = wornKey(legend, size, wear, aspect);
  let done = worn.get(key);
  if (!done) {
    const job = startWear(t, legend, size, wear, aspect);
    wearRows(job, size);
    done = finishWear(job);
    worn.set(key, done);
  }
  return { map: colourTexture(done.c), roughnessMap: dataTexture(done.rc) };
}

/** Digits 0 to 9 stacked for wrapping around a drum: base-900 body, readout digits. */
export function drumStrip(t: Tokens, cw = 192, ch = 256): THREE.CanvasTexture {
  const [c, ctx] = canvas(cw, ch * 10);
  ctx.fillStyle = t.css.base900;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.font = `500 ${ch * 0.84}px ${fontFamily('data')}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (let d = 0; d < 10; d++) {
    ctx.fillStyle = t.css.readout;
    ctx.fillText(String(d), cw / 2, d * ch + ch * 0.8);
  }
  const tex = colourTexture(c, 16);
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

type SheetKind = 'form' | 'tender' | 'letterhead';

/** The face of a printed sheet, A4 proportion, drawn from the light theme's tokens. */
export function sheetFace(t: Tokens, kind: SheetKind, h = 1024): THREE.CanvasTexture {
  const w = Math.round((h * 210) / 297);
  const [c, ctx] = canvas(w, h);
  const u = w / 100; // one hundredth of the sheet width
  ctx.fillStyle = t.css.paperWhite;
  ctx.fillRect(0, 0, w, h);
  const line = (x: number, y: number, len: number, weight = 0.5, colour = t.css.paperHairline) => {
    ctx.fillStyle = colour;
    ctx.fillRect(x * u, y * u, len * u, weight * u);
  };
  const m = 12; // left margin: the keycap pitch on a letterhead
  if (kind === 'form') {
    line(m, 12, 30, 3.2, t.css.paperInk);
    line(60, 13, 28, 0.9, t.css.paperRule);
    line(m, 20, 76, 0.4, t.css.paperRule);
    for (let i = 0; i < 3; i++) {
      line(m + i * 26, 25, 12, 0.8, t.css.paperRule);
      line(m + i * 26, 29, 20, 1.4, t.css.paperMuted);
    }
    for (let i = 0; i < 3; i++) {
      line(m + i * 26, 42, 12, 0.8, t.css.paperRule);
      line(m + i * 26, 47, 16, 3, t.css.paperInk);
    }
    line(m, 60, 76, 0.4, t.css.paperRule);
    for (let i = 0; i < 5; i++) {
      line(m, 66 + i * 8, 4, 1.2, t.css.paperMuted);
      line(m + 8, 66 + i * 8, 44 - (i % 3) * 8, 1.2, t.css.paperHairline);
      line(76, 66 + i * 8, 12, 1.2, t.css.paperMuted);
      line(m, 71 + i * 8, 76, 0.25, t.css.paperHairline);
    }
    line(m, 116, 76, 0.4, t.css.paperRule);
    line(m, 122, 24, 1.2, t.css.paperRule);
    line(64, 120, 24, 3.4, t.css.paperInk);
  } else if (kind === 'tender') {
    line(m, 14, 44, 3.4, t.css.paperInk);
    line(m, 21, 28, 1.2, t.css.paperRule);
    line(m, 28, 76, 0.4, t.css.paperRule);
    let y = 36;
    for (let block = 0; block < 4; block++) {
      line(m, y, 22, 1.6, t.css.paperMuted);
      y += 6;
      for (let i = 0; i < 5; i++) {
        line(m, y, i === 4 ? 40 : 76, 1, t.css.paperHairline);
        y += 3.6;
      }
      y += 5;
    }
    line(m, 132, 76, 0.4, t.css.paperRule);
    line(80, 135, 8, 1.2, t.css.paperMuted);
  } else {
    // Letterhead: margin at the keycap pitch, one rule, one inverted band.
    line(m, 10, 20, 4.2, t.css.paperInk);
    line(66, 10, 22, 0.9, t.css.paperMuted);
    line(66, 13, 16, 0.9, t.css.paperMuted);
    line(m, 24, 76, 0.4, t.css.paperRule);
    line(m, 28, 14, 1, t.css.paperMuted);
    line(40, 28, 14, 1, t.css.paperMuted);
    let y = 40;
    for (let i = 0; i < 14; i++) {
      line(m, y, i % 5 === 4 ? 36 : 60, 1, t.css.paperHairline);
      y += i % 5 === 4 ? 7 : 3.6;
    }
    line(m, 108, 18, 2.2, t.css.paperInk);
    ctx.fillStyle = t.css.base900;
    ctx.fillRect(0, h - 11 * u, w, 11 * u);
    line(m, 141.4 - 6.4, 26, 0.9, t.css.readout);
    ctx.fillStyle = t.css.readout;
    for (let i = 0; i < 5; i++) ctx.fillRect((70 + i * 3.6) * u, h - 8.2 * u, 3 * u, 5 * u);
    ctx.fillStyle = t.css.base900;
    for (let i = 0; i < 5; i++) ctx.fillRect((70.8 + i * 3.6) * u, h - 7.2 * u, 1.4 * u, 3 * u);
  }
  return colourTexture(c, 16);
}

export interface MouseTextures {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

/** The top of a mouse, projected flat: seams, wheel, and the finish gone off the left button only. */
export function mouseTop(t: Tokens, size = 1024): MouseTextures {
  const w = Math.round(size * 0.62);
  const [c, ctx] = canvas(w, size);
  const [rc, rctx] = canvas(w, size);
  ctx.fillStyle = t.css.readout;
  ctx.fillRect(0, 0, w, size);
  // Seams, in base-900: the split between the buttons and the line behind them.
  ctx.strokeStyle = t.css.base900;
  ctx.lineWidth = size * 0.007;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, size * 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, size * 0.36);
  ctx.quadraticCurveTo(w / 2, size * 0.46, w, size * 0.36);
  ctx.stroke();
  // Wheel: a slot in base-900 with a ridged wheel in rule.
  ctx.fillStyle = t.css.base900;
  ctx.fillRect(w / 2 - w * 0.07, size * 0.11, w * 0.14, size * 0.19);
  ctx.fillStyle = t.css.rule;
  ctx.fillRect(w / 2 - w * 0.045, size * 0.125, w * 0.09, size * 0.16);
  ctx.fillStyle = t.css.hairline;
  for (let i = 0; i < 9; i++) ctx.fillRect(w / 2 - w * 0.045, size * (0.132 + i * 0.0172), w * 0.09, size * 0.006);

  const img = ctx.getImageData(0, 0, w, size);
  const rough = rctx.createImageData(w, size);
  const noise = fbm(41);
  const fine = fbm(97);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x / w;
      const ny = y / size;
      const n = noise(nx * 4, ny * 6.5);
      const f = fine(nx * 18, ny * 28);
      // Left button only: where the index finger rests and clicks.
      const d = Math.hypot((nx - 0.25) * 1.5, (ny - 0.2) * 1.0);
      const onLeft = nx < 0.485 && ny < 0.4 + (nx - 0.5) * (nx - 0.5) * -0.16 ? 1 : 0;
      const m = onLeft * (1 - smoothstep(0.1, 0.27, d + (n - 0.5) * 0.24));
      const i = (y * w + x) * 4;
      // Worn plastic is a shade darker and smooth; the rest keeps its matte finish.
      const k = 1 - m * 0.2 * smoothstep(0.2, 0.7, m + (f - 0.5) * 0.4);
      img.data[i] *= k;
      img.data[i + 1] *= k;
      img.data[i + 2] *= k;
      const r = 0.8 - m * 0.62 + (f - 0.5) * 0.06;
      const v = Math.round(Math.min(1, Math.max(0.1, r)) * 255);
      rough.data[i] = rough.data[i + 1] = rough.data[i + 2] = v;
      rough.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  rctx.putImageData(rough, 0, 0);
  return { map: colourTexture(c, 16), roughnessMap: dataTexture(rc) };
}
