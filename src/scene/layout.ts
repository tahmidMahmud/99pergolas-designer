/**
 * Converts a PergolaDesign + Structure (inches, origin front-left) into scene meters
 * (origin = footprint center at ground; front edge at +z, back/house at −z, left at −x).
 */
import type { PergolaDesign, SideId, Structure } from '../types';
import { IN } from './units';

export interface PostL {
  x: number;
  z: number;
  size: number;
  top: number;
  kind: Structure['posts'][number]['kind'];
}

export interface BayL {
  /** Inner clear rectangle, meters. */
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  /** Blade count for this bay. */
  count: number;
}

export interface SegmentL {
  side: SideId;
  /** Center position in scene meters (on the post line). */
  cx: number;
  cz: number;
  length: number;
  /** Yaw so local +z points outward. */
  ry: number;
}

export interface PergolaLayout {
  W: number;
  D: number;
  H: number;
  bd: number;
  bw: number;
  ps: number;
  top: number;
  hasHouse: boolean;
  posts: PostL[];
  bays: BayL[];
  segments: SegmentL[];
  /** Blade dims, meters. */
  bladeW: number;
  pitch: number;
  axis: 'x' | 'z';
  baysX: number;
  baysZ: number;
}

const SIDE_RY: Record<SideId, number> = { front: 0, back: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 };

export function computeLayout(d: PergolaDesign, s: Structure): PergolaLayout {
  const W = d.width * IN;
  const D = d.depth * IN;
  const H = d.height * IN;
  const bd = s.beamDepth * IN;
  const bw = s.beamWidth * IN;
  const ps = s.postSize * IN;
  const sx = (x: number) => (x - d.width / 2) * IN;
  const sz = (z: number) => (d.depth / 2 - z) * IN;
  const hasHouse = d.mounting === 'attached' || d.mounting === 'floating';
  const half = s.postSize / 2;
  const cx = (x: number) => Math.min(d.width - half, Math.max(half, x));
  const cz = (z: number) => Math.min(d.depth - half, Math.max(half, z));

  const posts: PostL[] = s.posts.map((p) => {
    const inset = p.kind === 'inset';
    return {
      x: sx(cx(p.x)),
      z: sz(inset ? p.z : cz(p.z)),
      size: inset ? ps * 0.72 : ps,
      top: inset ? H + 0.01 : H + bd - 0.02,
      kind: p.kind,
    };
  });

  // Bays (inner clear area between beams).
  const bx = Math.max(1, s.baysX);
  const bz = Math.max(1, s.baysZ);
  const bays: BayL[] = [];
  // louverCount is the total across bays (equal splits), see config/rules.ts bayLayout().
  const perBay = d.roof === 'solid' ? 0 : Math.round(s.louverCount / (bx * bz));
  for (let i = 0; i < bx; i++) {
    for (let j = 0; j < bz; j++) {
      const xa = -W / 2 + (i * W) / bx + (i === 0 ? bw : bw / 2);
      const xb = -W / 2 + ((i + 1) * W) / bx - (i === bx - 1 ? bw : bw / 2);
      const za = D / 2 - (j * D) / bz - (j === 0 ? bw : bw / 2);
      const zb = D / 2 - ((j + 1) * D) / bz + (j === bz - 1 ? bw : bw / 2);
      bays.push({ x0: xa, x1: xb, z0: Math.min(za, zb), z1: Math.max(za, zb), count: perBay });
    }
  }

  // Enclosure segments per side (inches first, then meters).
  const tol = 1.5;
  const rawPosts = s.posts.map((p) => ({ x: cx(p.x), z: p.kind === 'inset' ? p.z : cz(p.z), size: p.kind === 'inset' ? s.postSize * 0.72 : s.postSize }));
  const zsFront = rawPosts.filter((p) => p.z < d.depth / 2);
  const zsBack = rawPosts.filter((p) => p.z > d.depth / 2);
  const frontZ = zsFront.length ? Math.min(...zsFront.map((p) => p.z)) : s.beamWidth / 2;
  const backZ = hasHouse ? d.depth : zsBack.length ? Math.max(...zsBack.map((p) => p.z)) : d.depth - s.beamWidth / 2;
  const leftX = Math.min(...rawPosts.map((p) => p.x), half);
  const rightX = Math.max(...rawPosts.map((p) => p.x), d.width - half);

  const segments: SegmentL[] = [];
  const addLine = (side: SideId, fixed: number, from: number, to: number, along: 'x' | 'z') => {
    const pts = rawPosts
      .filter((p) => Math.abs((along === 'x' ? p.z : p.x) - fixed) < tol)
      .map((p) => ({ pos: along === 'x' ? p.x : p.z, half: p.size / 2 }))
      .filter((p) => p.pos >= from - tol && p.pos <= to + tol)
      .sort((a, b) => a.pos - b.pos);
    if (!pts.length || pts[0].pos - pts[0].half > from + 2) pts.unshift({ pos: from, half: 0 });
    const last = pts[pts.length - 1];
    if (last.pos + last.half < to - 2) pts.push({ pos: to, half: 0 });
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k].pos + pts[k].half;
      const b = pts[k + 1].pos - pts[k + 1].half;
      if (b - a < 6) continue;
      const mid = (a + b) / 2;
      const len = (b - a) * IN;
      if (along === 'x') segments.push({ side, cx: sx(mid), cz: sz(fixed), length: len, ry: SIDE_RY[side] });
      else segments.push({ side, cx: sx(fixed), cz: sz(mid), length: len, ry: SIDE_RY[side] });
    }
  };
  const sides = d.sides ?? {};
  if (sides.front?.type && sides.front.type !== 'none') addLine('front', frontZ, leftX - half, rightX + half, 'x');
  if (!hasHouse && sides.back?.type && sides.back.type !== 'none') addLine('back', backZ, leftX - half, rightX + half, 'x');
  if (sides.left?.type && sides.left.type !== 'none') addLine('left', leftX, frontZ - (zsFront.length ? half : 0), backZ + (hasHouse ? 0 : half), 'z');
  if (sides.right?.type && sides.right.type !== 'none') addLine('right', rightX, frontZ - (zsFront.length ? half : 0), backZ + (hasHouse ? 0 : half), 'z');

  return {
    W,
    D,
    H,
    bd,
    bw,
    ps,
    top: H + bd,
    hasHouse,
    posts,
    bays,
    segments,
    bladeW: s.bladeWidth * IN,
    pitch: s.louverPitch * IN,
    axis: s.louverAxis,
    baysX: bx,
    baysZ: bz,
  };
}

/** 0 = full day, 1 = full night. Night is hour ≥ 19 per spec, with a short dusk ramp. */
export function nightFactor(hour: number): number {
  if (hour >= 19.5) return 1;
  if (hour >= 18.5) return (hour - 18.5) / 1;
  return 0;
}
export const isNight = (hour: number) => hour >= 19;
