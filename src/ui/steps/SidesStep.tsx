import { useId, useMemo } from 'react';
import { useDesigner } from '../../state/store';
import { CATALOG, ENCLOSURE_NONE, estimate, sideDisabledReason, validate } from '../deps';
import { SIDE_LABELS } from '../copy';
import { Messages, Section } from '../controls';
import { FabricPicker } from '../FabricPicker';
import { ftIn, plusRange } from '../format';
import { usePergola, useValidation } from '../hooks';
import { SideArt } from '../icons';
import type { EnclosureType, PergolaDesign, SideConfig, SideId } from '../../types';

const SIDES: SideId[] = ['front', 'back', 'left', 'right'];

type Option = { id: EnclosureType; label: string; blurb: string; price: string; reason?: string };

function sideOptions(d: PergolaDesign, side: SideId): Option[] {
  const without: PergolaDesign = { ...d, sides: { ...d.sides, [side]: { type: 'none' } } };
  const base = estimate(without);
  const sideReason = sideDisabledReason(d.mounting, side) ?? undefined;
  const none: Option = { id: ENCLOSURE_NONE.id, label: 'Open — no enclosure', blurb: ENCLOSURE_NONE.blurb, price: '' };
  return [none, ...Object.values(CATALOG.enclosures).map((e): Option => {
    const cfg: SideConfig = { ...d.sides[side], type: e.id, fabric: e.id === 'screen' ? (d.sides[side].fabric ?? '95') : undefined };
    const alt: PergolaDesign = { ...d, sides: { ...d.sides, [side]: cfg } };
    const est = estimate(alt);
    const err = validate(alt).find((m) => m.severity === 'error' && m.field === `sides.${side}`);
    return {
      id: e.id,
      label: e.label,
      blurb: e.blurb,
      price: plusRange(Math.max(0, est.low - base.low), Math.max(0, est.high - base.high)),
      reason: sideReason ?? err?.message,
    };
  })];
}

function SideCard({ d, side }: { d: PergolaDesign; side: SideId }) {
  const setSide = useDesigner((s) => s.setSide);
  const id = useId();
  const options = useMemo(() => sideOptions(d, side), [d, side]);
  const cfg = d.sides[side];
  const len = side === 'front' || side === 'back' ? d.width : d.depth;
  const blocked = options.filter((o) => o.id !== 'none').every((o) => o.reason);
  const reasons = [...new Set(options.filter((o) => o.reason && o.id !== cfg.type).map((o) => o.reason!))];
  const current = options.find((o) => o.id === cfg.type);

  return (
    <div className={`side-card${cfg.type !== 'none' ? ' is-on' : ''}${blocked ? ' is-blocked' : ''}`}>
      <div className="side-head">
        <SideArt side={side} active={cfg.type !== 'none'} />
        <div>
          <label className="side-title" htmlFor={id}>{SIDE_LABELS[side]} side</label>
          <span className="side-len">{ftIn(len)} wide</span>
        </div>
        {current && current.id !== 'none' && <span className="price-tag">{current.price}</span>}
      </div>
      <select id={id} className="select" value={cfg.type} disabled={blocked && cfg.type === 'none'}
        onChange={(e) => {
          const type = e.target.value as EnclosureType;
          setSide(side, { ...cfg, type, fabric: type === 'screen' ? (cfg.fabric ?? '95') : undefined });
        }}>
        {options.map((o) => (
          <option key={o.id} value={o.id} disabled={!!o.reason && o.id !== cfg.type}>
            {o.id === 'none' ? o.label : `${o.label}  ${o.reason ? '— not available' : o.price}`}
          </option>
        ))}
      </select>
      {current && current.id !== 'none' && <p className="side-blurb">{current.blurb}</p>}
      {blocked ? (
        <p className="side-reason">{reasons[0] ?? 'Not available for this mounting.'}</p>
      ) : (
        reasons.length > 0 && <p className="side-reason side-reason-soft">Some options are unavailable here: {reasons.join(' ')}</p>
      )}
      {cfg.type === 'screen' && (
        <FabricPicker label={`${SIDE_LABELS[side]} screen fabric`} value={cfg.fabric ?? '95'}
          onChange={(fabric) => setSide(side, { ...cfg, fabric })} />
      )}
    </div>
  );
}

export function SidesStep() {
  const d = usePergola();
  const msgs = useValidation();
  const setDesign = useDesigner((s) => s.setDesign);
  const screens = SIDES.filter((s) => d.sides[s].type === 'screen');
  const firstFabric = screens.length ? d.sides[screens[0]].fabric : undefined;
  const mixed = screens.some((s) => d.sides[s].fabric !== firstFabric);

  return (
    <>
      <Section title="Choose each side" sub="Prices reflect your current size. Screens wider than 16′ are split into two.">
        <div className="side-grid">
          {SIDES.map((s) => <SideCard key={s} d={d} side={s} />)}
        </div>
        {mixed && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
            const sides = { ...d.sides };
            screens.forEach((s) => { sides[s] = { ...sides[s], fabric: firstFabric }; });
            setDesign({ ...d, sides });
          }}>
            Use the {SIDE_LABELS[screens[0]].toLowerCase()} fabric on every screen
          </button>
        )}
        <Messages messages={msgs} prefix="sides" />
      </Section>
    </>
  );
}
