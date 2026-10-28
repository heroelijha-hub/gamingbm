import { getSettings } from '@/actions/settings';
import NavigationForm from '@/components/admin/settings/NavigationForm';

export const metadata = {
  title: 'Navigation menu Settings | Gaming BM Admin',
};

export default async function NavigationSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <NavigationForm initialSettings={settings} />
    </div>
  );
}
