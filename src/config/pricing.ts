/**
 * Planning estimate (installed price range). Model: docs/research/99pergolas.md §3.3.
 * NOT 99 Pergolas' real price list — tune the bands in catalog.ts with the client.
 *
 * Pergola structure = max(minCharge, sqft × rate) × (1 + Σ modifier %)
 *   rate: line band (Prestige 55–85, Lux 75–120 $/sqft); solid roof = Prestige band × 0.8
 *   modifiers: +5%/extra bay, floating +12%, cantilever +15%, custom RAL +6%, two-tone +2%, clear height > 9' +5%
 * + adders (LED, RGB, sensors, app hub, fans, heaters), enclosures per side (per sqft, min per piece),
 * + permit/engineering package. Low/high rounded to $100; monthly = round(mid / 60).
 */
import type {
  Design,
  Estimate,
  KitchenDesign,
  LineItem,
  PergolaDesign,
  ScreensDesign,
  ShadesDesign,
} from '../types';
import {
  ACCESSORIES,
  COLORS,
  DISCLAIMER,
  ENCLOSURES,
  FABRICS,
  FINANCE_TERM_MONTHS,
  KITCHEN,
  LINES,
  ROOFS,
  SHADE_BASE_SQFT,
  SHADE_MOTOR_PRICE,
  SHADE_OPERATIONS,
  SHADE_SERVICES,
  SHADE_STYLES,
  type AccessoryId,
  type PriceBand,
} from './catalog';
import { computeStructure, SIDE_IDS, sideAllowed, sideLength, sidePieces } from './rules';
import { formatFtIn, formatSize } from './format';

/** Pricing knobs that are not per-item catalog prices. */
export const PRICING = {
  solidRoofFactor: 0.8,
  extraBayPct: 0.05,
  floatingPct: 0.12,
  cantileverPct: 0.15,
  customColorPct: 0.06,
  twoTonePct: 0.02,
  tallPct: 0.05,
  /** Clear height above which the tall-post modifier applies (9'0"). */
  tallThreshold: 108,
  permit: { low: 500, high: 2000 } as PriceBand,
};

const round100 = (n: number) => Math.round(n / 100) * 100;
const round10 = (n: number) => Math.round(n / 10) * 10;

function item(
  id: string,
  label: string,
  group: LineItem['group'],
  low: number,
  high: number,
  qty = 1,
  note?: string,
): LineItem {
  const it: LineItem = { id, label, qty, low: round10(low), high: round10(high), group };
  if (note) it.note = note;
  return it;
}

function finish(items: LineItem[]): Estimate {
  const low = round100(items.reduce((s, i) => s + i.low, 0));
  const high = round100(items.reduce((s, i) => s + i.high, 0));
  return {
    low,
    high,
    items,
    monthly: Math.round((low + high) / 2 / FINANCE_TERM_MONTHS),
    termMonths: FINANCE_TERM_MONTHS,
    disclaimer: DISCLAIMER,
  };
}

export function estimate(design: Design): Estimate {
  switch (design.kind) {
    case 'pergola':
      return estimatePergola(design);
    case 'screens':
      return estimateScreens(design);
    case 'shades':
      return estimateShades(design);
    case 'kitchen':
      return estimateKitchen(design);
    default:
      return finish([]);
  }
}

/** Structure rate band ($/sqft) and minimum charge for a design. */
export function structureRate(design: Pick<PergolaDesign, 'line' | 'roof'>): { low: number; high: number; minLow: number; minHigh: number } {
  if (design.roof === 'solid') {
    const p = LINES.prestige;
    const f = PRICING.solidRoofFactor;
    return {
      low: p.rate.low * f,
      high: p.rate.high * f,
      minLow: p.minCharge * f,
      minHigh: ((p.minCharge * p.rate.high) / p.rate.low) * f,
    };
  }
  const l = LINES[design.line];
  return { low: l.rate.low, high: l.rate.high, minLow: l.minCharge, minHigh: (l.minCharge * l.rate.high) / l.rate.low };
}

function addAccessory(items: LineItem[], id: AccessoryId, design: PergolaDesign, group: LineItem['group'], qty = 1) {
  if (qty <= 0) return;
  const a = ACCESSORIES[id];
  if (a.includedWith.includes(design.line)) {
    items.push(item(id, a.label, group, 0, 0, qty, `Included with ${LINES[design.line].label}`));
    return;
  }
  items.push(item(id, a.label, group, a.price.low * qty, a.price.high * qty, qty));
}

function estimatePergola(d: PergolaDesign): Estimate {
  const items: LineItem[] = [];
  const s = computeStructure(d);
  const sqft = (d.width * d.depth) / 144;
  const r = structureRate(d);
  const baseLow = Math.max(r.minLow, sqft * r.low);
  const baseHigh = Math.max(r.minHigh, sqft * r.high);
  const minApplies = sqft * r.low < r.minLow;
  const what = d.roof === 'solid' ? `${ROOFS.solid.label}` : `${LINES[d.line].label} louvered pergola`;
  items.push(
    item(
      'structure',
      `${what}, ${formatSize(d.width, d.depth)} (${Math.round(sqft)} sq ft)`,
      'structure',
      baseLow,
      baseHigh,
      1,
      minApplies ? 'Minimum project charge applies' : 'Installed: posts, beams, gutters, motorized roof, standard colors',
    ),
  );

  const mod = (id: string, label: string, pct: number, qty = 1, note?: string) =>
    items.push(item(id, label, 'structure', baseLow * pct * qty, baseHigh * pct * qty, qty, note));

  const extraBays = s.baysX * s.baysZ - 1;
  if (extraBays > 0)
    mod('bays', `Multi-bay construction (${s.baysX * s.baysZ} bays, shared posts)`, PRICING.extraBayPct, extraBays);
  if (d.mounting === 'floating') mod('floating', 'Floating mount — concealed structural support', PRICING.floatingPct);
  if (d.mounting === 'cantilever') mod('cantilever', 'Cantilever frame & arms', PRICING.cantileverPct);
  if (d.frameColor === 'custom' || d.louverColor === 'custom' || d.frameColor === 'bronze' || d.louverColor === 'bronze')
    mod('color', 'Custom RAL powder coat', PRICING.customColorPct, 1, d.customRal || undefined);
  if (d.frameColor !== d.louverColor && d.roof === 'louvered')
    mod('twotone', `Two-tone: ${COLORS[d.frameColor].label} frame, ${COLORS[d.louverColor].label} louvers`, PRICING.twoTonePct);
  if (d.height > PRICING.tallThreshold)
    mod('tall', `Clear height over ${formatFtIn(PRICING.tallThreshold)}`, PRICING.tallPct);

  // Roof automation
  if (d.roof === 'louvered' && d.rainSensor) addAccessory(items, 'rain', d, 'roof');
  if (d.windSensor) addAccessory(items, 'wind', d, 'roof');
  if (d.control === 'app') addAccessory(items, 'app', d, 'roof');

  // Lighting
  if (d.ledWarm) addAccessory(items, 'led', d, 'lighting');
  if (d.rgb) addAccessory(items, 'rgb', d, 'lighting');

  // Comfort
  addAccessory(items, 'fan', d, 'comfort', Math.max(0, Math.floor(d.fans)));
  addAccessory(items, 'heater', d, 'comfort', Math.max(0, Math.floor(d.heaters)));

  // Sides
  for (const side of SIDE_IDS) {
    const cfg = d.sides?.[side];
    if (!cfg || cfg.type === 'none' || !sideAllowed(d.mounting, side)) continue;
    const spec = ENCLOSURES[cfg.type];
    if (!spec) continue;
    const len = sideLength(d, side);
    const pcs = sidePieces(cfg.type, len);
    const area = (len * d.height) / 144;
    const fabric = cfg.type === 'screen' && cfg.fabric ? ` · ${FABRICS[cfg.fabric]?.label ?? ''}` : '';
    items.push(
      item(
        `side-${side}`,
        `${cap(side)} side: ${spec.label}${fabric}`,
        'sides',
        Math.max(spec.minPrice * (cfg.type === 'screen' ? pcs : 1), area * spec.pricePerSqFt.low),
        Math.max(spec.minPrice * (cfg.type === 'screen' ? pcs : 1), area * spec.pricePerSqFt.high),
        pcs,
        `${formatFtIn(len)} × ${formatFtIn(d.height)}${pcs > 1 ? `, ${pcs} ${cfg.type === 'screen' ? 'screens' : 'panels'}` : ''}`,
      ),
    );
  }

  items.push(item('permit', 'Permit, engineering & HOA drawings', 'site', PRICING.permit.low, PRICING.permit.high, 1, 'Typical; varies by city'));
  return finish(items);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function estimateScreens(d: ScreensDesign): Estimate {
  const items: LineItem[] = [];
  const spec = ENCLOSURES.screen;
  d.openings.forEach((o, i) => {
    const pcs = sidePieces('screen', o.width);
    const area = (o.width * o.height) / 144;
    items.push(
      item(
        `opening-${i + 1}`,
        `Motorized screen — opening ${i + 1} (${formatSize(o.width, o.height)})`,
        'sides',
        Math.max(spec.minPrice * pcs, area * spec.pricePerSqFt.low),
        Math.max(spec.minPrice * pcs, area * spec.pricePerSqFt.high),
        pcs,
        `${FABRICS[d.fabric]?.label ?? ''}${pcs > 1 ? ` · split into ${pcs} screens` : ''}`,
      ),
    );
  });
  const n = d.openings.length;
  if (d.windSensor && n > 0)
    items.push(item('wind', ACCESSORIES.wind.label, 'comfort', ACCESSORIES.wind.price.low, ACCESSORIES.wind.price.high));
  if (d.control === 'app' && n > 0)
    items.push(item('app', 'Mobile app control hub', 'comfort', ACCESSORIES.app.price.low, ACCESSORIES.app.price.high));
  if (d.frameColor === 'custom' || d.fabricColor === 'custom') {
    const sub = items.filter((i) => i.group === 'sides');
    const lo = sub.reduce((s, i) => s + i.low, 0);
    const hi = sub.reduce((s, i) => s + i.high, 0);
    items.push(item('color', 'Custom color', 'sides', lo * PRICING.customColorPct, hi * PRICING.customColorPct));
  }
  return finish(items);
}

function estimateShades(d: ShadesDesign): Estimate {
  const items: LineItem[] = [];
  const svc = SHADE_SERVICES[d.service] ?? SHADE_SERVICES.install;
  d.windows.forEach((w, i) => {
    const st = SHADE_STYLES[w.style];
    if (!st) return;
    const sizeFactor = Math.max(1, (w.width * w.height) / 144 / SHADE_BASE_SQFT);
    const room = w.room ? ` · ${w.room}` : '';
    items.push(
      item(
        `window-${i + 1}`,
        `${st.label} — window ${i + 1} (${formatSize(w.width, w.height)})${room}`,
        'structure',
        st.price.low * sizeFactor * svc.factor,
        st.price.high * sizeFactor * svc.factor,
        1,
        `${w.mount === 'inside' ? 'Inside' : 'Outside'} mount`,
      ),
    );
    if (SHADE_OPERATIONS[w.operation]?.motorized)
      items.push(
        item(
          `motor-${i + 1}`,
          `Motorization (${SHADE_OPERATIONS[w.operation].label}) — window ${i + 1}`,
          'comfort',
          SHADE_MOTOR_PRICE.low,
          SHADE_MOTOR_PRICE.high,
        ),
      );
  });
  return finish(items);
}

function estimateKitchen(d: KitchenDesign): Estimate {
  const items: LineItem[] = [];
  const ft = d.length / 12;
  const shape = KITCHEN.shapes[d.shape] ?? KITCHEN.shapes.straight;
  const counter = KITCHEN.counters[d.counter] ?? KITCHEN.counters.granite;
  const f = shape.factor * counter.factor;
  items.push(
    item(
      'island',
      `${shape.label}, ${formatFtIn(d.length)} run · ${counter.label} counters`,
      'structure',
      KITCHEN.perLinearFt.low * ft * f,
      KITCHEN.perLinearFt.high * ft * f,
    ),
  );
  for (const id of ['grill', 'fridge', 'sink'] as const) {
    if (!d[id]) continue;
    const a = KITCHEN.appliances[id];
    items.push(item(id, a.label, 'comfort', a.price.low, a.price.high));
  }
  return finish(items);
}
