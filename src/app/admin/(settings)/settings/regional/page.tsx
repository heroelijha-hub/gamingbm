import { getSettings } from '@/actions/settings';
import RegionalForm from '@/components/admin/settings/RegionalForm';

export const metadata = {
  title: 'Regional and Currency Settings | Gaming BM Admin',
};

export default async function RegionalSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <RegionalForm initialSettings={settings} />
    </div>
  );
}
