'use client';
import { useState } from 'react';
import { renderContentInput, renderDesignTextControls } from './SharedUI';
import Image from "next/image";

interface ProductGridEditorProps {
  section: any;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  updateSectionSettings: (id: string, key: string, value: any) => void;
  categories: any[];
  allProducts: any[];
  handleUpload: (id: string, key: string) => void;
  goBack: () => void;
}

export default function ProductGridEditor({ 
  section, 
  previewMode, 
  updateSectionSettings, 
  categories, 
  allProducts,
  handleUpload,
  goBack 
}: ProductGridEditorProps) {
  
  const [openSection, setOpenSection] = useState<'content' | 'design' | ''>('content');
  const [productSearch, setProductSearch] = useState('');

  const renderManualProductSelection = () => {
    if (section.settings.filterType !== 'MANUAL') return null;
    return (
      <div className="mt-4 border-t pt-4">
        <label className="block text-sm font-medium mb-2 text-gray-800">Select Specific Products</label>
        
        <input 
          type="text" 
          placeholder="Search products by title..." 
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500 mb-2"
        />
        
        {productSearch && (
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-sm mb-4">
            {allProducts
              .filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase()))
              .slice(0, 10)
              .map(p => (
                <div 
                  key={p.id} 
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-orange-50 border-b last:border-b-0 flex items-center gap-3"
                  onClick={() => {
                    const currentIds = section.settings.productIds || [];
                    if (!currentIds.includes(p.id)) {
                      updateSectionSettings(section.id, 'productIds', [...currentIds, p.id]);
                    }
                    setProductSearch('');
                  }}
                >
                  {p.images && p.images[0] && (
                     <Image width={800} height={800} src={p.images[0]} alt="" className="w-8 h-8 object-cover rounded" />
                  )}
                  <span className="font-medium truncate">{p.title}</span>
                </div>
            ))}
            {allProducts.filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No products found.</div>
            )}
          </div>
        )}
        
        {/* Selected Products List */}
        <div className="flex flex-col gap-2 mt-2">
           <label className="block text-xs font-medium text-gray-500">Selected Products:</label>
          {(section.settings.productIds || []).map((id: string) => {
            const prod = allProducts.find(p => p.id === id);
            if (!prod) return null;
            return (
              <div key={id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-2 shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  {prod.images && prod.images[0] && (
                    <Image width={800} height={800} src={prod.images[0]} alt="" className="w-8 h-8 object-cover rounded flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate">{prod.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newIds = section.settings.productIds.filter((pid: string) => pid !== id);
                    updateSectionSettings(section.id, 'productIds', newIds);
                  }}
                  className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
            <h3 className="font-bold text-gray-900 leading-tight">Edit Section</h3>
            <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
              {section.type}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        
        {/* GENERAL SETTINGS */}
        <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">General Settings</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Total number of products</label>
              <input 
                type="number" 
                min="1" max="50"
                value={section.settings.maxProducts || '12'} 
                onChange={e => updateSectionSettings(section.id, 'maxProducts', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500 outline-none mb-4"
              />
            </div>

            {/* Toggle Masquer sur mobile */}
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">Masquer sur mobile</p>
                <p className="text-xs text-gray-500 mt-0.5">Cette section ne s'affichera pas sur les écrans mobiles</p>
              </div>
              <button
                type="button"
                onClick={() => updateSectionSettings(section.id, 'hideMobile', !section.settings.hideMobile)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${section.settings.hideMobile ? 'bg-orange-500' : 'bg-gray-200'}`}
                role="switch"
                aria-checked={!!section.settings.hideMobile}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${section.settings.hideMobile ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {section.type === 'ProductGrid' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Design Variant</label>
                  <select value={section.settings.variant || '1'} onChange={e => updateSectionSettings(section.id, 'variant', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500 outline-none">
                    <option value="1">Variant 1 (Button at bottom of card)</option>
                    <option value="2">Variant 2 (Button on image on hover)</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700 text-center">Cols (Desktop)</label>
                    <select value={section.settings.colsDesktop || '5'} onChange={e => updateSectionSettings(section.id, 'colsDesktop', e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-orange-500 outline-none">
                      <option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700 text-center">Cols (Tablet)</label>
                    <select value={section.settings.colsTablet || '3'} onChange={e => updateSectionSettings(section.id, 'colsTablet', e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-orange-500 outline-none">
                      <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-700 text-center">Cols (Mobile)</label>
                    <select value={section.settings.colsMobile || '1'} onChange={e => updateSectionSettings(section.id, 'colsMobile', e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-orange-500 outline-none">
                      <option value="1">1</option><option value="2">2</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Product category</label>
              <select value={section.settings.categoryId || ''} onChange={e => updateSectionSettings(section.id, 'categoryId', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500 outline-none">
                <option value="">All categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Filter (Sort)</label>
              <select value={section.settings.filterType || (section.type === 'BestDeals' ? 'ON_SALE' : 'POPULAR')} onChange={e => updateSectionSettings(section.id, 'filterType', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500 outline-none">
                <option value="POPULAR">Most popular (Best Sellers)</option>
                <option value="LATEST">Most recent</option>
                <option value="ON_SALE">On sale (Reduced price)</option>
                <option value="MANUAL">Manual Selection (by ID)</option>
              </select>
            </div>

            {renderManualProductSelection()}
          </div>
        </div>

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
            {renderContentInput(section, updateSectionSettings, 'Section Title', 'title', 'Enter the title...')}
            {renderContentInput(section, updateSectionSettings, '"See All" Link Text', 'SEE_ALL_TEXT', 'See All')}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Custom "See All" URL</label>
              <input
                type="text"
                value={section.settings.seeAllUrl || ''}
                onChange={e => updateSectionSettings(section.id, 'seeAllUrl', e.target.value)}
                placeholder="ex: /shop (leave empty for auto category link)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 outline-none transition-colors"
              />
            </div>
            {section.type === 'BestDeals' && (
              <div className="mt-6 border-t pt-4">
                <label className="block text-sm font-medium mb-2 text-gray-800">Offer end (Countdown)</label>
                <input 
                  type="datetime-local" 
                  value={section.settings.countdown ? section.settings.countdown.substring(0,16) : ''} 
                  onChange={e => updateSectionSettings(section.id, 'countdown', e.target.value + ':00Z')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4 outline-none focus:border-orange-500"
                />
                
                <h4 className="font-medium text-xs text-gray-700 mb-2">Show countdown timer on:</h4>
                <div className="flex gap-4">
                  <button
                    type="button"
                    title="Mobile"
                    onClick={() => updateSectionSettings(section.id, 'SHOW_TIMER_MOBILE', section.settings.SHOW_TIMER_MOBILE !== 'false' ? 'false' : 'true')}
                    className={`p-1.5 rounded transition flex items-center justify-center border ${section.settings.SHOW_TIMER_MOBILE !== 'false' ? 'text-orange-700 bg-orange-50 border-orange-200' : 'text-gray-500 hover:text-gray-600 bg-gray-50 border-gray-200'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                  </button>
                  <button
                    type="button"
                    title="Tablet"
                    onClick={() => updateSectionSettings(section.id, 'SHOW_TIMER_TABLET', section.settings.SHOW_TIMER_TABLET !== 'false' ? 'false' : 'true')}
                    className={`p-1.5 rounded transition flex items-center justify-center border ${section.settings.SHOW_TIMER_TABLET !== 'false' ? 'text-orange-700 bg-orange-50 border-orange-200' : 'text-gray-500 hover:text-gray-600 bg-gray-50 border-gray-200'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                  </button>
                  <button
                    type="button"
                    title="Desktop"
                    onClick={() => updateSectionSettings(section.id, 'SHOW_TIMER_DESKTOP', section.settings.SHOW_TIMER_DESKTOP !== 'false' ? 'false' : 'true')}
                    className={`p-1.5 rounded transition flex items-center justify-center border ${section.settings.SHOW_TIMER_DESKTOP !== 'false' ? 'text-orange-700 bg-orange-50 border-orange-200' : 'text-gray-500 hover:text-gray-600 bg-gray-50 border-gray-200'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                  </button>
                </div>
              </div>
            )}

            {/* Embedded Promo Banners in BestDeals */}
            {section.type === 'BestDeals' && [1, 2].map(blockNum => (
              <div key={blockNum} className="mt-6 border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-800">Promo Banner {blockNum}</h4>
                  <button
                    type="button"
                    onClick={() => updateSectionSettings(section.id, `SHOW_PROMO_${blockNum}`, section.settings[`SHOW_PROMO_${blockNum}`] !== 'false' ? 'false' : 'true')}
                    className={`flex items-center gap-1.5 text-xs font-medium transition ${section.settings[`SHOW_PROMO_${blockNum}`] !== 'false' ? 'text-gray-800' : 'text-gray-500'}`}
                  >
                    {section.settings[`SHOW_PROMO_${blockNum}`] !== 'false' ? 'Visible' : 'Hidden'}
                  </button>
                </div>
                {section.settings[`SHOW_PROMO_${blockNum}`] !== 'false' && (
                  <div className="space-y-4">
                    {renderContentInput(section, updateSectionSettings, `Title Promo ${blockNum}`, `PROMO_${blockNum}_TITLE`, 'Ex: Smartwatch')}
                    {renderContentInput(section, updateSectionSettings, `Subtitle Promo ${blockNum}`, `PROMO_${blockNum}_SUBTITLE`, 'Price Start $69')}
                    {renderContentInput(section, updateSectionSettings, `Button Promo ${blockNum}`, `PROMO_${blockNum}_CTA`, 'Shop Now')}
                    
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 mt-2">
                      <label className="block text-xs font-semibold mb-1 text-red-600">Main Image</label>
                      <button type="button" onClick={() => handleUpload(section.id, `PROMO_${blockNum}_IMAGE`)} className="bg-white text-blue-700 px-3 py-1.5 rounded border border-blue-200 hover:bg-blue-50 text-xs font-semibold block text-center mt-1 transition w-full">
                        Choose an image
                      </button>
                      {section.settings[`PROMO_${blockNum}_IMAGE`] && (
                        <div className="mt-2 flex items-center justify-between bg-white p-2 border rounded">
                          <Image width={800} height={800} src={section.settings[`PROMO_${blockNum}_IMAGE`]} className="h-8 object-contain" / alt="" >
                          <button onClick={() => updateSectionSettings(section.id, `PROMO_${blockNum}_IMAGE`, '')} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
                        </div>
                      )}

                      <label className="block text-xs font-semibold mb-1 mt-3 text-red-600">Background Image</label>
                      <button type="button" onClick={() => handleUpload(section.id, `PROMO_${blockNum}_BG_IMAGE`)} className="bg-white text-blue-700 px-3 py-1.5 rounded border border-blue-200 hover:bg-blue-50 text-xs font-semibold block text-center mt-1 transition w-full">
                        Choose an image
                      </button>
                      {section.settings[`PROMO_${blockNum}_BG_IMAGE`] && (
                        <div className="mt-2 flex items-center justify-between bg-white p-2 border rounded">
                          <Image width={800} height={800} src={section.settings[`PROMO_${blockNum}_BG_IMAGE`]} className="h-8 object-cover" / alt="" >
                          <button onClick={() => updateSectionSettings(section.id, `PROMO_${blockNum}_BG_IMAGE`, '')} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
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
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">Typography & Colors</h4>
              {renderDesignTextControls(section, updateSectionSettings, previewMode, 'Section Title', 'title', 'titleColor', '#111827')}
              {renderDesignTextControls(section, updateSectionSettings, previewMode, '"See All" Link', 'SEE_ALL_TEXT', 'seeAllColor', '#ea580c')}
            </div>

            {section.type === 'BestDeals' && [1, 2].map(blockNum => (
              <div key={blockNum} className="border-t pt-6 mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Promo Banner {blockNum} Typography</h4>
                {renderDesignTextControls(section, updateSectionSettings, previewMode, 'Title Text', `PROMO_${blockNum}_TITLE`, `PROMO_${blockNum}_TEXT_COLOR`, '#111827')}
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600">Block Background Color</label>
                  <div className="relative w-full h-10 rounded-md overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
                    <input type="color" value={section.settings[`PROMO_${blockNum}_BG_COLOR`] || (blockNum === 1 ? '#ffedd5' : '#f3f4f6')} onChange={e => updateSectionSettings(section.id, `PROMO_${blockNum}_BG_COLOR`, e.target.value)} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0" />
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t pt-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">Product Cards</h4>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600">Border Color (Card)</label>
                  <div className="relative w-full h-10 rounded-md overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
                    <input type="color" value={section.settings[`${section.type.toUpperCase()}_CARD_BORDER_COLOR`] || section.settings.cardBorderColor || '#e5e7eb'} onChange={e => {
                        updateSectionSettings(section.id, `${section.type.toUpperCase()}_CARD_BORDER_COLOR`, e.target.value);
                        if(section.type === 'ProductGrid') updateSectionSettings(section.id, 'cardBorderColor', e.target.value);
                    }} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600">Icons Background</label>
                  <div className="relative w-full h-10 rounded-md overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
                    <input type="color" value={section.settings[`${section.type.toUpperCase()}_BTN_BG_COLOR`] || section.settings.btnBgColor || section.settings.PRODUCT_GRID_BTN_BG_COLOR || '#ea580c'} onChange={e => {
                        updateSectionSettings(section.id, `${section.type.toUpperCase()}_BTN_BG_COLOR`, e.target.value);
                        if(section.type === 'ProductGrid') updateSectionSettings(section.id, 'btnBgColor', e.target.value);
                    }} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600">Icons color</label>
                  <div className="relative w-full h-10 rounded-md overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
                    <input type="color" value={section.settings[`${section.type.toUpperCase()}_BTN_TEXT_COLOR`] || section.settings.btnTextColor || '#ffffff'} onChange={e => {
                        updateSectionSettings(section.id, `${section.type.toUpperCase()}_BTN_TEXT_COLOR`, e.target.value);
                        if(section.type === 'ProductGrid') updateSectionSettings(section.id, 'btnTextColor', e.target.value);
                    }} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600">Icons Hover Background</label>
                  <div className="relative w-full h-10 rounded-md overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
                    <input type="color" value={section.settings[`${section.type.toUpperCase()}_BTN_HOVER_BG_COLOR`] || section.settings.btnHoverBgColor || '#c2410c'} onChange={e => {
                        updateSectionSettings(section.id, `${section.type.toUpperCase()}_BTN_HOVER_BG_COLOR`, e.target.value);
                        if(section.type === 'ProductGrid') updateSectionSettings(section.id, 'btnHoverBgColor', e.target.value);
                    }} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600">Icons Hover color</label>
                  <div className="relative w-full h-10 rounded-md overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
                    <input type="color" value={section.settings[`${section.type.toUpperCase()}_BTN_HOVER_TEXT_COLOR`] || section.settings.btnHoverTextColor || '#ffffff'} onChange={e => {
                        updateSectionSettings(section.id, `${section.type.toUpperCase()}_BTN_HOVER_TEXT_COLOR`, e.target.value);
                        if(section.type === 'ProductGrid') updateSectionSettings(section.id, 'btnHoverTextColor', e.target.value);
                    }} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0" />
                  </div>
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
}
