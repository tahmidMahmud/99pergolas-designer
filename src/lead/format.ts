/**
 * Pure formatting helpers shared by the client (PDF, mailto) and the server (emails, CF7 block).
 * No DOM, no imports with side effects: this file also runs inside Cloudflare Pages Functions
 * and under `node --experimental-strip-types` (scripts/dev-api.mjs), so runtime imports must use
 * explicit `.ts` extensions and only `import type` from elsewhere.
 */
import type {
  ColorId,
  Design,
  EnclosureType,
  FabricId,
  KitchenDesign,
  LeadPayload,
  Mounting,
  PergolaDesign,
  ScreensDesign,
  ShadesDesign,
  SideId,
  SiteInfo,
} from '../types';

export const BRAND = {
  name: '99 Pergolas',
  phone: '(682) 241-5877',
  phoneHref: 'tel:+16822415877',
  email: 'info@99pergolas.com',
  site: 'https://99pergolas.com',
  siteLabel: '99pergolas.com',
  measureUrl: 'https://99pergolas.com/measurement-booking/',
  estimateFormUrl: 'https://99pergolas.com/free-estimate-custom-pergola/',
  colors: {
    dark: '#171A18',
    dark2: '#20241F',
    bone: '#F2F1EC',
    brass: '#B4863B',
    brassDeep: '#8F6A2B',
    text: '#22251F',
    muted: '#62655D',
  },
} as const;

export const DEFAULT_DISCLAIMER =
  'Estimate for planning only, based on typical Texas installations. Final price confirmed after a free on-site measure and depends on site conditions, permits/HOA, electrical, and engineering for your wind zone. Not an offer or contract.';

/** 150 -> `12' 6"`; 144 -> `12' 0"`; rounds to the nearest inch. */
export function formatInches(n: number): string {
  if (!Number.isFinite(n)) return '';
  const total = Math.round(Math.abs(n));
  const ft = Math.floor(total / 12);
  const inch = total % 12;
  return `${n < 0 ? '-' : ''}${ft}' ${inch}"`;
}

/** 18400 -> `$18,400` (no cents). */
export function money(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  const r = Math.round(n);
  return `${r < 0 ? '-' : ''}$${Math.abs(r).toLocaleString('en-US')}`;
}

export function moneyRange(low: number, high: number): string {
  return low === high ? money(low) : `${money(low)} - ${money(high)}`;
}

export const KIND_LABEL: Record<Design['kind'], string> = {
  pergola: 'Louvered pergola',
  screens: 'Motorized patio screens',
  shades: 'Motorized indoor shades',
  kitchen: 'Outdoor kitchen',
};

export const MOUNTING_LABEL: Record<Mounting, string> = {
  freestanding: 'Freestanding',
  attached: 'Wall mounted',
  floating: 'Wall hanging (floating)',
  cantilever: 'Cantilever (carport)',
};

export const COLOR_LABEL: Record<ColorId, string> = {
  black: 'Black',
  grey: 'Grey (anthracite)',
  white: 'White',
  bronze: 'Bronze',
  custom: 'Custom RAL',
};

export const COLOR_RAL: Partial<Record<ColorId, string>> = {
  black: 'RAL 9005',
  grey: 'RAL 7016',
  white: 'RAL 9016',
  bronze: 'RAL 8019',
};

export const ENCLOSURE_LABEL: Record<EnclosureType, string> = {
  none: 'Open',
  screen: 'Motorized zip screen',
  'glass-frameless': 'Frameless sliding glass',
  'glass-framed': 'Framed sliding glass door',
  'shutter-sliding': 'Sliding aluminum shutters',
  'shutter-bifold': 'Bifold aluminum shutters',
  'panel-fixed': 'Fixed aluminum privacy panel',
};

export const FABRIC_LABEL: Record<FabricId, string> = {
  blackout: 'Blackout',
  '99': '99% sun block',
  '97': '97% sun block',
  '95': '95% sun block',
  '90': '90% sun block',
  '70': '70% sun block',
  '60': '60% sun block',
};

const SIDE_ORDER: SideId[] = ['front', 'back', 'left', 'right'];
const SIDE_LABEL: Record<SideId, string> = { front: 'Front', back: 'Back', left: 'Left', right: 'Right' };

export function colorText(id: ColorId | undefined, customRal?: string): string {
  if (!id) return '';
  if (id === 'custom') return customRal ? `Custom (${customRal})` : 'Custom RAL (to confirm)';
  const ral = COLOR_RAL[id];
  return ral ? `${COLOR_LABEL[id]} (${ral})` : COLOR_LABEL[id];
}

function yes(b: boolean | undefined): string {
  return b ? 'Yes' : 'No';
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Short size label used in subjects: `12' 0" x 16' 0"`, `3 openings`, `4 windows`, `8' 0" run`. */
export function designSizeLabel(design: Design): string {
  switch (design.kind) {
    case 'pergola':
      return `${formatInches(design.width)} x ${formatInches(design.depth)}`;
    case 'screens': {
      const n = design.openings.length;
      return `${n} opening${n === 1 ? '' : 's'}`;
    }
    case 'shades': {
      const n = design.windows.length;
      return `${n} window${n === 1 ? '' : 's'}`;
    }
    case 'kitchen':
      return `${formatInches(design.length)} ${design.shape === 'straight' ? 'straight' : design.shape.toUpperCase() + '-shape'}`;
  }
}

export function designTitle(design: Design): string {
  if (design.kind === 'pergola') {
    const line = design.line === 'lux' ? 'Lux' : 'Prestige';
    const what = design.roof === 'solid' ? 'solid-roof patio cover' : 'louvered pergola';
    return `${line} ${what}, ${designSizeLabel(design)}`;
  }
  return `${KIND_LABEL[design.kind]}, ${designSizeLabel(design)}`;
}

export type SpecRow = [label: string, value: string];

function pergolaRows(d: PergolaDesign): SpecRow[] {
  const rows: SpecRow[] = [
    ['Product', `${d.line === 'lux' ? 'Lux Line' : 'Prestige Line'} ${d.roof === 'solid' ? 'solid-roof patio cover' : 'louvered pergola'}`],
    ['Roof', d.roof === 'solid' ? 'Solid insulated aluminum' : 'Motorized adjustable louvers'],
    ['Mounting', MOUNTING_LABEL[d.mounting]],
    ['Width x Length x Height', `${formatInches(d.width)} x ${formatInches(d.depth)} x ${formatInches(d.height)} clear`],
    ['Frame color', colorText(d.frameColor, d.customRal)],
    ['Louver color', colorText(d.louverColor, d.customRal)],
  ];
  if (d.roof === 'louvered' && d.louverDirection !== 'auto') {
    rows.push(['Louver direction', d.louverDirection === 'x' ? 'Spanning the width' : 'Spanning the length']);
  }
  for (const s of SIDE_ORDER) {
    const side = d.sides[s];
    if (!side || side.type === 'none') {
      rows.push([`${SIDE_LABEL[s]} side`, 'Open']);
      continue;
    }
    let v = ENCLOSURE_LABEL[side.type];
    if (side.type === 'screen' && side.fabric) v += `, ${FABRIC_LABEL[side.fabric]}`;
    if (side.color) v += `, ${COLOR_LABEL[side.color]}`;
    rows.push([`${SIDE_LABEL[s]} side`, v]);
  }
  const acc: string[] = [];
  if (d.ledWarm) acc.push('Warm LED lighting');
  if (d.rgb) acc.push('RGB lighting');
  if (d.rainSensor) acc.push('Rain sensor');
  if (d.windSensor) acc.push('Wind sensor');
  if (d.fans > 0) acc.push(`${d.fans} ceiling fan${d.fans > 1 ? 's' : ''}`);
  if (d.heaters > 0) acc.push(`${d.heaters} infrared heater${d.heaters > 1 ? 's' : ''}`);
  rows.push(['Accessories', acc.length ? acc.join(', ') : 'None']);
  rows.push(['Control', d.control === 'app' ? 'Mobile app (+ remote)' : 'Remote']);
  return rows;
}

function screensRows(d: ScreensDesign): SpecRow[] {
  const rows: SpecRow[] = [
    ['Product', 'Motorized patio screens'],
    ['Project type', cap(d.projectType)],
    ['Openings', String(d.openings.length)],
  ];
  d.openings.forEach((o, i) => {
    rows.push([`Opening ${i + 1}`, `${formatInches(o.width)} W x ${formatInches(o.height)} H, on ${o.mountedOn}`]);
  });
  rows.push(['Fabric', FABRIC_LABEL[d.fabric]]);
  rows.push(['Frame color', colorText(d.frameColor)]);
  rows.push(['Fabric color', colorText(d.fabricColor)]);
  rows.push(['Wind sensor', yes(d.windSensor)]);
  rows.push(['Control', d.control === 'app' ? 'Mobile app' : 'Remote']);
  return rows;
}

function shadesRows(d: ShadesDesign): SpecRow[] {
  const rows: SpecRow[] = [
    ['Product', 'Motorized indoor shades'],
    ['Service', d.service === 'install' ? 'Professional install' : d.service === 'diy' ? 'DIY' : 'Trade'],
    ['Windows', String(d.windows.length)],
  ];
  d.windows.forEach((w, i) => {
    const room = w.room ? `${w.room}: ` : '';
    rows.push([
      `Window ${i + 1}`,
      `${room}${cap(w.style)} ${formatInches(w.width)} W x ${formatInches(w.height)} H, ${w.mount} mount, ${w.opacity}, ${w.operation}`,
    ]);
  });
  return rows;
}

function kitchenRows(d: KitchenDesign): SpecRow[] {
  const appliances = [d.grill && 'Grill', d.fridge && 'Fridge', d.sink && 'Sink'].filter(Boolean) as string[];
  return [
    ['Product', 'Outdoor kitchen'],
    ['Layout', d.shape === 'straight' ? 'Straight run' : `${d.shape.toUpperCase()}-shape`],
    ['Island length', formatInches(d.length)],
    ['Countertop', cap(d.counter)],
    ['Appliances', appliances.length ? appliances.join(', ') : 'None'],
  ];
}

/** Human-readable spec rows, per product kind. */
export function specRows(design: Design): SpecRow[] {
  switch (design.kind) {
    case 'pergola':
      return pergolaRows(design);
    case 'screens':
      return screensRows(design);
    case 'shades':
      return shadesRows(design);
    case 'kitchen':
      return kitchenRows(design);
  }
}

export function customerRows(site: SiteInfo): SpecRow[] {
  const rows: SpecRow[] = [
    ['Name', site.name],
    ['Phone', site.phone],
    ['Email', site.email],
  ];
  const place = [site.address, site.city, site.zip].filter(Boolean).join(', ');
  if (place) rows.push(['Location', place]);
  if (site.surface) rows.push(['Surface', cap(site.surface)]);
  if (site.use) rows.push(['Use', cap(site.use)]);
  if (site.timeframe) rows.push(['Timeframe', TIMEFRAME_LABEL[site.timeframe]]);
  if (site.notes) rows.push(['Notes', site.notes]);
  return rows;
}

export const TIMEFRAME_LABEL: Record<NonNullable<SiteInfo['timeframe']>, string> = {
  asap: 'As soon as possible',
  '1-3mo': 'In 1-3 months',
  '3-6mo': 'In 3-6 months',
  researching: 'Just researching',
};

/** Multi-line plain-text summary (used by mailto fallback, plain-text email part, Zapier). */
export function plainSummary(p: Pick<LeadPayload, 'design' | 'site' | 'estimate' | 'shareUrl'>): string {
  const lines: string[] = [];
  lines.push(designTitle(p.design));
  lines.push('');
  for (const [k, v] of customerRows(p.site)) lines.push(`${k}: ${v}`);
  lines.push('');
  for (const [k, v] of specRows(p.design)) lines.push(`${k}: ${v}`);
  lines.push('');
  lines.push(`Estimated installed: ${moneyRange(p.estimate.low, p.estimate.high)}`);
  if (p.estimate.monthly > 0) {
    lines.push(`0% financing from ${money(p.estimate.monthly)}/mo O.A.C. (${p.estimate.termMonths} months)`);
  }
  if (p.shareUrl) lines.push(`Design link: ${p.shareUrl}`);
  return lines.join('\n');
}
