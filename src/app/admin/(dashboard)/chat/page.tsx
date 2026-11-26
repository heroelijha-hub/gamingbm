import { getTranslations } from 'next-intl/server';
import { getAdminSessions } from '@/actions/chat';
import AdminChatClient from './AdminChatClient';

export default async function AdminChatPage() {
  const t = await getTranslations('AdminChat');
  const initialSessions = await getAdminSessions();

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[500px]">
      <div className="mb-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-xs text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AdminChatClient initialSessions={initialSessions} />
      </div>
    </div>
  );
}
