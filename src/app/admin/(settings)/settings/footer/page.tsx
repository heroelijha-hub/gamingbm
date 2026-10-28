import { getSettings } from '@/actions/settings';
import FooterForm from '@/components/admin/settings/FooterForm';

export const metadata = {
  title: 'Footer Settings | Gaming BM Admin',
};

export default async function FooterSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <FooterForm initialSettings={settings} />
    </div>
  );
}
