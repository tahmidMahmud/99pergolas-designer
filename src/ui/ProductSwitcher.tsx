import { useRef, type KeyboardEvent } from 'react';
import { useDesigner } from '../state/store';
import { PRODUCTS } from './copy';
import type { ProductKind } from '../types';

/** Product tabs: Pergolas · Patio Screens · Indoor Shades · Outdoor Kitchen. */
export function ProductSwitcher() {
  const kind = useDesigner((s) => s.design.kind);
  const setProduct = useDesigner((s) => s.setProduct);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (id: ProductKind) => {
    if (id === useDesigner.getState().design.kind) return;
    setProduct(id);
    window.scrollTo({ top: 0 });
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + PRODUCTS.length) % PRODUCTS.length;
    refs.current[next]?.focus();
    select(PRODUCTS[next].id);
  };

  return (
    <nav className="product-tabs" aria-label="Products">
      <div role="tablist" aria-label="Choose a product to design">
        {PRODUCTS.map((p, i) => (
          <button key={p.id} type="button" role="tab" ref={(el) => { refs.current[i] = el; }}
            aria-selected={kind === p.id} tabIndex={kind === p.id ? 0 : -1}
            className={`product-tab${kind === p.id ? ' is-on' : ''}`}
            onClick={() => select(p.id)} onKeyDown={(e) => onKey(e, i)}>
            {p.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
