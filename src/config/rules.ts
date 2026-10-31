/**
 * Structural rules, validation and clamping. Pure, deterministic, inches.
 *
 * Coordinate system for Structure.posts: origin at the FRONT-LEFT corner at ground level,
 * x along width (0 → width), z along depth (0 = front edge → depth = back / house wall).
 * Post positions are post CENTERS. Perimeter posts sit postSize/2 inside the footprint so the
 * outer faces of posts and beams are flush with the footprint edge.
 */
import type {
  ColorId,
  ControlType,
  Design,
  EnclosureType,
  FabricId,
  KitchenDesign,
  Line,
  LouverDirection,
  Mounting,
  PergolaDesign,
  RoofType,
  ScreenMountSurface,
  ScreensDesign,
  ShadeOpacity,
  ShadeOperation,
  ShadesDesign,
  ShadeStyle,
  SideConfig,
  SideId,
  Structure,
  ValidationMessage,
} from '../types';
import {
  COLORS,
  ENCLOSURES,
  FABRICS,
  KITCHEN,
  LINES,
  MAX_FANS_PER_BAY,
  MAX_HEATERS_PER_BAY,
  MOUNTINGS,
  SCREEN_LIMITS,
  SCREEN_SURFACES,
  SHADE_LIMITS,
  SHADE_OPACITIES,
  SHADE_OPERATIONS,
  SHADE_STYLES,
  SIZE_LIMITS,
} from './catalog';
import {
  CONFIG_DEFAULT_KITCHEN,
  CONFIG_DEFAULT_PERGOLA,
  CONFIG_DEFAULT_SCREENS,
  CONFIG_DEFAULT_SHADES,
  cloneDefault,
} from './defaults';
import { formatFtIn } from './format';

export const SIDE_IDS: SideId[] = ['front', 'back', 'left', 'right'];

export interface Range {
  min: number;
  max: number;
}

export interface SizeLimits {
  width: Range;
  depth: Range;
  height: Range;
}

/** One bay rectangle (inches, same origin as posts) with its louver count. */
export interface Bay {
  ix: number;
  iz: number;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  louverCount: number;
}

/* ------------------------------------------------------------------ */
/* Limits                                                              */
/* ------------------------------------------------------------------ */

/** Slider limits for the UI. Max is the multi-bay soft cap (40'), except cantilever depth (20'). */
export function limits(line: Line, mounting: Mounting): SizeLimits {
  const spec = LINES[line] ?? LINES.lux;
  return {
    width: { min: SIZE_LIMITS.min, max: SIZE_LIMITS.softCap },
    depth: {
      min: SIZE_LIMITS.min,
      max: mounting === 'cantilever' ? SIZE_LIMITS.cantileverMaxDepth : SIZE_LIMITS.softCap,
    },
    height: { min: SIZE_LIMITS.minHeight, max: spec.maxHeight },
  };
}

/* ------------------------------------------------------------------ */
/* Sides                                                               */
/* ------------------------------------------------------------------ */

/** Whether an enclosure may be put on a side for this mounting (back = house wall / post line). */
export function sideAllowed(mounting: Mounting, side: SideId): boolean {
  if (side !== 'back') return true;
  return mounting === 'freestanding';
}

/** Why a side is disabled (for the UI), or null when allowed. */
export function sideDisabledReason(mounting: Mounting, side: SideId): string | null {
  if (sideAllowed(mounting, side)) return null;
  if (mounting === 'cantilever') return 'The back of a cantilever cover is the post line — no enclosure there.';
  return 'This side is against your house wall.';
}

/** Run length of a side, inches: front/back = width, left/right = depth. */
export function sideLength(design: Pick<PergolaDesign, 'width' | 'depth'>, side: SideId): number {
  return side === 'front' || side === 'back' ? design.width : design.depth;
}

/** Number of units/panels needed to fill a run with an enclosure type. */
export function sidePieces(type: EnclosureType, length: number): number {
  if (type === 'none') return 0;
  const spec = ENCLOSURES[type];
  return Math.max(1, Math.ceil(length / spec.maxPanelWidth - 1e-9));
}

/* ------------------------------------------------------------------ */
/* Structure                                                           */
/* ------------------------------------------------------------------ */

const MAX_BAYS_PER_AXIS = 12;

interface BayChoice {
  nx: number;
  nz: number;
  fits: boolean;
}

function bayFits(d: PergolaDesign, bw: number, bd: number): boolean {
  const spec = LINES[d.line];
  if (d.mounting === 'cantilever' && bw > SIZE_LIMITS.cantileverMaxBay) return false;
  const S = spec.maxBayWidth;
  const L = spec.maxBayDepth;
  const dir = d.roof === 'solid' ? 'auto' : d.louverDirection;
  if (dir === 'x') return bw <= S && bd <= L;
  if (dir === 'z') return bd <= S && bw <= L;
  return Math.min(bw, bd) <= S && Math.max(bw, bd) <= L;
}

function chooseBays(d: PergolaDesign): BayChoice {
  const maxNz = d.mounting === 'cantilever' ? 1 : MAX_BAYS_PER_AXIS;
  let best: { nx: number; nz: number; score: number[] } | null = null;
  for (let nz = 1; nz <= maxNz; nz++) {
    for (let nx = 1; nx <= MAX_BAYS_PER_AXIS; nx++) {
      const bw = d.width / nx;
      const bd = d.depth / nz;
      if (!bayFits(d, bw, bd)) continue;
      const score = [nx * nz, nx + nz, Math.max(bw, bd), nx];
      if (!best || lexLess(score, best.score)) best = { nx, nz, score };
    }
  }
  if (best) return { nx: best.nx, nz: best.nz, fits: true };
  const S = LINES[d.line].maxBayWidth;
  return {
    nx: Math.max(1, Math.ceil(d.width / S)),
    nz: d.mounting === 'cantilever' ? 1 : Math.max(1, Math.ceil(d.depth / S)),
    fits: false,
  };
}

function lexLess(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}

function louverAxisFor(d: PergolaDesign, bw: number, bd: number): 'x' | 'z' {
  if (d.louverDirection === 'x' || d.louverDirection === 'z') return d.louverDirection;
  return bw <= bd ? 'x' : 'z';
}

function louversInBay(d: PergolaDesign, axis: 'x' | 'z', bw: number, bd: number): number {
  if (d.roof === 'solid') return 0;
  const spec = LINES[d.line];
  const stack = axis === 'x' ? bd : bw;
  return Math.max(0, Math.floor((stack - spec.postSize - SIZE_LIMITS.louverEndGap) / spec.louverPitch));
}

/** Bay rectangles with per-bay louver count (equal splits). */
export function bayLayout(design: PergolaDesign): Bay[] {
  const { nx, nz } = chooseBays(design);
  const bw = design.width / nx;
  const bd = design.depth / nz;
  const axis = louverAxisFor(design, bw, bd);
  const count = louversInBay(design, axis, bw, bd);
  const bays: Bay[] = [];
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      bays.push({ ix, iz, x0: ix * bw, x1: (ix + 1) * bw, z0: iz * bd, z1: (iz + 1) * bd, louverCount: count });
    }
  }
  return bays;
}

export function computeStructure(design: PergolaDesign): Structure {
  const spec = LINES[design.line] ?? LINES.lux;
  const { width: w, depth: d, mounting } = design;
  const { nx, nz, fits } = chooseBays(design);
  const bw = w / nx;
  const bd = d / nz;
  const p = spec.postSize;
  const half = p / 2;

  const xs: number[] = [];
  for (let i = 0; i <= nx; i++) xs.push(i === 0 ? half : i === nx ? w - half : i * bw);
  const zs: number[] = [];
  for (let j = 0; j <= nz; j++) {
    const front = mounting === 'floating' ? SIZE_LIMITS.floatingInset + half : half;
    zs.push(j === 0 ? front : j === nz ? d - half : j * bd);
  }

  const posts: Structure['posts'] = [];
  for (let j = 0; j <= nz; j++) {
    if ((mounting === 'attached' || mounting === 'floating') && j === nz) continue; // ledger on the house
    if (mounting === 'cantilever' && j !== nz) continue; // posts along the back only
    for (let i = 0; i <= nx; i++) {
      const onX = i === 0 || i === nx;
      const onZ = j === 0 || j === nz;
      // Interior grid points carry shared posts too (multi-bay both ways).
      let kind: 'corner' | 'intermediate' | 'inset' = onX && onZ ? 'corner' : 'intermediate';
      if (mounting === 'floating' && j === 0) kind = 'inset';
      posts.push({ x: xs[i], z: zs[j], kind });
    }
  }

  const louverAxis = louverAxisFor(design, bw, bd);
  const perBay = louversInBay(design, louverAxis, bw, bd);
  const short = Math.min(w, d);
  const long = Math.max(w, d);

  const engineeringReview =
    !fits ||
    long > SIZE_LIMITS.softCap ||
    short > SIZE_LIMITS.reviewShort ||
    long > SIZE_LIMITS.reviewLong ||
    design.height > spec.maxHeight ||
    (mounting === 'cantilever' && d > SIZE_LIMITS.cantileverMaxDepth);

  return {
    baysX: nx,
    baysZ: nz,
    posts,
    louverAxis,
    louverCount: perBay * nx * nz,
    louverPitch: spec.louverPitch,
    beamDepth: spec.beamDepth,
    beamWidth: spec.beamWidth,
    postSize: spec.postSize,
    bladeWidth: spec.bladeWidth,
    roofAreaSqFt: round3((w * d) / 144),
    overallHeight: design.height + spec.beamDepth,
    engineeringReview,
  };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export function validate(design: Design): ValidationMessage[] {
  switch (design.kind) {
    case 'pergola':
      return validatePergola(design);
    case 'screens':
      return validateScreens(design);
    case 'shades':
      return validateShades(design);
    case 'kitchen':
      return validateKitchen(design);
    default:
      return [];
  }
}

const RAL_RE = /^\s*(RAL\s*)?\d{4}\s*$/i;

function validatePergola(d: PergolaDesign): ValidationMessage[] {
  const out: ValidationMessage[] = [];
  const spec = LINES[d.line] ?? LINES.lux;
  const lim = limits(d.line, d.mounting);
  const min = formatFtIn(SIZE_LIMITS.min);

  if (d.width < lim.width.min) out.push({ severity: 'error', field: 'width', message: `Minimum width is ${min}.` });
  if (d.depth < lim.depth.min) out.push({ severity: 'error', field: 'depth', message: `Minimum depth is ${min}.` });
  if (d.height < lim.height.min)
    out.push({ severity: 'error', field: 'height', message: `Minimum clear height is ${formatFtIn(lim.height.min)}.` });
  if (d.height > lim.height.max)
    out.push({
      severity: 'error',
      field: 'height',
      message: `Maximum clear height is ${formatFtIn(lim.height.max)}. Taller posts need a custom engineered design.`,
    });

  if (d.mounting === 'cantilever' && d.depth > SIZE_LIMITS.cantileverMaxDepth) {
    out.push({
      severity: 'error',
      field: 'depth',
      message: `Cantilever covers can project at most ${formatFtIn(SIZE_LIMITS.cantileverMaxDepth)} from the post line.`,
    });
  }
  if (d.width > SIZE_LIMITS.softCap)
    out.push({ severity: 'warn', field: 'width', message: `Over ${formatFtIn(SIZE_LIMITS.softCap)} wide needs engineering review and a custom quote.` });
  if (d.depth > SIZE_LIMITS.softCap && d.mounting !== 'cantilever')
    out.push({ severity: 'warn', field: 'depth', message: `Over ${formatFtIn(SIZE_LIMITS.softCap)} deep needs engineering review and a custom quote.` });

  if (d.width >= SIZE_LIMITS.min && d.depth >= SIZE_LIMITS.min) {
    const s = computeStructure(d);
    const bays = s.baysX * s.baysZ;
    if (bays > 1) {
      out.push({
        severity: 'info',
        field: 'size',
        message: `At this size the ${spec.label} is built as ${bays} connected bays (${s.baysX} × ${s.baysZ}) with shared posts.`,
      });
      if (d.line === 'prestige') {
        const asLux = computeStructure({ ...d, line: 'lux' });
        if (asLux.baysX * asLux.baysZ < bays)
          out.push({
            severity: 'info',
            field: 'line',
            message: `The Lux Line spans up to ${formatFtIn(LINES.lux.maxBayWidth)} × ${formatFtIn(LINES.lux.maxBayDepth)} per bay — fewer posts at this size.`,
          });
      }
    }
    const short = Math.min(d.width, d.depth);
    const long = Math.max(d.width, d.depth);
    if (short > SIZE_LIMITS.reviewShort || long > SIZE_LIMITS.reviewLong)
      out.push({
        severity: 'info',
        field: 'size',
        message: `Larger than ${formatFtIn(SIZE_LIMITS.reviewShort)}×${formatFtIn(SIZE_LIMITS.reviewLong)}: we'll confirm with engineering.`,
      });
    const maxFans = MAX_FANS_PER_BAY * bays;
    const maxHeaters = MAX_HEATERS_PER_BAY * bays;
    if (d.fans > maxFans)
      out.push({ severity: 'warn', field: 'fans', message: `Up to ${maxFans} ceiling fan${maxFans === 1 ? '' : 's'} fit this layout (${MAX_FANS_PER_BAY} per bay).` });
    if (d.heaters > maxHeaters)
      out.push({ severity: 'warn', field: 'heaters', message: `Up to ${maxHeaters} heaters fit this layout (${MAX_HEATERS_PER_BAY} per bay).` });
  }

  // Sides
  for (const side of SIDE_IDS) {
    const cfg = d.sides?.[side];
    if (!cfg || cfg.type === 'none') continue;
    if (!sideAllowed(d.mounting, side)) {
      out.push({
        severity: 'error',
        field: `sides.${side}`,
        message:
          d.mounting === 'cantilever'
            ? 'Cantilever covers have posts along the back, so the back side cannot be enclosed.'
            : `The back side is against your house wall on a ${MOUNTINGS[d.mounting].label.toLowerCase()} pergola — enclosures aren't available there.`,
      });
      continue;
    }
    const len = sideLength(d, side);
    if (cfg.type === 'screen') {
      const pcs = sidePieces('screen', len);
      if (pcs > 1) {
        const words = ['', 'one', 'two', 'three', 'four', 'five'];
        out.push({
          severity: 'warn',
          field: `sides.${side}`,
          message: `The ${side} side is ${formatFtIn(len)} wide — it will be split into ${words[pcs] ?? pcs} screens.`,
        });
      }
    }
  }

  // Lux-only features
  if (d.line === 'prestige') {
    if (d.rgb && !LINES.prestige.features.rgb)
      out.push({ severity: 'warn', field: 'rgb', message: 'RGB lighting is a Lux Line feature. Switch to Lux to include it.' });
    if (d.control === 'app' && !LINES.prestige.features.app)
      out.push({ severity: 'warn', field: 'control', message: 'Mobile app & voice control come with the Lux Line. Prestige uses a smart remote.' });
  }

  // Colors
  const usesCustom = d.frameColor === 'custom' || d.louverColor === 'custom';
  if (usesCustom && !(d.customRal && d.customRal.trim()))
    out.push({ severity: 'info', field: 'customRal', message: 'Enter a RAL code (e.g. RAL 7016) for your custom color — or we’ll match it at your measure.' });
  else if (usesCustom && d.customRal && !RAL_RE.test(d.customRal))
    out.push({ severity: 'info', field: 'customRal', message: `We'll confirm "${d.customRal}" against the RAL chart at your measure.` });

  if (d.roof === 'solid' && d.rainSensor)
    out.push({ severity: 'info', field: 'rainSensor', message: 'A solid roof is always closed — the rain sensor isn’t needed.' });

  if (d.mounting === 'floating')
    out.push({
      severity: 'info',
      field: 'mounting',
      message: `Floating mounts need about ${formatFtIn(d.height + spec.beamDepth + 2)} of solid wall above the patio; we'll verify it on site.`,
    });
  if (d.mounting === 'cantilever' && d.line === 'prestige')
    out.push({ severity: 'info', field: 'mounting', message: 'Cantilever carports are usually built on the Lux Line frame; we’ll confirm the right system.' });

  return out;
}

function validateScreens(d: ScreensDesign): ValidationMessage[] {
  const out: ValidationMessage[] = [];
  if (!d.openings.length) out.push({ severity: 'error', field: 'openings', message: 'Add at least one opening.' });
  if (d.openings.length > SCREEN_LIMITS.maxOpenings)
    out.push({ severity: 'info', field: 'openings', message: `More than ${SCREEN_LIMITS.maxOpenings} openings? We'll quote the project as a whole.` });
  d.openings.forEach((o, i) => {
    const f = `openings.${i}`;
    if (o.width < SCREEN_LIMITS.width.min)
      out.push({ severity: 'error', field: f, message: `Opening ${i + 1}: minimum width is ${formatFtIn(SCREEN_LIMITS.width.min)}.` });
    if (o.width > SCREEN_LIMITS.width.max)
      out.push({ severity: 'warn', field: f, message: `Opening ${i + 1}: over ${formatFtIn(SCREEN_LIMITS.width.max)} wide needs a custom system.` });
    else if (o.width > ENCLOSURES.screen.maxPanelWidth)
      out.push({ severity: 'warn', field: f, message: `Opening ${i + 1} is ${formatFtIn(o.width)} wide — it will be split into two screens.` });
    if (o.height < SCREEN_LIMITS.height.min)
      out.push({ severity: 'error', field: f, message: `Opening ${i + 1}: minimum height is ${formatFtIn(SCREEN_LIMITS.height.min)}.` });
    if (o.height > SCREEN_LIMITS.height.max)
      out.push({ severity: 'warn', field: f, message: `Opening ${i + 1}: drops over ${formatFtIn(SCREEN_LIMITS.height.max)} need a custom system.` });
  });
  return out;
}

function validateShades(d: ShadesDesign): ValidationMessage[] {
  const out: ValidationMessage[] = [];
  if (!d.windows.length) out.push({ severity: 'error', field: 'windows', message: 'Add at least one window.' });
  d.windows.forEach((w, i) => {
    const f = `windows.${i}`;
    const st = SHADE_STYLES[w.style];
    if (!st) return;
    if (w.width < SHADE_LIMITS.width.min || w.height < SHADE_LIMITS.height.min)
      out.push({ severity: 'error', field: f, message: `Window ${i + 1}: minimum size is 12" × 12".` });
    if (w.width > st.maxWidth || w.height > st.maxHeight)
      out.push({
        severity: 'warn',
        field: f,
        message: `Window ${i + 1}: ${st.label} go up to ${formatFtIn(st.maxWidth)} × ${formatFtIn(st.maxHeight)}; larger windows are split or custom.`,
      });
    if (!st.opacities.includes(w.opacity))
      out.push({ severity: 'warn', field: f, message: `Window ${i + 1}: ${st.label} aren't offered in ${SHADE_OPACITIES[w.opacity]?.label ?? w.opacity}.` });
  });
  return out;
}

function validateKitchen(d: KitchenDesign): ValidationMessage[] {
  const out: ValidationMessage[] = [];
  if (d.length < KITCHEN.length.min)
    out.push({ severity: 'error', field: 'length', message: `Minimum island length is ${formatFtIn(KITCHEN.length.min)}.` });
  if (d.length > KITCHEN.length.max)
    out.push({ severity: 'warn', field: 'length', message: `Over ${formatFtIn(KITCHEN.length.max)} of island — we'll design it with you.` });
  out.push({ severity: 'info', field: 'kind', message: 'Outdoor kitchens are coming soon — send your idea and we’ll reach out.' });
  return out;
}

/* ------------------------------------------------------------------ */
/* Clamp                                                               */
/* ------------------------------------------------------------------ */

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function clampNum(v: unknown, lo: number, hi: number, fallback: number): number {
  return Math.min(hi, Math.max(lo, Math.round(num(v, fallback))));
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

const LINE_IDS = Object.keys(LINES) as Line[];
const ROOF_IDS: RoofType[] = ['louvered', 'solid'];
const MOUNTING_IDS = Object.keys(MOUNTINGS) as Mounting[];
const COLOR_IDS = Object.keys(COLORS) as ColorId[];
const FABRIC_IDS = Object.keys(FABRICS) as FabricId[];
const ENCLOSURE_IDS: EnclosureType[] = ['none', ...(Object.keys(ENCLOSURES) as EnclosureType[])];
const DIRECTIONS: LouverDirection[] = ['auto', 'x', 'z'];
const CONTROL_IDS: ControlType[] = ['remote', 'app'];
const SURFACE_IDS = Object.keys(SCREEN_SURFACES) as ScreenMountSurface[];
const STYLE_IDS = Object.keys(SHADE_STYLES) as ShadeStyle[];
const OPACITY_IDS = Object.keys(SHADE_OPACITIES) as ShadeOpacity[];
const OPERATION_IDS = Object.keys(SHADE_OPERATIONS) as ShadeOperation[];

export const IDS = {
  lines: LINE_IDS,
  roofs: ROOF_IDS,
  mountings: MOUNTING_IDS,
  colors: COLOR_IDS,
  fabrics: FABRIC_IDS,
  enclosures: ENCLOSURE_IDS,
  directions: DIRECTIONS,
  controls: CONTROL_IDS,
  surfaces: SURFACE_IDS,
  shadeStyles: STYLE_IDS,
  shadeOpacities: OPACITY_IDS,
  shadeOperations: OPERATION_IDS,
};

/** Return a legal copy of the design (snap sizes to limits, strip disallowed sides, sanitize enums). */
export function clamp<T extends Design>(design: T): T;
export function clamp(design: Design): Design {
  switch (design?.kind) {
    case 'screens':
      return clampScreens(design);
    case 'shades':
      return clampShades(design);
    case 'kitchen':
      return clampKitchen(design);
    case 'pergola':
    default:
      return clampPergola((design ?? {}) as PergolaDesign);
  }
}

function clampSide(cfg: Partial<SideConfig> | undefined, allowed: boolean): SideConfig {
  const type = allowed ? oneOf(cfg?.type, ENCLOSURE_IDS, 'none') : 'none';
  const out: SideConfig = { type };
  if (type === 'screen') out.fabric = oneOf(cfg?.fabric, FABRIC_IDS, '95');
  if (type !== 'none' && cfg?.color && COLOR_IDS.includes(cfg.color)) out.color = cfg.color;
  return out;
}

function clampPergola(d: PergolaDesign): PergolaDesign {
  const def = CONFIG_DEFAULT_PERGOLA;
  const line = oneOf(d.line, LINE_IDS, def.line);
  const mounting = oneOf(d.mounting, MOUNTING_IDS, def.mounting);
  const lim = limits(line, mounting);
  const out: PergolaDesign = {
    kind: 'pergola',
    line,
    roof: oneOf(d.roof, ROOF_IDS, def.roof),
    mounting,
    width: clampNum(d.width, lim.width.min, lim.width.max, def.width),
    depth: clampNum(d.depth, lim.depth.min, lim.depth.max, Math.min(def.depth, lim.depth.max)),
    height: clampNum(d.height, lim.height.min, lim.height.max, def.height),
    louverDirection: oneOf(d.louverDirection, DIRECTIONS, def.louverDirection),
    frameColor: oneOf(d.frameColor, COLOR_IDS, def.frameColor),
    louverColor: oneOf(d.louverColor, COLOR_IDS, def.louverColor),
    sides: {
      front: clampSide(d.sides?.front, sideAllowed(mounting, 'front')),
      back: clampSide(d.sides?.back, sideAllowed(mounting, 'back')),
      left: clampSide(d.sides?.left, sideAllowed(mounting, 'left')),
      right: clampSide(d.sides?.right, sideAllowed(mounting, 'right')),
    },
    ledWarm: bool(d.ledWarm, def.ledWarm),
    rgb: bool(d.rgb, def.rgb),
    rainSensor: bool(d.rainSensor, def.rainSensor),
    windSensor: bool(d.windSensor, def.windSensor),
    fans: 0,
    heaters: 0,
    control: oneOf(d.control, CONTROL_IDS, def.control),
  };
  if (out.frameColor === 'custom' || out.louverColor === 'custom') {
    const ral = typeof d.customRal === 'string' ? d.customRal.trim().slice(0, 40) : '';
    if (ral) out.customRal = ral;
  }
  const s = computeStructure(out);
  const bays = s.baysX * s.baysZ;
  out.fans = clampNum(d.fans, 0, MAX_FANS_PER_BAY * bays, 0);
  out.heaters = clampNum(d.heaters, 0, MAX_HEATERS_PER_BAY * bays, 0);
  return out;
}

function clampScreens(d: ScreensDesign): ScreensDesign {
  const def = CONFIG_DEFAULT_SCREENS;
  const src = Array.isArray(d.openings) && d.openings.length ? d.openings : cloneDefault(def.openings);
  const openings = src.slice(0, SCREEN_LIMITS.maxOpenings).map((o) => ({
    width: clampNum(o?.width, SCREEN_LIMITS.width.min, SCREEN_LIMITS.width.max, def.openings[0].width),
    height: clampNum(o?.height, SCREEN_LIMITS.height.min, SCREEN_LIMITS.height.max, def.openings[0].height),
    mountedOn: oneOf(o?.mountedOn, SURFACE_IDS, def.openings[0].mountedOn),
  }));
  return {
    kind: 'screens',
    openings,
    frameColor: oneOf(d.frameColor, COLOR_IDS, def.frameColor),
    fabricColor: oneOf(d.fabricColor, COLOR_IDS, def.fabricColor),
    fabric: oneOf(d.fabric, FABRIC_IDS, def.fabric),
    windSensor: bool(d.windSensor, def.windSensor),
    control: oneOf(d.control, CONTROL_IDS, def.control),
    projectType: oneOf(d.projectType, ['residential', 'commercial'] as const, def.projectType),
  };
}

function clampShades(d: ShadesDesign): ShadesDesign {
  const def = CONFIG_DEFAULT_SHADES;
  const src = Array.isArray(d.windows) && d.windows.length ? d.windows : cloneDefault(def.windows);
  const w0 = def.windows[0];
  const windows = src.slice(0, SHADE_LIMITS.maxWindows).map((w) => {
    const style = oneOf(w?.style, STYLE_IDS, w0.style);
    const st = SHADE_STYLES[style];
    const opacity = oneOf(w?.opacity, OPACITY_IDS, w0.opacity);
    const win: ShadesDesign['windows'][number] = {
      style,
      width: clampNum(w?.width, SHADE_LIMITS.width.min, st.maxWidth, w0.width),
      height: clampNum(w?.height, SHADE_LIMITS.height.min, st.maxHeight, w0.height),
      mount: oneOf(w?.mount, ['inside', 'outside'] as const, w0.mount),
      opacity: st.opacities.includes(opacity) ? opacity : st.opacities[0],
      operation: oneOf(w?.operation, OPERATION_IDS, w0.operation),
    };
    if (typeof w?.room === 'string' && w.room.trim()) win.room = w.room.trim().slice(0, 60);
    return win;
  });
  return { kind: 'shades', windows, service: oneOf(d.service, ['install', 'diy', 'trade'] as const, def.service) };
}

function clampKitchen(d: KitchenDesign): KitchenDesign {
  const def = CONFIG_DEFAULT_KITCHEN;
  return {
    kind: 'kitchen',
    shape: oneOf(d.shape, ['straight', 'l', 'u'] as const, def.shape),
    length: clampNum(d.length, KITCHEN.length.min, KITCHEN.length.max, def.length),
    grill: bool(d.grill, def.grill),
    fridge: bool(d.fridge, def.fridge),
    sink: bool(d.sink, def.sink),
    counter: oneOf(d.counter, ['granite', 'quartz', 'concrete', 'tile'] as const, def.counter),
  };
}
