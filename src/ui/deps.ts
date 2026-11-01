/**
 * Single import point for sibling modules (config / scene / lead), with thin adapters.
 * Heavy modules (three.js scene, jspdf) are loaded lazily so the options UI paints first.
 */
import { lazy } from 'react';
import type { Design, LeadPayload, ViewState } from '../types';
import { paramsToDesign as parseDesign, paramsToView, shareUrl as buildShareUrl } from '../config';

export {
  CATALOG, PRESETS, SCREEN_LIMITS, ENCLOSURE_NONE, computeStructure, validate, clamp, limits, estimate,
  designToParams, sideDisabledReason,
} from '../config';
export { captureSource } from '../lead/source';
export { submitLead, mailtoFallback } from '../lead/submit';

/** URL → design + view (config exposes these as two functions). */
export function paramsToDesign(params: URLSearchParams): { design: Design; view: Partial<ViewState> } {
  return { design: parseDesign(params), view: paramsToView(params) };
}

/** Share links point at wherever the designer is served (design.99pergolas.com in production). */
export function shareUrl(design: Design, view?: Partial<ViewState>): string {
  return buildShareUrl(design, view, `${window.location.origin}${window.location.pathname}`);
}

const sceneModule = () => import('../scene');

export const Viewer = lazy(() => sceneModule().then((m) => ({ default: m.Viewer })));

export async function captureSnapshot(): Promise<string> {
  const m = await sceneModule();
  return m.captureSnapshot();
}

export function fitCamera(): void {
  void sceneModule().then((m) => m.fitCamera());
}

/** AR: USDZ for iOS Quick Look, GLB for everything else, WebXR session for Android Chrome. */
export async function exportUsdz(): Promise<Blob> {
  return (await sceneModule()).exportUsdz();
}
export async function exportGlb(): Promise<Blob> {
  return (await sceneModule()).exportGlb();
}
export async function webXrArSupported(): Promise<boolean> {
  return (await sceneModule()).webXrArSupported();
}
export async function startWebXrAr(opts: { overlay?: HTMLElement; onPlaced?: () => void; onEnd?: () => void }) {
  return (await sceneModule()).startWebXrAr(opts);
}

export async function buildSpecPdf(payload: LeadPayload): Promise<{ blob: Blob; filename: string }> {
  const m = await import('../lead/pdf');
  return { blob: await m.buildSpecPdf(payload), filename: m.specPdfFilename(payload) };
}
