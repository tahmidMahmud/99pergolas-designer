/**
 * UI-only copy (wording taken from 99pergolas.com where possible: docs/research/99pergolas.md).
 * Prices, limits and rules live in src/config; this file is labels and marketing text only.
 */
import type { Line, ProductKind, RoofType, SideId, StepId, KitchenDesign, SiteInfo } from '../types';
import { CATALOG } from './deps';

export const PHONE_DISPLAY = '(682) 241-5877';
export const PHONE_HREF = 'tel:16822415877';
export const EMAIL = 'info@99pergolas.com';
export const MEASURE_URL = 'https://99pergolas.com/measurement-booking/';
export const FINANCE_URL = 'https://www.hfsfinancial.net/promo/67f7fef2c6cd95578286fcfc/';
export const LOGO_URL = 'https://99pergolas.com/wp-content/uploads/2026/07/logo-white.png';

export const PRODUCTS: { id: ProductKind; label: string; title: string; tagline: string }[] = [
  { id: 'pergola', label: 'Pergolas', title: 'Custom Design Pergola', tagline: 'From Design to Shade — Your Custom Pergola Starts Here' },
  { id: 'screens', label: 'Patio Screens', title: 'Motorized Patio Screens', tagline: 'Enjoy Your Patio Year-Round.' },
  { id: 'shades', label: 'Indoor Shades', title: 'Motorized Indoor Shades', tagline: 'Perfect Light. One Touch Away.' },
  { id: 'kitchen', label: 'Outdoor Kitchen', title: 'Outdoor Kitchen', tagline: 'Cook, Entertain, Live Outside.' },
];

export const STEPS: { id: StepId; label: string; heading: string; sub: string }[] = [
  { id: 'size', label: 'Size', heading: 'Size & mounting', sub: 'Approximate measurements are fine — we confirm everything at your free on-site measure.' },
  { id: 'style', label: 'Style', heading: 'Line & colors', sub: 'Two lines. One standard of quality. Every pergola is powder-coated to order.' },
  { id: 'roof', label: 'Roof', heading: 'Roof & control', sub: 'Rain or shine, stay outside. Tilt the louvers to see the shade move.' },
  { id: 'sides', label: 'Sides', heading: 'Side enclosures', sub: 'Choose an enclosure for each side — screens, glass, shutters or privacy panels.' },
  { id: 'comfort', label: 'Comfort', heading: 'Lighting & comfort', sub: 'Integrated lighting, ceiling fans and infrared heaters, with wiring prep included.' },
  { id: 'review', label: 'Review', heading: 'Review your design', sub: 'Send it to us for a free estimate — we reply within one business day.' },
];

/** Catalog-backed lists (labels and blurbs come from src/config so copy stays in one place). */
export const LINES = CATALOG.lines;
export const LOUVER_MAX: Record<Line, number> = { lux: CATALOG.lines.lux.louverMaxAngle, prestige: CATALOG.lines.prestige.louverMaxAngle };
export const ROOFS = Object.values(CATALOG.roofs);

export const SIDE_LABELS: Record<SideId, string> = { front: 'Front', back: 'Back', left: 'Left', right: 'Right' };

export const SHADE_STYLES = Object.values(CATALOG.shadeStyles);
export const SHADE_OPACITY = Object.values(CATALOG.shadeOpacities);
export const SHADE_OPERATION = Object.values(CATALOG.shadeOperations);
export const SCREEN_SURFACES = Object.values(CATALOG.screenSurfaces);
export const KITCHEN_SHAPES = Object.values(CATALOG.kitchen.shapes);

/** Countertop render colors for the 2D kitchen plan (UI only). */
const COUNTER_HEX: Record<KitchenDesign['counter'], string> = {
  granite: '#4a4744',
  quartz: '#e6e3dc',
  concrete: '#9b9890',
  tile: '#b58a5e',
};
export const COUNTERS = Object.values(CATALOG.kitchen.counters).map((c) => ({ ...c, hex: COUNTER_HEX[c.id] }));

export const TIMEFRAMES: { id: NonNullable<SiteInfo['timeframe']>; label: string }[] = [
  { id: 'asap', label: 'As soon as possible' },
  { id: '1-3mo', label: 'In 1–3 months' },
  { id: '3-6mo', label: 'In 3–6 months' },
  { id: 'researching', label: 'Just researching' },
];

/** Shade/heat narrative for the sun slider. */
export function sunNote(hour: number, roof: RoofType): string {
  if (hour >= 19) return 'Evening — integrated LEDs take over after sunset.';
  if (roof === 'solid') {
    if (hour < 10) return 'Morning sun comes in low from the east — a side screen keeps it off your table.';
    if (hour < 15) return 'Midday — the solid roof keeps the whole patio in shade.';
    return 'Afternoon sun swings west — a west-facing screen blocks the low glare.';
  }
  if (hour < 10) return 'Morning sun from the east — open the louvers to let gentle light in.';
  if (hour < 15) return 'Midday sun is overhead — close the louvers for full shade.';
  return 'Afternoon sun from the west — tilt the louvers against it, or drop a screen on that side.';
}
