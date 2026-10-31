import type { ReactNode } from 'react';
import { PriceBar } from './PriceBlock';

/**
 * Two-column designer: sticky stage card (3D viewer or 2D preview) left, scrolling options right.
 * Mobile: stage sticks to the top (~44vh), options below, PriceBar fixed at the bottom.
 */
export function DesignerLayout({ stage, children, compactStage }: { stage: ReactNode; children: ReactNode; compactStage?: boolean }) {
  return (
    <>
      <main className="designer" id="main">
        <div className={`stage-col${compactStage ? ' stage-compact' : ''}`}>
          <div className="stage-sticky">{stage}</div>
        </div>
        <div className="options-col">{children}</div>
      </main>
      <PriceBar />
    </>
  );
}

export function ProductHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="product-heading">
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
  );
}
