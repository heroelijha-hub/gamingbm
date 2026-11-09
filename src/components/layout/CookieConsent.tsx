'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

type ConsentPreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

export default function CookieConsent() {
  const t = useTranslations('CookieConsent');
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [view, setView] = useState<'banner' | 'customize'>('banner');
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem('cookie_consent');
    const savedPrefs = localStorage.getItem('cookie_preferences');

    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPreferences({
          necessary: true,
          analytics: !!parsed.analytics,
          marketing: !!parsed.marketing,
        });
      } catch (e) {
        // Fallback default
      }
    }

    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookie_consent', 'true');
    localStorage.setItem('cookie_preferences', JSON.stringify(allAccepted));
    setShowBanner(false);
    setView('banner');
    window.dispatchEvent(new Event('cookie_consent_accepted'));
  };

  const handleDeclineAll = () => {
    const allDeclined: ConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(allDeclined);
    localStorage.setItem('cookie_consent', 'false');
    localStorage.setItem('cookie_preferences', JSON.stringify(allDeclined));
    setShowBanner(false);
    setView('banner');
  };

  const handleSavePreferences = () => {
    const isConsentGiven = preferences.analytics;
    localStorage.setItem('cookie_consent', isConsentGiven ? 'true' : 'false');
    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
    setShowBanner(false);
    setView('banner');

    if (isConsentGiven) {
      window.dispatchEvent(new Event('cookie_consent_accepted'));
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Floating button to re-open cookie preferences anytime (GDPR compliant) */}
      {!showBanner && (
        <button
          type="button"
          onClick={() => {
            setView('customize');
            setShowBanner(true);
          }}
          className="fixed bottom-4 left-4 z-40 bg-white/90 hover:bg-white text-gray-700 hover:text-orange-600 border border-gray-200/90 rounded-full p-2.5 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 group backdrop-blur-sm"
          title={t('cookie_settings')}
          aria-label={t('cookie_settings')}
        >
          <span className="text-base select-none">🍪</span>
          <span className="hidden sm:inline-block max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold text-gray-700 group-hover:text-orange-600 pr-0 group-hover:pr-1">
            {t('cookie_settings')}
          </span>
        </button>
      )}

      {/* Main Cookie Consent Card / Modal */}
      {showBanner && (
        <div 
          className="fixed bottom-4 left-4 z-50 max-w-md w-[calc(100%-2rem)] sm:w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/80 p-5 md:p-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('title')}
        >
          {view === 'banner' ? (
            /* ── VIEW 1: Standard Consent Banner ── */
            <div>
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xl shrink-0">
                  🍪
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                    {t('title')}
                  </h3>
                  <p className="text-xs text-orange-600 font-semibold mt-0.5">
                    {t('subtitle')}
                  </p>
                </div>
              </div>

              {/* Message */}
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed mb-4">
                {t('message')}
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeclineAll}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs md:text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    {t('decline')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="flex-1 py-2.5 px-3 rounded-xl text-white text-xs md:text-sm font-semibold shadow-sm hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: 'var(--theme-color, #c2410c)' }}
                  >
                    {t('accept')}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setView('customize')}
                  className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors flex items-center justify-center gap-1.5 hover:underline"
                >
                  <span>⚙️</span>
                  <span>{t('customize')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ── VIEW 2: Granular Preferences ── */
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setView('banner')}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    title={t('back')}
                    aria-label={t('back')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-sm font-bold text-gray-900">{t('cookie_settings')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBanner(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 text-sm rounded-lg hover:bg-gray-100"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>

              {/* Preferences list */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {/* 1. Necessary */}
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      🔒 {t('necessary_title')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                      {t('necessary_badge')}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {t('necessary_desc')}
                  </p>
                </div>

                {/* 2. Analytics */}
                <div className="p-3 rounded-xl bg-white border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      📊 {t('analytics_title')}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {t('analytics_desc')}
                  </p>
                </div>

                {/* 3. Marketing */}
                <div className="p-3 rounded-xl bg-white border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      🎯 {t('marketing_title')}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {t('marketing_desc')}
                  </p>
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 py-2 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors"
                >
                  {t('accept')}
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="flex-1 py-2 px-3 rounded-xl text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity"
                  style={{ backgroundColor: 'var(--theme-color, #c2410c)' }}
                >
                  {t('save_preferences')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
