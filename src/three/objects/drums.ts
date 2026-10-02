// An odometer drum row. Each drum is a narrow wheel with the digits 0 to 9
// around it, on a shared axle along X, seen square-on. One unit is the pitch
// between drums; the radius follows from the counter cell (76 by 104), ten
// digits to a turn.
import * as THREE from 'three';
import type { Tokens } from '../tokens';
import { drumStrip } from '../textures';

export const DRUM_WIDTH = 0.92; // a cell 76 wide by 104 tall, wrapped ten to a turn
export const DRUM_PITCH = 1.0;
export const DRUM_R = (DRUM_WIDTH * (104 / 76) * 10) / (Math.PI * 2);

function wheelGeometry(width: number, segments = 72): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const y = Math.cos(a);
    const z = Math.sin(a);
    const R = DRUM_R;
    for (const side of [0, 1]) {
      pos.push((side - 0.5) * width, y * R, z * R);
      nor.push(0, y, z);
      uv.push(side, 1 - i / segments);
    }
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    index.push(a, a + 3, a + 1, a, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}

export interface Drums {
  group: THREE.Group;
  /** One group per drum: the wheel and a rim on each side. Move these to open gaps in the row. */
  units: THREE.Group[];
  count: number;
  /** Turn a drum so that the given digit (may be fractional) faces the camera. */
  show(i: number, digit: number): void;
  dispose(): void;
}

export function makeDrums(t: Tokens, count: number): Drums {
  const group = new THREE.Group();
  const wheel = wheelGeometry(DRUM_WIDTH);
  const strip = drumStrip(t);
  const body = new THREE.MeshStandardMaterial({ map: strip, roughness: 0.62, metalness: 0 });
  const rim = new THREE.MeshStandardMaterial({ color: t.rule, roughness: 0.7, metalness: 0 });
  const rimW = (DRUM_PITCH - DRUM_WIDTH) / 2;
  const rimGeo = new THREE.CylinderGeometry(DRUM_R * 1.02, DRUM_R * 1.02, rimW, 64, 1, false);
  rimGeo.rotateZ(Math.PI / 2);
  const wheels: THREE.Mesh[] = [];
  const units: THREE.Group[] = [];
  for (let i = 0; i < count; i++) {
    const unit = new THREE.Group();
    const drum = new THREE.Mesh(wheel, body);
    unit.add(drum);
    for (const side of [-1, 1]) {
      const r = new THREE.Mesh(rimGeo, rim);
      r.position.x = side * (DRUM_WIDTH / 2 + rimW / 2);
      unit.add(r);
    }
    unit.position.x = (i - (count - 1) / 2) * DRUM_PITCH;
    group.add(unit);
    wheels.push(drum);
    units.push(unit);
  }
  return {
    group,
    units,
    count,
    show(i, digit) {
      // Digit d is centred at angle (d + 0.5) / 10 of a turn around the wheel.
      // The point facing the camera is at 90 degrees.
      wheels[i].rotation.x = Math.PI / 2 - ((digit + 0.5) / 10) * Math.PI * 2;
    },
    dispose() {
      wheel.dispose();
      rimGeo.dispose();
      strip.dispose();
      body.dispose();
      rim.dispose();
    },
  };
}
