import { getSettings } from '@/actions/settings';
import NotFoundPageForm from '@/components/admin/settings/NotFoundPageForm';

export const metadata = {
  title: '404 page Settings | Top Kaminbrennstoffe Admin',
};

export default async function NotFoundPageSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <NotFoundPageForm initialSettings={settings} />
    </div>
  );
}
