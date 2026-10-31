import { LOGO_URL, MEASURE_URL, PHONE_DISPLAY, PHONE_HREF } from './copy';
import { IconPhone } from './icons';
import { ProductSwitcher } from './ProductSwitcher';

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="https://99pergolas.com/" aria-label="99 Pergolas home">
          <img src={LOGO_URL} alt="99 Pergolas" width={140} height={44} />
        </a>
        <ProductSwitcher />
        <div className="header-actions">
          <a className="header-phone" href={PHONE_HREF}>
            <IconPhone size={16} />
            <span className="header-phone-text">{PHONE_DISPLAY}</span>
            <span className="sr-only">Call 99 Pergolas</span>
          </a>
          <a className="btn btn-outline btn-dark btn-sm header-measure" href={MEASURE_URL} target="_blank" rel="noopener">
            Book your measure
          </a>
        </div>
      </div>
    </header>
  );
}
