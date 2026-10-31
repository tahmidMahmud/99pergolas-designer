import { describe, expect, it } from 'vitest';
import { CATALOG, PRESETS, findPreset, formatFtIn, parseFtIn } from '..';
import { DEFAULT_KITCHEN, DEFAULT_PERGOLA, DEFAULT_SCREENS, DEFAULT_SHADES, DEFAULT_VIEW } from '../../state/store';
import { CONFIG_DEFAULT_KITCHEN, CONFIG_DEFAULT_PERGOLA, CONFIG_DEFAULT_SCREENS, CONFIG_DEFAULT_SHADES, CONFIG_DEFAULT_VIEW } from '../defaults';

describe('catalog', () => {
  it('has colors with RAL + hex, fabrics with 1–3 ratings, enclosure price bands', () => {
    expect(CATALOG.colors.black).toMatchObject({ ral: 'RAL 9005', hex: '#1d1f1e' });
    expect(CATALOG.colors.grey.ral).toBe('RAL 7016');
    for (const f of Object.values(CATALOG.fabrics)) {
      for (const r of [f.shade, f.privacy, f.visibility]) expect([1, 2, 3]).toContain(r);
      expect(f.blurb.length).toBeGreaterThan(10);
    }
    for (const e of Object.values(CATALOG.enclosures)) {
      expect(e.pricePerSqFt.high).toBeGreaterThan(e.pricePerSqFt.low);
      expect(e.maxPanelWidth).toBeGreaterThan(0);
    }
    expect(CATALOG.accessories.rgb.luxOnly).toBe(true);
    expect(CATALOG.mountings.floating.perfectFor).toContain('Rooftop terraces');
  });

  it('presets are in inches and flag the popular sizes', () => {
    expect(PRESETS).toHaveLength(9);
    expect(findPreset(144, 192)).toMatchObject({ id: '12x16', popular: true });
    expect(PRESETS.filter((p) => p.popular).map((p) => p.id)).toEqual(['12x16', '12x20', '14x20']);
    expect(findPreset(240, 240)?.label).toBe(`20' × 20'`);
  });

  it('formats and parses ft/in', () => {
    expect(formatFtIn(150)).toBe(`12'6"`);
    expect(parseFtIn(`12'6"`)).toBe(150);
    expect(parseFtIn('12 ft 6 in')).toBe(150);
    expect(parseFtIn('150')).toBe(150);
    expect(Number.isNaN(parseFtIn('abc'))).toBe(true);
  });

  it('config defaults mirror the store defaults', () => {
    expect(CONFIG_DEFAULT_PERGOLA).toEqual(DEFAULT_PERGOLA);
    expect(CONFIG_DEFAULT_SCREENS).toEqual(DEFAULT_SCREENS);
    expect(CONFIG_DEFAULT_SHADES).toEqual(DEFAULT_SHADES);
    expect(CONFIG_DEFAULT_KITCHEN).toEqual(DEFAULT_KITCHEN);
    expect(CONFIG_DEFAULT_VIEW).toEqual(DEFAULT_VIEW);
  });
});
