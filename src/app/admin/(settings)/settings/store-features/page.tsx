import { getSettings } from '@/actions/settings';
import StoreFeaturesForm from '@/components/admin/settings/StoreFeaturesForm';

export const metadata = {
  title: 'Store features Settings | Gaming BM Admin',
};

export default async function StoreFeaturesSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <StoreFeaturesForm initialSettings={settings} />
    </div>
  );
}
