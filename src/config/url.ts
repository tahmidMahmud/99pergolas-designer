/**
 * URL state + Contact Form 7 field mapping.
 *
 * Pergola:  ?p=pergola&line=lux&w=144&d=192&h=108&m=fs&roof=louv&ld=auto&fc=black&lc=black&ral=RAL%207016
 *           &sf=screen:95&sb=none&sl=glass-frameless&sr=none&led=1&rgb=0&rain=1&wind=0&fans=1&heat=2&ctl=app
 *           side value = type[:fabric][:color]  (fabric only for screens)
 * Screens:  ?p=screens&op=120x96xwood,144x96xbrick&fc=black&fbc=black&fab=95&wind=1&ctl=remote&pt=res
 * Shades:   ?p=shades&win=roller:36:60:in:light-filtering:remote:Kitchen|zebra:…&svc=install
 * Kitchen:  ?p=kitchen&ks=l&kl=120&grill=1&fridge=0&sink=1&ctr=quartz
 * View (any product, optional): la=35&hr=16&dim=1&st=sides
 */
import type {
  Design,
  EnclosureType,
  KitchenDesign,
  Mounting,
  PergolaDesign,
  ScreensDesign,
  ShadesDesign,
  SideConfig,
  SideId,
  SiteInfo,
  StepId,
  ViewState,
} from '../types';
import { COLORS, CONTROLS, ENCLOSURES, FABRICS, LINES, MOUNTINGS, SCREEN_SURFACES } from './catalog';
import {
  CONFIG_DEFAULT_KITCHEN,
  CONFIG_DEFAULT_PERGOLA,
  CONFIG_DEFAULT_SCREENS,
  CONFIG_DEFAULT_SHADES,
  cloneDefault,
} from './defaults';
import { formatFtIn } from './format';
import { clamp, computeStructure, SIDE_IDS, sideLength, sidePieces } from './rules';

export const DEFAULT_SHARE_BASE = 'https://design.99pergolas.com/';

const MOUNT_CODES: Record<Mounting, string> = { freestanding: 'fs', attached: 'wm', floating: 'fl', cantilever: 'cl' };
const MOUNT_FROM_CODE: Record<string, Mounting> = {
  fs: 'freestanding',
  wm: 'attached',
  att: 'attached',
  fl: 'floating',
  cl: 'cantilever',
  cant: 'cantilever',
  freestanding: 'freestanding',
  attached: 'attached',
  floating: 'floating',
  cantilever: 'cantilever',
};
const ROOF_CODES = { louvered: 'louv', solid: 'solid' } as const;
const SIDE_KEYS: Record<SideId, string> = { front: 'sf', back: 'sb', left: 'sl', right: 'sr' };
const STEPS: StepId[] = ['size', 'style', 'roof', 'sides', 'comfort', 'review'];

const b = (v: boolean) => (v ? '1' : '0');

/* ------------------------------------------------------------------ */
/* design → params                                                     */
/* ------------------------------------------------------------------ */

export function designToParams(design: Design, view?: Partial<ViewState>): URLSearchParams {
  const p = new URLSearchParams();
  p.set('p', design.kind);
  switch (design.kind) {
    case 'pergola': {
      const d = design;
      p.set('line', d.line);
      p.set('w', String(Math.round(d.width)));
      p.set('d', String(Math.round(d.depth)));
      p.set('h', String(Math.round(d.height)));
      p.set('m', MOUNT_CODES[d.mounting]);
      p.set('roof', ROOF_CODES[d.roof]);
      p.set('ld', d.louverDirection);
      p.set('fc', d.frameColor);
      p.set('lc', d.louverColor);
      if (d.customRal) p.set('ral', d.customRal);
      for (const side of SIDE_IDS) p.set(SIDE_KEYS[side], encodeSide(d.sides[side]));
      p.set('led', b(d.ledWarm));
      p.set('rgb', b(d.rgb));
      p.set('rain', b(d.rainSensor));
      p.set('wind', b(d.windSensor));
      p.set('fans', String(d.fans));
      p.set('heat', String(d.heaters));
      p.set('ctl', d.control);
      break;
    }
    case 'screens': {
      const d = design;
      p.set('op', d.openings.map((o) => `${Math.round(o.width)}x${Math.round(o.height)}x${o.mountedOn}`).join(','));
      p.set('fc', d.frameColor);
      p.set('fbc', d.fabricColor);
      p.set('fab', d.fabric);
      p.set('wind', b(d.windSensor));
      p.set('ctl', d.control);
      p.set('pt', d.projectType === 'commercial' ? 'com' : 'res');
      break;
    }
    case 'shades': {
      const d = design;
      p.set(
        'win',
        d.windows
          .map((w) =>
            [w.style, Math.round(w.width), Math.round(w.height), w.mount === 'inside' ? 'in' : 'out', w.opacity, w.operation, w.room ? encodeURIComponent(w.room) : '']
              .join(':')
              .replace(/:$/, ''),
          )
          .join('|'),
      );
      p.set('svc', d.service);
      break;
    }
    case 'kitchen': {
      const d = design;
      p.set('ks', d.shape);
      p.set('kl', String(Math.round(d.length)));
      p.set('grill', b(d.grill));
      p.set('fridge', b(d.fridge));
      p.set('sink', b(d.sink));
      p.set('ctr', d.counter);
      break;
    }
  }
  if (view) {
    if (view.louverAngle !== undefined) p.set('la', String(Math.round(view.louverAngle)));
    if (view.hour !== undefined) p.set('hr', String(Math.round(view.hour * 10) / 10));
    if (view.showDimensions !== undefined) p.set('dim', b(view.showDimensions));
    if (view.step !== undefined) p.set('st', view.step);
  }
  return p;
}

function encodeSide(cfg: SideConfig): string {
  if (!cfg || cfg.type === 'none') return 'none';
  const parts: string[] = [cfg.type];
  if (cfg.type === 'screen') parts.push(cfg.fabric ?? '');
  if (cfg.color) {
    if (cfg.type !== 'screen') parts.push('');
    parts.push(cfg.color);
  }
  return parts.join(':').replace(/:$/, '');
}

/** Full share link. `base` defaults to https://design.99pergolas.com/ */
export function shareUrl(design: Design, view?: Partial<ViewState>, base: string = DEFAULT_SHARE_BASE): string {
  const qs = designToParams(design, view).toString();
  const clean = base.split('#')[0].split('?')[0];
  return `${clean}?${qs}`;
}

/* ------------------------------------------------------------------ */
/* params → design (tolerant)                                          */
/* ------------------------------------------------------------------ */

type ParamsInput = URLSearchParams | string | Record<string, string>;

function toParams(input: ParamsInput): URLSearchParams {
  if (input instanceof URLSearchParams) return input;
  if (typeof input === 'string') {
    const q = input.includes('?') ? input.slice(input.indexOf('?') + 1) : input;
    return new URLSearchParams(q.split('#')[0]);
  }
  return new URLSearchParams(input);
}

const intOr = (v: string | null, fb: number): number => {
  if (v === null || v.trim() === '') return fb;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fb;
};
const boolOr = (v: string | null, fb: boolean): boolean => {
  if (v === null) return fb;
  const s = v.toLowerCase();
  if (s === '1' || s === 'true' || s === 'yes' || s === 'on') return true;
  if (s === '0' || s === 'false' || s === 'no' || s === 'off') return false;
  return fb;
};
function pick<T extends string>(v: string | null, allowed: readonly T[], fb: T): T {
  return v !== null && (allowed as readonly string[]).includes(v) ? (v as T) : fb;
}

/** Parse a URL query (or URLSearchParams) into a legal design. Unknown/bad values fall back to defaults, then clamp. */
export function paramsToDesign(input: ParamsInput): Design {
  const p = toParams(input);
  const kind = p.get('p') ?? p.get('product');
  switch (kind) {
    case 'screens':
      return parseScreens(p);
    case 'shades':
      return parseShades(p);
    case 'kitchen':
      return parseKitchen(p);
    default:
      return parsePergola(p);
  }
}

/** Parse the viewer part of the URL. Only keys present in the URL are returned. */
export function paramsToView(input: ParamsInput): Partial<ViewState> {
  const p = toParams(input);
  const v: Partial<ViewState> = {};
  if (p.has('la')) {
    const n = Number(p.get('la'));
    if (Number.isFinite(n)) v.louverAngle = Math.min(105, Math.max(0, n));
  }
  if (p.has('hr')) {
    const n = Number(p.get('hr'));
    if (Number.isFinite(n)) v.hour = Math.min(20, Math.max(6, n));
  }
  if (p.has('dim')) v.showDimensions = boolOr(p.get('dim'), false);
  const st = p.get('st');
  if (st && (STEPS as string[]).includes(st)) v.step = st as StepId;
  return v;
}

const COLOR_IDS = Object.keys(COLORS) as (keyof typeof COLORS)[];
const FABRIC_IDS = Object.keys(FABRICS) as (keyof typeof FABRICS)[];
const ENCLOSURE_IDS = ['none', ...Object.keys(ENCLOSURES)] as EnclosureType[];

function parseSide(v: string | null): SideConfig {
  if (!v) return { type: 'none' };
  const [type, fabric, color] = v.split(':');
  const t = pick(type ?? null, ENCLOSURE_IDS, 'none');
  const cfg: SideConfig = { type: t };
  if (t === 'screen') cfg.fabric = pick(fabric || null, FABRIC_IDS, '95');
  if (t !== 'none' && color && (COLOR_IDS as string[]).includes(color)) cfg.color = color as SideConfig['color'];
  return cfg;
}

function parsePergola(p: URLSearchParams): PergolaDesign {
  const def = cloneDefault(CONFIG_DEFAULT_PERGOLA);
  const roofCode = p.get('roof');
  const d: PergolaDesign = {
    kind: 'pergola',
    line: pick(p.get('line'), Object.keys(LINES) as PergolaDesign['line'][], def.line),
    roof: roofCode === 'solid' ? 'solid' : roofCode === 'louv' || roofCode === 'louvered' ? 'louvered' : def.roof,
    mounting: MOUNT_FROM_CODE[p.get('m') ?? ''] ?? def.mounting,
    width: intOr(p.get('w'), def.width),
    depth: intOr(p.get('d'), def.depth),
    height: intOr(p.get('h'), def.height),
    louverDirection: pick(p.get('ld'), ['auto', 'x', 'z'] as const, def.louverDirection),
    frameColor: pick(p.get('fc'), COLOR_IDS, def.frameColor),
    louverColor: pick(p.get('lc'), COLOR_IDS, def.louverColor),
    sides: {
      front: p.has('sf') ? parseSide(p.get('sf')) : def.sides.front,
      back: p.has('sb') ? parseSide(p.get('sb')) : def.sides.back,
      left: p.has('sl') ? parseSide(p.get('sl')) : def.sides.left,
      right: p.has('sr') ? parseSide(p.get('sr')) : def.sides.right,
    },
    ledWarm: boolOr(p.get('led'), def.ledWarm),
    rgb: boolOr(p.get('rgb'), def.rgb),
    rainSensor: boolOr(p.get('rain'), def.rainSensor),
    windSensor: boolOr(p.get('wind'), def.windSensor),
    fans: Math.max(0, intOr(p.get('fans'), def.fans)),
    heaters: Math.max(0, intOr(p.get('heat'), def.heaters)),
    control: pick(p.get('ctl'), ['remote', 'app'] as const, def.control),
  };
  const ral = p.get('ral');
  if (ral) d.customRal = ral;
  return clamp(d);
}

function parseScreens(p: URLSearchParams): ScreensDesign {
  const def = cloneDefault(CONFIG_DEFAULT_SCREENS);
  const surfaces = Object.keys(SCREEN_SURFACES) as ScreensDesign['openings'][number]['mountedOn'][];
  const op = p.get('op');
  const openings = op
    ? op
        .split(',')
        .filter(Boolean)
        .map((s) => {
          const [w, h, m] = s.split('x');
          return {
            width: intOr(w ?? null, def.openings[0].width),
            height: intOr(h ?? null, def.openings[0].height),
            mountedOn: pick(m ?? null, surfaces, def.openings[0].mountedOn),
          };
        })
    : def.openings;
  return clamp<ScreensDesign>({
    kind: 'screens',
    openings: openings.length ? openings : def.openings,
    frameColor: pick(p.get('fc'), COLOR_IDS, def.frameColor),
    fabricColor: pick(p.get('fbc'), COLOR_IDS, def.fabricColor),
    fabric: pick(p.get('fab'), FABRIC_IDS, def.fabric),
    windSensor: boolOr(p.get('wind'), def.windSensor),
    control: pick(p.get('ctl'), ['remote', 'app'] as const, def.control),
    projectType: p.get('pt') === 'com' || p.get('pt') === 'commercial' ? 'commercial' : 'residential',
  });
}

function parseShades(p: URLSearchParams): ShadesDesign {
  const def = cloneDefault(CONFIG_DEFAULT_SHADES);
  const w0 = def.windows[0];
  const raw = p.get('win');
  const windows = raw
    ? raw
        .split('|')
        .filter(Boolean)
        .map((s) => {
          const [style, w, h, mount, opacity, operation, room] = s.split(':');
          const win: ShadesDesign['windows'][number] = {
            style: (style || w0.style) as ShadesDesign['windows'][number]['style'],
            width: intOr(w ?? null, w0.width),
            height: intOr(h ?? null, w0.height),
            mount: mount === 'out' || mount === 'outside' ? 'outside' : 'inside',
            opacity: (opacity || w0.opacity) as ShadesDesign['windows'][number]['opacity'],
            operation: (operation || w0.operation) as ShadesDesign['windows'][number]['operation'],
          };
          if (room) {
            try {
              win.room = decodeURIComponent(room);
            } catch {
              /* ignore malformed room */
            }
          }
          return win;
        })
    : def.windows;
  // clamp() sanitizes unknown style/opacity/operation values.
  return clamp<ShadesDesign>({
    kind: 'shades',
    windows: windows.length ? windows : def.windows,
    service: pick(p.get('svc'), ['install', 'diy', 'trade'] as const, def.service),
  });
}

function parseKitchen(p: URLSearchParams): KitchenDesign {
  const def = cloneDefault(CONFIG_DEFAULT_KITCHEN);
  return clamp<KitchenDesign>({
    kind: 'kitchen',
    shape: pick(p.get('ks'), ['straight', 'l', 'u'] as const, def.shape),
    length: intOr(p.get('kl'), def.length),
    grill: boolOr(p.get('grill'), def.grill),
    fridge: boolOr(p.get('fridge'), def.fridge),
    sink: boolOr(p.get('sink'), def.sink),
    counter: pick(p.get('ctr'), ['granite', 'quartz', 'concrete', 'tile'] as const, def.counter),
  });
}

/* ------------------------------------------------------------------ */
/* Contact Form 7 mapping                                              */
/* ------------------------------------------------------------------ */

/** CF7 field map. `_wpcf7` holds the form id: 1643 pergola, 1783 screens, 1864 contact (shades/kitchen). */
export type CF7Fields = Record<string, string | string[]>;

export interface CF7Options {
  /** Preferred date for the `date` / `estimate-date` field. */
  date?: string;
}

const USE_LABELS: Record<NonNullable<SiteInfo['use']>, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  poolside: 'Poolside',
  rooftop: 'Rooftop',
  balcony: 'Balcony',
  garden: 'Garden',
};

function colorField(id: keyof typeof COLORS, customRal?: string): { value: string; custom: string } {
  const c = COLORS[id] ?? COLORS.black;
  if (c.cf7 !== 'Customized') return { value: c.cf7, custom: '' };
  const custom = id === 'custom' ? customRal || 'Custom RAL (to confirm)' : `${c.label} (${c.ral})`;
  return { value: 'Customized', custom };
}

/** Map a design + customer info to the existing 99pergolas.com Contact Form 7 field names. */
export function designToCF7Fields(design: Design, site: SiteInfo, opts: CF7Options = {}): CF7Fields {
  const address = [site.address, site.city].filter(Boolean).join(', ');
  switch (design.kind) {
    case 'pergola':
      return pergolaCF7(design, site, address, opts);
    case 'screens':
      return screensCF7(design, site, address, opts);
    default:
      return contactCF7(design, site);
  }
}

function pergolaCF7(d: PergolaDesign, site: SiteInfo, address: string, opts: CF7Options): CF7Fields {
  const s = computeStructure(d);
  const f: CF7Fields = {
    _wpcf7: '1643',
    'full-name': site.name,
    'phone-number': site.phone,
    date: opts.date ?? '',
    'email-address': site.email,
    address,
    'zip-code': site.zip,
    length: formatFtIn(d.depth),
    width: formatFtIn(d.width),
    height: formatFtIn(d.height),
    model: LINES[d.line].cf7,
    'pergola-design': s.baysX * s.baysZ > 1 && d.mounting === 'freestanding' ? 'Custom Shape' : MOUNTINGS[d.mounting].cf7,
  };
  const acc: string[] = [];
  if (d.ledWarm) acc.push('LED-lighting');
  if (d.rgb) acc.push('RGB-lighting');
  if (d.rainSensor && d.roof === 'louvered') acc.push('Rain-sensor');
  if (d.fans > 0) acc.push('Ceiling-fan');
  if (d.heaters > 0) acc.push('Electric-heater');
  f['accessories[]'] = acc;

  // Sides grid: row 1 = width sides (front/back), row 2 = length sides (left/right).
  for (const spec of Object.values(ENCLOSURES)) {
    const rows: [SideId[], 1 | 2][] = [
      [['front', 'back'], 1],
      [['left', 'right'], 2],
    ];
    for (const [sides, row] of rows) {
      const used = sides.filter((side) => d.sides[side]?.type === spec.id);
      const pre = `${spec.cf7Prefix}${row}`;
      if (!used.length) {
        f[`${pre}-w`] = '';
        f[`${pre}-h`] = '';
        f[`${pre}-pcs`] = '';
        continue;
      }
      const len = sideLength(d, used[0]);
      f[`${pre}-w`] = formatFtIn(len);
      f[`${pre}-h`] = formatFtIn(d.height);
      f[`${pre}-pcs`] = String(used.reduce((n, side) => n + sidePieces(spec.id, sideLength(d, side)), 0));
    }
  }

  const lc = colorField(d.louverColor, d.customRal);
  const fc = colorField(d.frameColor, d.customRal);
  f['louver-color'] = lc.value;
  f['custom-louver-color'] = lc.custom;
  f['frame-color'] = fc.value;
  f['custom-frame-color'] = fc.custom;
  f['control-system'] = CONTROLS[d.control].cf7;
  f['radio-606'] = USE_LABELS[site.use ?? 'residential'] ?? 'Residential';
  return f;
}

function screensCF7(d: ScreensDesign, site: SiteInfo, address: string, opts: CF7Options): CF7Fields {
  const n = d.openings.length;
  const f: CF7Fields = {
    _wpcf7: '1783',
    'full-name': site.name,
    'phone-number': site.phone,
    'estimate-date': opts.date ?? '',
    'your-email': site.email,
    'project-address': address,
    'zip-code': site.zip,
    'installation-type': SCREEN_SURFACES[d.openings[0]?.mountedOn ?? 'other'].cf7,
    openings: n > 6 ? 'More' : String(Math.max(1, n)),
  };
  for (let i = 0; i < 3; i++) {
    const o = d.openings[i];
    f[`width-${i + 1}`] = o ? formatFtIn(o.width) : '';
    f[`height-${i + 1}`] = o ? formatFtIn(o.height) : '';
  }
  const fc = colorField(d.frameColor);
  const fb = colorField(d.fabricColor);
  f['frame-color'] = fc.value;
  f['custom-frame-color'] = fc.custom;
  f['fabric-color'] = fb.value;
  f['custom-fabric-color'] = fb.custom;
  f['fabric-openness'] = FABRICS[d.fabric].cf7;
  f['wind-sensor'] = d.windSensor ? 'Yes' : 'No';
  f['motor-type'] = CONTROLS[d.control].cf7Screen;
  f['project-type'] = d.projectType === 'commercial' ? 'Commercial' : 'Residential';
  const extra = d.openings
    .slice(3)
    .map((o, i) => `Opening ${i + 4}: ${formatFtIn(o.width)} × ${formatFtIn(o.height)} (${SCREEN_SURFACES[o.mountedOn].label})`);
  f['additional-notes'] = [site.notes ?? '', ...extra].filter(Boolean).join('\n');
  return f;
}

function contactCF7(d: ShadesDesign | KitchenDesign, site: SiteInfo): CF7Fields {
  let service: string;
  let summary: string;
  if (d.kind === 'shades') {
    service = 'Motorized Indoor Blinds';
    summary = d.windows
      .map((w, i) => `Window ${i + 1}: ${w.style} ${formatFtIn(w.width)} × ${formatFtIn(w.height)}, ${w.mount} mount, ${w.opacity}, ${w.operation}${w.room ? ` (${w.room})` : ''}`)
      .join('\n');
    summary += `\nService: ${d.service}`;
  } else {
    service = 'Outdoor Kitchen';
    const apps = (['grill', 'fridge', 'sink'] as const).filter((k) => d[k]).join(', ') || 'none';
    summary = `Outdoor kitchen: ${d.shape} shape, ${formatFtIn(d.length)} run, ${d.counter} counters, appliances: ${apps}`;
  }
  return {
    _wpcf7: '1864',
    'your-name': site.name,
    'your-phone': site.phone,
    'your-email': site.email,
    'your-city': site.city ?? site.zip,
    'your-service': service,
    'your-message': [summary, site.notes ?? ''].filter(Boolean).join('\n\n'),
  };
}
