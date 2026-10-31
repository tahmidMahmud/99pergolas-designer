/**
 * Default designs, duplicated from src/state/store.ts so that src/config stays free of
 * zustand/React (it is imported by the Cloudflare Function). A test asserts they stay equal.
 */
import type { KitchenDesign, PergolaDesign, ScreensDesign, ShadesDesign, ViewState } from '../types';

export const CONFIG_DEFAULT_PERGOLA: PergolaDesign = {
  kind: 'pergola',
  line: 'lux',
  roof: 'louvered',
  mounting: 'freestanding',
  width: 144,
  depth: 192,
  height: 108,
  louverDirection: 'auto',
  frameColor: 'black',
  louverColor: 'black',
  sides: {
    front: { type: 'none' },
    back: { type: 'none' },
    left: { type: 'none' },
    right: { type: 'none' },
  },
  ledWarm: true,
  rgb: false,
  rainSensor: true,
  windSensor: false,
  fans: 0,
  heaters: 0,
  control: 'app',
};

export const CONFIG_DEFAULT_SCREENS: ScreensDesign = {
  kind: 'screens',
  openings: [{ width: 120, height: 96, mountedOn: 'wood' }],
  frameColor: 'black',
  fabricColor: 'black',
  fabric: '95',
  windSensor: true,
  control: 'remote',
  projectType: 'residential',
};

export const CONFIG_DEFAULT_SHADES: ShadesDesign = {
  kind: 'shades',
  windows: [{ style: 'roller', width: 36, height: 60, mount: 'inside', opacity: 'light-filtering', operation: 'remote' }],
  service: 'install',
};

export const CONFIG_DEFAULT_KITCHEN: KitchenDesign = {
  kind: 'kitchen',
  shape: 'straight',
  length: 96,
  grill: true,
  fridge: false,
  sink: false,
  counter: 'granite',
};

export const CONFIG_DEFAULT_VIEW: ViewState = {
  louverAngle: 35,
  hour: 16,
  showDimensions: false,
  step: 'size',
};

/** Deep copy of a default so callers can mutate freely. */
export function cloneDefault<T>(d: T): T {
  return JSON.parse(JSON.stringify(d)) as T;
}
