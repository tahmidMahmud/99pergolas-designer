/**
 * Shared domain types for the 99 Pergolas custom designer.
 * ALL modules import from here. Units: inches internally; the 3D scene converts to meters.
 * Do not add module-specific types here; keep this the contract between config/, scene/, ui/, lead/.
 */

export type ProductKind = 'pergola' | 'screens' | 'shades' | 'kitchen';

/** Pergola product lines (99pergolas.com/pergolas). */
export type Line = 'lux' | 'prestige';

/** Louvered roof (motorized adjustable louvers) or solid insulated aluminum roof (patio cover). */
export type RoofType = 'louvered' | 'solid';

/**
 * freestanding: 4+ posts.
 * attached: ledger beam on the house wall (back side), posts on the front only.
 * floating: "wall-hanging" look; attached to the house with concealed support and inset slim posts at the front.
 * cantilever: carport style; posts along ONE long side (back), roof cantilevers forward.
 */
export type Mounting = 'freestanding' | 'attached' | 'floating' | 'cantilever';

export type ColorId = 'black' | 'grey' | 'white' | 'bronze' | 'custom';

export type SideId = 'front' | 'back' | 'left' | 'right';

export type EnclosureType =
  | 'none'
  | 'screen' // motorized zip screen
  | 'glass-frameless' // frameless sliding glass
  | 'glass-framed' // framed sliding glass door
  | 'shutter-sliding' // sliding aluminum louvered shutters
  | 'shutter-bifold' // bifold aluminum louvered shutters
  | 'panel-fixed'; // fixed aluminum privacy panel

/** Screen fabric, expressed as percent sun block (site vocabulary). */
export type FabricId = 'blackout' | '99' | '97' | '95' | '90' | '70' | '60';

export type ControlType = 'remote' | 'app';

export type LouverDirection = 'auto' | 'x' | 'z';

export interface SideConfig {
  type: EnclosureType;
  /** Only for type === 'screen'. */
  fabric?: FabricId;
  /** Fabric / panel color; defaults to frameColor. */
  color?: ColorId;
}

export interface PergolaDesign {
  kind: 'pergola';
  line: Line;
  roof: RoofType;
  mounting: Mounting;
  /** Along the house wall / front edge (X axis), inches. */
  width: number;
  /** Projection out from the wall (Z axis), inches. */
  depth: number;
  /** Clear height from ground to underside of beam, inches. */
  height: number;
  louverDirection: LouverDirection;
  frameColor: ColorId;
  louverColor: ColorId;
  /** RAL code when a color is 'custom', e.g. "RAL 7016". */
  customRal?: string;
  sides: Record<SideId, SideConfig>;
  ledWarm: boolean;
  rgb: boolean;
  rainSensor: boolean;
  windSensor: boolean;
  fans: number;
  heaters: number;
  control: ControlType;
}

export type ScreenMountSurface = 'brick' | 'aluminum' | 'wood' | 'metal' | 'other';

export interface ScreenOpening {
  width: number; // inches
  height: number; // inches
  mountedOn: ScreenMountSurface;
}

export interface ScreensDesign {
  kind: 'screens';
  openings: ScreenOpening[];
  frameColor: ColorId;
  fabricColor: ColorId;
  fabric: FabricId;
  windSensor: boolean;
  control: ControlType;
  projectType: 'residential' | 'commercial';
}

export type ShadeStyle = 'shangri-la' | 'vertical' | 'roman' | 'zebra' | 'honeycomb' | 'roller';
export type ShadeOpacity = 'sheer' | 'light-filtering' | 'privacy' | 'room-darkening' | 'blackout';
export type ShadeOperation = 'manual' | 'remote' | 'wall-switch' | 'smart-home';

export interface ShadeWindow {
  style: ShadeStyle;
  width: number; // inches
  height: number; // inches
  mount: 'inside' | 'outside';
  opacity: ShadeOpacity;
  operation: ShadeOperation;
  room?: string;
}

export interface ShadesDesign {
  kind: 'shades';
  windows: ShadeWindow[];
  service: 'install' | 'diy' | 'trade';
}

export interface KitchenDesign {
  kind: 'kitchen';
  shape: 'straight' | 'l' | 'u';
  length: number; // inches of island run
  grill: boolean;
  fridge: boolean;
  sink: boolean;
  counter: 'granite' | 'quartz' | 'concrete' | 'tile';
}

export type Design = PergolaDesign | ScreensDesign | ShadesDesign | KitchenDesign;

/** Viewer-only state; never priced, optionally in the URL. */
export interface ViewState {
  /** 0 = closed, up to line max (lux 105, prestige 90). */
  louverAngle: number;
  /** Hour of day 6..20, drives sun position and night mode (LEDs on after ~19). */
  hour: number;
  showDimensions: boolean;
  /** Which step the UI is on; the scene may focus the camera accordingly. */
  step: StepId;
}

export type StepId = 'size' | 'style' | 'roof' | 'sides' | 'comfort' | 'review';

/** Customer / site info collected in the lead form. */
export interface SiteInfo {
  name: string;
  phone: string;
  email: string;
  zip: string;
  city?: string;
  address?: string;
  surface?: 'concrete' | 'pavers' | 'deck' | 'grass' | 'other';
  use?: 'residential' | 'commercial' | 'poolside' | 'rooftop' | 'balcony' | 'garden';
  timeframe?: 'asap' | '1-3mo' | '3-6mo' | 'researching';
  notes?: string;
  consent: boolean;
}

/** Derived structural facts the rules module computes from a PergolaDesign. */
export interface Structure {
  /** Bays along X and Z (multi-bay when a dimension exceeds a line's single-bay limit). */
  baysX: number;
  baysZ: number;
  /** Post positions in inches, origin at the front-left corner at ground level; y is always 0. */
  posts: { x: number; z: number; kind: 'corner' | 'intermediate' | 'inset' }[];
  /** Louvers span along this axis; blades stack along the other. */
  louverAxis: 'x' | 'z';
  louverCount: number;
  /** Louver blade spacing center-to-center, inches. */
  louverPitch: number;
  /** Beam depth (vertical) and width, post size, blade width: inches. */
  beamDepth: number;
  beamWidth: number;
  postSize: number;
  bladeWidth: number;
  roofAreaSqFt: number;
  /** Overall outer height including beam, inches. */
  overallHeight: number;
  /** True when size needs engineering review (beyond soft caps). */
  engineeringReview: boolean;
}

export type Severity = 'error' | 'warn' | 'info';

export interface ValidationMessage {
  severity: Severity;
  /** Which field to highlight, e.g. 'width', 'sides.left'. */
  field: string;
  message: string;
}

export interface LineItem {
  id: string;
  label: string;
  qty: number;
  low: number;
  high: number;
  /** Section for the summary. */
  group: 'structure' | 'roof' | 'sides' | 'comfort' | 'lighting' | 'site';
  note?: string;
}

export interface Estimate {
  low: number;
  high: number;
  items: LineItem[];
  /** Estimated monthly payment at 0% O.A.C. over `termMonths`, using the midpoint. */
  monthly: number;
  termMonths: number;
  disclaimer: string;
}

/** Payload posted to /api/lead and emailed to sales. */
export interface LeadPayload {
  design: Design;
  view?: Partial<ViewState>;
  site: SiteInfo;
  estimate: Estimate;
  shareUrl: string;
  /** data:image/png;base64 snapshot of the viewer. */
  snapshot?: string;
  source: {
    referrer?: string;
    utm?: Record<string, string>;
    device: 'mobile' | 'desktop';
    page?: string;
  };
}
