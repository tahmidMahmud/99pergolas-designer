import { CATALOG, PRESETS, limits } from '../deps';
import { ROOFS } from '../copy';
import { CardChoice, DimensionInput, Messages, Section } from '../controls';
import { usePergola, useUpdatePergola, useValidation } from '../hooks';
import { MountingArt, RoofArt } from '../icons';
import type { Mounting, RoofType } from '../../types';

export function SizeStep() {
  const d = usePergola();
  const update = useUpdatePergola();
  const msgs = useValidation();
  const lim = limits(d.line, d.mounting);
  const invalid = (f: string) => msgs.some((m) => m.field === f && m.severity === 'error');
  const attachedish = d.mounting === 'attached' || d.mounting === 'floating';

  return (
    <>
      <Section title="Popular sizes" sub="Start from a common size, then fine-tune to the inch.">
        <div className="chip-row">
          {PRESETS.map((p) => {
            const on = p.width === d.width && p.depth === d.depth;
            const disabled = p.width > lim.width.max || p.depth > lim.depth.max;
            return (
              <button key={p.id} type="button" className={`chip chip-preset${on ? ' is-on' : ''}`} aria-pressed={on}
                disabled={disabled} onClick={() => update({ width: p.width, depth: p.depth })}>
                {p.label}
                {p.popular && <span className="badge">Popular</span>}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Dimensions" sub="Feet and inches — use the dropdowns or drag the slider in 1″ steps.">
        <DimensionInput label="Width" value={d.width} min={lim.width.min} max={lim.width.max}
          onChange={(width) => update({ width })} invalid={invalid('width')}
          tip={attachedish ? 'Measured along your house wall, outside to outside of the frame.' : 'Measured from the outside of one post base to the outside of the other.'} />
        <DimensionInput label="Length" value={d.depth} min={lim.depth.min} max={lim.depth.max}
          onChange={(depth) => update({ depth })} invalid={invalid('depth')}
          tip={attachedish ? 'How far the pergola projects out from the wall.' : 'Front-to-back, outside to outside of the posts.'} />
        <DimensionInput label="Height" value={d.height} min={lim.height.min} max={lim.height.max}
          onChange={(height) => update({ height })} invalid={invalid('height')}
          tip="Clear height from the ground to the underside of the beam. Louvers open above the beam." />
        <Messages messages={msgs} prefix={['width', 'depth', 'height', 'size']} />
      </Section>

      <Section title="Mounting" sub="How the pergola meets your home.">
        <CardChoice<Mounting> label="Mounting" value={d.mounting} columns={2} className="mount-cards"
          onChange={(mounting) => update({ mounting })}
          options={Object.values(CATALOG.mountings).map((m) => ({
            id: m.id,
            content: (
              <>
                <MountingArt kind={m.id} />
                <span className="card-title">{m.label}</span>
                <span className="card-blurb">{m.blurb}</span>
                {m.perfectFor.length > 0 && (
                  <span className="mini-chips" aria-label="Perfect for">
                    {m.perfectFor.map((p) => <span key={p} className="mini-chip">{p}</span>)}
                  </span>
                )}
              </>
            ),
          }))} />
        <Messages messages={msgs} prefix="mounting" />
      </Section>

      <Section title="Roof type">
        <CardChoice<RoofType> label="Roof type" value={d.roof} columns={2}
          onChange={(roof) => update({ roof })}
          options={ROOFS.map((r) => ({
            id: r.id,
            content: (
              <>
                <RoofArt kind={r.id} />
                <span className="card-title">{r.label}</span>
                <span className="card-blurb">{r.blurb}</span>
              </>
            ),
          }))} />
        <Messages messages={msgs} prefix="roof" />
      </Section>
    </>
  );
}
