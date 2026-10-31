import { describe, expect, it } from 'vitest';
import { bayLayout, clamp, computeStructure, limits, validate } from '../rules';
import { LINES } from '../catalog';
import { pergola } from './helpers';

describe('computeStructure', () => {
  it('default 12x16 Lux freestanding is a single bay with 4 corner posts', () => {
    const s = computeStructure(pergola());
    expect(s.baysX).toBe(1);
    expect(s.baysZ).toBe(1);
    expect(s.posts).toHaveLength(4);
    expect(s.posts.every((p) => p.kind === 'corner')).toBe(true);
    expect(s.roofAreaSqFt).toBe(192);
    expect(s.overallHeight).toBe(108 + 8);
  });

  it('posts are centered postSize/2 inside the footprint', () => {
    const s = computeStructure(pergola({ width: 144, depth: 192 }));
    const half = 5.875 / 2;
    const xs = [...new Set(s.posts.map((p) => p.x))].sort((a, b) => a - b);
    const zs = [...new Set(s.posts.map((p) => p.z))].sort((a, b) => a - b);
    expect(xs).toEqual([half, 144 - half]);
    expect(zs).toEqual([half, 192 - half]);
  });

  it('uses per-line beam/blade sizes', () => {
    const lux = computeStructure(pergola({ line: 'lux' }));
    const pre = computeStructure(pergola({ line: 'prestige' }));
    expect([lux.beamDepth, lux.beamWidth, lux.bladeWidth, lux.louverPitch, lux.postSize]).toEqual([8, 5, 8, 7.875, 5.875]);
    expect([pre.beamDepth, pre.beamWidth, pre.bladeWidth, pre.louverPitch, pre.postSize]).toEqual([7.5, 4.5, 6.7, 6.5, 5.875]);
    expect(pre.overallHeight).toBe(108 + 7.5);
  });

  it('auto louvers span the shorter side and count = floor((span - post - 2)/pitch)', () => {
    const s = computeStructure(pergola({ width: 144, depth: 192 }));
    expect(s.louverAxis).toBe('x');
    expect(s.louverCount).toBe(Math.floor((192 - 5.875 - 2) / 7.875));
    const t = computeStructure(pergola({ width: 192, depth: 144 }));
    expect(t.louverAxis).toBe('z');
    expect(t.louverCount).toBe(Math.floor((192 - 5.875 - 2) / 7.875));
  });

  it('explicit louver direction is respected', () => {
    expect(computeStructure(pergola({ louverDirection: 'z' })).louverAxis).toBe('z');
  });

  it('solid roof has no louvers', () => {
    expect(computeStructure(pergola({ roof: 'solid' })).louverCount).toBe(0);
  });

  it('Prestige splits into bays beyond 13\'1" x 19\'8" while Lux stays single', () => {
    const d = { width: 192, depth: 192 }; // 16x16
    const pre = computeStructure(pergola({ line: 'prestige', ...d }));
    const lux = computeStructure(pergola({ line: 'lux', ...d }));
    expect(pre.baysX * pre.baysZ).toBe(2);
    expect(lux.baysX * lux.baysZ).toBe(1);
    // 2 bays freestanding → 6 posts (4 corners + 2 intermediates)
    expect(pre.posts).toHaveLength(6);
    expect(pre.posts.filter((p) => p.kind === 'intermediate')).toHaveLength(2);
    // every bay respects the line limits
    for (const bay of bayLayout(pergola({ line: 'prestige', ...d }))) {
      const w = bay.x1 - bay.x0;
      const dd = bay.z1 - bay.z0;
      expect(Math.min(w, dd)).toBeLessThanOrEqual(LINES.prestige.maxBayWidth);
      expect(Math.max(w, dd)).toBeLessThanOrEqual(LINES.prestige.maxBayDepth);
    }
  });

  it('36\'8" square Lux is a 2x2 grid with a shared center post and needs engineering review', () => {
    const s = computeStructure(pergola({ width: 440, depth: 440 }));
    expect([s.baysX, s.baysZ]).toEqual([2, 2]);
    expect(s.posts).toHaveLength(9);
    expect(s.posts.some((p) => p.x === 220 && p.z === 220 && p.kind === 'intermediate')).toBe(true);
    // 40' x 40': 240" bays exceed Lux's 236" louver span, so it goes 2 x 3
    const big = computeStructure(pergola({ width: 480, depth: 480 }));
    expect(big.baysX * big.baysZ).toBe(6);
    expect(s.engineeringReview).toBe(true);
    expect(computeStructure(pergola()).engineeringReview).toBe(false);
  });

  it('attached: posts only on the front row', () => {
    const s = computeStructure(pergola({ mounting: 'attached' }));
    expect(s.posts).toHaveLength(2);
    expect(s.posts.every((p) => p.z === 5.875 / 2)).toBe(true);
  });

  it('floating: front posts inset 24" and marked inset', () => {
    const s = computeStructure(pergola({ mounting: 'floating' }));
    expect(s.posts).toHaveLength(2);
    expect(s.posts.every((p) => p.kind === 'inset' && p.z === 24 + 5.875 / 2)).toBe(true);
  });

  it('cantilever: posts along the back only, bays every ≤ 20 ft', () => {
    const s = computeStructure(pergola({ mounting: 'cantilever', width: 300, depth: 216 }));
    expect(s.baysZ).toBe(1);
    expect(s.baysX).toBe(2);
    expect(s.posts).toHaveLength(3);
    expect(s.posts.every((p) => p.z === 216 - 5.875 / 2)).toBe(true);
  });

  it('louverCount is the total across bays', () => {
    const d = pergola({ line: 'prestige', width: 192, depth: 192 });
    const total = bayLayout(d).reduce((n, b) => n + b.louverCount, 0);
    expect(computeStructure(d).louverCount).toBe(total);
  });
});

describe('limits', () => {
  it('returns min 7ft, multi-bay soft cap, cantilever depth 20ft', () => {
    expect(limits('lux', 'freestanding')).toEqual({
      width: { min: 84, max: 480 },
      depth: { min: 84, max: 480 },
      height: { min: 84, max: 118 },
    });
    expect(limits('prestige', 'cantilever').depth.max).toBe(240);
  });
});

describe('validate', () => {
  const fields = (d: Parameters<typeof validate>[0]) => validate(d).map((m) => `${m.severity}:${m.field}`);

  it('default design has no errors or warnings', () => {
    expect(validate(pergola()).filter((m) => m.severity !== 'info')).toEqual([]);
  });

  it('min sizes and height range are errors', () => {
    const f = fields(pergola({ width: 60, depth: 70, height: 130 }));
    expect(f).toContain('error:width');
    expect(f).toContain('error:depth');
    expect(f).toContain('error:height');
    expect(fields(pergola({ height: 80 }))).toContain('error:height');
  });

  it('back enclosure is an error when attached or floating', () => {
    for (const mounting of ['attached', 'floating'] as const) {
      const msgs = validate(pergola({ mounting, sides: { front: { type: 'none' }, back: { type: 'screen', fabric: '95' }, left: { type: 'none' }, right: { type: 'none' } } }));
      const m = msgs.find((x) => x.field === 'sides.back');
      expect(m?.severity).toBe('error');
      expect(m?.message).toMatch(/house wall/);
    }
  });

  it('cantilever: depth > 20 ft and back enclosures are errors', () => {
    const d = pergola({ mounting: 'cantilever', depth: 252, sides: { front: { type: 'none' }, back: { type: 'panel-fixed' }, left: { type: 'none' }, right: { type: 'none' } } });
    const f = fields(d);
    expect(f).toContain('error:depth');
    expect(f).toContain('error:sides.back');
  });

  it('screen side wider than 16 ft warns about splitting', () => {
    const msgs = validate(pergola({ width: 240, sides: { front: { type: 'screen', fabric: '95' }, back: { type: 'none' }, left: { type: 'none' }, right: { type: 'none' } } }));
    expect(msgs.find((m) => m.field === 'sides.front')?.message).toMatch(/split into two screens/);
  });

  it('Prestige with RGB or app warns to suggest Lux', () => {
    const f = fields(pergola({ line: 'prestige', rgb: true, control: 'app' }));
    expect(f).toContain('warn:rgb');
    expect(f).toContain('warn:control');
    expect(fields(pergola({ line: 'lux', rgb: true, control: 'app' }))).not.toContain('warn:rgb');
  });

  it('custom color without RAL is info; oversize is info/warn', () => {
    expect(fields(pergola({ frameColor: 'custom' }))).toContain('info:customRal');
    expect(fields(pergola({ frameColor: 'custom', customRal: 'RAL 7016' }))).not.toContain('info:customRal');
    expect(validate(pergola({ width: 300, depth: 300 })).some((m) => /Larger than 20'0"×24'0"/.test(m.message))).toBe(true);
    expect(fields(pergola({ width: 500 }))).toContain('warn:width');
  });

  it('validates the other product kinds', () => {
    expect(validate({ kind: 'screens', openings: [{ width: 200, height: 96, mountedOn: 'brick' }], frameColor: 'black', fabricColor: 'black', fabric: '95', windSensor: false, control: 'remote', projectType: 'residential' }).some((m) => /two screens/.test(m.message))).toBe(true);
    expect(validate({ kind: 'kitchen', shape: 'l', length: 20, grill: true, fridge: false, sink: false, counter: 'granite' }).some((m) => m.severity === 'error')).toBe(true);
    expect(validate({ kind: 'shades', windows: [], service: 'install' }).some((m) => m.severity === 'error')).toBe(true);
  });
});

describe('clamp', () => {
  it('snaps sizes to limits and strips disallowed sides', () => {
    const c = clamp(pergola({ width: 20, depth: 999, height: 200, mounting: 'attached', sides: { front: { type: 'screen' }, back: { type: 'glass-framed' }, left: { type: 'none' }, right: { type: 'none' } } }));
    expect(c.width).toBe(84);
    expect(c.depth).toBe(480);
    expect(c.height).toBe(118);
    expect(c.sides.back.type).toBe('none');
    expect(c.sides.front).toEqual({ type: 'screen', fabric: '95' });
    expect(validate(c).filter((m) => m.severity === 'error')).toEqual([]);
  });

  it('cantilever depth is capped at 240 and fans per bay limited', () => {
    const c = clamp(pergola({ mounting: 'cantilever', depth: 300, fans: 99, heaters: -3 }));
    expect(c.depth).toBe(240);
    expect(c.fans).toBe(2);
    expect(c.heaters).toBe(0);
  });

  it('sanitizes garbage enums and NaN', () => {
    const c = clamp({ ...pergola(), line: 'gold' as never, width: NaN, frameColor: 'pink' as never });
    expect(c.line).toBe('lux');
    expect(c.width).toBe(144);
    expect(c.frameColor).toBe('black');
  });

  it('is idempotent', () => {
    const once = clamp(pergola({ width: 1000, mounting: 'floating', frameColor: 'custom', customRal: ' RAL 7016 ' }));
    expect(clamp(once)).toEqual(once);
  });
});
