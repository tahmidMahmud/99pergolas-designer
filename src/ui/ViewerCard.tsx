import { Component, Suspense, type ReactNode } from 'react';
import { useDesigner } from '../state/store';
import { LOUVER_MAX } from './copy';
import { Viewer, captureSnapshot, fitCamera } from './deps';
import { IconCamera, IconMoon, IconReset, IconSun } from './icons';
import { Toggle } from './controls';
import { downloadDataUrl, toast } from './Toast';
import { ArButton } from './ArView';

class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.error('[viewer]', err);
  }
  render() {
    if (this.state.failed)
      return (
        <div className="viewer-fallback" role="status">
          <strong>3D preview unavailable on this device.</strong>
          <span>Your design and price still update — send it to us and we will send back a rendered drawing.</span>
        </div>
      );
    return this.props.children;
  }
}

function ViewerLoading() {
  return (
    <div className="viewer-fallback" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>Loading 3D preview…</span>
    </div>
  );
}

/** Bone viewer card with the Pergolux-style toggle row underneath. */
export function ViewerCard() {
  const design = useDesigner((s) => s.design);
  const view = useDesigner((s) => s.view);
  const setView = useDesigner((s) => s.setView);
  const isPergola = design.kind === 'pergola';
  const louvered = isPergola && design.roof === 'louvered';
  const max = isPergola ? LOUVER_MAX[design.line] : 90;
  const night = view.hour >= 19;
  const coarse = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

  const snapshot = async () => {
    try {
      const url = await captureSnapshot();
      if (!url) throw new Error('empty');
      downloadDataUrl(url, `99pergolas-${design.kind}-design.png`);
      toast('Snapshot saved');
    } catch {
      toast('Snapshot is not available yet — try again in a moment', 'error');
    }
  };

  return (
    <div className="viewer-card">
      <div className="viewer-canvas">
        <ViewerBoundary>
          <Suspense fallback={<ViewerLoading />}>
            <Viewer className="viewer-root" />
          </Suspense>
        </ViewerBoundary>
        {coarse && (
          <div className="viewer-hint" aria-hidden="true">
            Drag to rotate · Two fingers to move
          </div>
        )}
      </div>
      <div className="viewer-tools">
        {louvered && (
          <Toggle label="Open louvers" checked={view.louverAngle > 0}
            onChange={(on) => setView({ louverAngle: on ? max : 0 })} />
        )}
        {(isPergola || design.kind === 'screens') && (
          <Toggle label="Show dimensions" checked={view.showDimensions}
            onChange={(on) => setView({ showDimensions: on })} />
        )}
        <div className="viewer-tool-btns">
          <button type="button" className="chip" aria-pressed={night}
            onClick={() => setView({ hour: night ? 16 : 20 })}
            title={night ? 'Switch to daytime' : 'Switch to night — see the LEDs'}>
            {night ? <IconMoon size={16} /> : <IconSun size={16} />}
            {night ? 'Night' : 'Day'}
          </button>
          <button type="button" className="chip" onClick={() => fitCamera()}>
            <IconReset size={16} /> Reset view
          </button>
          <button type="button" className="chip" onClick={snapshot}>
            <IconCamera size={16} /> Snapshot
          </button>
          <ArButton />
        </div>
      </div>
    </div>
  );
}
