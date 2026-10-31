/** The pergola: posts, perimeter gutter-beams, ledger/brackets, cantilever arms, mid beams, solid roof. */
import { useMemo } from 'react';
import * as THREE from 'three';
import type { PergolaDesign, Structure } from '../types';
import type { PergolaLayout } from './layout';
import { box, extrudeAlong, roundedBox, type Part } from './parts';
import { colorHex, pcKey } from './materials';
import { IN } from './units';
import { MergedMeshes } from './MergedMeshes';
import { Louvers } from './Louvers';
import { Enclosures } from './Enclosures';
import { Accessories } from './Accessories';
import { Dimensions } from './Dimensions';
import { House } from './House';

/** Gutter-beam cross-section: u = outward from the inner face, v = up from the beam bottom (meters). */
function beamProfile(bw: number, bd: number): THREE.Shape {
  const i = IN;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(bw, 0);
  s.lineTo(bw, bd - 0.8 * i);
  s.lineTo(bw + 0.35 * i, bd - 0.8 * i); // drip lip
  s.lineTo(bw + 0.35 * i, bd);
  s.lineTo(bw - 0.5 * i, bd);
  s.lineTo(bw - 0.5 * i, bd - 2.2 * i); // gutter channel floor
  s.lineTo(0.7 * i, bd - 2.2 * i);
  s.lineTo(0.7 * i, bd - 1.2 * i);
  s.lineTo(0, bd - 1.2 * i);
  s.closePath();
  return s;
}

/** Tapered cantilever arm in the side plane: deep at the back posts, beam-deep at the front. */
function armProfile(len: number, bd: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(len * 0.45, 0);
  s.lineTo(len, -bd * 0.9);
  s.lineTo(len, bd);
  s.lineTo(0, bd);
  s.closePath();
  return s;
}

export function buildFrame(d: PergolaDesign, L: PergolaLayout): Part[] {
  const frame = pcKey(colorHex(d.frameColor, d.customRal));
  const roofKey = pcKey(colorHex(d.louverColor, d.customRal));
  const parts: Part[] = [];
  const push = (geo: THREE.BufferGeometry, mat = frame) => parts.push({ geo, mat });
  const { W, D, H, bd, bw } = L;

  // Posts + base plates.
  for (const p of L.posts) {
    const plate = 7.7 * IN * (p.kind === 'inset' ? 0.8 : 1);
    push(roundedBox(p.size, p.top - 0.3 * IN, p.size, p.x, (p.top + 0.3 * IN) / 2, p.z));
    push(box(plate, 0.3 * IN, plate, p.x, 0.15 * IN, p.z));
  }

  // Perimeter gutter-beams. Front/back run full width; sides run between them.
  const prof = beamProfile(bw, bd);
  push(extrudeAlong(prof, W, new THREE.Vector3(0, H, D / 2 - bw), new THREE.Vector3(0, 0, 1)));
  push(extrudeAlong(prof, W, new THREE.Vector3(0, H, -D / 2 + bw), new THREE.Vector3(0, 0, -1)));
  const sideLen = D - 2 * bw;
  if (d.mounting === 'cantilever') {
    // Two tapered arms replace the side beams.
    const arm = armProfile(sideLen, bd);
    for (const x of [-W / 2, W / 2 - bw]) {
      const g = new THREE.ExtrudeGeometry(arm, { depth: bw, bevelEnabled: false });
      const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
      m.setPosition(x, H, D / 2 - bw);
      g.applyMatrix4(m);
      g.deleteAttribute('uv');
      push(normalizeExtrude(g));
    }
  } else {
    push(extrudeAlong(prof, sideLen, new THREE.Vector3(-W / 2 + bw, H, 0), new THREE.Vector3(-1, 0, 0)));
    push(extrudeAlong(prof, sideLen, new THREE.Vector3(W / 2 - bw, H, 0), new THREE.Vector3(1, 0, 0)));
  }

  // Mid beams at bay lines.
  for (let i = 1; i < L.baysX; i++) {
    const x = -W / 2 + (i * W) / L.baysX;
    push(box(bw, bd * 0.96, D - 2 * bw, x, H + bd * 0.48, 0));
  }
  for (let j = 1; j < L.baysZ; j++) {
    const z = D / 2 - (j * D) / L.baysZ;
    push(box(W - 2 * bw, bd * 0.96, bw, 0, H + bd * 0.48, z));
  }

  // Wall bracket for the floating look: plate on the wall + diagonal strut under each side beam.
  if (d.mounting === 'floating') {
    for (const x of [-W / 2 + bw / 2, W / 2 - bw / 2]) {
      const plateH = 20 * IN;
      const zw = -D / 2;
      push(box(bw * 1.2, plateH, 0.5 * IN, x, H - plateH / 2 + 0.02, zw + 0.25 * IN));
      const run = 18 * IN;
      const rise = plateH - 2 * IN;
      const len = Math.hypot(run, rise);
      const ang = Math.atan2(rise, run);
      push(box(bw * 0.6, 1.5 * IN, len, x, H - rise / 2, zw + run / 2, -ang, 0, 0));
    }
  }

  // Louver end closures: fixed strips between the beam and the first/last blade (no light leak when closed).
  if (d.roof !== 'solid') {
    const y = L.H + L.bd * 0.62 + 0.25 * IN;
    for (const b of L.bays) {
      if (b.count <= 0) continue;
      const alongX = L.axis === 'x';
      const s0 = alongX ? b.z0 : b.x0;
      const s1 = alongX ? b.z1 : b.x1;
      const span = (b.count - 1) * L.pitch;
      const mid = (s0 + s1) / 2;
      const gap = mid - span / 2 - s0 - L.bladeW * 0.3; // beam face → just under the first blade
      if (gap < 0.2 * IN) continue;
      const len = alongX ? b.x1 - b.x0 : b.z1 - b.z0;
      const cLong = alongX ? (b.x0 + b.x1) / 2 : (b.z0 + b.z1) / 2;
      for (const c of [s0 + gap / 2, s1 - gap / 2]) {
        push(alongX ? box(len, 0.5 * IN, gap, cLong, y, c) : box(gap, 0.5 * IN, len, c, y, cLong), roofKey);
      }
    }
  }

  // Solid insulated roof: flat panel with a 2" fascia edge sitting on the beams.
  if (d.roof === 'solid') {
    const over = 1 * IN;
    push(box(W + 2 * over, 2 * IN, D + 2 * over, 0, L.top + 1 * IN, 0), roofKey);
    // Ribbed underside look: shallow panel inside the frame.
    push(box(W - 2 * bw, 0.6 * IN, D - 2 * bw, 0, L.top - 2.4 * IN, 0), roofKey);
  }
  return parts;
}

/** ExtrudeGeometry is non-indexed already; just ensure a uv attribute exists for merging. */
function normalizeExtrude(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const n = g.attributes.position.count;
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
  g.clearGroups();
  return g;
}

export function PergolaModel({ design, structure, layout }: { design: PergolaDesign; structure: Structure; layout: PergolaLayout }) {
  const parts = useMemo(() => buildFrame(design, layout), [design, layout]);
  void structure;
  return (
    <group>
      <MergedMeshes parts={parts} />
      {design.roof !== 'solid' && <Louvers design={design} layout={layout} />}
      <Enclosures design={design} layout={layout} />
      <Accessories design={design} layout={layout} />
      {layout.hasHouse && <House width={layout.W} backZ={-layout.D / 2} structureTop={layout.top} />}
      <Dimensions design={design} layout={layout} />
    </group>
  );
}
