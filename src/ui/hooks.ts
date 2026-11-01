/** UI-local hooks and a tiny UI store (modal state). Domain state stays in src/state/store.ts. */
import { useMemo } from 'react';
import { create } from 'zustand';
import { useDesigner } from '../state/store';
import type { Design, Estimate, PergolaDesign } from '../types';
import { clamp, estimate, validate } from './deps';
import { plusRange } from './format';

export const useUi = create<{
  leadOpen: boolean;
  openLead: () => void;
  closeLead: () => void;
  arOpen: boolean;
  openAr: () => void;
  closeAr: () => void;
}>((set) => ({
  leadOpen: false,
  openLead: () => set({ leadOpen: true, arOpen: false }),
  closeLead: () => set({ leadOpen: false }),
  arOpen: false,
  openAr: () => set({ arOpen: true }),
  closeAr: () => set({ arOpen: false }),
}));

export function useEstimate(): Estimate {
  const design = useDesigner((s) => s.design);
  return useMemo(() => estimate(design), [design]);
}

export function useValidation() {
  const design = useDesigner((s) => s.design);
  return useMemo(() => validate(design), [design]);
}

/** The current pergola design (components using it only render when kind === 'pergola'). */
export function usePergola(): PergolaDesign {
  const d = useDesigner((s) => s.design);
  return d as PergolaDesign;
}

/** Patch the pergola and run it through clamp() so sizes/sides stay legal after mounting/line changes. */
export function useUpdatePergola() {
  const setDesign = useDesigner((s) => s.setDesign);
  return (p: Partial<PergolaDesign>) => {
    const cur = useDesigner.getState().design;
    if (cur.kind !== 'pergola') return;
    setDesign(clamp({ ...cur, ...p }));
  };
}

/** Cost of an option: estimate with `on` minus estimate with `off`, as "+ $low–$high". */
export function addonLabel<D extends Design>(d: D, on: Partial<D>, off: Partial<D>): string {
  const r = addonRange(d, on, off);
  return plusRange(r.low, r.high);
}

export function addonRange<D extends Design>(d: D, on: Partial<D>, off: Partial<D>): { low: number; high: number } {
  const a: Estimate = estimate({ ...d, ...on });
  const b: Estimate = estimate({ ...d, ...off });
  return { low: Math.max(0, a.low - b.low), high: Math.max(0, a.high - b.high) };
}
