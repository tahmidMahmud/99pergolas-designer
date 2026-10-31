import { useMemo } from 'react';
import { computeStructure, CATALOG } from '../deps';
import { LINES, LOUVER_MAX, SIDE_LABELS } from '../copy';
import { Messages, Section } from '../controls';
import { ftIn } from '../format';
import { usePergola, useValidation } from '../hooks';
import { colorLabel, EstimateTable, ReviewActions, ShareRow } from '../review';
import type { SideId } from '../../types';

export function ReviewStep() {
  const d = usePergola();
  const msgs = useValidation();
  const s = useMemo(() => computeStructure(d), [d]);
  const mount = CATALOG.mountings[d.mounting]?.label ?? d.mounting;

  const sides = (['front', 'back', 'left', 'right'] as SideId[])
    .filter((k) => d.sides[k].type !== 'none')
    .map((k) => {
      const cfg = d.sides[k];
      const label = cfg.type === 'none' ? 'Open' : (CATALOG.enclosures[cfg.type]?.label ?? cfg.type);
      const fabric = cfg.type === 'screen' && cfg.fabric ? CATALOG.fabrics[cfg.fabric]?.label : undefined;
      return `${SIDE_LABELS[k]}: ${label}${fabric ? ` (${fabric})` : ''}`;
    });

  const extras = [
    d.ledWarm && 'Warm-white LED',
    d.rgb && 'RGB lighting',
    d.roof === 'louvered' && d.rainSensor && 'Rain sensor',
    d.windSensor && 'Wind sensor',
    d.fans > 0 && `${d.fans} ceiling fan${d.fans > 1 ? 's' : ''}`,
    d.heaters > 0 && `${d.heaters} infrared heater${d.heaters > 1 ? 's' : ''}`,
  ].filter(Boolean) as string[];

  const rows: [string, string][] = [
    ['Line', `${LINES[d.line].label} · ${d.roof === 'louvered' ? 'Louvered roof' : 'Solid patio cover'}`],
    ['Size', `${ftIn(d.width)} W × ${ftIn(d.depth)} L`],
    ['Clear height', `${ftIn(d.height)} (overall ${ftIn(s.overallHeight)})`],
    ['Mounting', mount],
    ['Structure', `${s.posts.length} posts · ${s.baysX * s.baysZ} bay${s.baysX * s.baysZ > 1 ? 's' : ''} · ${Math.round(s.roofAreaSqFt)} sq ft roof`],
  ];
  if (d.roof === 'louvered') rows.push(['Louvers', `${s.louverCount} blades · open 0–${LOUVER_MAX[d.line]}° · ${d.control === 'app' ? 'Mobile app + voice' : 'Smart remote'}`]);
  rows.push(['Frame color', colorLabel(d.frameColor, d.customRal)]);
  rows.push([d.roof === 'louvered' ? 'Louver color' : 'Roof color', colorLabel(d.louverColor, d.customRal)]);
  rows.push(['Sides', sides.length ? sides.join(' · ') : 'All sides open']);
  rows.push(['Lighting & comfort', extras.length ? extras.join(' · ') : 'None selected']);

  return (
    <>
      <Section title="Your specification">
        <table className="spec-table">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
        {s.engineeringReview && (
          <p className="hint hint-brass">This size is beyond our standard spans — our engineering team reviews it before your quote.</p>
        )}
        <Messages messages={msgs} />
      </Section>

      <Section title="Itemized estimate">
        <EstimateTable />
      </Section>

      <Section title="Save & share">
        <ShareRow />
      </Section>

      <ReviewActions />
    </>
  );
}
