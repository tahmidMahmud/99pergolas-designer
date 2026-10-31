import { describe, expect, it } from 'vitest';
import { designToCF7Fields, designToParams, paramsToDesign, paramsToView, shareUrl } from '../url';
import { clamp } from '../rules';
import { pergola } from './helpers';
import type { Design, SiteInfo } from '../../types';
import { CONFIG_DEFAULT_PERGOLA } from '../defaults';

const site: SiteInfo = { name: 'Jane Doe', phone: '555-0100', email: 'jane@example.com', zip: '75034', city: 'Frisco', address: '1 Main St', consent: true, use: 'poolside' };

describe('URL round-trip', () => {
  it('pergola survives designToParams → paramsToDesign', () => {
    const d = clamp(
      pergola({
        line: 'prestige',
        width: 150,
        depth: 200,
        height: 100,
        mounting: 'floating',
        roof: 'solid',
        louverDirection: 'z',
        frameColor: 'custom',
        louverColor: 'white',
        customRal: 'RAL 7016',
        sides: { front: { type: 'screen', fabric: '70', color: 'grey' }, back: { type: 'none' }, left: { type: 'glass-frameless' }, right: { type: 'panel-fixed', color: 'bronze' } },
        ledWarm: false,
        rgb: true,
        rainSensor: false,
        windSensor: true,
        fans: 1,
        heaters: 2,
        control: 'remote',
      }),
    );
    expect(paramsToDesign(designToParams(d))).toEqual(d);
  });

  it('all other kinds round-trip', () => {
    const designs: Design[] = [
      { kind: 'screens', openings: [{ width: 120, height: 96, mountedOn: 'wood' }, { width: 200, height: 100, mountedOn: 'brick' }], frameColor: 'white', fabricColor: 'grey', fabric: 'blackout', windSensor: false, control: 'app', projectType: 'commercial' },
      { kind: 'shades', windows: [{ style: 'zebra', width: 40, height: 60, mount: 'outside', opacity: 'privacy', operation: 'smart-home', room: 'Kids: room | 2' }, { style: 'roller', width: 36, height: 60, mount: 'inside', opacity: 'blackout', operation: 'manual' }], service: 'diy' },
      { kind: 'kitchen', shape: 'u', length: 180, grill: false, fridge: true, sink: true, counter: 'concrete' },
    ];
    for (const d of designs) expect(paramsToDesign(designToParams(d).toString())).toEqual(d);
  });

  it('uses the short param names from the spec', () => {
    const qs = designToParams(pergola({ fans: 1, heaters: 2, sides: { front: { type: 'screen', fabric: '95' }, back: { type: 'none' }, left: { type: 'glass-frameless' }, right: { type: 'none' } } })).toString();
    for (const part of ['p=pergola', 'line=lux', 'w=144', 'd=192', 'h=108', 'm=fs', 'roof=louv', 'fc=black', 'lc=black', 'sf=screen%3A95', 'sl=glass-frameless', 'led=1', 'rgb=0', 'rain=1', 'wind=0', 'fans=1', 'heat=2', 'ctl=app'])
      expect(qs).toContain(part);
  });

  it('parses the SPEC example URL', () => {
    const d = paramsToDesign('?p=pergola&line=lux&w=144&d=192&h=108&m=fs&roof=louv&fc=black&lc=black&sf=screen:95&sl=glass-frameless&led=1&rgb=0&rain=1&wind=0&fans=1&heat=2&ctl=app');
    expect(d).toMatchObject({ kind: 'pergola', width: 144, fans: 1, heaters: 2, sides: { front: { type: 'screen', fabric: '95' }, left: { type: 'glass-frameless' } } });
  });

  it('is tolerant: garbage → defaults, out-of-range → clamped', () => {
    expect(paramsToDesign('')).toEqual(CONFIG_DEFAULT_PERGOLA);
    expect(paramsToDesign('?p=nope&line=gold&w=abc&h=9999&m=zzz&sf=lava&fans=-2&led=maybe')).toEqual({ ...CONFIG_DEFAULT_PERGOLA, height: 118 });
    const d = paramsToDesign('?w=10&d=100000&m=wm&sb=screen:95');
    expect(d).toMatchObject({ width: 84, depth: 480, mounting: 'attached', sides: { back: { type: 'none' } } });
    const s = paramsToDesign('?p=screens&op=10x5000xmoon,,abc&fab=12');
    expect(s).toMatchObject({ kind: 'screens', fabric: '95', openings: [{ width: 36, height: 144, mountedOn: 'wood' }, { width: 120, height: 96, mountedOn: 'wood' }] });
  });

  it('view params and share URL', () => {
    const url = shareUrl(pergola(), { louverAngle: 90, hour: 19.5, showDimensions: true, step: 'sides' }, 'https://example.com/design/?old=1#x');
    expect(url.startsWith('https://example.com/design/?p=pergola')).toBe(true);
    expect(paramsToView(url)).toEqual({ louverAngle: 90, hour: 19.5, showDimensions: true, step: 'sides' });
    expect(paramsToView('?la=abc&hr=99&st=nope')).toEqual({ hour: 20 });
    expect(shareUrl(pergola())).toMatch(/^https:\/\/design\.99pergolas\.com\/\?p=pergola/);
  });
});

describe('designToCF7Fields', () => {
  it('maps a pergola to form 1643 fields', () => {
    const f = designToCF7Fields(
      pergola({
        width: 150,
        depth: 192,
        height: 108,
        mounting: 'attached',
        frameColor: 'grey',
        louverColor: 'custom',
        customRal: 'RAL 1015',
        fans: 1,
        rgb: true,
        sides: { front: { type: 'screen', fabric: '95' }, back: { type: 'none' }, left: { type: 'screen', fabric: '95' }, right: { type: 'screen', fabric: '95' } },
      }),
      site,
    );
    expect(f).toMatchObject({
      _wpcf7: '1643',
      'full-name': 'Jane Doe',
      'phone-number': '555-0100',
      'email-address': 'jane@example.com',
      'zip-code': '75034',
      address: '1 Main St, Frisco',
      width: `12'6"`,
      length: `16'0"`,
      height: `9'0"`,
      model: 'Lux Line',
      'pergola-design': 'Wall Mounted',
      'louver-color': 'Customized',
      'custom-louver-color': 'RAL 1015',
      'frame-color': 'Grey',
      'control-system': 'Mobile App',
      'radio-606': 'Poolside',
      'ms1-w': `12'6"`,
      'ms1-h': `9'0"`,
      'ms1-pcs': '1',
      'ms2-w': `16'0"`,
      'ms2-pcs': '2',
      'frsgd1-w': '',
    });
    expect(f['accessories[]']).toEqual(['LED-lighting', 'RGB-lighting', 'Rain-sensor', 'Ceiling-fan']);
    expect(designToCF7Fields(pergola({ mounting: 'floating', line: 'prestige' }), site)).toMatchObject({ 'pergola-design': 'Wall Hanging', model: 'Prestige Line' });
  });

  it('maps screens to form 1783 and shades/kitchen to contact form 1864', () => {
    const s = designToCF7Fields({ kind: 'screens', openings: [{ width: 120, height: 96, mountedOn: 'brick' }], frameColor: 'bronze', fabricColor: 'black', fabric: 'blackout', windSensor: true, control: 'remote', projectType: 'residential' }, site);
    expect(s).toMatchObject({ _wpcf7: '1783', 'your-email': 'jane@example.com', 'installation-type': 'Brick', openings: '1', 'width-1': `10'0"`, 'height-1': `8'0"`, 'frame-color': 'Customized', 'custom-frame-color': 'Bronze (RAL 8019)', 'fabric-openness': 'Blackout', 'wind-sensor': 'Yes', 'motor-type': 'Remote Control', 'project-type': 'Residential' });
    const k = designToCF7Fields({ kind: 'kitchen', shape: 'l', length: 120, grill: true, fridge: false, sink: true, counter: 'granite' }, site);
    expect(k).toMatchObject({ _wpcf7: '1864', 'your-service': 'Outdoor Kitchen', 'your-name': 'Jane Doe' });
  });
});
