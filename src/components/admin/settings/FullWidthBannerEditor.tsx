'use client';

import { useState } from 'react';
import { renderContentInput } from './SharedUI';
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
              {renderContentInput(section, updateSectionSettings, 'Title (HTML accepted: <br />)', 'BANNER_TITLE', 'Featured Product<br />Apple Accessories 2018')}
              {renderContentInput(section, updateSectionSettings, 'Subtitle (HTML accepted)', 'BANNER_SUBTITLE', 'Sale Offer <span class="text-[#e01b1b] font-bold">-20% Off</span> This Week')}
              {renderContentInput(section, updateSectionSettings, 'Price Label', 'BANNER_PRICE_LABEL', 'Starting at')}
              {renderContentInput(section, updateSectionSettings, 'Price', 'BANNER_PRICE', '$1209.00')}
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
            <span className="font-semibold text-sm text-gray-800">Design Settings</span>
            <svg className={`w-5 h-5 text-gray-500 transition-transform ${openSection === 'design' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openSection === 'design' && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">Background Color</label>
                <div className="relative w-full h-10 rounded-md overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
                  <input 
                    type="color" 
                    value={section.settings['BANNER_BG_COLOR'] || '#f8f9fa'} 
                    onChange={e => updateSectionSettings(section.id, 'BANNER_BG_COLOR', e.target.value)} 
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0" 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

