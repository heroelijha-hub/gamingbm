import { getSettings } from '@/actions/settings';
import LanguageForm from '@/components/admin/settings/LanguageForm';

export const metadata = {
  title: 'Language Settings | Gaming BM Admin',
};

export default async function LanguageSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <LanguageForm initialSettings={settings} />
    </div>
  );
}
