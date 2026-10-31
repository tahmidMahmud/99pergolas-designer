/**
 * Spec-sheet PDF (jsPDF, dynamically imported so it stays out of the main bundle).
 *
 *   const blob = await buildSpecPdf(payload);           // Letter by default
 *   const blob = await buildSpecPdf(payload, { format: 'a4' });
 *   downloadBlob(blob, specPdfFilename(payload));
 */
import type { LeadPayload } from '../types';
import {
  BRAND,
  customerRows,
  DEFAULT_DISCLAIMER,
  designTitle,
  money,
  moneyRange,
  specRows,
  type SpecRow,
} from './format.ts';

export { formatInches, money } from './format.ts';

export interface PdfOptions {
  format?: 'letter' | 'a4';
  /** Short design code (shown in the header) when known. */
  code?: string;
}

const C = BRAND.colors;

/** Standard PDF fonts are WinAnsi; map common Unicode punctuation and drop the rest. */
function latin(s: string): string {
  return s
    .replace(/[‘’′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/×/g, 'x')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E -ÿ\n]/g, '');
}

export function specPdfFilename(p: Pick<LeadPayload, 'design'>): string {
  const d = new Date().toISOString().slice(0, 10);
  return `99-pergolas-${p.design.kind}-design-${d}.pdf`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function buildSpecPdf(payload: LeadPayload, opts: PdfOptions = {}): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: opts.format ?? 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const CW = W - 2 * M;
  const FOOT = 36;
  let y = 0;

  const ensure = (h: number) => {
    if (y + h > H - FOOT - 12) {
      doc.addPage();
      y = M;
    }
  };

  const text = (s: string, x: number, yy: number, o?: { align?: 'left' | 'right' | 'center' }) =>
    doc.text(latin(s), x, yy, o);

  const section = (title: string) => {
    ensure(40);
    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(C.text);
    text(title.toUpperCase(), M, y);
    doc.setDrawColor(C.brass);
    doc.setLineWidth(1.2);
    doc.line(M, y + 5, M + 28, y + 5);
    y += 16;
  };

  const kvTable = (rows: SpecRow[]) => {
    const labelW = 150;
    doc.setFontSize(10);
    for (const [k, v] of rows) {
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(latin(v || '-'), CW - labelW - 8) as string[];
      const h = Math.max(1, lines.length) * 13 + 8;
      ensure(h);
      doc.setTextColor(C.muted);
      text(k, M, y + 10);
      doc.setTextColor(C.text);
      doc.text(lines, M + labelW, y + 10);
      doc.setDrawColor('#E4E2DA');
      doc.setLineWidth(0.5);
      doc.line(M, y + h - 2, M + CW, y + h - 2);
      y += h;
    }
  };

  // ---- Header band --------------------------------------------------------------------------
  doc.setFillColor(C.dark);
  doc.rect(0, 0, W, 78, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(C.bone);
  doc.setCharSpace(1.5);
  text('99 PERGOLAS', M, 38);
  doc.setCharSpace(0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(C.brass);
  text('Custom Design Spec', M, 58);
  doc.setFontSize(9);
  doc.setTextColor(C.bone);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  text(dateStr, W - M, 38, { align: 'right' });
  if (opts.code) text(`Design ${opts.code}`, W - M, 52, { align: 'right' });
  text(BRAND.phone, W - M, opts.code ? 66 : 52, { align: 'right' });
  y = 78 + 30;

  // ---- Title + headline price ---------------------------------------------------------------
  const est = payload.estimate;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(C.text);
  const titleLines = doc.splitTextToSize(latin(designTitle(payload.design)), CW) as string[];
  doc.text(titleLines, M, y);
  y += titleLines.length * 19;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(C.brassDeep);
  text(`Estimated installed: ${moneyRange(est.low, est.high)}`, M, y);
  y += 15;
  if (est.monthly > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(C.muted);
    text(`0% financing from ${money(est.monthly)}/mo O.A.C. (${est.termMonths} months)`, M, y);
    y += 12;
  }

  // ---- Snapshot -----------------------------------------------------------------------------
  if (payload.snapshot) {
    try {
      const props = doc.getImageProperties(payload.snapshot);
      const maxH = 300;
      let w = CW;
      let h = (props.height / props.width) * w;
      if (h > maxH) {
        h = maxH;
        w = (props.width / props.height) * h;
      }
      ensure(h + 16);
      y += 10;
      doc.setFillColor(C.bone);
      doc.roundedRect(M, y, CW, h, 8, 8, 'F');
      const fmt = /^data:image\/(\w+)/.exec(payload.snapshot)?.[1]?.toUpperCase() ?? 'PNG';
      doc.addImage(payload.snapshot, fmt === 'JPG' ? 'JPEG' : fmt, M + (CW - w) / 2, y, w, h, undefined, 'FAST');
      y += h + 4;
    } catch {
      /* unreadable snapshot — skip, never fail the PDF */
    }
  }

  // ---- Customer -----------------------------------------------------------------------------
  section('Prepared for');
  kvTable(customerRows(payload.site));

  // ---- Design -------------------------------------------------------------------------------
  section('Your design');
  kvTable(specRows(payload.design));

  // ---- Itemized estimate --------------------------------------------------------------------
  section('Itemized estimate');
  const colGroup = 80;
  const colQty = 36;
  const colRange = 120;
  const colItem = CW - colGroup - colQty - colRange;
  const header = () => {
    ensure(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(C.muted);
    text('GROUP', M, y + 9);
    text('ITEM', M + colGroup, y + 9);
    text('QTY', M + colGroup + colItem + colQty / 2, y + 9, { align: 'center' });
    text('RANGE', M + CW, y + 9, { align: 'right' });
    y += 16;
  };
  header();
  doc.setFontSize(10);
  for (const it of est.items) {
    doc.setFont('helvetica', 'normal');
    const label = it.note ? `${it.label}\n${it.note}` : it.label;
    const lines = doc.splitTextToSize(latin(label), colItem - 8) as string[];
    const h = lines.length * 13 + 6;
    if (y + h > H - FOOT - 12) {
      doc.addPage();
      y = M;
      header();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
    }
    doc.setTextColor(C.muted);
    text(it.group.charAt(0).toUpperCase() + it.group.slice(1), M, y + 10);
    doc.setTextColor(C.text);
    doc.text(lines, M + colGroup, y + 10);
    text(String(it.qty), M + colGroup + colItem + colQty / 2, y + 10, { align: 'center' });
    text(moneyRange(it.low, it.high), M + CW, y + 10, { align: 'right' });
    doc.setDrawColor('#E4E2DA');
    doc.setLineWidth(0.5);
    doc.line(M, y + h - 1, M + CW, y + h - 1);
    y += h;
  }
  ensure(46);
  doc.setFillColor(C.bone);
  doc.rect(M, y + 4, CW, est.monthly > 0 ? 38 : 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(C.text);
  text('Estimated installed total', M + 8, y + 20);
  text(moneyRange(est.low, est.high), M + CW - 8, y + 20, { align: 'right' });
  if (est.monthly > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(C.brassDeep);
    text(`0% financing from ${money(est.monthly)}/mo O.A.C. over ${est.termMonths} months`, M + 8, y + 34);
  }
  y += est.monthly > 0 ? 50 : 36;

  // ---- Share link ---------------------------------------------------------------------------
  if (payload.shareUrl) {
    section('Open your design in 3D');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(C.brassDeep);
    const urlLines = doc.splitTextToSize(payload.shareUrl, CW) as string[];
    ensure(urlLines.length * 11 + 6);
    doc.text(urlLines, M, y + 8);
    doc.link(M, y, CW, urlLines.length * 11 + 2, { url: payload.shareUrl });
    y += urlLines.length * 11 + 8;
  }

  // ---- Next steps + disclaimer --------------------------------------------------------------
  section('Next steps');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(C.text);
  const next = doc.splitTextToSize(
    latin(
      `We reply within one business day. Book your on-site measure ($200, credited toward your project) at ${BRAND.measureUrl} or call ${BRAND.phone}.`,
    ),
    CW,
  ) as string[];
  ensure(next.length * 13);
  doc.text(next, M, y + 8);
  y += next.length * 13 + 8;

  doc.setFontSize(8);
  doc.setTextColor(C.muted);
  const disc = doc.splitTextToSize(latin(est.disclaimer || DEFAULT_DISCLAIMER), CW) as string[];
  ensure(disc.length * 10 + 10);
  doc.text(disc, M, y + 10);

  // ---- Footer on every page -----------------------------------------------------------------
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(C.dark2);
    doc.rect(0, H - FOOT, W, FOOT, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(C.bone);
    text(`${BRAND.name}  |  ${BRAND.phone}  |  ${BRAND.email}  |  ${BRAND.siteLabel}`, M, H - FOOT / 2 + 3);
    doc.setTextColor(C.brass);
    text(`${i} / ${pages}`, W - M, H - FOOT / 2 + 3, { align: 'right' });
  }

  return doc.output('blob');
}

/** Base64 (no data: prefix) of a Blob, for attaching to the lead POST. */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) bin += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  return btoa(bin);
}
