/** Per-side enclosures: zip screens, glass, sliding/bifold shutters, fixed louvered panels. */
import { useMemo } from 'react';
import * as THREE from 'three';
import type { EnclosureType, PergolaDesign, SideConfig } from '../types';
import type { PergolaLayout, SegmentL } from './layout';
import { box, plane, sideMatrix, type Part } from './parts';
import { colorHex, fabricKey, pcKey } from './materials';
import { IN } from './units';
import { MergedMeshes } from './MergedMeshes';

type Push = (g: THREE.BufferGeometry, mat: string) => void;

/** Zip screen in local side frame (x along side centered, +z outward, y up). Exported for ScreensModel. */
export function buildScreen(push: Push, len: number, topY: number, frameKey: string, fabKey: string, dropFrac = 0.85, outward = 0) {
  const hs = 5 * IN; // housing 5" × 5"
  push(box(len + 1 * IN, hs, hs, 0, topY - hs / 2, outward), frameKey);
  const fabricTop = topY - hs;
  const bottom = Math.max(0.05, topY * (1 - dropFrac));
  const fh = Math.max(0.05, fabricTop - bottom);
  push(plane(len - 1.2 * IN, fh, 0, bottom + fh / 2, outward), fabKey);
  push(box(len - 1.2 * IN, 1.4 * IN, 1.2 * IN, 0, bottom, outward), frameKey); // bottom bar
  for (const sx of [-1, 1]) push(box(1.1 * IN, fabricTop, 1.6 * IN, sx * (len / 2 - 0.55 * IN), fabricTop / 2, outward), frameKey); // zip tracks
}

function buildGlass(push: Push, len: number, H: number, frameKey: string, framed: boolean) {
  const n = len > 3.2 ? 4 : 3;
  const pw = len / n + 1 * IN;
  const ph = H - 3.5 * IN;
  push(box(len, 2 * IN, 3.2 * IN, 0, H - 1 * IN, 0), frameKey); // top track
  push(box(len, 0.6 * IN, 3.2 * IN, 0, 0.3 * IN, 0), frameKey); // bottom track
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (i + 0.5) * (len / n);
    const z = (i % 2 ? -0.7 : 0.7) * IN;
    const y0 = 0.6 * IN;
    push(box(pw - (framed ? 3 : 0.2) * IN, ph, 0.4 * IN, x, y0 + ph / 2, z), 'glass');
    if (framed) {
      for (const sx of [-1, 1]) push(box(1.6 * IN, ph, 1.4 * IN, x + sx * (pw / 2 - 0.8 * IN), y0 + ph / 2, z), frameKey);
      push(box(pw, 2 * IN, 1.4 * IN, x, y0 + 1 * IN, z), frameKey);
      push(box(pw, 1.6 * IN, 1.4 * IN, x, y0 + ph - 0.8 * IN, z), frameKey);
    } else {
      push(box(0.8 * IN, 10 * IN, 0.8 * IN, x + pw / 2 - 2 * IN, 40 * IN, z + 0.6 * IN), frameKey); // small handle
    }
  }
}

/** Louvered panel in its own local frame (centered at x=0, bottom at y=0). */
function louverPanel(pw: number, ph: number, slatPitch: number, slatTilt: number): { geo: THREE.BufferGeometry; frame: boolean }[] {
  const out: { geo: THREE.BufferGeometry; frame: boolean }[] = [];
  const st = 2 * IN;
  out.push({ geo: box(st, ph, 1.5 * IN, -pw / 2 + st / 2, ph / 2, 0), frame: true });
  out.push({ geo: box(st, ph, 1.5 * IN, pw / 2 - st / 2, ph / 2, 0), frame: true });
  out.push({ geo: box(pw, 3 * IN, 1.5 * IN, 0, 1.5 * IN, 0), frame: true });
  out.push({ geo: box(pw, 3 * IN, 1.5 * IN, 0, ph - 1.5 * IN, 0), frame: true });
  const inner = ph - 6 * IN;
  const n = Math.max(1, Math.floor(inner / slatPitch));
  for (let k = 0; k < n; k++) {
    const y = 3 * IN + (k + 0.5) * (inner / n);
    out.push({ geo: box(pw - 2 * st, 0.22 * IN, 3 * IN, 0, y, 0, slatTilt, 0, 0), frame: true });
  }
  return out;
}

function buildShutters(push: Push, len: number, H: number, frameKey: string, type: EnclosureType) {
  const ph = H - 2.5 * IN;
  const m = new THREE.Matrix4();
  if (type === 'panel-fixed') {
    for (const p of louverPanel(len, ph, 2.6 * IN, 0.75)) push(p.geo, frameKey);
    return;
  }
  push(box(len, 2 * IN, 3.6 * IN, 0, H - 1 * IN, 0), frameKey); // overhead track
  if (type === 'shutter-sliding') {
    const n = len > 3.6 ? 3 : 2;
    const pw = len / n + 1 * IN;
    for (let i = 0; i < n; i++) {
      const x = -len / 2 + (i + 0.5) * (len / n);
      m.makeTranslation(x, 0.4 * IN, (i % 2 ? -1 : 1) * IN);
      for (const p of louverPanel(pw, ph, 3.2 * IN, 0.6)) push(p.geo.applyMatrix4(m), frameKey);
    }
    return;
  }
  // Bifold: 3 panels zig-zagged.
  const n = 3;
  const theta = 0.32;
  const seg = len / n;
  const pw = seg / Math.cos(theta);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (i + 0.5) * seg;
    m.makeRotationY(i % 2 ? theta : -theta).setPosition(x, 0.4 * IN, 0);
    for (const p of louverPanel(pw, ph, 3.2 * IN, 0.6)) push(p.geo.applyMatrix4(m), frameKey);
  }
}

export function buildSegment(push: Push, seg: SegmentL, cfg: SideConfig, H: number, frameHex: string, customRal?: string) {
  const colorHexStr = cfg.color ? colorHex(cfg.color, customRal) : frameHex;
  const frameKey = pcKey(colorHexStr);
  const mtx = sideMatrix(seg.cx, seg.cz, seg.ry);
  const local: { g: THREE.BufferGeometry; k: string }[] = [];
  const lp: Push = (g, k) => local.push({ g, k });
  switch (cfg.type) {
    case 'screen':
      buildScreen(lp, seg.length, H, frameKey, fabricKey(colorHexStr, cfg.fabric), 0.85, 0);
      break;
    case 'glass-frameless':
      buildGlass(lp, seg.length, H, pcKey(frameHex), false);
      break;
    case 'glass-framed':
      buildGlass(lp, seg.length, H, frameKey, true);
      break;
    case 'shutter-sliding':
    case 'shutter-bifold':
    case 'panel-fixed':
      buildShutters(lp, seg.length, H, frameKey, cfg.type);
      break;
    default:
      return;
  }
  for (const { g, k } of local) push(g.applyMatrix4(mtx), k);
}

export function Enclosures({ design, layout }: { design: PergolaDesign; layout: PergolaLayout }) {
  const parts = useMemo(() => {
    const out: Part[] = [];
    const frameHex = colorHex(design.frameColor, design.customRal);
    for (const seg of layout.segments) {
      const cfg = design.sides[seg.side];
      if (!cfg || cfg.type === 'none') continue;
      buildSegment((geo, mat) => out.push({ geo, mat }), seg, cfg, layout.H, frameHex, design.customRal);
    }
    return out;
  }, [design.sides, design.frameColor, design.customRal, layout]);
  if (!parts.length) return null;
  return <MergedMeshes parts={parts} />;
}
