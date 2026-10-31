import { useEffect } from 'react';
import { useDesigner } from './state/store';
import { designToParams, paramsToDesign } from './ui/deps';
import { viewFor } from './ui/review';
import { Header } from './ui/Header';
import { LeadForm } from './ui/LeadForm';
import { Toaster } from './ui/Toast';
import { PergolaConfigurator } from './ui/PergolaConfigurator';
import { ScreensConfigurator } from './ui/ScreensConfigurator';
import { ShadesConfigurator } from './ui/ShadesConfigurator';
import { KitchenConfigurator } from './ui/KitchenConfigurator';

/** Query keys we never own but must carry through replaceState (iframe flag, attribution). */
const PASSTHROUGH = /^(embed|utm_[a-z]+|gclid|fbclid|msclkid|ref)$/;

export const isEmbed = new URLSearchParams(window.location.search).get('embed') === '1';

/** URL <-> store: restore on mount, then mirror every change with replaceState (debounced 150 ms). */
function useUrlSync() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasDesign = [...params.keys()].some((k) => !PASSTHROUGH.test(k));
    if (hasDesign) {
      try {
        const { design, view } = paramsToDesign(params);
        const st = useDesigner.getState();
        st.setDesign(design);
        if (view) st.setView(view);
      } catch (e) {
        console.warn('[url] could not restore design', e);
      }
    }

    const write = () => {
      const s = useDesigner.getState();
      const next = designToParams(s.design, viewFor(s.design, s.view));
      new URLSearchParams(window.location.search).forEach((v, k) => {
        if (PASSTHROUGH.test(k)) next.set(k, v);
      });
      const url = `${window.location.pathname}?${next.toString()}${window.location.hash}`;
      if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        window.history.replaceState(window.history.state, '', url);
      }
    };
    // Like Pergolux: fill in every key on load so the address bar is always a complete share link.
    if (hasDesign) write();

    let timer: number | undefined;
    const unsub = useDesigner.subscribe((s, prev) => {
      if (s.design === prev.design && s.view === prev.view) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(write, 150);
    });
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, []);
}

export default function App() {
  const kind = useDesigner((s) => s.design.kind);
  useUrlSync();

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to the designer</a>
      {!isEmbed && <Header />}
      {kind === 'pergola' && <PergolaConfigurator />}
      {kind === 'screens' && <ScreensConfigurator />}
      {kind === 'shades' && <ShadesConfigurator />}
      {kind === 'kitchen' && <KitchenConfigurator />}
      <LeadForm />
      <Toaster />
    </div>
  );
}
