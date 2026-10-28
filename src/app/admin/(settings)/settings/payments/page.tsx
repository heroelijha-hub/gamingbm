import { getSettings } from '@/actions/settings';
import PaymentsForm from '@/components/admin/settings/PaymentsForm';

export const metadata = {
  title: 'Payments Settings | Gaming BM Admin',
};

export default async function PaymentsSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <PaymentsForm initialSettings={settings} />
    </div>
  );
}
