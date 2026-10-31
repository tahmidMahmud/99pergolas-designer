/** Inch → meter conversion and formatting helpers for the scene. */
export const IN = 0.0254;

/** Inches to meters. */
export const m = (inches: number): number => inches * IN;

/** Format inches as feet-inches, e.g. 144 → 12' 0". */
export function ftIn(inches: number): string {
  const total = Math.round(inches);
  const ft = Math.floor(total / 12);
  const inch = total - ft * 12;
  return `${ft}' ${inch}"`;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
