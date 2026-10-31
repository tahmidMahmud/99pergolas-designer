import { describe, expect, it } from 'vitest';
import { estimate } from '../pricing';
import { DISCLAIMER } from '../catalog';
import { pergola } from './helpers';
import type { Design } from '../../types';

describe('estimate', () => {
  it('returns a rounded range, monthly payment and disclaimer', () => {
    const e = estimate(pergola());
    expect(e.low % 100).toBe(0);
    expect(e.high % 100).toBe(0);
    expect(e.high).toBeGreaterThan(e.low);
    expect(e.termMonths).toBe(60);
    expect(e.monthly).toBe(Math.round((e.low + e.high) / 2 / 60));
    expect(e.disclaimer).toBe(DISCLAIMER);
    expect(e.items.length).toBeGreaterThan(0);
  });

  it('matches the research sanity check for a bare 12x16 Prestige', () => {
    const e = estimate(pergola({ line: 'prestige', ledWarm: false, rainSensor: false, control: 'remote' }));
    const s = e.items.find((i) => i.id === 'structure')!;
    expect(s.low).toBeCloseTo(192 * 55, -1);
    expect(s.high).toBeCloseTo(192 * 85, -1);
  });

  it('applies the minimum charge on small pergolas', () => {
    const e = estimate(pergola({ line: 'lux', width: 84, depth: 84 }));
    const s = e.items.find((i) => i.id === 'structure')!;
    expect(s.low).toBe(12000);
    expect(s.note).toMatch(/Minimum/);
  });

  it('Lux costs more than Prestige; solid roof costs less than louvered', () => {
    const base = { width: 144, depth: 192 };
    expect(estimate(pergola({ ...base, line: 'lux' })).low).toBeGreaterThan(estimate(pergola({ ...base, line: 'prestige' })).low);
    expect(estimate(pergola({ ...base, line: 'prestige', roof: 'solid' })).low).toBeLessThan(estimate(pergola({ ...base, line: 'prestige' })).low);
  });

  it('modifiers add cost: floating, cantilever, custom RAL, two-tone, tall', () => {
    const ref = estimate(pergola()).low;
    expect(estimate(pergola({ mounting: 'floating' })).low).toBeGreaterThan(ref);
    expect(estimate(pergola({ mounting: 'cantilever' })).low).toBeGreaterThan(ref);
    expect(estimate(pergola({ frameColor: 'custom', louverColor: 'custom' })).low).toBeGreaterThan(ref);
    expect(estimate(pergola({ louverColor: 'white' })).low).toBeGreaterThan(ref);
    expect(estimate(pergola({ height: 114 })).low).toBeGreaterThan(ref);
  });

  it('adds accessories per unit and enclosures per side', () => {
    const e = estimate(pergola({ fans: 2, heaters: 3, rgb: true, sides: { front: { type: 'screen', fabric: '95' }, back: { type: 'glass-frameless' }, left: { type: 'none' }, right: { type: 'none' } } }));
    expect(e.items.find((i) => i.id === 'fan')).toMatchObject({ qty: 2, low: 1200, high: 3000 });
    expect(e.items.find((i) => i.id === 'heater')).toMatchObject({ qty: 3, low: 2400, high: 6000 });
    expect(e.items.find((i) => i.id === 'side-front')?.group).toBe('sides');
    expect(e.items.find((i) => i.id === 'side-back')).toBeTruthy();
  });

  it('screen minimum applies per piece', () => {
    const e = estimate(pergola({ width: 84, height: 84, sides: { front: { type: 'screen', fabric: '95' }, back: { type: 'none' }, left: { type: 'none' }, right: { type: 'none' } } }));
    expect(e.items.find((i) => i.id === 'side-front')?.low).toBe(3500);
  });

  it('ignores enclosures on disallowed sides', () => {
    const e = estimate(pergola({ mounting: 'attached', sides: { front: { type: 'none' }, back: { type: 'screen', fabric: '95' }, left: { type: 'none' }, right: { type: 'none' } } }));
    expect(e.items.find((i) => i.id === 'side-back')).toBeUndefined();
  });

  it('is monotonic non-decreasing in width, depth and height', () => {
    const sides = { front: { type: 'screen' as const, fabric: '95' as const }, back: { type: 'none' as const }, left: { type: 'shutter-sliding' as const }, right: { type: 'none' as const } };
    for (const line of ['lux', 'prestige'] as const) {
      for (const mounting of ['freestanding', 'attached', 'floating', 'cantilever'] as const) {
        let prevLow = 0;
        let prevHigh = 0;
        for (let w = 84; w <= 480; w += 6) {
          const e = estimate(pergola({ line, mounting, sides, width: w, depth: 144 }));
          expect(e.low).toBeGreaterThanOrEqual(prevLow);
          expect(e.high).toBeGreaterThanOrEqual(prevHigh);
          prevLow = e.low;
          prevHigh = e.high;
        }
        prevLow = prevHigh = 0;
        const maxD = mounting === 'cantilever' ? 240 : 480;
        for (let d = 84; d <= maxD; d += 6) {
          const e = estimate(pergola({ line, mounting, sides, width: 168, depth: d }));
          expect(e.low).toBeGreaterThanOrEqual(prevLow);
          expect(e.high).toBeGreaterThanOrEqual(prevHigh);
          prevLow = e.low;
          prevHigh = e.high;
        }
        prevLow = prevHigh = 0;
        for (let h = 84; h <= 118; h += 1) {
          const e = estimate(pergola({ line, mounting, sides, height: h }));
          expect(e.low).toBeGreaterThanOrEqual(prevLow);
          expect(e.high).toBeGreaterThanOrEqual(prevHigh);
          prevLow = e.low;
          prevHigh = e.high;
        }
      }
    }
  });

  it('works for screens, shades and kitchen', () => {
    const designs: Design[] = [
      { kind: 'screens', openings: [{ width: 120, height: 96, mountedOn: 'wood' }, { width: 200, height: 96, mountedOn: 'brick' }], frameColor: 'black', fabricColor: 'black', fabric: '95', windSensor: true, control: 'app', projectType: 'residential' },
      { kind: 'shades', windows: [{ style: 'roller', width: 36, height: 60, mount: 'inside', opacity: 'blackout', operation: 'remote' }, { style: 'vertical', width: 144, height: 96, mount: 'outside', opacity: 'sheer', operation: 'manual' }], service: 'install' },
      { kind: 'kitchen', shape: 'l', length: 144, grill: true, fridge: true, sink: true, counter: 'quartz' },
    ];
    for (const d of designs) {
      const e = estimate(d);
      expect(e.low).toBeGreaterThan(0);
      expect(e.high).toBeGreaterThan(e.low);
      expect(e.monthly).toBeGreaterThan(0);
    }
    const scr = estimate(designs[0]);
    expect(scr.items.find((i) => i.id === 'opening-2')?.qty).toBe(2);
  });
});
