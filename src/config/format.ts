/** Unit + money formatting helpers (pure). */

/** 150 → `12'6"`. Rounds to the nearest whole inch. */
export function formatFtIn(inches: number): string {
  const total = Math.max(0, Math.round(inches));
  const ft = Math.floor(total / 12);
  const inch = total % 12;
  return `${ft}'${inch}"`;
}

/**
 * Parse `12'6"`, `12' 6`, `12ft 6in`, `12.5'`, `150"` or `150` (bare number = inches).
 * Returns NaN when nothing parses.
 */
export function parseFtIn(text: string): number {
  const s = String(text).trim().toLowerCase().replace(/[’′]/g, "'").replace(/[”″]/g, '"');
  if (!s) return NaN;
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft|feet|foot)\s*(?:(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?)?$/);
  if (m) return Math.round(parseFloat(m[1]) * 12 + (m[2] ? parseFloat(m[2]) : 0));
  const n = s.match(/^(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?$/);
  if (n) return Math.round(parseFloat(n[1]));
  return NaN;
}

/** 12345 → "$12,345". */
export function formatUSD(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

/** "$18,400–$22,900" */
export function formatRange(low: number, high: number): string {
  return `${formatUSD(low)}–${formatUSD(high)}`;
}

/** `12'0" × 16'0"` */
export function formatSize(width: number, depth: number): string {
  return `${formatFtIn(width)} × ${formatFtIn(depth)}`;
}
