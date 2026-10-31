/** Popular pergola sizes (inches). width = along the house / front edge, depth = projection. */
export interface Preset {
  id: string;
  label: string;
  width: number;
  depth: number;
  popular?: boolean;
}

const ft = (w: number, d: number, popular = false): Preset => {
  const p: Preset = { id: `${w}x${d}`, label: `${w}' × ${d}'`, width: w * 12, depth: d * 12 };
  if (popular) p.popular = true;
  return p;
};

export const PRESETS: Preset[] = [
  ft(10, 10),
  ft(10, 12),
  ft(12, 12),
  ft(12, 16, true),
  ft(12, 20, true),
  ft(14, 14),
  ft(14, 20, true),
  ft(16, 20),
  ft(20, 20),
];

/** The preset matching a size exactly, if any. */
export function findPreset(width: number, depth: number): Preset | undefined {
  return PRESETS.find((p) => p.width === Math.round(width) && p.depth === Math.round(depth));
}
