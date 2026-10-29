'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettingsBatch } from '@/actions/settings';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import Image from "next/image";

export default function FooterForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const tSettings = useTranslations('AdminSettings');
  const router = useRouter();
  
  const [footerBgColor, setFooterBgColor] = useState(initialSettings.FOOTER_BG_COLOR || '#0B162C');
  const [footerTextColor, setFooterTextColor] = useState(initialSettings.FOOTER_TEXT_COLOR || '#d1d5db');
  const [footerHeadingColor, setFooterHeadingColor] = useState(initialSettings.FOOTER_HEADING_COLOR || '#ffffff');
  const [footerDescription, setFooterDescription] = useState(initialSettings.FOOTER_DESCRIPTION || 'Unsere Verpflichtungen...');
  const [footerShowAddress, setFooterShowAddress] = useState(initialSettings.FOOTER_SHOW_ADDRESS !== 'false');
  const [footerShowEmail, setFooterShowEmail] = useState(initialSettings.FOOTER_SHOW_EMAIL !== 'false');
  const [footerShowPhone, setFooterShowPhone] = useState(initialSettings.FOOTER_SHOW_PHONE !== 'false');
  
  const [footerAddress, setFooterAddress] = useState(initialSettings.FOOTER_ADDRESS_1 ?? '2972 Westheimer Rd. Illinois 85486');
  const [footerSupportEmail, setFooterSupportEmail] = useState(initialSettings.FOOTER_SUPPORT_EMAIL ?? initialSettings.HEADER_SUPPORT_EMAIL ?? 'support@mystore.com');
  const [footerSupportPhone, setFooterSupportPhone] = useState(initialSettings.FOOTER_SUPPORT_PHONE ?? initialSettings.HEADER_SUPPORT_PHONE ?? '+08 9229 8228');

  const [footerCopyright, setFooterCopyright] = useState(initialSettings.FOOTER_COPYRIGHT || '© 2026 My Store. All rights reserved.');
  
  const [footerLogoImage, setFooterLogoImage] = useState(initialSettings.FOOTER_LOGO_IMAGE || '');
  const [footerNewsletterTitle, setFooterNewsletterTitle] = useState(initialSettings.FOOTER_NEWSLETTER_TITLE || 'Newsletter');
  const [footerNewsletterText, setFooterNewsletterText] = useState(initialSettings.FOOTER_NEWSLETTER_TEXT || 'Subscribe to our newsletter!');
  const [footerNewsletterPlaceholder, setFooterNewsletterPlaceholder] = useState(initialSettings.FOOTER_NEWSLETTER_PLACEHOLDER || 'Enter your email');
  
  const [showMediaModal, setShowMediaModal] = useState(false);
  
  const [footerColumns, setFooterColumns] = useState<{title: string, links: {label: string, url: string}[]}[]>(() => {
    try {
      return initialSettings.FOOTER_COLUMNS ? JSON.parse(initialSettings.FOOTER_COLUMNS) : [
        { title: 'Contact Us', links: [{ label: 'About Us', url: '/about' }, { label: 'Contact Us', url: '/contact' }] },
        { title: 'Account', links: [{ label: 'Shop', url: '/shop' }, { label: 'Checkout', url: '/checkout' }] }
      ];
    } catch {
      return [];
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await updateSettingsBatch({
      FOOTER_BG_COLOR: footerBgColor,
      FOOTER_TEXT_COLOR: footerTextColor,
      FOOTER_HEADING_COLOR: footerHeadingColor,
      FOOTER_DESCRIPTION: footerDescription,
      FOOTER_SHOW_ADDRESS: footerShowAddress.toString(),
      FOOTER_SHOW_EMAIL: footerShowEmail.toString(),
      FOOTER_SHOW_PHONE: footerShowPhone.toString(),
      FOOTER_ADDRESS_1: footerAddress,
      FOOTER_SUPPORT_EMAIL: footerSupportEmail,
      FOOTER_SUPPORT_PHONE: footerSupportPhone,
      FOOTER_COPYRIGHT: footerCopyright,
      FOOTER_LOGO_IMAGE: footerLogoImage,
      FOOTER_NEWSLETTER_TITLE: footerNewsletterTitle,
      FOOTER_NEWSLETTER_TEXT: footerNewsletterText,
      FOOTER_NEWSLETTER_PLACEHOLDER: footerNewsletterPlaceholder,
      FOOTER_COLUMNS: JSON.stringify(footerColumns)
    });

    setMessage(tSettings('update_success'));
    setIsLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{tSettings('nav_footer') || 'Footer'}</h2>
      </div>
      {message && <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200">{message}</div>}

      <div className="space-y-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('bg_color_label') || 'Background Color'}</label>
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <input type="color" value={footerBgColor} onChange={(e) => setFooterBgColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                <div className="w-10 h-10 rounded-xl shadow-sm border border-gray-200" style={{ backgroundColor: footerBgColor }} />
              </div>
              <span className="text-xs text-gray-500 font-mono uppercase">{footerBgColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('text_color_label') || 'Text Color'}</label>
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <input type="color" value={footerTextColor} onChange={(e) => setFooterTextColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                <div className="w-10 h-10 rounded-xl shadow-sm border border-gray-200" style={{ backgroundColor: footerTextColor }} />
              </div>
              <span className="text-xs text-gray-500 font-mono uppercase">{footerTextColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('heading_color_label') || 'Couleur des titres'}</label>
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <input type="color" value={footerHeadingColor} onChange={(e) => setFooterHeadingColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                <div className="w-10 h-10 rounded-xl shadow-sm border border-gray-200" style={{ backgroundColor: footerHeadingColor }} />
              </div>
              <span className="text-xs text-gray-500 font-mono uppercase">{footerHeadingColor}</span>
            </div>
          </div>
        </div>
        
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{tSettings('col_1_logo_info') || 'Column 1: Logo & Info'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('footer_logo_label') || 'Footer Logo'}</label>
              <div className="flex items-center gap-4">
                {footerLogoImage && (
                  <div className="w-32 p-2 bg-gray-100 rounded border">
                    <Image width={800} height={800} src={footerLogoImage} alt="Footer logo" className="max-h-12 object-contain" />
                  </div>
                )}
                <button type="button" onClick={() => setShowMediaModal(true)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {footerLogoImage ? (tSettings('change_logo') || 'Change Logo') : (tSettings('select_logo') || 'Select Logo')}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('description_label') || 'Description'}</label>
              <textarea value={footerDescription} onChange={(e) => setFooterDescription(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" />
            </div>
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-[140px]">
                  <button type="button" role="switch" aria-checked={footerShowAddress} onClick={() => setFooterShowAddress(!footerShowAddress)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${footerShowAddress ? "bg-blue-600" : "bg-gray-200"}`}>    <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${footerShowAddress ? "translate-x-5" : "translate-x-0"}`} />  </button>
                  <span className="text-sm cursor-pointer" onClick={() => setFooterShowAddress(!footerShowAddress)}>{tSettings('show_address') || 'Show Address'}</span>
                </div>
                {footerShowAddress && (
                  <input type="text" value={footerAddress} onChange={(e) => setFooterAddress(e.target.value)} placeholder="Address" className="flex-1 px-4 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 text-sm" />
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-[140px]">
                  <button type="button" role="switch" aria-checked={footerShowEmail} onClick={() => setFooterShowEmail(!footerShowEmail)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${footerShowEmail ? "bg-blue-600" : "bg-gray-200"}`}>    <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${footerShowEmail ? "translate-x-5" : "translate-x-0"}`} />  </button>
                  <span className="text-sm cursor-pointer" onClick={() => setFooterShowEmail(!footerShowEmail)}>{tSettings('show_email') || 'Show Email'}</span>
                </div>
                {footerShowEmail && (
                  <input type="email" value={footerSupportEmail} onChange={(e) => setFooterSupportEmail(e.target.value)} placeholder="Email" className="flex-1 px-4 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 text-sm" />
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-[140px]">
                  <button type="button" role="switch" aria-checked={footerShowPhone} onClick={() => setFooterShowPhone(!footerShowPhone)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${footerShowPhone ? "bg-blue-600" : "bg-gray-200"}`}>    <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${footerShowPhone ? "translate-x-5" : "translate-x-0"}`} />  </button>
                  <span className="text-sm cursor-pointer" onClick={() => setFooterShowPhone(!footerShowPhone)}>{tSettings('show_phone') || 'Show Phone'}</span>
                </div>
                {footerShowPhone && (
                  <input type="text" value={footerSupportPhone} onChange={(e) => setFooterSupportPhone(e.target.value)} placeholder="Phone" className="flex-1 px-4 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 text-sm" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{tSettings('col_5_newsletter') || 'Column 5: Newsletter'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('newsletter_title_label') || 'Title'}</label>
              <input type="text" value={footerNewsletterTitle} onChange={(e) => setFooterNewsletterTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('newsletter_desc_label') || 'Description / Text'}</label>
              <textarea value={footerNewsletterText} onChange={(e) => setFooterNewsletterText(e.target.value)} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tSettings('newsletter_placeholder_label') || 'Input Placeholder'}</label>
              <input type="text" value={footerNewsletterPlaceholder} onChange={(e) => setFooterNewsletterPlaceholder(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
          <label className="block text-base font-semibold text-gray-900 mb-4">{tSettings('footer_columns_links') || 'Footer Columns & Links'}</label>
          <div className="space-y-6">
            {footerColumns.map((col, colIndex) => (
              <div key={colIndex} className="bg-white p-4 border rounded-md shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <input type="text" placeholder={tSettings('column_title_ex') || "Column Title (e.g. Account)"} value={col.title} onChange={e => {
                    const newCols = [...footerColumns];
                    newCols[colIndex].title = e.target.value;
                    setFooterColumns(newCols);
                  }} className="font-semibold px-3 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 text-sm" />
                  <button type="button" onClick={() => setFooterColumns(footerColumns.filter((_, i) => i !== colIndex))} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md text-sm font-medium">{tSettings('remove_column') || 'Remove Column'}</button>
                </div>
                
                <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                  {col.links.map((link, linkIndex) => (
                    <div key={linkIndex} className="flex items-center gap-2">
                      <input type="text" placeholder={tSettings('label_ex') || "Label"} value={link.label} onChange={e => {
                        const newCols = [...footerColumns];
                        newCols[colIndex].links[linkIndex].label = e.target.value;
                        setFooterColumns(newCols);
                      }} className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 text-sm" />
                      <input type="text" placeholder={tSettings('url_ex') || "URL"} value={link.url} onChange={e => {
                        const newCols = [...footerColumns];
                        newCols[colIndex].links[linkIndex].url = e.target.value;
                        setFooterColumns(newCols);
                      }} className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 text-sm" />
                      <button type="button" onClick={() => {
                        const newCols = [...footerColumns];
                        newCols[colIndex].links = newCols[colIndex].links.filter((_, i) => i !== linkIndex);
                        setFooterColumns(newCols);
                      }} className="text-red-500 hover:text-red-700 p-1" title="Remove Link">
                        X
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    const newCols = [...footerColumns];
                    newCols[colIndex].links.push({label: '', url: ''});
                    setFooterColumns(newCols);
                  }} className="text-xs text-blue-600 font-medium hover:underline mt-2 inline-block">
                    + {tSettings('add_link_to') || 'Add Link to'} {col.title || 'Column'}
                  </button>
                </div>
              </div>
            ))}
            
            <button type="button" onClick={() => setFooterColumns([...footerColumns, {title: '', links: []}])} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {tSettings('add_new_column') || 'Add New Column'}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 text-sm font-semibold transition-colors">
          {isLoading ? tSettings('saving') : (tSettings('save_changes') || 'Save changes')}
        </button>
      </div>
      
      {showMediaModal && (
        <MediaPickerModal 
          onClose={() => setShowMediaModal(false)}
          onSelect={(url) => {
            setFooterLogoImage(url);
            setShowMediaModal(false);
          }}
        />
      )}
    </form>
  );
}