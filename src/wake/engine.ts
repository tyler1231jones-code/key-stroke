// The wake. The homepage hero is a keyboard seen from overhead, and it carries
// on under the headline, in the dark. The pointer leaves a liquid trail that
// shows it: the keys the trail passes over light up, then go dark again as
// the trail thins. A click sends one ring out through them, and so does the
// hero's own greeting when the page arrives.
//
// It belongs to the hero and nothing else. It is drawn only inside the hero,
// behind the headline, on the grid the hero's own 3D field comes to rest on
// (the same pitch, the same rows, measured from the worn key), so once the
// camera has pulled back the ghost keys carry the real keyboard on under the
// headline. As the hero's scroll sequence drops its
// keys away the wake fades with them, and from there down the page there is
// no wake at all.
//
// One fixed canvas above the 3D stage and below the hero's copy. It writes
// colour with no alpha, which a premultiplied canvas adds to what is behind
// it, so it can only add light and costs the browser no blending pass. Two
// small shader passes:
//
//   1. The trail. A low-resolution field holding how much trail is at each
//      point and which way it is moving. Each frame it drifts, spreads a
//      little, thins, follows the hero when the page moves it, and takes a
//      new stroke along the pointer's path.
//   2. The picture. Where the trail is thick enough, the keyboard is drawn.
//      Each key reads the trail at its own centre to know how lit it is.
//
// It runs only while there is trail on screen, and the canvas is hidden the
// rest of the time. Colours are read from the design tokens.
import { bus, HERO } from '../scripts/bus';

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const NOISE = `
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}`;

// rg: the trail's movement in CSS pixels a second. b: how much trail.
const TRAIL = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPrev;
uniform vec2 uSize;
uniform float uDt, uTime, uScrollDy, uStamp, uRadius;
uniform vec2 uA, uB, uVel;
uniform vec4 uRing[4];
${NOISE}
void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  vec2 px = 1.0 / vec2(textureSize(uPrev, 0));
  vec2 here = texture(uPrev, vUv).rg;
  float t = uTime * 0.22;
  vec2 drift = (vec2(vnoise(p * 0.006 + vec2(t, 0.0)), vnoise(p * 0.006 + vec2(7.3, -t))) - 0.5) * 44.0;
  // Where this point's trail was a frame ago: carried by its own movement, a slow drift, and the page.
  vec2 src = p - (here + drift) * uDt + vec2(0.0, uScrollDy);
  vec2 uv = vec2(src.x / uSize.x, 1.0 - src.y / uSize.y);
  vec4 s = texture(uPrev, uv);
  vec4 n = (texture(uPrev, uv + vec2(px.x, 0.0)) + texture(uPrev, uv - vec2(px.x, 0.0)) + texture(uPrev, uv + vec2(0.0, px.y)) + texture(uPrev, uv - vec2(0.0, px.y))) * 0.25;
  s = mix(s, n, 0.2);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) s = vec4(0.0);
  float d = max(0.0, s.b * exp(-uDt * 1.7) - uDt * 0.04);
  vec2 vel = s.rg * exp(-uDt * 2.6);

  // The new stroke: the pointer's path since the last frame.
  vec2 ab = uB - uA;
  float h = clamp(dot(p - uA, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
  float dist = length(p - uA - ab * h);
  float stroke = exp(-dist * dist / (uRadius * uRadius)) * uStamp;
  d = max(d, stroke * 1.12);
  vel += uVel * stroke * 0.09;

  // Rings: from a click, and from the hero's greeting. A ring is a band that widens a little as it travels.
  for (int i = 0; i < 4; i++) {
    vec4 r = uRing[i];
    if (r.w <= 0.0) continue;
    float e = abs(length(p - r.xy) - r.z);
    float band = 30.0 + r.z * 0.05;
    d = max(d, exp(-e * e / (band * band)) * r.w);
  }

  float speed = length(vel);
  if (speed > 220.0) vel *= 220.0 / speed;
  o = vec4(vel, min(d, 1.3), 1.0);
}`;

const PICTURE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uTrail;
uniform vec2 uSize, uAnchor;
uniform float uPitch, uLive, uBase, uTime, uGain;
uniform vec4 uFrame, uField;
// The copy's corner: its right edge and its foot, from the worn key. z is 1 when keys were left out for it.
uniform vec3 uCopy;
// The sizes a key passes through as the camera pulls back, close in to far out.
uniform float uPath[15];
uniform vec3 uSide, uFace;
${NOISE}
float box(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float stagger(float row) {
  float r4 = mod(row, 4.0);
  return r4 < 0.5 ? 0.0 : r4 < 1.5 ? 0.5 : r4 < 2.5 ? 0.25 : 0.75;
}
// Is there a real key at this place in the grid? The same rule the 3D scene lays its field out by:
// inside the frame, and never crossing the copy's corner at any distance of the pull-back.
bool real(float col, float row) {
  float st = stagger(row);
  if (row == 0.0 && col == 0.0) return true; // the worn key
  if (uField.z <= uField.x) return false; // no 3D field at all
  if (row < floor(uField.y / uPitch) - 1.0 || row > ceil(uField.w / uPitch) + 1.0) return false;
  if (col < floor(uField.x / uPitch) - 2.0 || col > ceil(uField.z / uPitch) + 2.0) return false;
  if (uCopy.z < 0.5) return true;
  vec2 k = vec2(col + st, row);
  for (int i = 0; i < 15; i++) {
    float sc = uPath[i];
    vec2 c = k * sc;
    float hf = sc * 0.5;
    if (c.x - hf < uCopy.x && c.y + hf > uField.y && c.y - hf < uCopy.y) return false;
  }
  return true;
}
void main() {
  float m = texture(uTrail, vUv).b;
  if (m < 0.03) { o = vec4(0.0); return; }
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uSize;

  // The edge of the trail: a hard, liquid line that wobbles a little.
  float wobble = (vnoise(p * 0.016 + uTime * 0.3) - 0.5) * 0.09;
  float a = smoothstep(0.17, 0.24, m + wobble);
  // Only inside the hero, with a soft foot so nothing of it reaches the section below.
  vec2 lo = uFrame.xy, hi = uFrame.xy + uFrame.zw;
  a *= step(lo.x, p.x) * step(p.x, hi.x) * step(lo.y, p.y) * (1.0 - smoothstep(hi.y - 56.0, hi.y - 4.0, p.y));
  a *= uGain;
  if (a <= 0.0) { o = vec4(0.0); return; }
  // A thin bright line where the trail ends, like the edge of a liquid.
  float lip = smoothstep(0.17, 0.215, m + wobble) * (1.0 - smoothstep(0.215, 0.26, m + wobble));

  // Where a real key is on screen now, the wake keeps off it: only the liquid's edge crosses it.
  vec2 kl = (p - uAnchor) / uLive;
  float rowL = floor(kl.y + 0.5);
  float colL = floor(kl.x - stagger(rowL) + 0.5);
  vec2 cl = vec2(colL + stagger(rowL), rowL);
  // A key as the camera sees it: its top where it is, its foot a little smaller and a little nearer the worn key.
  float shape = min(box(kl - cl, vec2(0.34), 0.08), box(kl - cl * uBase, vec2(0.475 * uBase), 0.06));
  float cover = 1.0 - smoothstep(-0.012, 0.012, shape);
  if (cover > 0.0 && real(colL, rowL)) {
    a *= 1.0 - cover;
    if (a <= 0.0) { o = vec4(uSide * 0.1 * lip * uGain, 0.0); return; }
  }

  // The rest of the keyboard: the keys the field left out, on the grid it comes to rest on.
  vec2 k = (p - uAnchor) / uPitch;
  float row = floor(k.y + 0.5);
  float st = stagger(row);
  float col = floor(k.x - st + 0.5);
  if (real(col, row)) { o = vec4(uSide * 0.1 * lip * a, 0.0); return; }
  vec2 l = k - vec2(col + st, row);

  // How lit this key is: the trail at its centre.
  vec2 cv = uAnchor + vec2(col + st, row) * uPitch;
  float press = smoothstep(0.3, 1.0, texture(uTrail, vec2(cv.x / uSize.x, 1.0 - cv.y / uSize.y)).b);

  float aa = 1.2 / uPitch;
  float body = box(l, vec2(0.455), 0.08);
  vec2 lf = (l + vec2(0.0, 0.014)) / (1.0 - press * 0.05);
  float face = box(lf, vec2(0.33), 0.075);
  float inBody = 1.0 - smoothstep(-aa, aa, body);
  float inFace = 1.0 - smoothstep(-aa, aa, face);

  // Sides catch a flat light from above and to the left. The face is dished, and lights as the trail covers it.
  float lit = clamp(0.55 + 0.45 * dot(normalize(l + 0.0001), normalize(vec2(-0.45, -0.9))), 0.0, 1.0);
  vec3 side = uSide * mix(0.13, 0.42, lit);
  float dish = 1.0 - dot(lf, lf) * 1.1;
  vec3 top = uFace * mix(0.09, 0.4, press) * dish;
  top += uFace * (0.05 + 0.14 * press) * smoothstep(0.035, 0.0, abs(face));
  vec3 colour = mix(side, top, inFace) * inBody;

  // Brightest where the trail is thickest, like a torch held over the keys.
  colour *= 0.4 + 0.6 * smoothstep(0.17, 0.95, m);
  colour += uSide * 0.22 * lip;
  // Colour with no alpha: on a premultiplied canvas that is light added to whatever is behind, and nothing taken away.
  o = vec4(colour * a, 0.0);
}`;

interface Ring {
  x: number;
  /** Measured from the top of the hero, so a ring stays where it was made if the page moves. */
  y: number;
  t0: number;
  reach: number;
  life: number;
  strength: number;
}

/** What the hero sends when it greets: a ring from the worn key, in viewport pixels. */
export interface RingDetail {
  x: number;
  y: number;
  reach?: number;
  life?: number;
  strength?: number;
}

const RING_LIFE = 0.8;
const RING_REACH = 330;
const IDLE_AFTER = 3200;
/** With no 3D scene to take the grid from, a key is this wide. */
const PITCH = 76;
const CONTROLS = 'a, button, input, select, textarea, summary, label';

const span = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function colour(name: string): [number, number, number] {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(v)?.[1];
  if (!hex) return [0.5, 0.5, 0.5];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function program(gl: WebGL2RenderingContext, frag: string): WebGLProgram | null {
  const make = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('wake: shader did not compile', gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };
  const vs = make(gl.VERTEX_SHADER, VERT);
  const fs = make(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const p = gl.createProgram()!;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  return p;
}

/** Start the wake in the homepage hero. `first` is the pointer event that woke it, if one did, so the trail starts where the pointer is. */
export function startWake(first?: PointerEvent): void {
  const hero = document.getElementById('hero');
  const slot = hero?.querySelector<HTMLElement>('.hero-slot');
  if (!hero || !slot) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'wake';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  // The trail needs a float texture it can draw into. Without one, the page simply has no wake.
  if (!gl || !(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) return;
  const trail = program(gl, TRAIL);
  const picture = program(gl, PICTURE);
  if (!trail || !picture) return;
  const U = (p: WebGLProgram, names: string[]) => Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)])) as Record<string, WebGLUniformLocation | null>;
  const ut = U(trail, ['uPrev', 'uSize', 'uDt', 'uTime', 'uScrollDy', 'uStamp', 'uRadius', 'uA', 'uB', 'uVel', 'uRing']);
  const up = U(picture, ['uTrail', 'uSize', 'uAnchor', 'uPitch', 'uLive', 'uBase', 'uTime', 'uGain', 'uFrame', 'uField', 'uCopy', 'uPath', 'uSide', 'uFace']);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const side = colour('--rule');
  const face = colour('--readout');
  // Straight after the 3D stage in the document: above its keys, below the hero's copy.
  const stage = document.getElementById('stage');
  if (stage) stage.after(canvas);
  else document.body.prepend(canvas);

  let width = 1;
  let height = 1;
  let targets: { tex: WebGLTexture; fbo: WebGLFramebuffer }[] = [];
  let read = 0;

  function target(w: number, h: number) {
    const tex = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA16F, w, h, 0, gl!.RGBA, gl!.HALF_FLOAT, null);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    const fbo = gl!.createFramebuffer()!;
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    return { tex, fbo };
  }

  function measure(): void {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    // The trail is soft, so a sixth of the resolution holds it.
    const tw = Math.max(16, Math.round(width / 6));
    const th = Math.max(16, Math.round(height / 6));
    for (const t of targets) {
      gl!.deleteTexture(t.tex);
      gl!.deleteFramebuffer(t.fbo);
    }
    targets = [target(tw, th), target(tw, th)];
    read = 0;
  }

  /** How strong the wake is: whole while the keyboard is there, fading out as the scroll sequence drops the keys away. */
  const gain = () => 1 - inOut(span(bus.hero.p, HERO.drop[0], HERO.drop[1]));
  /** The part of the hero on screen. */
  const inHero = (x: number, y: number) => {
    const r = hero.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= Math.max(0, r.top) && y <= r.bottom;
  };

  // The pointer: where it is, where the last stroke ended, and how fast it is going.
  const ptr = { x: first?.clientX ?? -1, y: first?.clientY ?? -1, lastX: first?.clientX ?? -1, lastY: first?.clientY ?? -1, vx: 0, vy: 0, moved: false, on: false };
  const rings: Ring[] = [];
  let running = false;
  let dead = false;
  let lastFrame = 0;
  let lastActive = performance.now();
  let lastTop = 0;
  let raf = 0;
  // A computer that cannot keep up loses the wake rather than its scrolling: 40 slow frames in a row turns it off for this page.
  let slowRun = 0;
  // ?debug keeps it running on a slow machine, so the tools can look at it on a software renderer.
  const debug = new URLSearchParams(location.search).has('debug');

  function wake(): void {
    lastActive = performance.now();
    if (running || dead || document.hidden) return;
    running = true;
    lastFrame = 0;
    lastTop = hero!.getBoundingClientRect().top;
    canvas.style.visibility = 'visible';
    raf = requestAnimationFrame(frame);
  }

  function rest(): void {
    running = false;
    cancelAnimationFrame(raf);
    canvas.style.visibility = 'hidden';
    ptr.on = false;
    rings.length = 0;
    // Nothing is left of the trail by now; clear it so the next one starts clean.
    for (const t of targets) {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, t.fbo);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
    }
  }

  const ringData = new Float32Array(16);
  const path = new Float32Array(15);

  function frame(now: number): void {
    if (!running) return;
    const gap = lastFrame ? now - lastFrame : 16;
    const dt = Math.min(0.05, gap / 1000);
    lastFrame = now;
    slowRun = gap > 42 && gap < 250 ? slowRun + 1 : 0;
    if (slowRun > 40 && !debug) {
      dead = true;
      rest();
      canvas.remove();
      return;
    }
    const box = hero!.getBoundingClientRect();
    const g = gain();
    // The keys have dropped away, or the hero has left the screen: there is nothing here to light.
    if (g <= 0.001 || box.bottom <= 0 || box.top >= height) {
      rest();
      return;
    }
    // The trail belongs to the hero: it stays put while the hero is pinned, and moves with it when it is not.
    const scrollDy = lastTop - box.top;
    lastTop = box.top;

    // This frame's stroke.
    const stamp = ptr.moved && ptr.on ? 1 : 0;
    const dx = ptr.x - ptr.lastX;
    const dy = ptr.y - ptr.lastY;
    if (stamp) {
      ptr.vx += (dx / dt - ptr.vx) * 0.5;
      ptr.vy += (dy / dt - ptr.vy) * 0.5;
    } else {
      ptr.vx *= 0.8;
      ptr.vy *= 0.8;
    }
    const speed = Math.hypot(ptr.vx, ptr.vy);
    // The 3D field's grid when the scene is running, so once the camera has pulled back a ghost key and a real one line up.
    const grid = bus.hero.grid;
    const pitch = grid?.pitch ?? PITCH;
    const radius = 34 + Math.min(34, speed * 0.024);

    ringData.fill(0);
    for (let i = rings.length - 1; i >= 0; i--) if (now - rings[i].t0 > rings[i].life * 1000) rings.splice(i, 1);
    rings.slice(-4).forEach((r, i) => {
      const age = (now - r.t0) / 1000 / r.life;
      // A click's ring is quick. The greeting's travels the whole hero, so it goes more evenly and holds its strength longer.
      const long = r.life > 1;
      const eased = 1 - Math.pow(1 - age, long ? 1.6 : 3);
      ringData.set([r.x, r.y + box.top, 24 + r.reach * eased, (long ? Math.min(1, (1 - age) * 2.2) : 1 - age) * r.strength], i * 4);
    });

    const write = 1 - read;
    gl!.bindVertexArray(vao);
    gl!.disable(gl!.BLEND);

    // 1. The trail.
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, targets[write].fbo);
    gl!.viewport(0, 0, Math.max(16, Math.round(width / 6)), Math.max(16, Math.round(height / 6)));
    gl!.useProgram(trail);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, targets[read].tex);
    gl!.uniform1i(ut.uPrev, 0);
    gl!.uniform2f(ut.uSize, width, height);
    gl!.uniform1f(ut.uDt, dt);
    gl!.uniform1f(ut.uTime, now / 1000);
    gl!.uniform1f(ut.uScrollDy, scrollDy);
    gl!.uniform1f(ut.uStamp, stamp);
    gl!.uniform1f(ut.uRadius, radius);
    gl!.uniform2f(ut.uA, ptr.lastX, ptr.lastY);
    gl!.uniform2f(ut.uB, ptr.x, ptr.y);
    gl!.uniform2f(ut.uVel, ptr.vx, ptr.vy);
    gl!.uniform4fv(ut.uRing, ringData);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    read = write;
    if (stamp) {
      ptr.lastX = ptr.x;
      ptr.lastY = ptr.y;
      ptr.moved = false;
    }

    // 2. The picture.
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.useProgram(picture);
    gl!.bindTexture(gl!.TEXTURE_2D, targets[read].tex);
    gl!.uniform1i(up.uTrail, 0);
    gl!.uniform2f(up.uSize, width, height);
    // The worn key sits in the middle of its slot, and is the key at row 0, column 0.
    const s = slot!.getBoundingClientRect();
    gl!.uniform2f(up.uAnchor, s.left + s.width / 2, s.top + s.height / 2);
    gl!.uniform1f(up.uPitch, pitch);
    // With no 3D scene the only real key is the drawn one in the slot, at its close-in size.
    const macro = grid?.macro ?? (0.8 * Math.min(s.width, s.height)) / 0.94;
    gl!.uniform1f(up.uLive, grid?.scale ?? macro);
    gl!.uniform1f(up.uBase, grid?.base ?? 0.94);
    if (grid) gl!.uniform4f(up.uField, grid.frame[0], grid.frame[1], grid.frame[2], grid.frame[3]);
    else gl!.uniform4f(up.uField, 0, 0, 0, 0);
    gl!.uniform3f(up.uCopy, grid?.copy?.[0] ?? 0, grid?.copy?.[1] ?? 0, grid?.copy ? 1 : 0);
    for (let i = 0; i < 15; i++) path[i] = Math.exp(Math.log(pitch) + (Math.log(macro) - Math.log(pitch)) * (i / 14));
    gl!.uniform1fv(up.uPath, path);
    gl!.uniform1f(up.uTime, now / 1000);
    gl!.uniform1f(up.uGain, g);
    gl!.uniform4f(up.uFrame, box.left, box.top, box.width, box.height);
    gl!.uniform3fv(up.uSide, side);
    gl!.uniform3fv(up.uFace, face);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    if (stamp || rings.length) lastActive = now;
    if (now - lastActive > IDLE_AFTER) rest();
    else raf = requestAnimationFrame(frame);
  }

  function ring(x: number, y: number, reach = RING_REACH, life = RING_LIFE, strength = 0.95): void {
    if (gain() <= 0.001) return;
    rings.push({ x, y: y - hero!.getBoundingClientRect().top, t0: performance.now(), reach, life, strength });
    wake();
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      // Outside the hero there is no wake: the next stroke starts where the pointer comes back in.
      if (!inHero(e.clientX, e.clientY) || gain() <= 0.001) {
        ptr.on = false;
        return;
      }
      if (!ptr.on) {
        ptr.lastX = e.clientX;
        ptr.lastY = e.clientY;
        ptr.on = true;
      }
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.moved = true;
      wake();
    },
    { passive: true },
  );
  // The pointer left the window: the next stroke starts where it comes back in.
  document.documentElement.addEventListener('pointerleave', () => { ptr.on = false; });
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || !inHero(e.clientX, e.clientY)) return;
      // A click on a link, a button or a field is that control's, not the keyboard's.
      if ((e.target as Element | null)?.closest?.(CONTROLS)) return;
      ring(e.clientX, e.clientY);
    },
    { passive: true },
  );
  // The hero's greeting: the worn key presses itself and a ring goes out from it.
  window.addEventListener('ks:ring', (e) => {
    const d = (e as CustomEvent<RingDetail>).detail;
    if (d) ring(d.x, d.y, d.reach, d.life, d.strength);
  });
  window.addEventListener('resize', () => { measure(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && running) rest(); });
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    dead = true;
    running = false;
    cancelAnimationFrame(raf);
    canvas.remove();
  });

  measure();
  if (first && inHero(first.clientX, first.clientY)) {
    ptr.on = true;
    ptr.moved = true;
    wake();
  }
}
