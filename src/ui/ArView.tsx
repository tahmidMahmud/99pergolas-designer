/**
 * "View in AR": iPhone/iPad → AR Quick Look (USDZ, real-world scale, custom "Get my estimate" banner);
 * Android Chrome → WebXR placement; desktop → QR code that opens this exact design with ?ar=1.
 */
import { useEffect, useRef, useState } from 'react';
import { useDesigner } from '../state/store';
import { captureSnapshot, exportGlb, exportUsdz, startWebXrAr, webXrArSupported } from './deps';
import { moneyRange } from './format';
import { useEstimate, useUi } from './hooks';
import { IconAr, IconClose, IconDownload } from './icons';
import { designSummary, useShareUrl } from './review';
import { toast } from './Toast';

type Mode = 'quicklook' | 'webxr' | 'qr';

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Safari (and every iOS browser, all WebKit) advertises AR Quick Look through relList. */
const quickLookSupported = () => {
  const a = document.createElement('a');
  return !!a.relList?.supports?.('ar');
};

async function detectMode(): Promise<Mode> {
  if (quickLookSupported()) return 'quicklook';
  if (await webXrArSupported()) return 'webxr';
  return 'qr';
}

const QL_BUTTON_TAPPED = '_apple_ar_quicklook_button_tapped';

export function ArButton() {
  const kind = useDesigner((s) => s.design.kind);
  const openAr = useUi((s) => s.openAr);
  if (kind !== 'pergola' && kind !== 'screens') return null;
  return (
    <button type="button" className="chip chip-ar" onClick={openAr} title="See it at full size in your own yard">
      <IconAr size={16} /> View in AR
    </button>
  );
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function ArDialog() {
  const open = useUi((s) => s.arOpen);
  const close = useUi((s) => s.closeAr);
  const openLead = useUi((s) => s.openLead);
  const design = useDesigner((s) => s.design);
  const est = useEstimate();
  const shareLink = useShareUrl();
  const ref = useRef<HTMLDialogElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [status, setStatus] = useState<'building' | 'ready' | 'error'>('building');
  const [usdz, setUsdz] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [xrActive, setXrActive] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  // Build whatever this device needs each time the dialog opens (the design may have changed).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setStatus('building');
    setUsdz(null);
    (async () => {
      const m = await detectMode();
      if (cancelled) return;
      setMode(m);
      if (m === 'quicklook') {
        const [blob, snap] = await Promise.all([exportUsdz(), captureSnapshot().catch(() => null)]);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUsdz(objectUrl);
        setPoster(snap);
      } else if (m === 'qr') {
        const { toDataURL } = await import('qrcode');
        const url = `${shareLink}${shareLink.includes('?') ? '&' : '?'}ar=1`;
        const png = await toDataURL(url, { margin: 1, width: 440, color: { dark: '#171a18', light: '#ffffff' } });
        if (cancelled) return;
        setQr(png);
      }
      setStatus('ready');
    })().catch((e) => {
      console.error('[ar]', e);
      if (!cancelled) setStatus('error');
    });
    return () => {
      cancelled = true;
      if (objectUrl) window.setTimeout(() => URL.revokeObjectURL(objectUrl!), 60_000);
    };
    // shareLink changes with every design edit; the dialog is rebuilt on open only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Quick Look's custom banner button posts a message back to the <a rel="ar"> element.
  useEffect(() => {
    const a = linkRef.current;
    if (!a) return;
    const onMsg = (e: Event) => {
      if ((e as MessageEvent).data === QL_BUTTON_TAPPED) openLead();
    };
    a.addEventListener('message', onMsg);
    return () => a.removeEventListener('message', onMsg);
  }, [usdz, openLead]);

  const startXr = async () => {
    try {
      setXrActive(true);
      await startWebXrAr({
        overlay: overlayRef.current ?? undefined,
        onEnd: () => setXrActive(false),
      });
      ref.current?.close();
    } catch (e) {
      console.error('[ar]', e);
      setXrActive(false);
      toast('Could not start AR on this device', 'error');
    }
  };

  const save = async (kind: 'usdz' | 'glb') => {
    setBusy(kind);
    try {
      const blob = kind === 'usdz' ? await exportUsdz() : await exportGlb();
      download(blob, `99pergolas-${design.kind}.${kind}`);
    } catch {
      toast('Could not build the 3D file', 'error');
    } finally {
      setBusy(null);
    }
  };

  const price = moneyRange(est.low, est.high);
  const qlHref = usdz
    ? `${usdz}#allowsContentScaling=0&canonicalWebPageURL=${encodeURIComponent(shareLink)}&callToAction=${encodeURIComponent(
        'Get my free estimate',
      )}&checkoutTitle=${encodeURIComponent(designSummary(design))}&checkoutSubtitle=${encodeURIComponent(`Estimated ${price} installed`)}`
    : undefined;

  return (
    <>
      <dialog ref={ref} className="modal modal-ar" aria-labelledby="ar-title" onClose={close}>
        <div className="modal-inner">
          <button type="button" className="icon-btn modal-close" aria-label="Close" onClick={close}><IconClose /></button>
          <h2 id="ar-title">See it in your yard</h2>

          {status === 'error' && (
            <p className="hint hint-brass">The 3D model is still loading — close this and try again in a moment.</p>
          )}

          {mode === 'quicklook' && (
            <div className="ar-quicklook">
              <p className="ar-lead">Full size, in your own space. Walk around it, check the height, see how it fits.</p>
              {status === 'ready' && qlHref ? (
                <a ref={linkRef} rel="ar" href={qlHref} className="ar-launch">
                  <img src={poster ?? ''} alt="" />
                  <span className="btn btn-primary btn-lg"><IconAr size={18} /> Tap to place it</span>
                </a>
              ) : (
                <div className="ar-building"><span className="spinner" aria-hidden="true" /> Preparing your model…</div>
              )}
              <p className="field-hint">Point your camera at the patio or lawn and move it slowly until the pergola appears. Works on iPhone and iPad (iOS 12 or later).</p>
            </div>
          )}

          {mode === 'webxr' && (
            <div className="ar-webxr">
              <p className="ar-lead">Full size, in your own space. Point the camera at the ground, then tap to place the design.</p>
              <button type="button" className="btn btn-primary btn-lg" disabled={xrActive} onClick={startXr}>
                <IconAr size={18} /> {xrActive ? 'Starting camera…' : 'Start AR'}
              </button>
              <p className="field-hint">Uses your browser's camera (WebXR). Allow camera access when asked.</p>
            </div>
          )}

          {mode === 'qr' && (
            <div className="ar-qr">
              <p className="ar-lead">Scan with your phone's camera to open this exact design and place it at full size in your yard.</p>
              {qr ? <img src={qr} alt="QR code that opens this design in AR" width={220} height={220} /> : <div className="ar-building"><span className="spinner" aria-hidden="true" /></div>}
              <p className="field-hint">iPhone and iPad use AR Quick Look; Android phones use Chrome's AR. {isIOS() ? 'Open this page in Safari for the AR button.' : ''}</p>
              <div className="ar-downloads">
                <button type="button" className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => save('usdz')}>
                  <IconDownload size={15} /> {busy === 'usdz' ? 'Building…' : 'Download .usdz'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => save('glb')}>
                  <IconDownload size={15} /> {busy === 'glb' ? 'Building…' : 'Download .glb'}
                </button>
              </div>
            </div>
          )}
          {!mode && <div className="ar-building"><span className="spinner" aria-hidden="true" /> Checking this device…</div>}
        </div>
      </dialog>
      {/* DOM overlay drawn on top of the WebXR camera feed. */}
      <div ref={overlayRef} className="ar-overlay" hidden={!xrActive}>
        <p>Point at the ground, then tap to place</p>
      </div>
    </>
  );
}
