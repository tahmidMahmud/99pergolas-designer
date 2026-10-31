import { useEffect, useRef } from 'react';
import { useDesigner } from '../state/store';
import type { StepId } from '../types';
import { STEPS } from './copy';
import { useValidation } from './hooks';
import { IconArrow, IconBack } from './icons';
import { SizeStep } from './steps/SizeStep';
import { StyleStep } from './steps/StyleStep';
import { RoofStep } from './steps/RoofStep';
import { SidesStep } from './steps/SidesStep';
import { ComfortStep } from './steps/ComfortStep';
import { ReviewStep } from './steps/ReviewStep';

const BODIES: Record<StepId, () => React.JSX.Element> = {
  size: SizeStep,
  style: StyleStep,
  roof: RoofStep,
  sides: SidesStep,
  comfort: ComfortStep,
  review: ReviewStep,
};

/** Which validation fields belong to which step (for the error dot on the step tab). */
const STEP_FIELDS: Record<StepId, string[]> = {
  size: ['width', 'depth', 'height', 'size', 'mounting', 'roof'],
  style: ['line', 'frameColor', 'louverColor', 'customRal'],
  roof: ['control', 'rainSensor', 'windSensor'],
  sides: ['sides'],
  comfort: ['ledWarm', 'rgb', 'fans', 'heaters'],
  review: [],
};

export function Stepper() {
  const step = useDesigner((s) => s.view.step);
  const setStep = useDesigner((s) => s.setStep);
  const msgs = useValidation();
  const topRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const idx = Math.max(0, STEPS.findIndex((s) => s.id === step));
  const cur = STEPS[idx];
  const Body = BODIES[cur.id];

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = topRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.6) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    }
    el.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }, [step]);

  const hasError = (id: StepId) =>
    msgs.some((m) => m.severity === 'error' && STEP_FIELDS[id].some((f) => m.field === f || m.field.startsWith(`${f}.`)));

  return (
    <div className="stepper" ref={topRef}>
      <ol className="step-tabs" aria-label="Design steps">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button type="button" className={`step-tab${i === idx ? ' is-on' : ''}${i < idx ? ' is-done' : ''}`}
              aria-current={i === idx ? 'step' : undefined} onClick={() => setStep(s.id)}>
              <span className="step-num" aria-hidden="true">{i + 1}</span>
              <span className="step-name">{s.label}</span>
              {hasError(s.id) && <span className="step-err" aria-label="has an issue" />}
            </button>
          </li>
        ))}
      </ol>

      <div className="step-body">
        <div className="step-head">
          <span className="kicker">Step {idx + 1} of {STEPS.length}</span>
          <h2 tabIndex={-1}>{cur.heading}</h2>
          <p>{cur.sub}</p>
        </div>
        <Body />
      </div>

      <div className="step-nav">
        {idx > 0 ? (
          <button type="button" className="btn btn-outline" onClick={() => setStep(STEPS[idx - 1].id)}>
            <IconBack size={16} /> Back
          </button>
        ) : <span />}
        {idx < STEPS.length - 1 && (
          <button type="button" className="btn btn-primary" onClick={() => setStep(STEPS[idx + 1].id)}>
            Next: {STEPS[idx + 1].label} <IconArrow size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
