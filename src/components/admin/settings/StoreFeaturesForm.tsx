'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettingsBatch } from '@/actions/settings';

export default function StoreFeaturesForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const tSettings = useTranslations('AdminSettings');
  const router = useRouter();
  
  const [enableBuyNow, setEnableBuyNow] = useState(initialSettings.ENABLE_BUY_NOW_BUTTON === 'true');
  const [contactReceiverEmail, setContactReceiverEmail] = useState(initialSettings.CONTACT_RECEIVER_EMAIL || 'info@gamingbm.com');
  const [newsletterSuccessMessage, setNewsletterSuccessMessage] = useState(initialSettings.NEWSLETTER_SUCCESS_MESSAGE || 'Thank you for subscribing to our newsletter!');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    await updateSettingsBatch({
      ENABLE_BUY_NOW_BUTTON: enableBuyNow.toString(),
      CONTACT_RECEIVER_EMAIL: contactReceiverEmail,
      NEWSLETTER_SUCCESS_MESSAGE: newsletterSuccessMessage
    });

    setMessage(tSettings('update_success'));
    setIsLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{tSettings('nav_features') || 'Store features'}</h2>
        <p className="text-gray-500 mt-1">{tSettings('settings_category_only') || 'Settings for this category only.'}</p>
      </div>

      {message && <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200">{message}</div>}

      <div className="grid grid-cols-1 gap-6 border-t border-gray-100 pt-6">
        <div className="flex items-center gap-3">
          <button type="button" role="switch" aria-checked={enableBuyNow} onClick={() => setEnableBuyNow(!enableBuyNow)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${enableBuyNow ? "bg-blue-600" : "bg-gray-200"}`}>  <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enableBuyNow ? "translate-x-5" : "translate-x-0"}`} /></button><span className="text-sm font-medium text-gray-700 cursor-pointer" onClick={() => setEnableBuyNow(!enableBuyNow)}>{tSettings('enable_buy_now')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('receiving_email')}</label>
            <input type="email" value={contactReceiverEmail} onChange={(e) => setContactReceiverEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
            <p className="mt-2 text-xs text-gray-500">{tSettings('receiving_email_desc')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('newsletter_success_msg')}</label>
            <textarea value={newsletterSuccessMessage} onChange={(e) => setNewsletterSuccessMessage(e.target.value)} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
            <p className="mt-2 text-xs text-gray-500">{tSettings('newsletter_success_desc')}</p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 text-sm font-semibold transition-colors">
          {isLoading ? tSettings('saving') : (tSettings('save_changes') || 'Save changes')}
        </button>
      </div>
    </form>
  );
}