import { useDesigner } from '../state/store';
import type { ControlType, ScreenMountSurface, ScreensDesign } from '../types';
import { PRODUCTS, SCREEN_SURFACES } from './copy';
import { DimensionInput, Messages, Section, Segmented, Toggle } from './controls';
import { FabricPicker } from './FabricPicker';
import { addonLabel, useValidation } from './hooks';
import { IconPlus, IconTrash } from './icons';
import { DesignerLayout, ProductHeading } from './Layout';
import { PriceBlock } from './PriceBlock';
import { EstimateTable, ReviewActions, ShareRow } from './review';
import { SwatchGrid } from './steps/StyleStep';
import { SCREEN_LIMITS } from './deps';
import { ViewerCard } from './ViewerCard';

/** The site's screen form offers 1–6 openings ("More" goes to a call). */
const MAX_OPENINGS = Math.min(6, SCREEN_LIMITS.maxOpenings);
const W = SCREEN_LIMITS.width;
const H = SCREEN_LIMITS.height;

export function ScreensConfigurator() {
  const d = useDesigner((s) => s.design) as ScreensDesign;
  const patch = useDesigner((s) => s.patch);
  const msgs = useValidation();
  const up = (p: Partial<ScreensDesign>) => patch(p);
  const setOpening = (i: number, p: Partial<ScreensDesign['openings'][number]>) =>
    up({ openings: d.openings.map((o, j) => (j === i ? { ...o, ...p } : o)) });

  return (
    <DesignerLayout stage={<ViewerCard />}>
      <ProductHeading title={PRODUCTS[1].title} sub="Custom-built for every opening — block up to 95% of the sun's heat and harmful UV rays." />
      <div className="price-sticky"><PriceBlock /></div>

      <Section title="Openings" sub="Add each opening you want to screen — up to six here, more on the phone.">
        <div className="stack">
          {d.openings.map((o, i) => (
            <div key={i} className="item-card">
              <div className="item-head">
                <span className="item-title">Opening {i + 1}</span>
                {d.openings.length > 1 && (
                  <button type="button" className="icon-btn" aria-label={`Remove opening ${i + 1}`}
                    onClick={() => up({ openings: d.openings.filter((_, j) => j !== i) })}>
                    <IconTrash size={16} />
                  </button>
                )}
              </div>
              <DimensionInput label="Width" value={o.width} min={W.min} max={W.max} onChange={(width) => setOpening(i, { width })}
                tip="Inside width of the opening. Wider than 16′? We split it into two screens with a shared post." />
              <DimensionInput label="Height" value={o.height} min={H.min} max={H.max} onChange={(height) => setOpening(i, { height })}
                tip="Drop from the top of the opening to the floor." />
              <label className="field">
                <span className="field-label">Mounted on</span>
                <select className="select" value={o.mountedOn} onChange={(e) => setOpening(i, { mountedOn: e.target.value as ScreenMountSurface })}>
                  {SCREEN_SURFACES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </label>
            </div>
          ))}
        </div>
        {d.openings.length < MAX_OPENINGS && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
            const last = d.openings[d.openings.length - 1];
            up({ openings: [...d.openings, { ...last }] });
          }}>
            <IconPlus size={16} /> Add another opening
          </button>
        )}
        <Messages messages={msgs} prefix="openings" />
      </Section>

      <Section title="Fabric" sub="99/97% for more shade and privacy · 95% balanced · 90/70/60% for more view and airflow · Blackout for complete privacy.">
        <FabricPicker value={d.fabric} onChange={(fabric) => up({ fabric })} />
      </Section>

      <Section title="Housing & track color">
        <SwatchGrid label="Housing color" ids={['black', 'white', 'grey', 'custom']} value={d.frameColor} onChange={(frameColor) => up({ frameColor })} />
      </Section>
      <Section title="Fabric color">
        <SwatchGrid label="Fabric color" ids={['black', 'white', 'grey', 'custom']} value={d.fabricColor} onChange={(fabricColor) => up({ fabricColor })} />
      </Section>

      <Section title="Control & sensors">
        <Segmented<ControlType> label="Control" value={d.control} onChange={(control) => up({ control })}
          options={[{ id: 'remote', label: 'Remote control' }, { id: 'app', label: 'Mobile app' }]} />
        <Toggle label="Wind sensor" hint="Retracts the screens automatically during high winds."
          checked={d.windSensor} onChange={(windSensor) => up({ windSensor })}
          price={addonLabel(d, { windSensor: true }, { windSensor: false })} />
      </Section>

      <Section title="Project type">
        <Segmented<ScreensDesign['projectType']> label="Project type" value={d.projectType} onChange={(projectType) => up({ projectType })}
          options={[{ id: 'residential', label: 'Residential' }, { id: 'commercial', label: 'Commercial' }]} />
        <p className="hint">Screens are not waterproof walls or storm protection — they are built for sun, bugs, privacy and wind.</p>
      </Section>

      <Section title="Your estimate"><EstimateTable /></Section>
      <Section title="Save & share"><ShareRow /></Section>
      <ReviewActions />
    </DesignerLayout>
  );
}
