import { getSettings } from '@/actions/settings';
import TaxesForm from '@/components/admin/settings/TaxesForm';

export const metadata = {
  title: 'Taxes and VAT Settings | Gaming BM Admin',
};

export default async function TaxesSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <TaxesForm initialSettings={settings} />
    </div>
  );
}
