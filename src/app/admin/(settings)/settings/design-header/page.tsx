import { getSettings } from '@/actions/settings';
import DesignHeaderForm from '@/components/admin/settings/DesignHeaderForm';

export const metadata = {
  title: 'Header and product cards Settings | Gaming BM Admin',
};

export default async function DesignHeaderSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <DesignHeaderForm initialSettings={settings} />
    </div>
  );
}
