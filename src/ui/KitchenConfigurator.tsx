import { useDesigner } from '../state/store';
import type { KitchenDesign } from '../types';
import { COUNTERS, KITCHEN_SHAPES, PRODUCTS } from './copy';
import { CardChoice, DimensionInput, Messages, Section, Toggle } from './controls';
import { ftIn } from './format';
import { addonLabel, useValidation } from './hooks';
import { DesignerLayout, ProductHeading } from './Layout';
import { PriceBlock } from './PriceBlock';
import { CATALOG } from './deps';
import { EstimateTable, ReviewActions, ShareRow } from './review';

const DEPTH = 30; // counter depth, inches

/** Top-down plan of the island: run along the top, returns down the sides for L/U. */
function KitchenPlan({ d, small }: { d: KitchenDesign; small?: boolean }) {
  const L = d.length;
  const ret = d.shape === 'straight' ? 0 : Math.min(Math.max(L * 0.45, 48), 120);
  const pad = 26;
  // Fixed minimum canvas (~22' x 14') so short runs don't blow up to fill the card.
  const W = Math.max(L + pad * 2, 264);
  const H = Math.max(DEPTH + ret + pad * 2 + 20, 168);
  const ox = (W - L) / 2;
  const oy = (H - (DEPTH + ret)) / 2 + 6;
  const counter = COUNTERS.find((c) => c.id === d.counter)!;
  const apps: { id: string; label: string; w: number }[] = [];
  if (d.sink) apps.push({ id: 'sink', label: 'Sink', w: 30 });
  if (d.grill) apps.push({ id: 'grill', label: 'Grill', w: 36 });
  if (d.fridge) apps.push({ id: 'fridge', label: 'Fridge', w: 24 });
  const gap = L / (apps.length + 1);
  const textColor = d.counter === 'quartz' ? '#22251F' : '#F2F1EC';

  if (small) {
    return (
      <svg viewBox="0 0 60 40" className="kitchen-mini" aria-hidden="true" focusable="false">
        <rect x={6} y={6} width={48} height={8} fill="currentColor" />
        {d.shape !== 'straight' && <rect x={46} y={6} width={8} height={26} fill="currentColor" />}
        {d.shape === 'u' && <rect x={6} y={6} width={8} height={26} fill="currentColor" />}
      </svg>
    );
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="kitchen-plan" role="img"
      aria-label={`Top-down plan: ${KITCHEN_SHAPES.find((s) => s.id === d.shape)?.label}, ${ftIn(L)} run`}>
      <defs>
        <pattern id="pavers" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#E9E6DD" />
          <path d="M0 0H24V24" fill="none" stroke="#D6D2C7" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#pavers)" rx={10} />
      <g transform={`translate(${ox} ${oy})`}>
        <rect x={0} y={0} width={L} height={DEPTH} rx={2} fill={counter.hex} stroke="#22251F" strokeWidth={1.2} />
        {d.shape !== 'straight' && <rect x={L - DEPTH} y={DEPTH - 1} width={DEPTH} height={ret} rx={2} fill={counter.hex} stroke="#22251F" strokeWidth={1.2} />}
        {d.shape === 'u' && <rect x={0} y={DEPTH - 1} width={DEPTH} height={ret} rx={2} fill={counter.hex} stroke="#22251F" strokeWidth={1.2} />}
        {apps.map((a, k) => {
          const cx = Math.min(Math.max(gap * (k + 1), a.w / 2 + 2), L - a.w / 2 - 2);
          const x = cx - a.w / 2;
          return (
            <g key={a.id}>
              {a.id === 'grill' && (
                <>
                  <rect x={x} y={4} width={a.w} height={DEPTH - 8} rx={2} fill="#2b2d2a" stroke="#8F6A2B" strokeWidth={1} />
                  {[0.25, 0.5, 0.75].map((t) => <line key={t} x1={x + 3} x2={x + a.w - 3} y1={4 + (DEPTH - 8) * t} y2={4 + (DEPTH - 8) * t} stroke="#62655D" strokeWidth={1} />)}
                </>
              )}
              {a.id === 'sink' && <rect x={x + 3} y={7} width={a.w - 6} height={DEPTH - 14} rx={5} fill="#cfd6da" stroke="#62655D" strokeWidth={1} />}
              {a.id === 'fridge' && <rect x={x} y={4} width={a.w} height={DEPTH - 8} rx={1.5} fill="none" stroke={textColor} strokeWidth={1.2} strokeDasharray="3 2" />}
              <text x={cx} y={DEPTH + 11} textAnchor="middle" fontSize={8} fill="#22251F" fontFamily="Instrument Sans, sans-serif">{a.label}</text>
            </g>
          );
        })}
        <g stroke="#8F6A2B" strokeWidth={1}>
          <line x1={0} y1={-12} x2={L} y2={-12} />
          <line x1={0} y1={-16} x2={0} y2={-8} />
          <line x1={L} y1={-16} x2={L} y2={-8} />
        </g>
        <rect x={L / 2 - 24} y={-19} width={48} height={13} rx={6} fill="#F2F1EC" />
        <text x={L / 2} y={-9.5} textAnchor="middle" fontSize={9} fontWeight={600} fill="#8F6A2B" fontFamily="Archivo, sans-serif">{ftIn(L)}</text>
      </g>
    </svg>
  );
}

function KitchenStage({ d }: { d: KitchenDesign }) {
  return (
    <div className="viewer-card preview-card">
      <div className="preview-canvas preview-kitchen"><KitchenPlan d={d} /></div>
      <div className="preview-caption">
        <strong>{KITCHEN_SHAPES.find((s) => s.id === d.shape)?.label} · {ftIn(d.length)} run</strong>
        <span>{COUNTERS.find((c) => c.id === d.counter)?.label} countertop · {[d.grill && 'grill', d.fridge && 'fridge', d.sink && 'sink'].filter(Boolean).join(', ') || 'no appliances yet'}</span>
      </div>
    </div>
  );
}

export function KitchenConfigurator() {
  const d = useDesigner((s) => s.design) as KitchenDesign;
  const patch = useDesigner((s) => s.patch);
  const msgs = useValidation();
  const up = (p: Partial<KitchenDesign>) => patch(p);

  return (
    <DesignerLayout stage={<KitchenStage d={d} />} compactStage>
      <ProductHeading title={PRODUCTS[3].title} sub={CATALOG.kitchen.blurb} />
      <div className="price-sticky"><PriceBlock /></div>

      <Section title="Layout">
        <CardChoice<KitchenDesign['shape']> label="Kitchen shape" value={d.shape} columns={3} onChange={(shape) => up({ shape })}
          options={KITCHEN_SHAPES.map((s) => ({
            id: s.id,
            content: (
              <>
                <KitchenPlan d={{ ...d, shape: s.id }} small />
                <span className="card-title">{s.label}</span>
                <span className="card-blurb">{s.blurb}</span>
              </>
            ),
          }))} />
        <DimensionInput label="Island run" value={d.length} min={CATALOG.kitchen.length.min} max={CATALOG.kitchen.length.max} onChange={(length) => up({ length })}
          tip="Length of the main counter run. L and U returns are sized at your design consultation." />
      </Section>

      <Section title="Appliances">
        <Toggle label={CATALOG.kitchen.appliances.grill.label} hint={CATALOG.kitchen.appliances.grill.blurb} checked={d.grill} onChange={(grill) => up({ grill })}
          price={addonLabel(d, { grill: true }, { grill: false })} />
        <Toggle label={CATALOG.kitchen.appliances.fridge.label} hint={CATALOG.kitchen.appliances.fridge.blurb} checked={d.fridge} onChange={(fridge) => up({ fridge })}
          price={addonLabel(d, { fridge: true }, { fridge: false })} />
        <Toggle label={CATALOG.kitchen.appliances.sink.label} hint={CATALOG.kitchen.appliances.sink.blurb} checked={d.sink} onChange={(sink) => up({ sink })}
          price={addonLabel(d, { sink: true }, { sink: false })} />
      </Section>

      <Section title="Countertop">
        <CardChoice<KitchenDesign['counter']> label="Countertop" value={d.counter} columns={4} className="swatches"
          onChange={(counter) => up({ counter })}
          options={COUNTERS.map((c) => ({
            id: c.id,
            content: (
              <>
                <span className="swatch-dot" style={{ background: c.hex }} />
                <span className="swatch-name">{c.label}</span>
              </>
            ),
          }))} />
        <Messages messages={msgs} />
      </Section>

      <Section title="Your estimate"><EstimateTable /></Section>
      <Section title="Save & share"><ShareRow /></Section>
      <ReviewActions />
    </DesignerLayout>
  );
}
