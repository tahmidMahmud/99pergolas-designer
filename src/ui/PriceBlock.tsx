import { useDesigner } from '../state/store';
import { FINANCE_URL } from './copy';
import { InfoTip } from './controls';
import { moneyRange, money } from './format';
import { useEstimate, useUi } from './hooks';
import { IconArrow } from './icons';

/** Live price block: "Estimated $X – $Y installed" + financing + disclaimer. */
export function PriceBlock({ cta = true }: { cta?: boolean }) {
  const est = useEstimate();
  const openLead = useUi((s) => s.openLead);
  const step = useDesigner((s) => s.view.step);
  const kind = useDesigner((s) => s.design.kind);
  return (
    <div className="price-block" aria-live="polite">
      <div className="price-main">
        <span className="price-kicker">Estimated, installed</span>
        <span className="price-range">{moneyRange(est.low, est.high)}</span>
        <span className="price-fin">
          0% financing from <strong>{money(est.monthly)}/mo</strong> O.A.C.{' '}
          <a href={FINANCE_URL} target="_blank" rel="noopener" className="link-quiet">Pre-qualify</a>
        </span>
        <span className="price-disc">
          Planning estimate, not a quote
          <InfoTip text={est.disclaimer} label="About this estimate" />
        </span>
      </div>
      {cta && !(kind === 'pergola' && step === 'review') && (
        <button type="button" className="btn btn-primary btn-sm price-cta" onClick={openLead}>
          Get my free estimate <IconArrow size={16} />
        </button>
      )}
    </div>
  );
}

/** Mobile sticky bottom bar. Hidden on desktop via CSS. */
export function PriceBar() {
  const est = useEstimate();
  const openLead = useUi((s) => s.openLead);
  return (
    <div className="price-bar" role="region" aria-label="Estimate summary">
      <div className="price-bar-text">
        <span className="price-bar-range">{moneyRange(est.low, est.high)}</span>
        <span className="price-bar-fin">from {money(est.monthly)}/mo · 0% O.A.C.</span>
      </div>
      <button type="button" className="btn btn-primary btn-sm" onClick={openLead}>
        Get my estimate <IconArrow size={16} />
      </button>
    </div>
  );
}
