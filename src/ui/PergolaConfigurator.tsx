import { LINES, PRODUCTS } from './copy';
import { usePergola } from './hooks';
import { DesignerLayout, ProductHeading } from './Layout';
import { PriceBlock } from './PriceBlock';
import { Stepper } from './Stepper';
import { ViewerCard } from './ViewerCard';

export function PergolaConfigurator() {
  const d = usePergola();
  const title = d.mounting === 'cantilever' ? 'Custom Aluminum Carport' : d.roof === 'solid' ? 'Custom Patio Cover' : PRODUCTS[0].title;
  return (
    <DesignerLayout stage={<ViewerCard />}>
      <ProductHeading title={`${title} — ${LINES[d.line].label}`} sub={PRODUCTS[0].tagline} />
      <div className="price-sticky"><PriceBlock /></div>
      <Stepper />
    </DesignerLayout>
  );
}
