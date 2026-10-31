/** Small accessible form controls styled by index.css. */
import { useId, useState, type ReactNode } from 'react';
import type { ValidationMessage } from '../types';
import { IconAlert, IconInfo, IconMinus, IconPlus } from './icons';
import { ftIn } from './format';

/* ---------- Toggle (pill switch) ---------- */
export function Toggle({ checked, onChange, label, hint, disabled, price }: {
  checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode; disabled?: boolean; price?: string;
}) {
  const id = useId();
  return (
    <div className={`toggle-row${disabled ? ' is-disabled' : ''}`}>
      <button type="button" role="switch" id={id} aria-checked={checked} disabled={disabled}
        className="switch" onClick={() => onChange(!checked)}>
        <span className="switch-knob" />
      </button>
      <label htmlFor={id} className="toggle-label">
        <span className="toggle-title">{label}</span>
        {hint && <span className="toggle-hint">{hint}</span>}
      </label>
      {price && <span className="price-tag">{price}</span>}
    </div>
  );
}

/* ---------- Segmented control (native radios) ---------- */
export function Segmented<T extends string>({ value, options, onChange, label, size }: {
  value: T; options: { id: T; label: ReactNode; disabled?: boolean }[]; onChange: (v: T) => void; label: string; size?: 'sm';
}) {
  const name = useId();
  return (
    <div className={`seg${size === 'sm' ? ' seg-sm' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label key={o.id} className={`seg-opt${o.id === value ? ' is-on' : ''}${o.disabled ? ' is-disabled' : ''}`}>
          <input type="radio" className="sr-only" name={name} value={o.id} checked={o.id === value}
            disabled={o.disabled} onChange={() => onChange(o.id)} />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

/* ---------- Radio card grid ---------- */
export function CardChoice<T extends string>({ value, options, onChange, label, columns = 2, className }: {
  value: T;
  options: { id: T; content: ReactNode; disabled?: boolean; title?: string }[];
  onChange: (v: T) => void;
  label: string;
  columns?: number;
  className?: string;
}) {
  const name = useId();
  return (
    <div className={`card-grid cols-${columns}${className ? ` ${className}` : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label key={o.id} className={`choice-card${o.id === value ? ' is-on' : ''}${o.disabled ? ' is-disabled' : ''}`} title={o.title}>
          <input type="radio" className="sr-only" name={name} value={o.id} checked={o.id === value}
            disabled={o.disabled} onChange={() => onChange(o.id)} />
          {o.content}
        </label>
      ))}
    </div>
  );
}

/* ---------- Counter ---------- */
export function Counter({ value, min, max, onChange, label, hint, price }: {
  value: number; min: number; max: number; onChange: (v: number) => void; label: ReactNode; hint?: ReactNode; price?: string;
}) {
  const id = useId();
  return (
    <div className="counter-row">
      <div className="toggle-label" id={id}>
        <span className="toggle-title">{label}</span>
        {hint && <span className="toggle-hint">{hint}</span>}
      </div>
      {price && <span className="price-tag">{price}</span>}
      <div className="counter" role="group" aria-labelledby={id}>
        <button type="button" className="icon-btn" aria-label="Decrease" disabled={value <= min} onClick={() => onChange(value - 1)}>
          <IconMinus size={16} />
        </button>
        <output aria-live="polite" className="counter-val">{value}</output>
        <button type="button" className="icon-btn" aria-label="Increase" disabled={value >= max} onClick={() => onChange(value + 1)}>
          <IconPlus size={16} />
        </button>
      </div>
    </div>
  );
}

/* ---------- Range slider with brass fill ---------- */
export function Range({ value, min, max, step = 1, onChange, label, valueText, id }: {
  value: number; min: number; max: number; step?: number; onChange: (v: number) => void; label: string; valueText?: string; id?: string;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input type="range" className="range" id={id} min={min} max={max} step={step} value={value}
      aria-label={label} aria-valuetext={valueText}
      style={{ ['--pct' as string]: `${pct}%` }}
      onChange={(e) => onChange(Number(e.target.value))} />
  );
}

/* ---------- ft + in selects + slider (Pergolux pattern) ---------- */
export function DimensionInput({ label, value, min, max, onChange, tip, invalid }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void; tip?: string; invalid?: boolean;
}) {
  const id = useId();
  const ft = Math.floor(value / 12);
  const inch = Math.round(value - ft * 12);
  const ftOptions: number[] = [];
  for (let f = Math.floor(min / 12); f <= Math.floor(max / 12); f++) ftOptions.push(f);
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v))));
  return (
    <div className={`dim-row${invalid ? ' is-invalid' : ''}`}>
      <div className="dim-head">
        <span className="dim-label" id={`${id}-l`}>{label}</span>
        {tip && <InfoTip text={tip} />}
        <span className="dim-value" aria-hidden="true">{ftIn(value)}</span>
      </div>
      <div className="dim-controls">
        <select className="select select-sm" aria-label={`${label} feet`} value={ft}
          onChange={(e) => set(Number(e.target.value) * 12 + inch)}>
          {ftOptions.map((f) => <option key={f} value={f}>{f}′</option>)}
        </select>
        <select className="select select-sm" aria-label={`${label} inches`} value={inch}
          onChange={(e) => set(ft * 12 + Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i} disabled={ft * 12 + i < min || ft * 12 + i > max}>{i}″</option>
          ))}
        </select>
        <Range value={value} min={min} max={max} onChange={set} label={label} valueText={ftIn(value)} />
      </div>
      <div className="dim-limits" aria-hidden="true"><span>{ftIn(min)}</span><span>{ftIn(max)}</span></div>
    </div>
  );
}

/* ---------- Info tooltip ---------- */
export function InfoTip({ text, label = 'More info' }: { text: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="tip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="tip-btn" aria-label={label} aria-describedby={open ? id : undefined}
        aria-expanded={open} onClick={() => setOpen((o) => !o)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
        <IconInfo size={15} />
      </button>
      {open && <span role="tooltip" id={id} className="tip-pop">{text}</span>}
    </span>
  );
}

/* ---------- Section wrapper ---------- */
export function Section({ title, sub, children, aside }: { title: string; sub?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="opt-section">
      <div className="opt-section-head">
        <h3>{title}</h3>
        {aside}
      </div>
      {sub && <p className="opt-sub">{sub}</p>}
      {children}
    </section>
  );
}

/* ---------- Inline validation ---------- */
export function Messages({ messages, prefix }: { messages: ValidationMessage[]; prefix?: string | string[] }) {
  const prefixes = prefix == null ? null : Array.isArray(prefix) ? prefix : [prefix];
  const list = prefixes ? messages.filter((m) => prefixes.some((p) => m.field === p || m.field.startsWith(`${p}.`))) : messages;
  if (!list.length) return null;
  return (
    <ul className="msgs">
      {list.map((m, i) => (
        <li key={`${m.field}-${i}`} className={`msg msg-${m.severity}`} role={m.severity === 'error' ? 'alert' : undefined}>
          {m.severity === 'info' ? <IconInfo size={16} /> : <IconAlert size={16} />}
          <span>{m.message}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Rating bar (fabric picker) ---------- */
export function Bars({ label, percent, word }: { label: string; percent: number; word: string }) {
  return (
    <div className="bars">
      <span className="bars-label">{label}</span>
      <span className="bars-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={percent} aria-valuetext={word}>
        <span style={{ width: `${Math.max(2, percent)}%` }} />
      </span>
      <span className="bars-word">{word}</span>
    </div>
  );
}
