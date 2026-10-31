/** Formatting helpers shared by the UI. Inches are the internal unit. */

export function ftIn(inches: number): string {
  const total = Math.round(inches);
  const ft = Math.floor(total / 12);
  const inch = total - ft * 12;
  return `${ft}′ ${inch}″`;
}

/** 36.375 -> 36 3/8″ */
export function inchesFrac(inches: number): string {
  const whole = Math.floor(inches + 1e-6);
  const eighths = Math.round((inches - whole) * 8);
  if (eighths === 0) return `${whole}″`;
  if (eighths === 8) return `${whole + 1}″`;
  const g = gcd(eighths, 8);
  return `${whole} ${eighths / g}/${8 / g}″`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function money(n: number): string {
  return usd.format(Math.round(n));
}

export function moneyRange(low: number, high: number): string {
  if (Math.round(low) === Math.round(high)) return money(low);
  return `${money(low)} – ${money(high)}`;
}

/** "+ $800–$2,000" for add-on deltas. */
export function plusRange(low: number, high: number): string {
  if (high <= 0 && low <= 0) return 'Included';
  if (Math.round(low) === Math.round(high)) return `+ ${money(low)}`;
  return `+ ${money(low)}–${money(high)}`;
}

/** 16 -> "4:00 PM", 6.5 -> "6:30 AM" */
export function hourLabel(h: number): string {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const suffix = hr >= 12 ? 'PM' : 'AM';
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${suffix}`;
}

export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? '';
}
