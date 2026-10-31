/** Review building blocks shared by every product: itemized estimate, share link, CTAs, PDF. */
import { useMemo, useState } from 'react';
import { useDesigner } from '../state/store';
import type { Design, LeadPayload, LineItem, SiteInfo, ViewState } from '../types';
import { CATALOG, buildSpecPdf, captureSource, estimate, shareUrl } from './deps';
import { MEASURE_URL, LINES, SHADE_STYLES, KITCHEN_SHAPES } from './copy';
import { ftIn, money, moneyRange } from './format';
import { useEstimate, useUi } from './hooks';
import { IconArrow, IconCalendar, IconCopy, IconDownload } from './icons';
import { copyText, toast } from './Toast';

const GROUPS: { id: LineItem['group']; label: string }[] = [
  { id: 'structure', label: 'Structure' },
  { id: 'roof', label: 'Roof & control' },
  { id: 'sides', label: 'Sides & openings' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'comfort', label: 'Comfort & extras' },
  { id: 'site', label: 'Site & installation' },
];

export function colorLabel(id: string, customRal?: string): string {
  const c = CATALOG.colors[id as keyof typeof CATALOG.colors];
  if (!c) return id;
  if (id === 'custom') return customRal ? `Custom (${customRal})` : 'Custom RAL (to confirm)';
  return `${c.label} (${c.ral})`;
}

/** Only pergola/screen designs carry scene view state in the share link. */
export function viewFor(design: Design, view: ViewState): Partial<ViewState> | undefined {
  if (design.kind === 'pergola') return { louverAngle: view.louverAngle, hour: view.hour, showDimensions: view.showDimensions };
  if (design.kind === 'screens') return { hour: view.hour };
  return undefined;
}

export function designSummary(d: Design): string {
  switch (d.kind) {
    case 'pergola':
      return `${LINES[d.line].label} ${d.roof === 'solid' ? 'patio cover' : 'pergola'} · ${ftIn(d.width)} × ${ftIn(d.depth)}`;
    case 'screens':
      return `${d.openings.length} motorized screen${d.openings.length > 1 ? 's' : ''} · ${CATALOG.fabrics[d.fabric]?.label ?? d.fabric} fabric`;
    case 'shades': {
      const styles = [...new Set(d.windows.map((w) => SHADE_STYLES.find((s) => s.id === w.style)?.label ?? w.style))];
      return `${d.windows.length} indoor shade${d.windows.length > 1 ? 's' : ''} · ${styles.join(', ')}`;
    }
    case 'kitchen':
      return `${KITCHEN_SHAPES.find((s) => s.id === d.shape)?.label ?? d.shape} outdoor kitchen · ${ftIn(d.length)} run`;
  }
}

export function useShareUrl(): string {
  const design = useDesigner((s) => s.design);
  const view = useDesigner((s) => s.view);
  return useMemo(() => shareUrl(design, viewFor(design, view)), [design, view]);
}

export const EMPTY_SITE: SiteInfo = { name: '', phone: '', email: '', zip: '', consent: false };

export function buildPayload(site: SiteInfo, snapshot?: string): LeadPayload {
  const { design, view } = useDesigner.getState();
  const v = viewFor(design, view);
  return {
    design,
    view: v,
    site,
    estimate: estimate(design),
    shareUrl: shareUrl(design, v),
    snapshot,
    source: captureSource(),
  };
}

export async function downloadSpecPdf(payload: LeadPayload) {
  try {
    const { blob, filename } = await buildSpecPdf(payload);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (e) {
    console.error('[pdf]', e);
    toast('Could not build the PDF — please try again', 'error');
  }
}

export function EstimateTable() {
  const est = useEstimate();
  const groups = GROUPS.map((g) => ({ ...g, items: est.items.filter((i) => i.group === g.id) })).filter((g) => g.items.length);
  return (
    <div className="est-table">
      {groups.map((g) => (
        <div key={g.id} className="est-group">
          <div className="est-group-label">{g.label}</div>
          {g.items.map((it) => (
            <div key={it.id} className="est-row">
              <span className="est-label">
                {it.label}
                {it.qty > 1 && <span className="est-qty"> × {it.qty}</span>}
                {it.note && <span className="est-note">{it.note}</span>}
              </span>
              <span className="est-amt">{moneyRange(it.low, it.high)}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="est-total">
        <span>Estimated total, installed</span>
        <span>{moneyRange(est.low, est.high)}</span>
      </div>
      <div className="est-fin">0% financing from {money(est.monthly)}/mo for {est.termMonths} months, O.A.C.</div>
      <p className="est-disclaimer">{est.disclaimer}</p>
    </div>
  );
}

export function ShareRow() {
  const url = useShareUrl();
  return (
    <div className="share-row">
      <label className="field-label" htmlFor="share-url">Your design link</label>
      <div className="share-input">
        <input id="share-url" className="input" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn btn-outline btn-sm" onClick={() => copyText(url)}>
          <IconCopy size={16} /> Copy
        </button>
      </div>
      <span className="field-hint">Anyone with this link sees exactly this design — share it with your spouse, HOA or builder.</span>
    </div>
  );
}

export function ReviewActions() {
  const openLead = useUi((s) => s.openLead);
  const [busy, setBusy] = useState(false);
  return (
    <div className="review-actions">
      <button type="button" className="btn btn-primary btn-lg" onClick={openLead}>
        Get my free estimate <IconArrow size={18} />
      </button>
      <a className="btn btn-outline" href={MEASURE_URL} target="_blank" rel="noopener">
        <IconCalendar size={16} /> Book your measure ($200, credited)
      </a>
      <button type="button" className="btn btn-ghost" disabled={busy} onClick={async () => {
        setBusy(true);
        await downloadSpecPdf(buildPayload(EMPTY_SITE));
        setBusy(false);
      }}>
        <IconDownload size={16} /> {busy ? 'Preparing PDF…' : 'Download spec PDF'}
      </button>
      <p className="review-note">We reply within one business day. Approximate measurements are fine — your free on-site measure confirms everything.</p>
    </div>
  );
}
