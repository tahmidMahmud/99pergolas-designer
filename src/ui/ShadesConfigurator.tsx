import { useId, useState } from 'react';
import { useDesigner } from '../state/store';
import type { ShadeOpacity, ShadeOperation, ShadesDesign, ShadeStyle, ShadeWindow } from '../types';
import { PRODUCTS, SHADE_OPACITY, SHADE_OPERATION, SHADE_STYLES } from './copy';
import { CardChoice, Messages, Range, Section, Segmented } from './controls';
import { inchesFrac, moneyRange } from './format';
import { useValidation } from './hooks';
import { CATALOG, estimate } from './deps';
import { IconPlus, IconTrash, ShadeArt } from './icons';
import { DesignerLayout, ProductHeading } from './Layout';
import { PriceBlock } from './PriceBlock';
import { EstimateTable, ReviewActions, ShareRow } from './review';

const MAX_WINDOWS = 20;
const EIGHTHS = ['0', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'];

/** Whole inches + eighths, plus a slider in 1/8″ steps. */
function InchInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const id = useId();
  const whole = Math.floor(value + 1e-6);
  const frac = Math.round((value - whole) * 8);
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 8) / 8)));
  return (
    <div className="dim-row">
      <div className="dim-head">
        <label className="dim-label" htmlFor={id}>{label}</label>
        <span className="dim-value" aria-hidden="true">{inchesFrac(value)}</span>
      </div>
      <div className="dim-controls">
        <input id={id} className="input input-num" type="number" inputMode="numeric" min={min} max={max} step={1} value={whole}
          aria-label={`${label}, whole inches`} onChange={(e) => e.target.value !== '' && set(Number(e.target.value) + frac / 8)} />
        <select className="select select-sm" aria-label={`${label}, eighths of an inch`} value={frac}
          onChange={(e) => set(whole + Number(e.target.value) / 8)}>
          {EIGHTHS.map((f, i) => <option key={f} value={i}>{f}″</option>)}
        </select>
        <Range label={label} min={min} max={max} step={0.125} value={value} valueText={inchesFrac(value)} onChange={set} />
      </div>
    </div>
  );
}

function ShadeStage({ w }: { w: ShadeWindow }) {
  const style = SHADE_STYLES.find((s) => s.id === w.style)!;
  const drop = w.opacity === 'blackout' || w.opacity === 'room-darkening' ? 0.78 : 0.62;
  return (
    <div className="viewer-card preview-card">
      <div className="preview-canvas preview-shade">
        <ShadeArt style={w.style} drop={drop} large color={w.opacity === 'sheer' ? '#c9b48a' : 'var(--brass-deep)'} />
      </div>
      <div className="preview-caption">
        <strong>{style.label}</strong>
        <span>{inchesFrac(w.width)} W × {inchesFrac(w.height)} H · {w.mount === 'inside' ? 'Inside mount' : 'Outside mount'} · {SHADE_OPACITY.find((o) => o.id === w.opacity)?.label}</span>
      </div>
    </div>
  );
}

export function ShadesConfigurator() {
  const d = useDesigner((s) => s.design) as ShadesDesign;
  const patch = useDesigner((s) => s.patch);
  const msgs = useValidation();
  const [sel, setSel] = useState(0);
  const i = Math.min(sel, d.windows.length - 1);
  const w = d.windows[i];
  const setWin = (p: Partial<ShadeWindow>) => patch({ windows: d.windows.map((x, j) => (j === i ? { ...x, ...p } : x)) } as Partial<ShadesDesign>);
  const spec = CATALOG.shadeStyles[w.style];
  const opacities = SHADE_OPACITY.filter((o) => spec.opacities.includes(o.id));
  /** Per-window price: the estimate of a design containing only that window. */
  const priceOf = (x: ShadeWindow) => estimate({ ...d, windows: [x] });

  return (
    <DesignerLayout stage={<ShadeStage w={w} />} compactStage>
      <ProductHeading title={PRODUCTS[2].title} sub="Perfect Light. One Touch Away. Custom-made for every window." />
      <div className="price-sticky"><PriceBlock /></div>

      <Section title="Windows" sub="Add each window, then pick its style and size.">
        <div className="win-list" role="tablist" aria-label="Windows">
          {d.windows.map((x, j) => {
            const item = priceOf(x);
            return (
              <button key={j} type="button" role="tab" aria-selected={j === i} className={`win-tab${j === i ? ' is-on' : ''}`} onClick={() => setSel(j)}>
                <ShadeArt style={x.style} />
                <span className="win-tab-text">
                  <strong>{x.room?.trim() || `Window ${j + 1}`}</strong>
                  <span>{SHADE_STYLES.find((s) => s.id === x.style)?.label} · {inchesFrac(x.width)} × {inchesFrac(x.height)}</span>
                  <span className="win-price">{moneyRange(item.low, item.high)}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="row-actions">
          {d.windows.length < MAX_WINDOWS && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
              patch({ windows: [...d.windows, { ...w, room: '' }] } as Partial<ShadesDesign>);
              setSel(d.windows.length);
            }}>
              <IconPlus size={16} /> Add a window
            </button>
          )}
          {d.windows.length > 1 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
              patch({ windows: d.windows.filter((_, j) => j !== i) } as Partial<ShadesDesign>);
              setSel(Math.max(0, i - 1));
            }}>
              <IconTrash size={16} /> Remove {w.room?.trim() || `window ${i + 1}`}
            </button>
          )}
        </div>
      </Section>

      <div className="item-card" role="tabpanel" aria-label={`Window ${i + 1} options`}>
        <Section title="Style">
          <CardChoice<ShadeStyle> label="Shade style" value={w.style} columns={3} className="style-cards"
            onChange={(style) => {
              const s = CATALOG.shadeStyles[style];
              setWin({ style, width: Math.min(w.width, s.maxWidth), height: Math.min(w.height, s.maxHeight), opacity: s.opacities.includes(w.opacity) ? w.opacity : s.opacities[0] });
            }}
            options={SHADE_STYLES.map((s) => ({
              id: s.id,
              content: (
                <>
                  <ShadeArt style={s.id} />
                  <span className="card-title">{s.label}</span>
                  <span className="card-blurb">{s.blurb}</span>
                </>
              ),
            }))} />
        </Section>

        <Section title="Size" sub="Measure in three places and use the smallest — we re-measure before ordering.">
          <InchInput label="Width" value={w.width} min={12} max={spec.maxWidth} onChange={(width) => setWin({ width })} />
          <InchInput label="Height" value={w.height} min={12} max={spec.maxHeight} onChange={(height) => setWin({ height })} />
          <Segmented<ShadeWindow['mount']> label="Mount" value={w.mount} onChange={(mount) => setWin({ mount })}
            options={[{ id: 'inside', label: 'Inside mount' }, { id: 'outside', label: 'Outside mount' }]} />
        </Section>

        <Section title="Light & operation">
          <div className="form-grid">
            <label className="field">
              <span className="field-label">Opacity</span>
              <select className="select" value={w.opacity} onChange={(e) => setWin({ opacity: e.target.value as ShadeOpacity })}>
                {opacities.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Operation</span>
              <select className="select" value={w.operation} onChange={(e) => setWin({ operation: e.target.value as ShadeOperation })}>
                {SHADE_OPERATION.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
            <label className="field span-2">
              <span className="field-label">Room <span className="optional">(optional)</span></span>
              <input className="input" placeholder="e.g. Living room, Primary bedroom" maxLength={40} value={w.room ?? ''} onChange={(e) => setWin({ room: e.target.value })} />
            </label>
          </div>
        </Section>
      </div>

      <Section title="Service">
        <Segmented<ShadesDesign['service']> label="Service" value={d.service} onChange={(service) => patch({ service } as Partial<ShadesDesign>)}
          options={[{ id: 'install', label: 'Professional install' }, { id: 'diy', label: 'DIY supply' }, { id: 'trade', label: 'Trade / wholesale' }]} />
        <Messages messages={msgs} />
      </Section>

      <Section title="Your estimate"><EstimateTable /></Section>
      <Section title="Save & share"><ShareRow /></Section>
      <ReviewActions />
    </DesignerLayout>
  );
}
