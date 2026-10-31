import { useId } from 'react';
import { CATALOG } from './deps';
import { Bars } from './controls';
import type { FabricId } from '../types';

/** Screen fabric picker with Shade / Privacy / Visibility bars, like the picker on 99pergolas.com/motorized-screens. */
export function FabricPicker({ value, onChange, label = 'Screen fabric' }: { value: FabricId; onChange: (f: FabricId) => void; label?: string }) {
  const name = useId();
  const fabrics = Object.values(CATALOG.fabrics).sort((a, b) => b.sunBlock - a.sunBlock);
  const current = CATALOG.fabrics[value];
  return (
    <div className="fabric-picker">
      <div className="fabric-chips" role="radiogroup" aria-label={label}>
        {fabrics.map((f) => (
          <label key={f.id} className={`fabric-chip${f.id === value ? ' is-on' : ''}`} title={f.label}>
            <input type="radio" className="sr-only" name={name} checked={f.id === value} onChange={() => onChange(f.id)} />
            <span className="fabric-swatch" style={{ ['--open' as string]: `${Math.max(0, 100 - f.sunBlock)}` }} aria-hidden="true" />
            <span className="fabric-label">{f.id === 'blackout' ? 'Blackout' : `${f.sunBlock}%`}</span>
            <span className="fabric-sub">{f.id === 'blackout' ? 'no view' : 'sun block'}</span>
          </label>
        ))}
      </div>
      {current && (
        <div className="fabric-detail">
          <strong className="fabric-name">{current.label}</strong>
          <Bars label="Shade" percent={current.bars.shade[0]} word={current.bars.shade[1]} />
          <Bars label="Privacy" percent={current.bars.privacy[0]} word={current.bars.privacy[1]} />
          <Bars label="Visibility" percent={current.bars.visibility[0]} word={current.bars.visibility[1]} />
          <p className="fabric-blurb">{current.blurb}</p>
        </div>
      )}
    </div>
  );
}
