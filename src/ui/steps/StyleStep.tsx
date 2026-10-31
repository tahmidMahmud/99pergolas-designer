import { CATALOG } from '../deps';
import { LINES } from '../copy';
import { CardChoice, Messages, Section } from '../controls';
import { usePergola, useUpdatePergola, useValidation } from '../hooks';
import { IconCheck } from '../icons';
import type { ColorId, Line } from '../../types';

export function SwatchGrid({ value, onChange, label, ids }: { value: ColorId; onChange: (c: ColorId) => void; label: string; ids?: ColorId[] }) {
  return (
    <CardChoice<ColorId> label={label} value={value} columns={5} className="swatches" onChange={onChange}
      options={Object.values(CATALOG.colors).filter((c) => !ids || ids.includes(c.id)).map((c) => ({
        id: c.id,
        title: c.ral ? `${c.label} · ${c.ral}` : c.label,
        content: (
          <>
            <span className={`swatch-dot${c.id === 'custom' ? ' swatch-custom' : ''}`} style={c.id === 'custom' ? undefined : { background: c.hex }}>
              {c.id === value && <IconCheck size={14} />}
            </span>
            <span className="swatch-name">{c.label}</span>
            <span className="swatch-ral">{c.ral || 'Any RAL'}</span>
          </>
        ),
      }))} />
  );
}

export function StyleStep() {
  const d = usePergola();
  const update = useUpdatePergola();
  const msgs = useValidation();
  const anyCustom = d.frameColor === 'custom' || d.louverColor === 'custom';
  const roofWord = d.roof === 'louvered' ? 'Louver' : 'Roof panel';

  return (
    <>
      <Section title="Product line" sub="Two Lines. One Standard of Quality.">
        <CardChoice<Line> label="Product line" value={d.line} columns={2} className="line-cards"
          onChange={(line) => update({ line })}
          options={(['lux', 'prestige'] as const).map((id) => {
            const l = LINES[id];
            return {
              id,
              content: (
                <>
                  <span className="card-title-row">
                    <span className="card-title">{l.label}</span>
                    {l.badge && <span className="badge badge-brass">{l.badge}</span>}
                  </span>
                  <span className="card-tagline">{l.tagline}</span>
                  <ul className="bullets">
                    {l.bullets.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                </>
              ),
            };
          })} />
        <Messages messages={msgs} prefix="line" />
      </Section>

      <Section title="Frame color" sub="Powder-coated to order. Standard colors or any RAL color.">
        <SwatchGrid label="Frame color" value={d.frameColor} onChange={(frameColor) => update({ frameColor })} />
      </Section>

      <Section title={`${roofWord} color`}>
        <SwatchGrid label={`${roofWord} color`} value={d.louverColor} onChange={(louverColor) => update({ louverColor })} />
        {d.frameColor !== d.louverColor && !anyCustom && (
          <p className="hint hint-brass">Two-tone finish — a sharp look (black frame with white louvers is a favorite). A small finishing charge is included in your estimate.</p>
        )}
      </Section>

      {anyCustom && (
        <Section title="Custom RAL color">
          <label className="field">
            <span className="field-label">RAL code</span>
            <input className="input" type="text" inputMode="text" placeholder="e.g. RAL 7016 or 8017" maxLength={40}
              value={d.customRal ?? ''} onChange={(e) => update({ customRal: e.target.value })} />
            <span className="field-hint">Not sure? Leave it blank — we bring the full RAL chart to your measure.</span>
          </label>
        </Section>
      )}
      <Messages messages={msgs} prefix={['frameColor', 'louverColor', 'customRal', 'color']} />
    </>
  );
}
