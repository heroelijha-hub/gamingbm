'use client';
import { useState } from 'react';
import { renderContentInput, renderDesignTextControls } from './SharedUI';
import Image from "next/image";

interface PromoBannersEditorProps {
  section: any;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  updateSectionSettings: (id: string, key: string, value: any) => void;
  handleUpload: (id: string, key: string) => void;
  goBack: () => void;
}

export default function PromoBannersEditor({ 
  section, 
  previewMode, 
  updateSectionSettings, 
  handleUpload,
  goBack 
}: PromoBannersEditorProps) {
  
  const [activeBlock, setActiveBlock] = useState<number>(0); // 0 = general list, 1 = block 1, 2 = block 2
  const [openSection, setOpenSection] = useState<'content' | 'design' | ''>('content');

  const getPrefix = (blockNum: number) => `BANNER_${blockNum}`;

  const renderBlockConfig = (blockNum: number) => {
    const prefix = getPrefix(blockNum);
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
        {/* HEADER */}
        <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => setActiveBlock(0)} 
              className="text-gray-500 hover:text-gray-800 transition p-1.5 hover:bg-gray-200 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">Block {blockNum}</h3>
              <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                Promo Banners
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {/* CONTENT */}
          {/* CONTENT ACCORDION */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mb-6">
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
            <div className="space-y-4">
              {renderContentInput(section, updateSectionSettings, 'Title', `${prefix}_TITLE`, 'Ex: Smartwatch')}
              {renderContentInput(section, updateSectionSettings, 'Target Link (URL)', `${prefix}_LINK`, '/category/...')}
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <label className="block text-sm font-bold mb-2 text-gray-800">Media</label>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-red-600">Main Image</label>
                  <button type="button" onClick={() => handleUpload(section.id, `${prefix}_IMAGE`)} className="bg-blue-50 text-blue-700 px-3 py-2 rounded border border-blue-200 hover:bg-blue-100 text-xs font-semibold block text-center mt-1 transition w-full">
                    Choose an image
                  </button>
                  {section.settings[`${prefix}_IMAGE`] && (
                    <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 border rounded">
                      <Image width={800} height={800} src={section.settings[`${prefix}_IMAGE`]} className="h-10 object-contain" />
                      <button onClick={() => updateSectionSettings(section.id, `${prefix}_IMAGE`, '')} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <label className="block text-xs font-semibold mb-1 text-red-600">Background Image (Optional)</label>
                  <button type="button" onClick={() => handleUpload(section.id, `${prefix}_BG_IMAGE`)} className="bg-blue-50 text-blue-700 px-3 py-2 rounded border border-blue-200 hover:bg-blue-100 text-xs font-semibold block text-center mt-1 transition w-full">
                    Choose an image
                  </button>
                  {section.settings[`${prefix}_BG_IMAGE`] && (
                    <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 border rounded">
                      <Image width={800} height={800} src={section.settings[`${prefix}_BG_IMAGE`]} className="h-10 object-cover" />
                      <button onClick={() => updateSectionSettings(section.id, `${prefix}_BG_IMAGE`, '')} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
              </div>
            )}
          </div>

          {/* DESIGN ACCORDION */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-6">
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
              <div className="p-4 border-t border-gray-200">
            <div>
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Typography & Colors</h4>
                {renderDesignTextControls(section, updateSectionSettings, previewMode, 'Title Text', `${prefix}_TITLE`, `${prefix}_TEXT_COLOR`, '#111827')}
              </div>
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Background</h4>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600">Block Background Color</label>
                  <div className="relative w-full h-10 rounded-md overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
                    <input type="color" value={section.settings[`${prefix}_BG_COLOR`] || (blockNum === 1 ? '#ffedd5' : '#f3f4f6')} onChange={e => updateSectionSettings(section.id, `${prefix}_BG_COLOR`, e.target.value)} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0" />
                  </div>
                </div>
              </div>
            </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // GENERAL LIST VIEW
  if (activeBlock === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
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
              <h3 className="font-bold text-gray-900 leading-tight">Edit Section</h3>
              <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                Promo Banners
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Promo Blocks</h4>
          <div className="space-y-3">
            {[1, 2].map((num) => (
              <div key={num} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:border-orange-300 hover:shadow-sm transition cursor-pointer" onClick={() => setActiveBlock(num)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {num}
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-800 text-sm">Block {num}</h5>
                    <p className="text-xs text-gray-500">{section.settings[`BANNER_${num}_TITLE`] || (num === 1 ? 'Left Banner' : 'Right Banner')}</p>
                  </div>
                </div>
                <button type="button" className="text-orange-600 hover:bg-orange-50 p-2 rounded-full transition">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return renderBlockConfig(activeBlock);
}
