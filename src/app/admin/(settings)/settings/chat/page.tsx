import { getSettings } from '@/actions/settings';
import ChatForm from '@/components/admin/settings/ChatForm';

export const metadata = {
  title: 'Customer chat Settings | Gaming BM Admin',
};

export default async function ChatSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-4xl">
      <ChatForm initialSettings={settings} />
    </div>
  );
}
