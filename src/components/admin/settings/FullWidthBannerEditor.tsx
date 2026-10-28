'use client';

import { useState } from 'react';
import { renderContentInput, renderDesignTextControls } from './SharedUI';
import Image from "next/image";

interface FullWidthBannerEditorProps {
  section: any;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  updateSectionSettings: (id: string, key: string, value: any) => void;
  handleUpload: (id: string, key: string) => void;
  goBack: () => void;
}

export default function FullWidthBannerEditor({ 
  section, 
  previewMode,
  updateSectionSettings, 
  handleUpload,
  goBack 
}: FullWidthBannerEditorProps) {
  const [openSection, setOpenSection] = useState<'content' | 'design' | ''>('content');

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
      {/* HEADER */}
      <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={goBack} 
            className="text-gray-500 hover:text-gray-800 transition p-1.5 hover:bg-gray-200 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">Edit Banner</h3>
            <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
              Full Width Banner
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-5">
        {/* CONTENT ACCORDION */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setOpenSection(openSection === 'content' ? '' : 'content')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="font-semibold text-sm text-gray-800">Content Settings</span>
            <svg className={`w-5 h-5 text-gray-500 transition-transform ${openSection === 'content' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openSection === 'content' && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                💡 <strong>Personnalisation HTML :</strong> Vous pouvez insérer du HTML avec du style pour colorer des mots spécifiques, ex :
                <br />
                <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] mt-1 inline-block select-all">
                  &lt;span style="color: #e01b1b"&gt;Texte coloré&lt;/span&gt;
                </code>
              </div>

              {renderContentInput(section, updateSectionSettings, 'Title (HTML/couleurs acceptés)', 'BANNER_TITLE', 'Featured Product<br />Apple Accessories 2018')}
              {renderContentInput(section, updateSectionSettings, 'Subtitle (HTML/couleurs acceptés)', 'BANNER_SUBTITLE', 'Sale Offer <span style="color: #e01b1b; font-weight: bold;">-20% Off</span> This Week')}
              {renderContentInput(section, updateSectionSettings, 'Price Label', 'BANNER_PRICE_LABEL', 'Starting at')}
              {renderContentInput(section, updateSectionSettings, 'Price (HTML/couleurs acceptés)', 'BANNER_PRICE', '$1209.00')}
              {renderContentInput(section, updateSectionSettings, 'Button Text', 'BANNER_CTA', 'SHOPPING NOW')}
              {renderContentInput(section, updateSectionSettings, 'Button Link (URL)', 'BANNER_LINK', '/shop')}

              <div className="border-t border-gray-200 pt-4 mt-4">
                <label className="block text-sm font-bold mb-2 text-gray-800">Media</label>
                
                {/* Main Product/Artwork Image */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-red-600">Main Banner Image</label>
                  <button type="button" onClick={() => handleUpload(section.id, 'BANNER_IMAGE')} className="bg-blue-50 text-blue-700 px-3 py-2 rounded border border-blue-200 hover:bg-blue-100 text-xs font-semibold block text-center mt-1 transition w-full">
                    Choose main image
                  </button>
                  {section.settings['BANNER_IMAGE'] && (
                    <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 border rounded">
                      <Image width={800} height={400} src={section.settings['BANNER_IMAGE']} className="h-12 object-contain" alt="" />
                      <button onClick={() => updateSectionSettings(section.id, 'BANNER_IMAGE', '')} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
                    </div>
                  )}
                </div>

                {/* Background Image */}
                <div className="mt-4">
                  <label className="block text-xs font-semibold mb-1 text-gray-700">Background Image (Optional)</label>
                  <button type="button" onClick={() => handleUpload(section.id, 'BANNER_BG_IMAGE')} className="bg-blue-50 text-blue-700 px-3 py-2 rounded border border-blue-200 hover:bg-blue-100 text-xs font-semibold block text-center mt-1 transition w-full">
                    Choose background image
                  </button>
                  {section.settings['BANNER_BG_IMAGE'] && (
                    <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 border rounded">
                      <Image width={800} height={400} src={section.settings['BANNER_BG_IMAGE']} className="h-12 object-cover" alt="" />
                      <button onClick={() => updateSectionSettings(section.id, 'BANNER_BG_IMAGE', '')} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DESIGN ACCORDION */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setOpenSection(openSection === 'design' ? '' : 'design')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="font-semibold text-sm text-gray-800">Design Settings ({previewMode})</span>
            <svg className={`w-5 h-5 text-gray-500 transition-transform ${openSection === 'design' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openSection === 'design' && (
            <div className="p-4 border-t border-gray-200 space-y-5">
              {/* Background Color & Overlay */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600">Background Color</label>
                  <div className="relative w-full h-9 rounded-md overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
                    <input 
                      type="color" 
                      value={section.settings['BANNER_BG_COLOR'] || '#f8f9fa'} 
                      onChange={e => updateSectionSettings(section.id, 'BANNER_BG_COLOR', e.target.value)} 
                      className="absolute -top-2 -left-2 w-24 h-24 cursor-pointer border-0 p-0" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600">Dark Overlay (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={section.settings['BANNER_BG_OVERLAY'] || '0'} 
                    onChange={e => updateSectionSettings(section.id, 'BANNER_BG_OVERLAY', e.target.value)} 
                    className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Title Typography & Color */}
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Titre Principal</h4>
                {renderDesignTextControls(section, updateSectionSettings, previewMode, 'Typographie Titre', 'BANNER_TITLE', 'BANNER_TITLE_COLOR', '#111827')}
              </div>

              {/* Subtitle Typography & Color */}
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Sous-Titre</h4>
                {renderDesignTextControls(section, updateSectionSettings, previewMode, 'Typographie Sous-titre', 'BANNER_SUBTITLE', 'BANNER_SUBTITLE_COLOR', '#4b5563')}
              </div>

              {/* Price Typography & Color */}
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Prix</h4>
                {renderDesignTextControls(section, updateSectionSettings, previewMode, 'Typographie Prix', 'BANNER_PRICE', 'BANNER_PRICE_COLOR', '#e01b1b')}

                <div className="mt-3">
                  <label className="block text-xs font-medium mb-1 text-gray-600">Couleur libellé prix ("Starting at")</label>
                  <div className="relative w-24 h-8 rounded overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
                    <input 
                      type="color" 
                      value={section.settings['BANNER_PRICE_LABEL_COLOR'] || '#374151'} 
                      onChange={e => updateSectionSettings(section.id, 'BANNER_PRICE_LABEL_COLOR', e.target.value)} 
                      className="absolute -top-2 -left-2 w-28 h-28 cursor-pointer border-0 p-0" 
                    />
                  </div>
                </div>
              </div>

              {/* Button Styling */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Bouton CTA</h4>
                {renderDesignTextControls(section, updateSectionSettings, previewMode, 'Typographie & Couleur Texte', 'BANNER_CTA', 'BANNER_BTN_TEXT_COLOR', '#111827')}
                
                <div className="mt-3">
                  <label className="block text-xs font-medium mb-1 text-gray-600">Couleur de fond du bouton</label>
                  <div className="relative w-24 h-8 rounded overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
                    <input 
                      type="color" 
                      value={section.settings['BANNER_BTN_BG_COLOR'] || '#fed700'} 
                      onChange={e => updateSectionSettings(section.id, 'BANNER_BTN_BG_COLOR', e.target.value)} 
                      className="absolute -top-2 -left-2 w-28 h-28 cursor-pointer border-0 p-0" 
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

