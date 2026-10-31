import { useDesigner } from '../../state/store';
import { LOUVER_MAX, sunNote } from '../copy';
import { Messages, Range, Section, Segmented, Toggle } from '../controls';
import { hourLabel } from '../format';
import { addonLabel, usePergola, useUpdatePergola, useValidation } from '../hooks';
import type { ControlType } from '../../types';

export function RoofStep() {
  const d = usePergola();
  const update = useUpdatePergola();
  const msgs = useValidation();
  const view = useDesigner((s) => s.view);
  const setView = useDesigner((s) => s.setView);
  const max = LOUVER_MAX[d.line];
  const louvered = d.roof === 'louvered';

  return (
    <>
      {louvered ? (
        <Section title="Louver angle" sub="Motorized louvers rotate to let in light and air, or close tight for rain."
          aside={<span className="value-pill">{Math.round(view.louverAngle)}°</span>}>
          <Range label="Louver angle" min={0} max={max} value={Math.min(view.louverAngle, max)}
            valueText={`${Math.round(view.louverAngle)} degrees`} onChange={(louverAngle) => setView({ louverAngle })} />
          <div className="range-scale" aria-hidden="true"><span>Closed 0°</span><span>Half {Math.round(max / 2)}°</span><span>Open {max}°</span></div>
        </Section>
      ) : (
        <Section title="Solid roof">
          <p className="hint">Insulated aluminum roof panels with a built-in gutter — always-on shade and rain cover, nothing to adjust.</p>
        </Section>
      )}

      <Section title="Sun & time" sub="Dallas sun path — watch the shade move across your patio."
        aside={<span className="value-pill">{hourLabel(view.hour)}</span>}>
        <Range label="Time of day" min={6} max={20} step={0.25} value={view.hour}
          valueText={hourLabel(view.hour)} onChange={(hour) => setView({ hour })} />
        <div className="range-scale" aria-hidden="true"><span>6 AM</span><span>1 PM</span><span>8 PM</span></div>
        <p className="hint">{sunNote(view.hour, d.roof)}</p>
      </Section>

      <Section title="Control" sub={d.line === 'prestige' ? 'Mobile app and voice control (Alexa / Google Home) are Lux Line features.' : 'Every Lux Line pergola works from the remote, the mobile app and Alexa / Google Home.'}>
        <Segmented<ControlType> label="Control" value={d.control} onChange={(control) => update({ control })}
          options={[{ id: 'remote', label: 'Smart remote' }, { id: 'app', label: 'Mobile app + voice' }]} />
        <Messages messages={msgs} prefix="control" />
      </Section>

      <Section title="Sensors">
        {louvered && (
          <Toggle label="Rain sensor" hint="Closes the louvers automatically when it starts to rain."
            checked={d.rainSensor} onChange={(rainSensor) => update({ rainSensor })}
            price={addonLabel(d, { rainSensor: true }, { rainSensor: false })} />
        )}
        <Toggle label="Wind sensor" hint="Retracts screens and closes the roof in high winds."
          checked={d.windSensor} onChange={(windSensor) => update({ windSensor })}
          price={addonLabel(d, { windSensor: true }, { windSensor: false })} />
        <Messages messages={msgs} prefix={['rainSensor', 'windSensor', 'roof']} />
      </Section>
    </>
  );
}
