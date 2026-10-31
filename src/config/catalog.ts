/**
 * Product catalog for the 99 Pergolas designer.
 * Marketing copy is taken (shortened) from 99pergolas.com (see docs/research/99pergolas.md).
 * Geometry comes from the OEM specs (AlunoTec Pergo-T600 = Lux, Pergo-M6 PRO = Prestige).
 * Prices are planning bands from docs/research §3.3 — calibrate with the client (docs/HANDOFF.md).
 * Units: inches, USD.
 */
import type {
  ColorId,
  ControlType,
  EnclosureType,
  FabricId,
  KitchenDesign,
  Line,
  Mounting,
  RoofType,
  ScreenMountSurface,
  ShadeOpacity,
  ShadeOperation,
  ShadeStyle,
} from '../types';

/* ------------------------------------------------------------------ */
/* Local catalog types (config-only; not part of the shared contract) */
/* ------------------------------------------------------------------ */

export interface PriceBand {
  low: number;
  high: number;
}

export interface LineSpec {
  id: Line;
  label: string;
  /** Value for CF7 field `model`. */
  cf7: string;
  badge?: string;
  tagline: string;
  blurb: string;
  bullets: string[];
  /**
   * Max single-bay span of the louvers (the bay's shorter side when louvers are auto), inches.
   * Prestige 13'1" (4 m), Lux 19'8" (6 m).
   */
  maxBayWidth: number;
  /** Max single-bay beam span (the bay's longer side), inches. Prestige 19'8" (6 m), Lux 22'11" (7 m). */
  maxBayDepth: number;
  /** Max clear height (OEM 3 m post), inches. */
  maxHeight: number;
  louverMaxAngle: number;
  bladeWidth: number;
  louverPitch: number;
  postSize: number;
  beamDepth: number;
  beamWidth: number;
  warrantyYears: number;
  priceTier: string;
  /** $/sq ft of roof footprint, installed. */
  rate: { low: number; mid: number; high: number };
  /** Minimum project charge (low end), USD. */
  minCharge: number;
  /** Feature gating: Lux-only by default (admin can flip). */
  features: { rgb: boolean; app: boolean; voice: boolean };
}

export interface ColorSpec {
  id: ColorId;
  label: string;
  ral: string;
  hex: string;
  /** Value for CF7 `frame-color` / `louver-color` / `fabric-color`. Non-standard colors go as "Customized". */
  cf7: 'Black' | 'Grey' | 'White' | 'Customized';
  standard: boolean;
}

export interface FabricSpec {
  id: FabricId;
  label: string;
  /** Percent of sun blocked (blackout = 100). */
  sunBlock: number;
  /** Value for CF7 `fabric-openness`. */
  cf7: string;
  blurb: string;
  /** 1 (low) – 3 (high) ratings for compact UI. */
  shade: 1 | 2 | 3;
  privacy: 1 | 2 | 3;
  visibility: 1 | 2 | 3;
  /** Exact bar values used on the 99pergolas.com fabric picker: [percent, word]. */
  bars: { shade: [number, string]; privacy: [number, string]; visibility: [number, string] };
  /** Render hint for the 3D fabric plane (0 transparent – 1 opaque). */
  opacity: number;
}

export interface EnclosureSpec {
  id: EnclosureType;
  label: string;
  tagline: string;
  blurb: string;
  bullets: string[];
  /** Widest single unit/panel, inches. A side wider than this is split into pieces. */
  maxPanelWidth: number;
  pricePerSqFt: PriceBand;
  /** Minimum price per piece, USD. */
  minPrice: number;
  /** CF7 sides-grid key prefix (`ms`, `fsw`, `ss`, `fold`, `fsgd`, `frsgd`). */
  cf7Prefix: string;
}

export type AccessoryId = 'led' | 'rgb' | 'rain' | 'wind' | 'fan' | 'heater' | 'app';

export interface AccessorySpec {
  id: AccessoryId;
  label: string;
  tagline: string;
  blurb: string;
  bullets: string[];
  price: PriceBand;
  /** Priced per unit (fans, heaters). */
  perUnit: boolean;
  luxOnly: boolean;
  /** Included at no extra cost with these lines. */
  includedWith: Line[];
  /** Value for CF7 `accessories[]`, when the form has one. */
  cf7?: string;
}

export interface ShadeStyleSpec {
  id: ShadeStyle;
  label: string;
  tagline: string;
  blurb: string;
  bestFor: string;
  opacities: ShadeOpacity[];
  /** Installed price per window (standard ~20 sq ft window), USD. */
  price: PriceBand;
  maxWidth: number;
  maxHeight: number;
}

export interface ScreenSurfaceSpec {
  id: ScreenMountSurface;
  label: string;
  /** CF7 `installation-type`. */
  cf7: string;
}

export interface MountingSpec {
  id: Mounting;
  label: string;
  /** CF7 `pergola-design`. */
  cf7: string;
  blurb: string;
  perfectFor: string[];
}

export interface RoofSpec {
  id: RoofType;
  label: string;
  blurb: string;
}

export interface ControlSpec {
  id: ControlType;
  label: string;
  blurb: string;
  /** CF7 `control-system` (pergola form). */
  cf7: string;
  /** CF7 `motor-type` (screen form). */
  cf7Screen: string;
}

export interface KitchenShapeSpec {
  id: KitchenDesign['shape'];
  label: string;
  blurb: string;
  /** Multiplier on the per-linear-foot island price (corners). */
  factor: number;
}

export interface KitchenCounterSpec {
  id: KitchenDesign['counter'];
  label: string;
  factor: number;
}

export interface KitchenApplianceSpec {
  id: 'grill' | 'fridge' | 'sink';
  label: string;
  blurb: string;
  price: PriceBand;
}

/* ------------------------------------------------------------------ */

export const LINES: Record<Line, LineSpec> = {
  lux: {
    id: 'lux',
    label: 'Lux Line',
    cf7: 'Lux Line',
    badge: 'Flagship',
    tagline: 'The Ultimate Smart Pergola Experience',
    blurb:
      'Our flagship motorized louvered aluminum pergola, engineered for the highest level of comfort, technology, and architectural design.',
    bullets: [
      'Motorized louvers (0–105°)',
      'Rain sensors',
      'LED & RGB lighting',
      'Ceiling fan ready',
      'Motorized screens & sliding glass compatible',
      'Remote, mobile app & voice control',
      'Custom sizes',
      '20-year structural warranty',
    ],
    maxBayWidth: 236, // 19'8"
    maxBayDepth: 275, // 22'11"
    maxHeight: 118, // 9'10"
    louverMaxAngle: 105,
    bladeWidth: 8,
    louverPitch: 7.875,
    postSize: 5.875,
    beamDepth: 8,
    beamWidth: 5,
    warrantyYears: 20,
    priceTier: '$$$$',
    rate: { low: 75, mid: 95, high: 120 },
    minCharge: 12000,
    features: { rgb: true, app: true, voice: true },
  },
  prestige: {
    id: 'prestige',
    label: 'Prestige Line',
    cf7: 'Prestige Line',
    tagline: 'Elegant Design Meets Everyday Performance',
    blurb:
      'The modern look and durability of aluminum with practical features — perfect for patios, backyards, pool areas, and commercial spaces.',
    bullets: [
      'Motorized adjustable louvers (0–90°)',
      'Durable powder-coated aluminum',
      'Integrated LED lighting options',
      'Compatible with motorized screens & privacy walls',
      'Custom sizes and colors',
      'Smart remote control operation',
    ],
    maxBayWidth: 157, // 13'1"
    maxBayDepth: 236, // 19'8"
    maxHeight: 118,
    louverMaxAngle: 90,
    bladeWidth: 6.7,
    louverPitch: 6.5,
    postSize: 5.875,
    beamDepth: 7.5,
    beamWidth: 4.5,
    warrantyYears: 15,
    priceTier: '$$$',
    rate: { low: 55, mid: 70, high: 85 },
    minCharge: 9000,
    features: { rgb: false, app: false, voice: false },
  },
};

export const COLORS: Record<ColorId, ColorSpec> = {
  black: { id: 'black', label: 'Matte Black', ral: 'RAL 9005', hex: '#1d1f1e', cf7: 'Black', standard: true },
  grey: { id: 'grey', label: 'Anthracite Grey', ral: 'RAL 7016', hex: '#3b3f3e', cf7: 'Grey', standard: true },
  white: { id: 'white', label: 'Traffic White', ral: 'RAL 9016', hex: '#f4f3ef', cf7: 'White', standard: true },
  bronze: { id: 'bronze', label: 'Bronze', ral: 'RAL 8019', hex: '#4a3f2f', cf7: 'Customized', standard: false },
  custom: { id: 'custom', label: 'Custom RAL', ral: '', hex: '#7a5c3a', cf7: 'Customized', standard: false },
};

export const FABRICS: Record<FabricId, FabricSpec> = {
  blackout: {
    id: 'blackout',
    label: 'Blackout',
    sunBlock: 100,
    cf7: 'Blackout',
    blurb: 'Complete light control and maximum privacy.',
    shade: 3,
    privacy: 3,
    visibility: 1,
    bars: { shade: [100, 'Maximum'], privacy: [100, 'Maximum'], visibility: [0, 'None'] },
    opacity: 1,
  },
  '99': {
    id: '99',
    label: '99% Sun Block',
    sunBlock: 99,
    cf7: '99%',
    blurb: 'Maximum solar protection with limited visibility.',
    shade: 3,
    privacy: 3,
    visibility: 1,
    bars: { shade: [95, 'Very High'], privacy: [90, 'Very High'], visibility: [20, 'Low'] },
    opacity: 0.94,
  },
  '97': {
    id: '97',
    label: '97% Sun Block',
    sunBlock: 97,
    cf7: '97%',
    blurb: 'Strong shade and privacy with moderate visibility.',
    shade: 3,
    privacy: 3,
    visibility: 1,
    bars: { shade: [92, 'Very High'], privacy: [80, 'High'], visibility: [45, 'Moderate'] },
    opacity: 0.88,
  },
  '95': {
    id: '95',
    label: '95% Sun Block',
    sunBlock: 95,
    cf7: '95%',
    blurb: 'A balanced option for shade, visibility, and everyday patio comfort.',
    shade: 3,
    privacy: 2,
    visibility: 2,
    bars: { shade: [85, 'High'], privacy: [60, 'Moderate'], visibility: [70, 'High'] },
    opacity: 0.8,
  },
  '90': {
    id: '90',
    label: '90% Sun Block',
    sunBlock: 90,
    cf7: '90%',
    blurb: 'More natural light and a clearer outdoor view.',
    shade: 2,
    privacy: 2,
    visibility: 3,
    bars: { shade: [65, 'Moderate'], privacy: [60, 'Moderate'], visibility: [88, 'Very High'] },
    opacity: 0.7,
  },
  '70': {
    id: '70',
    label: '70% Sun Block',
    sunBlock: 70,
    cf7: '70%',
    blurb: 'High visibility and airflow with lighter sun protection.',
    shade: 1,
    privacy: 1,
    visibility: 3,
    bars: { shade: [40, 'Light'], privacy: [30, 'Low'], visibility: [95, 'Excellent'] },
    opacity: 0.55,
  },
  '60': {
    id: '60',
    label: '60% Sun Block',
    sunBlock: 60,
    cf7: '60%',
    blurb: 'Maximum openness, airflow, and outward visibility.',
    shade: 1,
    privacy: 1,
    visibility: 3,
    bars: { shade: [30, 'Light'], privacy: [15, 'Minimal'], visibility: [100, 'Maximum'] },
    opacity: 0.45,
  },
};

/** Fabric guide line from the site. */
export const FABRIC_GUIDE =
  'More shade & privacy: 99% or 97% · Balanced: 95% · More view & airflow: 90%, 70%, or 60% · Complete privacy: Blackout.';

export const ENCLOSURES: Record<Exclude<EnclosureType, 'none'>, EnclosureSpec> = {
  screen: {
    id: 'screen',
    label: 'Motorized Screen',
    tagline: 'Enjoy Comfort Without Losing Your View',
    blurb: 'Retractable screens that reduce heat, block insects, and increase privacy — disappearing when not in use.',
    bullets: ['Reduce heat & UV', 'Insect protection', 'Privacy with airflow', 'Remote controlled', 'Wind sensor compatible'],
    maxPanelWidth: 192, // 16'
    pricePerSqFt: { low: 45, high: 75 },
    minPrice: 3500,
    cf7Prefix: 'ms',
  },
  'glass-frameless': {
    id: 'glass-frameless',
    label: 'Frameless Sliding Glass',
    tagline: 'Create a Four-Season Outdoor Room',
    blurb: 'Protection against wind, rain, and changing weather while preserving panoramic views of your backyard.',
    bullets: ['Year-round living', 'Elegant frameless look', 'Weather protection', 'Smooth operation'],
    maxPanelWidth: 40,
    pricePerSqFt: { low: 100, high: 150 },
    minPrice: 4500,
    cf7Prefix: 'frsgd',
  },
  'glass-framed': {
    id: 'glass-framed',
    label: 'Framed Sliding Glass Door',
    tagline: 'Lockable Glass, Framed in Aluminum',
    blurb: 'Framed sliding glass doors that close your pergola into a weather-protected, lockable outdoor room.',
    bullets: ['Lockable', 'Weather protection', 'Powder-coated aluminum frame', 'Smooth operation'],
    maxPanelWidth: 48,
    pricePerSqFt: { low: 80, high: 120 },
    minPrice: 3500,
    cf7Prefix: 'fsgd',
  },
  'shutter-sliding': {
    id: 'shutter-sliding',
    label: 'Sliding Aluminum Shutters',
    tagline: 'Modern Privacy with Effortless Flexibility',
    blurb: 'Elegant shutters that glide smoothly along a track — block the afternoon sun or create a private retreat in seconds.',
    bullets: ['Smooth sliding operation', 'Privacy with airflow', 'Reduces sun & heat', 'Powder-coated aluminum'],
    maxPanelWidth: 36,
    pricePerSqFt: { low: 60, high: 100 },
    minPrice: 2500,
    cf7Prefix: 'ss',
  },
  'shutter-bifold': {
    id: 'shutter-bifold',
    label: 'Bifold Aluminum Shutters',
    tagline: 'Modern Privacy with Architectural Style',
    blurb: 'Adjustable aluminum shutters that provide privacy, airflow, and shade with a clean, modern look.',
    bullets: ['Adjustable louvers', 'Modern luxury look', 'Improved airflow', 'Custom powder-coated finishes'],
    maxPanelWidth: 30,
    pricePerSqFt: { low: 70, high: 110 },
    minPrice: 3000,
    cf7Prefix: 'fold',
  },
  'panel-fixed': {
    id: 'panel-fixed',
    label: 'Fixed Privacy Panel',
    tagline: 'Permanent Privacy | Modern Design',
    blurb: 'Fixed aluminum panels that add architectural character while reducing direct sunlight and increasing privacy.',
    bullets: ['Permanent privacy', 'Contemporary finish', 'Custom sizes', 'Low maintenance'],
    maxPanelWidth: 48,
    pricePerSqFt: { low: 40, high: 70 },
    minPrice: 2000,
    cf7Prefix: 'fsw',
  },
};

export const ENCLOSURE_NONE = { id: 'none' as const, label: 'Open', blurb: 'No enclosure on this side.' };

export const ACCESSORIES: Record<AccessoryId, AccessorySpec> = {
  led: {
    id: 'led',
    label: 'Integrated LED Lighting',
    tagline: 'Beautiful Nights Start Here',
    blurb: 'Soft warm-white architectural light built directly into your pergola.',
    bullets: ['Integrated into the structure', 'Warm white architectural lighting', 'Energy-efficient', 'Extends your evenings'],
    price: { low: 800, high: 2000 },
    perUnit: false,
    luxOnly: false,
    includedWith: [],
    cf7: 'LED-lighting',
  },
  rgb: {
    id: 'rgb',
    label: 'RGB Mood Lighting',
    tagline: 'Every Night Can Feel Different',
    blurb: 'Millions of colors and effects for dinner parties, holidays, and game day.',
    bullets: ['Millions of color combinations', 'Remote & smart control', 'Dynamic lighting scenes', 'Holiday & event lighting'],
    price: { low: 1000, high: 2500 },
    perUnit: false,
    luxOnly: true,
    includedWith: [],
    cf7: 'RGB-lighting',
  },
  rain: {
    id: 'rain',
    label: 'Rain Sensor',
    tagline: 'Your Pergola Thinks Ahead',
    blurb: 'Automatically closes the motorized louvers when rain is detected — protecting your furniture even when you’re away.',
    bullets: ['Automatic rain detection', 'Smart louver operation', 'Furniture protection'],
    price: { low: 300, high: 600 },
    perUnit: false,
    luxOnly: false,
    includedWith: ['lux'],
    cf7: 'Rain-sensor',
  },
  wind: {
    id: 'wind',
    label: 'Wind Sensor',
    tagline: 'Automatic Protection on Windy Days',
    blurb: 'Retracts screens and protects the system during high winds.',
    bullets: ['Automatic wind detection', 'Protects screens and louvers'],
    price: { low: 250, high: 500 },
    perUnit: false,
    luxOnly: false,
    includedWith: [],
  },
  fan: {
    id: 'fan',
    label: 'Ceiling Fan',
    tagline: 'Refreshing Airflow for Texas Days',
    blurb: 'Reduces trapped heat and creates a cooler, more comfortable space beneath your pergola.',
    bullets: ['Powerful air circulation', 'Quiet, energy-efficient', 'Clean, integrated installation'],
    price: { low: 600, high: 1500 },
    perUnit: true,
    luxOnly: false,
    includedWith: [],
    cf7: 'Ceiling-fan',
  },
  heater: {
    id: 'heater',
    label: 'Electric Infrared Heater',
    tagline: 'Comfort for Cooler Evenings',
    blurb: 'Fast, focused warmth beneath your pergola without smoke, gas, or taking up floor space.',
    bullets: ['Fast, targeted infrared warmth', 'Clean, quiet electric operation', 'Sleek integration'],
    price: { low: 800, high: 2000 },
    perUnit: true,
    luxOnly: false,
    includedWith: [],
    cf7: 'Electric-heater',
  },
  app: {
    id: 'app',
    label: 'Mobile App & Voice Control',
    tagline: 'Control Everything from Your Phone',
    blurb: 'Smart hub for louvers, lights, and screens from your phone — works with Alexa and Google Home.',
    bullets: ['Mobile app control', 'Alexa / Google Home voice', 'Scenes & schedules'],
    price: { low: 300, high: 800 },
    perUnit: false,
    luxOnly: true,
    includedWith: [],
  },
};

/** Per-bay quantity limits for comfort accessories. */
export const MAX_FANS_PER_BAY = 2;
export const MAX_HEATERS_PER_BAY = 4;

export const MOUNTINGS: Record<Mounting, MountingSpec> = {
  freestanding: {
    id: 'freestanding',
    label: 'Freestanding',
    cf7: 'Freestanding',
    blurb:
      'A stunning outdoor destination anywhere on your property — independent from existing structures.',
    perfectFor: ['Pool areas', 'Outdoor kitchens', 'Backyard lounges', 'Garden retreats', 'Commercial spaces'],
  },
  attached: {
    id: 'attached',
    label: 'Wall-Mounted',
    cf7: 'Wall Mounted',
    blurb: 'Attaches directly to your home, creating a seamless extension of your indoor living space.',
    perfectFor: ['Backyard patios', 'Covered decks', 'Outdoor dining', 'Restaurants', 'Modern homes'],
  },
  floating: {
    id: 'floating',
    label: 'Floating',
    cf7: 'Wall Hanging',
    blurb: 'A sleek architectural look with concealed structural support for a clean, modern aesthetic.',
    perfectFor: ['Luxury homes', 'Rooftop terraces', 'Designer patios', 'Contemporary architecture'],
  },
  cantilever: {
    id: 'cantilever',
    label: 'Cantilever Carport',
    cf7: 'Custom Shape',
    blurb: 'Premium aluminum cantilever cover with posts on one side only — open access for vehicles.',
    perfectFor: ['Carports', 'Driveways', 'Vehicle covers', 'Open-front patios'],
  },
};

export const ROOFS: Record<RoofType, RoofSpec> = {
  louvered: {
    id: 'louvered',
    label: 'Motorized Louvered Roof',
    blurb: 'Adjustable aluminum louvers for sun, shade, and airflow — waterproof when closed.',
  },
  solid: {
    id: 'solid',
    label: 'Solid Roof Patio Cover',
    blurb: 'An insulated solid aluminum roof for permanent shade and rain cover.',
  },
};

export const CONTROLS: Record<ControlType, ControlSpec> = {
  remote: { id: 'remote', label: 'Remote', blurb: 'Smart remote control operation.', cf7: 'Remote', cf7Screen: 'Remote Control' },
  app: {
    id: 'app',
    label: 'Mobile App',
    blurb: 'Control from your phone, with Alexa / Google Home voice support.',
    cf7: 'Mobile App',
    cf7Screen: 'Mobile App',
  },
};

export const SCREEN_SURFACES: Record<ScreenMountSurface, ScreenSurfaceSpec> = {
  brick: { id: 'brick', label: 'Brick opening', cf7: 'Brick' },
  aluminum: { id: 'aluminum', label: 'Aluminum frame', cf7: 'Aluminum Frame' },
  wood: { id: 'wood', label: 'Wood frame', cf7: 'Wood Frame' },
  metal: { id: 'metal', label: 'Metal structure', cf7: 'Metal' },
  other: { id: 'other', label: 'Other', cf7: 'Other' },
};

/** Standalone screen opening limits, inches. */
export const SCREEN_LIMITS = { width: { min: 36, max: 240 }, height: { min: 36, max: 144 }, maxOpenings: 12 };

const ALL_OPACITIES: ShadeOpacity[] = ['sheer', 'light-filtering', 'privacy', 'room-darkening', 'blackout'];

export const SHADE_STYLES: Record<ShadeStyle, ShadeStyleSpec> = {
  'shangri-la': {
    id: 'shangri-la',
    label: 'Shangri-La Shades',
    tagline: 'Soft Light. Elegant Privacy.',
    blurb: 'Sheer fabric with adjustable horizontal vanes for flexible control over sunlight and privacy.',
    bestFor: 'Living rooms, dining rooms, bedrooms, home offices, and luxury interiors.',
    opacities: ['sheer', 'light-filtering', 'privacy'],
    price: { low: 600, high: 1400 },
    maxWidth: 144,
    maxHeight: 144,
  },
  vertical: {
    id: 'vertical',
    label: 'Vertical Drapery',
    tagline: 'Sophisticated Coverage for Wide Openings',
    blurb: 'Soft vertical panels that travel across sliding doors, large windows, and floor-to-ceiling openings.',
    bestFor: 'Sliding glass doors, living rooms, bedrooms, offices, and hotels.',
    opacities: ['sheer', 'light-filtering', 'privacy', 'room-darkening'],
    price: { low: 700, high: 1600 },
    maxWidth: 192,
    maxHeight: 144,
  },
  roman: {
    id: 'roman',
    label: 'Roman Shades',
    tagline: 'Timeless Fabric. Tailored Elegance.',
    blurb: 'Smooth when lowered, elegant horizontal folds when raised — softness, texture, and classic design.',
    bestFor: 'Bedrooms, dining rooms, living rooms, nurseries, and formal interiors.',
    opacities: ['light-filtering', 'privacy', 'room-darkening', 'blackout'],
    price: { low: 500, high: 1200 },
    maxWidth: 144,
    maxHeight: 144,
  },
  zebra: {
    id: 'zebra',
    label: 'Zebra Shades',
    tagline: 'Daylight and Privacy in One Modern Design',
    blurb: 'Alternating sheer and solid bands give precise control over natural light and privacy.',
    bestFor: 'Living rooms, kitchens, bedrooms, apartments, and home offices.',
    opacities: ['light-filtering', 'privacy', 'room-darkening'],
    price: { low: 400, high: 1000 },
    maxWidth: 144,
    maxHeight: 144,
  },
  honeycomb: {
    id: 'honeycomb',
    label: 'Honeycomb Shades',
    tagline: 'Smart Comfort Built into Every Cell',
    blurb: 'Cellular fabric traps air to keep rooms cooler in summer and warmer in winter.',
    bestFor: 'Bedrooms, nurseries, home offices, and windows exposed to strong Texas sun.',
    opacities: ['light-filtering', 'room-darkening', 'blackout'],
    price: { low: 450, high: 1100 },
    maxWidth: 144,
    maxHeight: 144,
  },
  roller: {
    id: 'roller',
    label: 'Roller Shades',
    tagline: 'Clean Design. Endless Versatility.',
    blurb: 'Fabric rolls neatly into a compact system — sheer, solar, light-filtering, privacy, or blackout.',
    bestFor: 'Bedrooms, living rooms, kitchens, media rooms, offices, and restaurants.',
    opacities: ALL_OPACITIES,
    price: { low: 350, high: 900 },
    maxWidth: 144,
    maxHeight: 144,
  },
};

export const SHADE_OPACITIES: Record<ShadeOpacity, { id: ShadeOpacity; label: string }> = {
  sheer: { id: 'sheer', label: 'Sheer' },
  'light-filtering': { id: 'light-filtering', label: 'Light-filtering' },
  privacy: { id: 'privacy', label: 'Privacy' },
  'room-darkening': { id: 'room-darkening', label: 'Room-darkening' },
  blackout: { id: 'blackout', label: 'Blackout' },
};

export const SHADE_OPERATIONS: Record<ShadeOperation, { id: ShadeOperation; label: string; motorized: boolean }> = {
  manual: { id: 'manual', label: 'Manual', motorized: false },
  remote: { id: 'remote', label: 'Remote control', motorized: true },
  'wall-switch': { id: 'wall-switch', label: 'Wall switch', motorized: true },
  'smart-home': { id: 'smart-home', label: 'Smart home', motorized: true },
};

/** Motorization adder per shade, USD. */
export const SHADE_MOTOR_PRICE: PriceBand = { low: 250, high: 450 };
/** Window size (sq ft) covered by the base shade price; larger windows scale linearly. */
export const SHADE_BASE_SQFT = 20;
export const SHADE_LIMITS = { width: { min: 12 }, height: { min: 12 }, maxWindows: 40 };
export const SHADE_SERVICES = {
  install: { id: 'install' as const, label: 'Professional install', factor: 1 },
  diy: { id: 'diy' as const, label: 'DIY supply program', factor: 0.75 },
  trade: { id: 'trade' as const, label: 'Trade / wholesale', factor: 0.85 },
};

export const KITCHEN = {
  tagline: 'Cook, Entertain, Live Outside.',
  blurb: 'Outdoor kitchens, BBQ islands, cabinets, countertops, and grills — built for cooking and entertaining year-round in DFW.',
  /** Island price per linear foot, installed. */
  perLinearFt: { low: 900, high: 1800 } as PriceBand,
  length: { min: 48, max: 480 },
  shapes: {
    straight: { id: 'straight', label: 'Straight island', blurb: 'One run along a wall or as a bar.', factor: 1 },
    l: { id: 'l', label: 'L-shape', blurb: 'Wraps a corner with a prep or bar side.', factor: 1.1 },
    u: { id: 'u', label: 'U-shape', blurb: 'Three sides for a full outdoor chef’s kitchen.', factor: 1.2 },
  } as Record<KitchenDesign['shape'], KitchenShapeSpec>,
  counters: {
    granite: { id: 'granite', label: 'Granite', factor: 1 },
    quartz: { id: 'quartz', label: 'Quartz', factor: 1.15 },
    concrete: { id: 'concrete', label: 'Concrete', factor: 1.1 },
    tile: { id: 'tile', label: 'Tile', factor: 0.9 },
  } as Record<KitchenDesign['counter'], KitchenCounterSpec>,
  appliances: {
    grill: { id: 'grill', label: 'Built-in grill', blurb: 'Stainless built-in gas grill.', price: { low: 1500, high: 4000 } },
    fridge: { id: 'fridge', label: 'Outdoor refrigerator', blurb: 'Outdoor-rated under-counter fridge.', price: { low: 800, high: 2000 } },
    sink: { id: 'sink', label: 'Sink', blurb: 'Stainless sink with faucet.', price: { low: 600, high: 1500 } },
  } as Record<'grill' | 'fridge' | 'sink', KitchenApplianceSpec>,
};

/** Pergola size limits (inches). */
export const SIZE_LIMITS = {
  min: 84, // 7'0"
  /** Multi-bay soft cap (40'). Beyond this = engineering review / custom quote. */
  softCap: 480,
  /** "Larger than 20'×24'" engineering confirmation threshold (short × long side). */
  reviewShort: 240,
  reviewLong: 288,
  minHeight: 84,
  cantileverMaxDepth: 240,
  cantileverMaxBay: 240,
  /** Floating front-post inset from the front edge. */
  floatingInset: 24,
  /** Louver end clearance (sum of both ends), inches. */
  louverEndGap: 2,
};

/** Monthly financing term shown as "0% from $X/mo O.A.C." */
export const FINANCE_TERM_MONTHS = 60;

export const DISCLAIMER =
  'Estimate for planning only, based on typical North Texas installations. Final price is confirmed after a free on-site measure and depends on site conditions, permits/HOA, electrical, and engineering for your wind zone. Not an offer or contract.';

export const COMPANY = {
  name: '99 Pergolas',
  phone: '(682) 241-5877',
  phoneHref: 'tel:+16822415877',
  email: 'info@99pergolas.com',
  address: '3939 Belt Line Rd Ste 760D, Addison TX 75001',
  measureFee: 200,
  financingUrl: 'https://www.hfsfinancial.net/promo/67f7fef2c6cd95578286fcfc/',
};

export const CATALOG = {
  lines: LINES,
  colors: COLORS,
  fabrics: FABRICS,
  fabricGuide: FABRIC_GUIDE,
  enclosures: ENCLOSURES,
  accessories: ACCESSORIES,
  mountings: MOUNTINGS,
  roofs: ROOFS,
  controls: CONTROLS,
  shadeStyles: SHADE_STYLES,
  shadeOpacities: SHADE_OPACITIES,
  shadeOperations: SHADE_OPERATIONS,
  screenSurfaces: SCREEN_SURFACES,
  kitchen: KITCHEN,
  limits: SIZE_LIMITS,
  company: COMPANY,
  disclaimer: DISCLAIMER,
} as const;

export type Catalog = typeof CATALOG;
