'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettingsBatch } from '@/actions/settings';
import { testSmtpConnection } from '@/actions/admin';

export default function SmtpForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const tSettings = useTranslations('AdminSettings');
  const router = useRouter();
  
  const [smtpHost, setSmtpHost] = useState(initialSettings.SMTP_HOST || '');
  const [smtpPort, setSmtpPort] = useState(initialSettings.SMTP_PORT || '');
  const [smtpUser, setSmtpUser] = useState(initialSettings.SMTP_USER || '');
  const [smtpPass, setSmtpPass] = useState(initialSettings.SMTP_PASS || '');
  const [smtpFrom, setSmtpFrom] = useState(initialSettings.SMTP_FROM || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestEmail = async () => {
    if (!testEmail) {
      setTestResult({ success: false, message: 'Veuillez saisir une adresse email de test.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    // Save first to ensure latest credentials are used
    await updateSettingsBatch({
      SMTP_HOST: smtpHost,
      SMTP_PORT: smtpPort,
      SMTP_USER: smtpUser,
      SMTP_PASS: smtpPass,
      SMTP_FROM: smtpFrom
    });

    const res = await testSmtpConnection(testEmail);
    if (res.success) {
      setTestResult({ success: true, message: `Email de test envoyé avec succès à ${testEmail} !` });
    } else {
      setTestResult({ success: false, message: res.error || 'Erreur lors de l\'envoi du test.' });
    }
    setIsTesting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await updateSettingsBatch({
      SMTP_HOST: smtpHost,
      SMTP_PORT: smtpPort,
      SMTP_USER: smtpUser,
      SMTP_PASS: smtpPass,
      SMTP_FROM: smtpFrom
    });

    setMessage(tSettings('update_success'));
    setIsLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{tSettings('nav_smtp') || 'Email server (SMTP)'}</h2>
        <p className="text-gray-500 mt-1">{tSettings('smtp_desc')}</p>
      </div>
      {message && <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('smtp_host')}</label>
          <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" placeholder="smtp.gmail.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('smtp_port')}</label>
          <input type="text" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" placeholder="587" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('smtp_username')}</label>
          <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('smtp_password')}</label>
          <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" placeholder="••••••••" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('smtp_sender_email')}</label>
          <input type="text" value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <button type="submit" disabled={isLoading} className="px-5 py-2.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 text-sm font-semibold transition-colors">
          {isLoading ? tSettings('saving') : (tSettings('save_changes') || 'Save changes')}
        </button>
      </div>

      {/* Test Email Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Tester la configuration SMTP</h3>
        <p className="text-sm text-gray-500 mb-4">
          Envoyez un email de test pour vérifier la connexion avec votre serveur de messagerie et diagnostiquer immédiatement toute erreur.
        </p>

        {testResult && (
          <div className={`p-4 rounded-md mb-4 text-sm font-medium ${testResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {testResult.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="votre-email@exemple.com"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={isTesting || !testEmail}
            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isTesting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            )}
            <span>{isTesting ? 'Envoi en cours...' : 'Envoyer un email de test'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}