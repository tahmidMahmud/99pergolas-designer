/**
 * Zustand store shared by UI and scene. Owned by the integration lead; agents may ADD actions
 * but must not rename existing fields.
 */
import { create } from 'zustand';
import type {
  Design,
  PergolaDesign,
  ScreensDesign,
  ShadesDesign,
  KitchenDesign,
  ViewState,
  StepId,
  SideId,
  SideConfig,
} from '../types';

import {
  CONFIG_DEFAULT_PERGOLA,
  CONFIG_DEFAULT_SCREENS,
  CONFIG_DEFAULT_SHADES,
  CONFIG_DEFAULT_KITCHEN,
  CONFIG_DEFAULT_VIEW,
} from '../config/defaults';

/** Single source of truth for defaults lives in src/config/defaults.ts (pure, server-safe). */
export const DEFAULT_PERGOLA: PergolaDesign = CONFIG_DEFAULT_PERGOLA;
export const DEFAULT_SCREENS: ScreensDesign = CONFIG_DEFAULT_SCREENS;
export const DEFAULT_SHADES: ShadesDesign = CONFIG_DEFAULT_SHADES;
export const DEFAULT_KITCHEN: KitchenDesign = CONFIG_DEFAULT_KITCHEN;
export const DEFAULT_VIEW: ViewState = CONFIG_DEFAULT_VIEW;

export interface DesignerState {
  design: Design;
  view: ViewState;
  /** Replace the whole design (e.g. from URL or preset). */
  setDesign: (d: Design) => void;
  /** Shallow-patch the current design; ignored if `kind` differs. */
  patch: (p: Partial<Design>) => void;
  /** Convenience for pergola sides. */
  setSide: (side: SideId, cfg: SideConfig) => void;
  setView: (p: Partial<ViewState>) => void;
  setStep: (s: StepId) => void;
  /** Switch product, loading that product's default design. */
  setProduct: (kind: Design['kind']) => void;
}

export const useDesigner = create<DesignerState>((set, get) => ({
  design: DEFAULT_PERGOLA,
  view: DEFAULT_VIEW,
  setDesign: (design) => set({ design }),
  patch: (p) => {
    const cur = get().design;
    if (p.kind && p.kind !== cur.kind) return;
    set({ design: { ...cur, ...p } as Design });
  },
  setSide: (side, cfg) => {
    const cur = get().design;
    if (cur.kind !== 'pergola') return;
    set({ design: { ...cur, sides: { ...cur.sides, [side]: cfg } } });
  },
  setView: (p) => set({ view: { ...get().view, ...p } }),
  setStep: (step) => set({ view: { ...get().view, step } }),
  setProduct: (kind) => {
    const d =
      kind === 'pergola' ? DEFAULT_PERGOLA : kind === 'screens' ? DEFAULT_SCREENS : kind === 'shades' ? DEFAULT_SHADES : DEFAULT_KITCHEN;
    set({ design: d, view: { ...get().view, step: 'size' } });
  },
}));
