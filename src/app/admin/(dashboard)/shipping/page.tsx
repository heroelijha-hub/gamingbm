import { getShippingZones } from '@/actions/shipping';
import ShippingManager from './ShippingManager';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Shipping Settings | Top Kaminbrennstoffe Admin',
};

export default async function ShippingPage() {
  const t = await getTranslations('AdminShipping');
  const initialZones = await getShippingZones();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 mt-2">{t('subtitle')}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ShippingManager initialZones={initialZones} />
      </div>
    </div>
  );
}
