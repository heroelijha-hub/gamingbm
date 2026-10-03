import { getSettings } from '@/actions/settings';
import ShippingInfoForm from '@/components/admin/settings/ShippingInfoForm';

export const metadata = {
  title: 'Product shipping info Settings | Top Kaminbrennstoffe Admin',
};

export default async function ShippingInfoSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <ShippingInfoForm initialSettings={settings} />
    </div>
  );
}
