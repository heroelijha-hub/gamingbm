import { getSettings } from '@/actions/settings';
import SmtpForm from '@/components/admin/settings/SmtpForm';

export const metadata = {
  title: 'Email server (SMTP) Settings | Top Kaminbrennstoffe Admin',
};

export default async function SmtpSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <SmtpForm initialSettings={settings} />
    </div>
  );
}
