'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettingsBatch } from '@/actions/settings';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import Image from "next/image";

export default function DesignHeaderForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const tSettings = useTranslations('AdminSettings');
  const router = useRouter();
  
  const [shopCardStyle, setShopCardStyle] = useState(initialSettings.SHOP_CARD_STYLE || 'design2');
  const [shopCardBorderColor, setShopCardBorderColor] = useState(initialSettings.SHOP_CARD_BORDER_COLOR || '#e5e7eb');
  const [themeColor, setThemeColor] = useState(initialSettings.THEME_COLOR || '#c2410c');
  const [headerAnnouncement, setHeaderAnnouncement] = useState(initialSettings.HEADER_ANNOUNCEMENT || 'Welcome to our store!');
  const [searchPlaceholder, setSearchPlaceholder] = useState(initialSettings.SEARCH_PLACEHOLDER || 'Search products...');
  const [headerSupportPhone, setHeaderSupportPhone] = useState(initialSettings.HEADER_SUPPORT_PHONE ?? '+08 9229 8228');
  const [headerSupportEmail, setHeaderSupportEmail] = useState(initialSettings.HEADER_SUPPORT_EMAIL ?? 'support@mystore.com');
  const [topBarBgColor, setTopBarBgColor] = useState(initialSettings.TOP_BAR_BG_COLOR || '#ffffff');
  const [topBarTextColor, setTopBarTextColor] = useState(initialSettings.TOP_BAR_TEXT_COLOR || '#4b5563');
  const [showStoreLocator, setShowStoreLocator] = useState(initialSettings.SHOW_STORE_LOCATOR !== 'false');
  
  const [headerLogoImage, setHeaderLogoImage] = useState(initialSettings.HEADER_LOGO_IMAGE || '');
  const [faviconImage, setFaviconImage] = useState(initialSettings.FAVICON_IMAGE || '');
  
  const [showHeaderLogoModal, setShowHeaderLogoModal] = useState(false);
  const [showFaviconModal, setShowFaviconModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await updateSettingsBatch({
      SHOP_CARD_STYLE: shopCardStyle,
      SHOP_CARD_BORDER_COLOR: shopCardBorderColor,
      THEME_COLOR: themeColor,
      HEADER_ANNOUNCEMENT: headerAnnouncement,
      SEARCH_PLACEHOLDER: searchPlaceholder,
      HEADER_SUPPORT_PHONE: headerSupportPhone,
      HEADER_SUPPORT_EMAIL: headerSupportEmail,
      TOP_BAR_BG_COLOR: topBarBgColor,
      TOP_BAR_TEXT_COLOR: topBarTextColor,
      SHOW_STORE_LOCATOR: showStoreLocator.toString(),
      HEADER_LOGO_IMAGE: headerLogoImage,
      FAVICON_IMAGE: faviconImage
    });

    setMessage(tSettings('update_success'));
    setIsLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Header & Product Cards Design</h2>
      </div>
      {message && <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200">{message}</div>}

      <div className="space-y-6 pt-4 border-t border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
          <div className="relative w-10 h-10">  <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />  <div className="w-10 h-10 rounded-xl shadow-sm border border-gray-200" style={{ backgroundColor: themeColor }} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('header_logo_label') || 'Header Logo'}</label>
            <div className="flex items-center gap-4">
              {headerLogoImage && (
                <div className="w-32 p-2 bg-gray-100 rounded border">
                  <Image width={800} height={800} src={headerLogoImage} alt="Header logo" className="max-h-12 object-contain" />
                </div>
              )}
              <button type="button" onClick={() => setShowHeaderLogoModal(true)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                {headerLogoImage ? (tSettings('change_logo') || 'Change Logo') : (tSettings('select_logo') || 'Select Logo')}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('favicon_label') || 'Favicon'}</label>
            <div className="flex items-center gap-4">
              {faviconImage && (
                <div className="w-12 h-12 p-1 bg-gray-100 rounded border flex items-center justify-center">
                  <Image width={800} height={800} src={faviconImage} alt="Favicon" className="max-h-8 max-w-8 object-contain" />
                </div>
              )}
              <button type="button" onClick={() => setShowFaviconModal(true)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                {faviconImage ? (tSettings('change_favicon') || 'Change Favicon') : (tSettings('select_favicon') || 'Select Favicon')}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('header_announcement') || 'Header Announcement'}</label>
          <input type="text" value={headerAnnouncement} onChange={(e) => setHeaderAnnouncement(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('search_placeholder_label') || 'Search Placeholder'}</label>
          <input type="text" value={searchPlaceholder} onChange={(e) => setSearchPlaceholder(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('support_phone') || 'Support Phone'}</label>
            <input type="text" value={headerSupportPhone} onChange={(e) => setHeaderSupportPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('support_email') || 'Support Email'}</label>
            <input type="email" value={headerSupportEmail} onChange={(e) => setHeaderSupportEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 text-sm font-semibold transition-colors">
          {isLoading ? tSettings('saving') : (tSettings('save_changes') || 'Save changes')}
        </button>
      </div>

      {showHeaderLogoModal && (
        <MediaPickerModal 
          onClose={() => setShowHeaderLogoModal(false)}
          onSelect={(url) => {
            setHeaderLogoImage(url);
            setShowHeaderLogoModal(false);
          }}
        />
      )}

      {showFaviconModal && (
        <MediaPickerModal 
          onClose={() => setShowFaviconModal(false)}
          onSelect={(url) => {
            setFaviconImage(url);
            setShowFaviconModal(false);
          }}
        />
      )}
    </form>
  );
}