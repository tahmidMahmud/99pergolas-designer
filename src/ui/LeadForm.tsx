import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useDesigner } from '../state/store';
import type { LeadPayload, SiteInfo } from '../types';
import { captureSnapshot, mailtoFallback, submitLead } from './deps';
import { EMAIL, MEASURE_URL, PHONE_DISPLAY, PHONE_HREF, TIMEFRAMES } from './copy';
import { firstName, moneyRange } from './format';
import { useEstimate, useUi } from './hooks';
import { IconArrow, IconCalendar, IconClose, IconCopy, IconDownload } from './icons';
import { buildPayload, designSummary, downloadSpecPdf } from './review';
import { copyText } from './Toast';

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done'; payload: LeadPayload; link: string } | { kind: 'error'; message: string; payload: LeadPayload; mailto: string };
type Errors = Partial<Record<'name' | 'phone' | 'email' | 'zip' | 'consent', string>>;

const DFW_ZIP = /^7[56]\d{3}$/;

function check(s: SiteInfo): Errors {
  const e: Errors = {};
  if (s.name.trim().length < 2) e.name = 'Please enter your name.';
  if (s.phone.replace(/\D/g, '').length < 10) e.phone = 'Please enter a 10-digit phone number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.email.trim())) e.email = 'Please enter a valid email.';
  if (!/^\d{5}$/.test(s.zip.trim())) e.zip = 'Please enter a 5-digit ZIP code.';
  if (!s.consent) e.consent = 'Please agree so we can send your estimate.';
  return e;
}

export function LeadForm() {
  const open = useUi((s) => s.leadOpen);
  const close = useUi((s) => s.closeLead);
  const design = useDesigner((s) => s.design);
  const est = useEstimate();
  const ref = useRef<HTMLDialogElement>(null);
  const [site, setSite] = useState<SiteInfo>({ name: '', phone: '', email: '', zip: '', city: '', notes: '', consent: false });
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [honeypot, setHoneypot] = useState('');

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      setStatus((s) => (s.kind === 'done' || s.kind === 'error' ? { kind: 'idle' } : s));
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  const set = <K extends keyof SiteInfo>(k: K, v: SiteInfo[K]) => {
    const next = { ...site, [k]: v };
    setSite(next);
    if (tried) setErrors(check(next));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    const errs = check(site);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      ref.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus({ kind: 'sending' });
    let snapshot: string | undefined;
    if (design.kind === 'pergola' || design.kind === 'screens') {
      try {
        snapshot = (await captureSnapshot()) || undefined;
      } catch {
        snapshot = undefined;
      }
    }
    const payload = buildPayload({ ...site, name: site.name.trim(), email: site.email.trim(), zip: site.zip.trim() }, snapshot);
    try {
      const res = await submitLead(payload, { website: honeypot });
      if (res.ok) {
        setStatus({ kind: 'done', payload, link: res.shareUrl ?? payload.shareUrl });
      } else {
        if (res.fieldErrors) {
          const fe: Errors = {};
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            const key = k.replace(/^site\./, '') as keyof Errors;
            if (['name', 'phone', 'email', 'zip', 'consent'].includes(key)) fe[key] = v;
          }
          setErrors(fe);
        }
        setStatus({ kind: 'error', message: res.error ?? 'We could not send your request.', payload, mailto: res.mailto ?? mailtoFallback(payload) });
      }
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'We could not send your request.', payload, mailto: mailtoFallback(payload) });
    }
  };

  const fieldProps = (k: keyof Errors) => ({
    name: k,
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `lead-${k}-err` : undefined,
  });
  const err = (k: keyof Errors) => errors[k] && <span className="field-error" id={`lead-${k}-err`}>{errors[k]}</span>;

  return (
    <dialog ref={ref} className="modal" aria-labelledby="lead-title" onClose={close}
      onClick={(e) => { if (e.target === ref.current) close(); }}>
      <div className="modal-inner">
        <button type="button" className="icon-btn modal-close" aria-label="Close" onClick={close}><IconClose /></button>

        {status.kind === 'done' ? (
          <div className="lead-done">
            <span className="kicker">Request received</span>
            <h2 id="lead-title">Thanks, {firstName(status.payload.site.name)} — we'll reply within one business day.</h2>
            <p>We emailed your design and estimate to <strong>{status.payload.site.email}</strong>. Keep this link to come back to your design anytime:</p>
            <div className="share-input">
              <input className="input" readOnly value={status.link} aria-label="Your design link" onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => copyText(status.link)}><IconCopy size={16} /> Copy</button>
            </div>
            <div className="lead-done-actions">
              <a className="btn btn-primary" href={MEASURE_URL} target="_blank" rel="noopener">
                <IconCalendar size={16} /> Book your measure ($200, credited)
              </a>
              <button type="button" className="btn btn-outline" onClick={() => downloadSpecPdf(status.payload)}>
                <IconDownload size={16} /> Download PDF
              </button>
            </div>
            <p className="field-hint">The $200 site-visit fee is fully credited toward your pergola if you go ahead. Questions? Call <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>.</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <span className="kicker">Free estimate</span>
            <h2 id="lead-title">Let's price this one for your space.</h2>
            <p className="lead-summary">
              <strong>{designSummary(design)}</strong>
              <span>Estimated {moneyRange(est.low, est.high)} installed</span>
            </p>

            <div className="form-grid">
              <label className="field span-2">
                <span className="field-label">Full name</span>
                <input className="input" autoComplete="name" value={site.name} onChange={(e) => set('name', e.target.value)} {...fieldProps('name')} />
                {err('name')}
              </label>
              <label className="field">
                <span className="field-label">Phone</span>
                <input className="input" type="tel" autoComplete="tel" inputMode="tel" value={site.phone} onChange={(e) => set('phone', e.target.value)} {...fieldProps('phone')} />
                {err('phone')}
              </label>
              <label className="field">
                <span className="field-label">Email</span>
                <input className="input" type="email" autoComplete="email" value={site.email} onChange={(e) => set('email', e.target.value)} {...fieldProps('email')} />
                {err('email')}
              </label>
              <label className="field">
                <span className="field-label">ZIP code</span>
                <input className="input" autoComplete="postal-code" inputMode="numeric" maxLength={5} value={site.zip}
                  onChange={(e) => set('zip', e.target.value.replace(/\D/g, '').slice(0, 5))} {...fieldProps('zip')} />
                {err('zip')}
                {!errors.zip && site.zip.length === 5 && !DFW_ZIP.test(site.zip) && (
                  <span className="field-hint">Outside DFW? Send it anyway — we take projects across Texas by request.</span>
                )}
              </label>
              <label className="field">
                <span className="field-label">City <span className="optional">(optional)</span></span>
                <input className="input" autoComplete="address-level2" value={site.city ?? ''} onChange={(e) => set('city', e.target.value)} />
              </label>
              <label className="field span-2">
                <span className="field-label">When are you hoping to start?</span>
                <select className="select" value={site.timeframe ?? ''} onChange={(e) => set('timeframe', (e.target.value || undefined) as SiteInfo['timeframe'])}>
                  <option value="">Choose a timeframe</option>
                  {TIMEFRAMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </label>
              <label className="field span-2">
                <span className="field-label">Notes <span className="optional">(optional)</span></span>
                <textarea className="input" rows={3} placeholder="Surface (concrete, pavers, deck), HOA, anything we should know"
                  value={site.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
              </label>
              <label className="check span-2">
                <input type="checkbox" checked={site.consent} onChange={(e) => set('consent', e.target.checked)} {...fieldProps('consent')} />
                <span>I agree to be contacted by call/text/email about my project.</span>
              </label>
              {err('consent')}
              <label className="hp" aria-hidden="true">
                Website
                <input tabIndex={-1} autoComplete="off" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </label>
            </div>

            {status.kind === 'error' && (
              <div className="form-error" role="alert">
                <strong>We couldn't send your request.</strong> {status.message}{' '}
                <a href={status.mailto}>Email it to {EMAIL}</a> or call <a href={PHONE_HREF}>{PHONE_DISPLAY}</a> — your design link is included.
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={status.kind === 'sending'}>
              {status.kind === 'sending' ? (<><span className="spinner spinner-sm" aria-hidden="true" /> Sending your design…</>) : (<>Send my design for a free estimate <IconArrow size={18} /></>)}
            </button>
            <p className="field-hint center">Reply within one business day. No obligation, no spam.</p>
          </form>
        )}
      </div>
    </dialog>
  );
}
