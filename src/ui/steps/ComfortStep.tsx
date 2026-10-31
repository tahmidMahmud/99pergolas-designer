import { Counter, Messages, Section, Toggle } from '../controls';
import { plusRange } from '../format';
import { addonLabel, addonRange, usePergola, useUpdatePergola, useValidation } from '../hooks';

export function ComfortStep() {
  const d = usePergola();
  const update = useUpdatePergola();
  const msgs = useValidation();
  const fan = addonRange(d, { fans: 1 }, { fans: 0 });
  const heater = addonRange(d, { heaters: 1 }, { heaters: 0 });

  return (
    <>
      <Section title="Lighting" sub="Integrated into the frame, with electrical prep included.">
        <Toggle label="Integrated LED — warm white" hint="Architectural light built into the structure, dimmable."
          checked={d.ledWarm} onChange={(ledWarm) => update({ ledWarm })}
          price={addonLabel(d, { ledWarm: true }, { ledWarm: false })} />
        <Toggle label="RGB lighting"
          hint={d.line === 'lux' ? 'Millions of color combinations with scenes, from the remote or the app.' : 'A Lux Line feature — switch to Lux in the Style step to add RGB.'}
          checked={d.rgb} onChange={(rgb) => update({ rgb })}
          price={addonLabel(d, { rgb: true }, { rgb: false })} />
        <Messages messages={msgs} prefix={['ledWarm', 'rgb', 'lighting']} />
      </Section>

      <Section title="Comfort" sub="Stay outside through Texas summers and cool evenings.">
        <Counter label="Ceiling fans" hint="Sealed, rust-resistant motors — feels 5–10°F cooler." min={0} max={4}
          value={d.fans} onChange={(fans) => update({ fans })} price={`${plusRange(fan.low, fan.high)} each`} />
        <Counter label="Infrared heaters" hint="Electric — no smoke, no gas. One or two per bay is typical." min={0} max={6}
          value={d.heaters} onChange={(heaters) => update({ heaters })} price={`${plusRange(heater.low, heater.high)} each`} />
        <Messages messages={msgs} prefix={['fans', 'heaters', 'comfort']} />
      </Section>
    </>
  );
}
