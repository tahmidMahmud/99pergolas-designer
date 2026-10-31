/**
 * Manual (zod-free) validation of a lead submission. Shared by functions/api/lead.ts and
 * scripts/dev-api.mjs. Pure; runtime imports must keep explicit `.ts` extensions.
 *
 * Returns a cleaned copy: strings are trimmed and length-capped, the design is rebuilt from
 * known keys only (unknown keys dropped), numbers are rounded and range-checked.
 */
import type {
  ColorId,
  Design,
  EnclosureType,
  Estimate,
  FabricId,
  LeadPayload,
  LineItem,
  SideConfig,
  SideId,
  SiteInfo,
} from '../types';

export type ValidationResult =
  | { ok: true; payload: LeadPayload; honeypot: boolean }
  | { ok: false; errors: Record<string, string> };

const KINDS = ['pergola', 'screens', 'shades', 'kitchen'] as const;
const COLORS: ColorId[] = ['black', 'grey', 'white', 'bronze', 'custom'];
const FABRICS: FabricId[] = ['blackout', '99', '97', '95', '90', '70', '60'];
const ENCLOSURES: EnclosureType[] = [
  'none',
  'screen',
  'glass-frameless',
  'glass-framed',
  'shutter-sliding',
  'shutter-bifold',
  'panel-fixed',
];
const SIDES: SideId[] = ['front', 'back', 'left', 'right'];

export const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function str(v: unknown, max = 200): string {
  // Strip ASCII control characters (keep \t \n \r).
  // oxlint-disable-next-line no-control-regex
  return typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max) : '';
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | undefined {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

class Bad extends Error {}

function num(v: unknown, min: number, max: number, field: string): number {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) throw new Bad(field);
  return Math.round(n * 100) / 100;
}

function int(v: unknown, min: number, max: number, field: string): number {
  return Math.round(num(v, min, max, field));
}

function req<T extends string>(v: unknown, allowed: readonly T[], field: string): T {
  const r = oneOf(v, allowed);
  if (!r) throw new Bad(field);
  return r;
}

const bool = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';

/** Inches. Generous bounds: business rules (min 7', bay limits) live in src/config/rules.ts. */
const DIM_MIN = 12;
const DIM_MAX = 1200;

function sanitizeDesign(raw: unknown): Design {
  if (!isObj(raw)) throw new Bad('design');
  const kind = req(raw.kind, KINDS, 'design.kind');
  if (kind === 'pergola') {
    const sidesRaw = isObj(raw.sides) ? raw.sides : {};
    const sides = {} as Record<SideId, SideConfig>;
    for (const s of SIDES) {
      const r = isObj(sidesRaw[s]) ? (sidesRaw[s] as Obj) : {};
      const cfg: SideConfig = { type: oneOf(r.type, ENCLOSURES) ?? 'none' };
      const fabric = oneOf(r.fabric, FABRICS);
      const color = oneOf(r.color, COLORS);
      if (fabric) cfg.fabric = fabric;
      if (color) cfg.color = color;
      sides[s] = cfg;
    }
    const customRal = str(raw.customRal, 40);
    return {
      kind,
      line: req(raw.line, ['lux', 'prestige'] as const, 'design.line'),
      roof: req(raw.roof, ['louvered', 'solid'] as const, 'design.roof'),
      mounting: req(raw.mounting, ['freestanding', 'attached', 'floating', 'cantilever'] as const, 'design.mounting'),
      width: num(raw.width, DIM_MIN, DIM_MAX, 'design.width'),
      depth: num(raw.depth, DIM_MIN, DIM_MAX, 'design.depth'),
      height: num(raw.height, DIM_MIN, 360, 'design.height'),
      louverDirection: oneOf(raw.louverDirection, ['auto', 'x', 'z'] as const) ?? 'auto',
      frameColor: req(raw.frameColor, COLORS, 'design.frameColor'),
      louverColor: req(raw.louverColor, COLORS, 'design.louverColor'),
      ...(customRal ? { customRal } : {}),
      sides,
      ledWarm: bool(raw.ledWarm),
      rgb: bool(raw.rgb),
      rainSensor: bool(raw.rainSensor),
      windSensor: bool(raw.windSensor),
      fans: int(raw.fans ?? 0, 0, 20, 'design.fans'),
      heaters: int(raw.heaters ?? 0, 0, 20, 'design.heaters'),
      control: oneOf(raw.control, ['remote', 'app'] as const) ?? 'remote',
    };
  }
  if (kind === 'screens') {
    if (!Array.isArray(raw.openings) || raw.openings.length < 1 || raw.openings.length > 30) {
      throw new Bad('design.openings');
    }
    return {
      kind,
      openings: raw.openings.map((o: unknown, i) => {
        const r = isObj(o) ? o : {};
        return {
          width: num(r.width, DIM_MIN, DIM_MAX, `design.openings.${i}.width`),
          height: num(r.height, DIM_MIN, 480, `design.openings.${i}.height`),
          mountedOn: oneOf(r.mountedOn, ['brick', 'aluminum', 'wood', 'metal', 'other'] as const) ?? 'other',
        };
      }),
      frameColor: req(raw.frameColor, COLORS, 'design.frameColor'),
      fabricColor: req(raw.fabricColor, COLORS, 'design.fabricColor'),
      fabric: req(raw.fabric, FABRICS, 'design.fabric'),
      windSensor: bool(raw.windSensor),
      control: oneOf(raw.control, ['remote', 'app'] as const) ?? 'remote',
      projectType: oneOf(raw.projectType, ['residential', 'commercial'] as const) ?? 'residential',
    };
  }
  if (kind === 'shades') {
    if (!Array.isArray(raw.windows) || raw.windows.length < 1 || raw.windows.length > 60) {
      throw new Bad('design.windows');
    }
    return {
      kind,
      windows: raw.windows.map((w: unknown, i) => {
        const r = isObj(w) ? w : {};
        const room = str(r.room, 60);
        return {
          style: req(r.style, ['shangri-la', 'vertical', 'roman', 'zebra', 'honeycomb', 'roller'] as const, `design.windows.${i}.style`),
          width: num(r.width, 6, 600, `design.windows.${i}.width`),
          height: num(r.height, 6, 600, `design.windows.${i}.height`),
          mount: oneOf(r.mount, ['inside', 'outside'] as const) ?? 'inside',
          opacity:
            oneOf(r.opacity, ['sheer', 'light-filtering', 'privacy', 'room-darkening', 'blackout'] as const) ??
            'light-filtering',
          operation: oneOf(r.operation, ['manual', 'remote', 'wall-switch', 'smart-home'] as const) ?? 'remote',
          ...(room ? { room } : {}),
        };
      }),
      service: oneOf(raw.service, ['install', 'diy', 'trade'] as const) ?? 'install',
    };
  }
  return {
    kind,
    shape: oneOf(raw.shape, ['straight', 'l', 'u'] as const) ?? 'straight',
    length: num(raw.length, DIM_MIN, DIM_MAX, 'design.length'),
    grill: bool(raw.grill),
    fridge: bool(raw.fridge),
    sink: bool(raw.sink),
    counter: oneOf(raw.counter, ['granite', 'quartz', 'concrete', 'tile'] as const) ?? 'granite',
  };
}

const GROUPS: LineItem['group'][] = ['structure', 'roof', 'sides', 'comfort', 'lighting', 'site'];

/** Client estimate is display-only; the server recomputes. This just keeps it well-formed. */
function sanitizeEstimate(raw: unknown): Estimate {
  if (!isObj(raw)) throw new Bad('estimate');
  const items: LineItem[] = Array.isArray(raw.items)
    ? raw.items.slice(0, 80).flatMap((it): LineItem[] => {
        if (!isObj(it)) return [];
        const note = str(it.note, 200);
        return [
          {
            id: str(it.id, 60),
            label: str(it.label, 120),
            qty: Number.isFinite(it.qty) ? Number(it.qty) : 1,
            low: Number.isFinite(it.low) ? Number(it.low) : 0,
            high: Number.isFinite(it.high) ? Number(it.high) : 0,
            group: oneOf(it.group, GROUPS) ?? 'structure',
            ...(note ? { note } : {}),
          },
        ];
      })
    : [];
  return {
    low: num(raw.low, 0, 10_000_000, 'estimate.low'),
    high: num(raw.high, 0, 10_000_000, 'estimate.high'),
    items,
    monthly: Number.isFinite(raw.monthly) ? Number(raw.monthly) : 0,
    termMonths: Number.isFinite(raw.termMonths) ? Number(raw.termMonths) : 60,
    disclaimer: str(raw.disclaimer, 600),
  };
}

export function digits(s: string): string {
  return s.replace(/\D/g, '');
}

/** Max accepted snapshot data URL length (~3 MB of base64). */
export const MAX_SNAPSHOT_CHARS = 4_000_000;

export function validateLead(body: unknown): ValidationResult {
  const errors: Record<string, string> = {};
  if (!isObj(body)) return { ok: false, errors: { body: 'Expected a JSON object.' } };

  const honeypot = str(body.website, 500) !== '';

  const siteRaw = isObj(body.site) ? body.site : {};
  const site: SiteInfo = {
    name: str(siteRaw.name, 80),
    phone: str(siteRaw.phone, 40),
    email: str(siteRaw.email, 120).toLowerCase(),
    zip: str(siteRaw.zip, 10),
    consent: siteRaw.consent === true,
  };
  if (site.name.length < 2) errors['site.name'] = 'Please enter your name.';
  const ph = digits(site.phone);
  if (ph.length < 10 || ph.length > 15) errors['site.phone'] = 'Please enter a phone number with area code.';
  if (!EMAIL_RE.test(site.email)) errors['site.email'] = 'Please enter a valid email address.';
  if (site.zip && !/^\d{5}(-\d{4})?$/.test(site.zip)) errors['site.zip'] = 'Please enter a 5-digit ZIP code.';
  if (!site.consent) errors['site.consent'] = 'Please agree to be contacted about your estimate.';
  const city = str(siteRaw.city, 80);
  const address = str(siteRaw.address, 160);
  const notes = str(siteRaw.notes, 2000);
  const surface = oneOf(siteRaw.surface, ['concrete', 'pavers', 'deck', 'grass', 'other'] as const);
  const use = oneOf(siteRaw.use, ['residential', 'commercial', 'poolside', 'rooftop', 'balcony', 'garden'] as const);
  const timeframe = oneOf(siteRaw.timeframe, ['asap', '1-3mo', '3-6mo', 'researching'] as const);
  if (city) site.city = city;
  if (address) site.address = address;
  if (notes) site.notes = notes;
  if (surface) site.surface = surface;
  if (use) site.use = use;
  if (timeframe) site.timeframe = timeframe;

  let design: Design | undefined;
  try {
    design = sanitizeDesign(body.design);
  } catch (e) {
    errors[e instanceof Bad ? e.message : 'design'] = 'Invalid design value.';
  }

  let estimate: Estimate | undefined;
  try {
    estimate = sanitizeEstimate(body.estimate);
  } catch (e) {
    errors[e instanceof Bad ? e.message : 'estimate'] = 'Invalid estimate.';
  }

  let snapshot: string | undefined;
  if (typeof body.snapshot === 'string' && body.snapshot) {
    const m = /^data:image\/(png|jpeg|webp);base64,/.exec(body.snapshot);
    if (!m || !/^[A-Za-z0-9+/=]+$/.test(body.snapshot.slice(m[0].length))) {
      errors.snapshot = 'Snapshot must be a PNG/JPEG/WebP data URL.';
    } else if (body.snapshot.length > MAX_SNAPSHOT_CHARS) {
      errors.snapshot = 'Snapshot is too large.';
    } else {
      snapshot = body.snapshot;
    }
  }

  const srcRaw = isObj(body.source) ? body.source : {};
  const utm: Record<string, string> = {};
  if (isObj(srcRaw.utm)) {
    for (const [k, v] of Object.entries(srcRaw.utm).slice(0, 20)) {
      const key = str(k, 40);
      const val = str(v, 300);
      if (key && val) utm[key] = val;
    }
  }
  const source: LeadPayload['source'] = {
    device: srcRaw.device === 'mobile' ? 'mobile' : 'desktop',
  };
  const referrer = str(srcRaw.referrer, 500);
  const page = str(srcRaw.page, 500);
  if (referrer) source.referrer = referrer;
  if (page) source.page = page;
  if (Object.keys(utm).length) source.utm = utm;

  const viewRaw = isObj(body.view) ? body.view : undefined;
  const view: LeadPayload['view'] = viewRaw
    ? {
        ...(Number.isFinite(viewRaw.louverAngle) ? { louverAngle: Math.max(0, Math.min(180, Number(viewRaw.louverAngle))) } : {}),
        ...(Number.isFinite(viewRaw.hour) ? { hour: Math.max(0, Math.min(24, Number(viewRaw.hour))) } : {}),
        ...(typeof viewRaw.showDimensions === 'boolean' ? { showDimensions: viewRaw.showDimensions } : {}),
      }
    : undefined;

  if (Object.keys(errors).length || !design || !estimate) return { ok: false, errors };

  return {
    ok: true,
    honeypot,
    payload: {
      design,
      ...(view ? { view } : {}),
      site,
      estimate,
      shareUrl: str(body.shareUrl, 2000),
      ...(snapshot ? { snapshot } : {}),
      source,
    },
  };
}
