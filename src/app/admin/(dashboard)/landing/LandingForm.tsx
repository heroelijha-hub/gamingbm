'use client';
import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import { updateSetting } from '@/actions/settings';
import { uploadImage, getMinimalProducts } from '@/actions/admin';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import HeroSectionEditor from '@/components/admin/settings/HeroSectionEditor';
import ProductGridEditor from '@/components/admin/settings/ProductGridEditor';
import PromoBannersEditor from '@/components/admin/settings/PromoBannersEditor';
import LatestBlogsEditor from '@/components/admin/settings/LatestBlogsEditor';
import FullWidthBannerEditor from '@/components/admin/settings/FullWidthBannerEditor';
import Cookies from 'js-cookie';

export type SectionType = 'Hero' | 'BestDeals' | 'BestSeller' | 'LatestBlogs' | 'Newsletter' | 'PromoBanners' | 'ProductGrid' | 'FullWidthBanner';

export interface SectionConfig {
  id: string;
  type: SectionType;
  name: string;
  enabled: boolean;
  settings: any;
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'sec_1', type: 'Hero', name: 'Main Header (Hero)', enabled: true, settings: {} },
  { id: 'sec_2', type: 'BestDeals', name: "Today's Best Deals", enabled: true, settings: { title: "Today's Best Deals", countdown: '2026-12-31T23:59:59', filterType: 'ON_SALE', categoryId: '' } },
  { id: 'sec_3', type: 'ProductGrid', name: 'New section (ProductGrid)', enabled: true, settings: { title: "Featured Products", filterType: 'LATEST', categoryId: '' } },
  { id: 'sec_4', type: 'BestSeller', name: 'Best Sellers', enabled: true, settings: { title: "Best Seller", filterType: 'POPULAR', categoryId: '' } },
  { id: 'sec_5', type: 'LatestBlogs', name: 'Latest Blog Articles', enabled: true, settings: { title: "Latest Blogs" } },
  { id: 'sec_6', type: 'Newsletter', name: 'Newsletter Subscription', enabled: true, settings: {} }
];

export default function LandingForm({ initialSettings, categories }: { initialSettings: Record<string, string>, categories: any[] }) {
  const t = useTranslations('AdminLanding');

  const [sections, setSections] = useState<SectionConfig[]>(() => {
    try {
      if (initialSettings.HOMEPAGE_LAYOUT) {
        return JSON.parse(initialSettings.HOMEPAGE_LAYOUT);
      }
      return DEFAULT_SECTIONS;
    } catch {
      return DEFAULT_SECTIONS;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBlockNum, setEditingBlockNum] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [globalFont, setGlobalFont] = useState(initialSettings.GLOBAL_FONT_FAMILY || 'Inter');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [mediaPickerTarget, setMediaPickerTarget] = useState<{sectionId: string, key: string} | null>(null);

  useEffect(() => {
    getMinimalProducts().then(setAllProducts).catch(console.error);
  }, []);

  const iframeRef = useRef<HTMLIFrameElement>(null);


  // Sync to database draft for preview iframe
  useEffect(() => {
    // Debounce iframe reload & save
    const timer = setTimeout(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        fetch('/api/preview-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout: sections, font: globalFont })
        }).then(() => {
          if (iframeRef.current) {
            // Cache bust the iframe
            iframeRef.current.src = `/preview?t=${Date.now()}`;
          }
        }).catch(err => console.error('Failed to update preview cache', err));
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [sections, globalFont]);

  // Listen for messages from iframe (PreviewSectionWrapper)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin if needed, but for now we accept all since it's same-origin usually
      if (event.data && event.data.type === 'EDIT_SECTION') {
        if (event.data.sectionId) {
          setEditingId(event.data.sectionId);
          if (event.data.blockNum !== undefined) {
            setEditingBlockNum(event.data.blockNum);
          } else {
            setEditingBlockNum(0); // 0 = General Settings
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      await updateSetting('HOMEPAGE_LAYOUT', JSON.stringify(sections));
      await updateSetting('GLOBAL_FONT_FAMILY', globalFont);
      setMessage(t('update_success'));
    } catch (e) {
      setMessage(t('update_failed'));
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const moveSection = (index: number, direction: 'UP' | 'DOWN') => {
    const newSections = [...sections];
    if (direction === 'UP' && index > 0) {
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    } else if (direction === 'DOWN' && index < newSections.length - 1) {
      [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
    }
    setSections(newSections);
  };

  const toggleSection = (index: number) => {
    const newSections = [...sections];
    newSections[index].enabled = !newSections[index].enabled;
    setSections(newSections);
  };

  const removeSection = (index: number) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    setSections(newSections);
  };

  const duplicateSection = (index: number) => {
    const original = sections[index];
    const newSec: SectionConfig = {
      ...original,
      id: 'sec_' + Date.now(),
      name: `${original.name || original.type} (Copie)`,
      settings: JSON.parse(JSON.stringify(original.settings)) // Deep copy settings
    };
    const newSections = [...sections];
    newSections.splice(index + 1, 0, newSec);
    setSections(newSections);
  };

  const updateSectionSettings = (id: string, keyOrUpdates: string | Record<string, any>, value?: any) => {
    setSections(prev => prev.map(s => {
      if (s.id === id) {
        if (typeof keyOrUpdates === 'string') {
          return { ...s, settings: { ...s.settings, [keyOrUpdates]: value } };
        } else {
          return { ...s, settings: { ...s.settings, ...keyOrUpdates } };
        }
      }
      return s;
    }));
  };

  const updateSectionName = (id: string, name: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleUpload = (id: string, key: string) => {
    setMediaPickerTarget({ sectionId: id, key });
  };



  const addSection = (type: SectionType) => {
    const newSec: SectionConfig = {
      id: 'sec_' + Date.now(),
      type,
      name: `New section (${type})`,
      enabled: true,
      settings: {}
    };
    if (type === 'BestDeals') {
      newSec.settings = { title: "New Deals", countdown: '2026-12-31T23:59:59', filterType: 'ON_SALE', categoryId: '' };
    } else if (type === 'BestSeller') {
      newSec.settings = { title: "New Selection", filterType: 'POPULAR', categoryId: '' };
    } else if (type === 'ProductGrid') {
      newSec.settings = { 
        title: "Ride-on Mowers", 
        filterType: 'LATEST', 
        categoryId: '',
        variant: '1',
        cardBorderColor: '#ea580c',
        btnBgColor: '#ea580c',
        btnTextColor: '#ffffff',
        maxProducts: '12',
        colsDesktop: '5',
        colsTablet: '3',
        colsMobile: '1'
      };
    }
    setSections([...sections, newSec]);
  };

  const renderConfig = (section: SectionConfig, inPopup: boolean) => {
    if (section.type === 'Newsletter') {
      return (
        <div className="p-4 bg-gray-50 border rounded text-sm text-gray-500">
          The settings for this section are managed elsewhere. You can however move or disable it.
        </div>
      );
    }

    if (section.type === 'ProductGrid' || section.type === 'BestDeals' || section.type === 'BestSeller') {
      return (
        <ProductGridEditor 
          section={section}
          previewMode={previewMode}
          updateSectionSettings={updateSectionSettings}
          categories={categories}
          allProducts={allProducts}
          handleUpload={handleUpload}
          goBack={() => setEditingId(null)}
        />
      );
    }

    if (section.type === 'Hero') {
      return (
        <HeroSectionEditor 
          section={section} 
          previewMode={previewMode} 
          updateSectionSettings={updateSectionSettings} 
          handleUpload={handleUpload} 
          editingBlockNum={editingBlockNum}
        />
      );
    }

    if (section.type === 'LatestBlogs') {
      return (
        <LatestBlogsEditor
          section={section}
          previewMode={previewMode}
          updateSectionSettings={updateSectionSettings}
          goBack={() => setEditingId(null)}
        />
      );
    }

    if (section.type === 'PromoBanners') {
      return (
        <PromoBannersEditor
          section={section}
          previewMode={previewMode}
          updateSectionSettings={updateSectionSettings}
          handleUpload={handleUpload}
          goBack={() => setEditingId(null)}
        />
      );
    }

    if (section.type === 'FullWidthBanner') {
      return (
        <FullWidthBannerEditor
          section={section}
          previewMode={previewMode}
          updateSectionSettings={updateSectionSettings}
          handleUpload={handleUpload}
          goBack={() => setEditingId(null)}
        />
      );
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-gray-100 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-20 shadow-xl overflow-hidden transition-all duration-300">
        {/* Sidebar Header */}
        <div className="bg-slate-800 text-white px-3 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <a href="/admin" className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition" title="Exit editor">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </a>
            <span className="font-semibold text-xs tracking-wide">{t('editor_title')}</span>
          </div>
          <button onClick={handleSave} disabled={isLoading} className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded text-xs font-medium transition disabled:opacity-50 flex items-center gap-1">
            {isLoading && <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            {isLoading ? t('saving') : t('save')}
          </button>
        </div>
        {message && <div className="px-4 py-2 bg-green-50 text-green-600 text-xs text-center border-b border-green-100 font-medium shrink-0">{message}</div>}

        {/* Sidebar Content */}
        <div className="flex-grow overflow-y-auto custom-scrollbar relative">
          {!editingId ? (
            // LIST VIEW
            <div className="p-3">
              {/* Global Settings */}
              <div className="mb-6 bg-white p-3 border rounded shadow-sm">
                <h4 className="font-bold text-xs text-gray-800 mb-2 border-b pb-1">{t('global_settings')}</h4>
                <label className="block text-xs font-medium mb-1">{t('font_family')}</label>
                <select 
                  value={globalFont} 
                  onChange={e => setGlobalFont(e.target.value)} 
                  className="w-full border rounded px-2 py-1 text-sm focus:border-orange-500 outline-none"
                >
                  <option value="Inter">Inter (Default)</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Playfair Display">Playfair Display (Serif)</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lora">Lora</option>
                  <option value="Oswald">Oswald</option>
                  <option value="Raleway">Raleway</option>
                  <option value="Nunito">Nunito</option>
                  <option value="Ubuntu">Ubuntu</option>
                  <option value="Merriweather">Merriweather</option>
                </select>
              </div>

              <p className="text-[11px] leading-tight text-gray-500 mb-4">{t('click_section_preview')}</p>
              
              <div className="space-y-3 mb-6">
                {sections.map((section, index) => (
                  <div key={section.id} className={`flex flex-col border rounded p-2 transition ${!section.enabled ? 'bg-gray-50 opacity-60' : 'bg-white hover:border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setEditingId(section.id)}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${section.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-sm font-medium group-hover:text-orange-700 transition-colors">{section.name || section.type}</span>
                        <svg className="w-3 h-3 text-gray-300 group-hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); duplicateSection(index); }} className="p-1 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded" title="Dupliquer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                        </button>
                        <div className="flex flex-col -space-y-1">
                          <button disabled={index === 0} onClick={(e) => { e.stopPropagation(); moveSection(index, 'UP'); }} className="p-0.5 hover:bg-gray-100 text-gray-500 hover:text-gray-600 rounded disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                          <button disabled={index === sections.length - 1} onClick={(e) => { e.stopPropagation(); moveSection(index, 'DOWN'); }} className="p-0.5 hover:bg-gray-100 text-gray-500 hover:text-gray-600 rounded disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeSection(index); }} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded ml-1" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{t("add_widget")}</h4>
                <div className="grid grid-cols-3 gap-1.5">
                  <button onClick={() => addSection('Hero')} className="border rounded bg-gray-50 hover:bg-gray-100 p-1.5 text-center text-[10px] flex flex-col items-center gap-1 transition text-gray-600 hover:text-gray-900 hover:border-gray-300">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Hero
                  </button>
                  <button onClick={() => addSection('PromoBanners')} className="border rounded bg-gray-50 hover:bg-gray-100 p-1.5 text-center text-[10px] flex flex-col items-center gap-1 transition text-gray-600 hover:text-gray-900 hover:border-gray-300">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                    Banners
                  </button>
                  <button onClick={() => addSection('BestDeals')} className="border rounded bg-gray-50 hover:bg-gray-100 p-1.5 text-center text-[10px] flex flex-col items-center gap-1 transition text-gray-600 hover:text-gray-900 hover:border-gray-300">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Promos
                  </button>
                  <button onClick={() => addSection('BestSeller')} className="border rounded bg-gray-50 hover:bg-gray-100 p-1.5 text-center text-[10px] flex flex-col items-center gap-1 transition text-gray-600 hover:text-gray-900 hover:border-gray-300">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    Grille
                  </button>
                  <button onClick={() => addSection('LatestBlogs')} className="border rounded bg-gray-50 hover:bg-gray-100 p-1.5 text-center text-[10px] flex flex-col items-center gap-1 transition text-gray-600 hover:text-gray-900 hover:border-gray-300">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3m0 0l3-3m-3 3V8" /></svg>
                    Blog
                  </button>
                  <button onClick={() => addSection('Newsletter')} className="border rounded bg-gray-50 hover:bg-gray-100 p-1.5 text-center text-[10px] flex flex-col items-center gap-1 transition text-gray-600 hover:text-gray-900 hover:border-gray-300">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Newsletter
                  </button>
                  <button onClick={() => addSection('FullWidthBanner')} className="border rounded bg-gray-50 hover:bg-gray-100 p-1.5 text-center text-[10px] flex flex-col items-center gap-1 transition text-gray-600 hover:text-gray-900 hover:border-gray-300">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2zM3 9h18M3 15h18" /></svg>
                    Large Banner
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // EDIT VIEW
            <div className="bg-gray-50 min-h-full">
              {sections.map((section, index) => section.id === editingId && (
                <div key={section.id}>
                  {/* Edit Header */}
                  <div className="bg-white px-3 py-2 border-b flex items-center gap-1.5 sticky top-0 z-10 shadow-sm">
                    <button onClick={() => setEditingId(null)} className="p-1 hover:bg-gray-100 hover:text-gray-900 rounded-full text-gray-500 transition-colors shrink-0" title="Back to list">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex-grow min-w-0 flex items-center gap-1.5">
                      <span className="px-1 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold uppercase tracking-wider rounded shrink-0 hidden sm:inline-block">{section.type}</span>
                      <input 
                        type="text" 
                        value={section.name} 
                        onChange={e => updateSectionName(section.id, e.target.value)}
                        className="text-xs font-bold border-b border-transparent hover:border-gray-200 focus:border-orange-500 outline-none bg-transparent w-full truncate transition-colors py-0.5"
                        placeholder="Name..."
                      />
                    </div>
                    <button onClick={() => toggleSection(index)} className={`p-1 rounded-full transition-colors shrink-0 ${section.enabled ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`} title={section.enabled ? 'Hide' : 'Show'}>
                      {section.enabled ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
                    </button>
                  </div>
                  <div className="p-3 bg-white text-sm">
                    {renderConfig(section, false)}
                  </div>
                  {/* Delete Section button at bottom */}
                  <div className="p-3 bg-gray-50 border-t flex justify-center">
                    <button onClick={() => { removeSection(index); setEditingId(null); }} className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1 p-1.5 rounded hover:bg-red-50 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Delete section
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Iframe Preview */}
      <div className="flex-grow w-full relative z-10 bg-gray-200 flex flex-col items-center">
        {/* Device Toggle Bar */}
        <div className="w-full bg-white border-b flex justify-center items-center py-2 gap-2 shadow-sm z-20">
          <button 
            onClick={() => setPreviewMode('desktop')} 
            className={`p-2 rounded transition-colors flex items-center justify-center ${previewMode === 'desktop' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Desktop Preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </button>
          <button 
            onClick={() => setPreviewMode('tablet')} 
            className={`p-2 rounded transition-colors flex items-center justify-center ${previewMode === 'tablet' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Tablet Preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </button>
          <button 
            onClick={() => setPreviewMode('mobile')} 
            className={`p-2 rounded transition-colors flex items-center justify-center ${previewMode === 'mobile' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Mobile Preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </button>
        </div>

        {/* Iframe Container */}
        <div className={`flex-grow relative transition-all duration-500 ease-in-out ${previewMode === 'desktop' ? 'w-full' : previewMode === 'tablet' ? 'w-[768px] shadow-2xl my-4 rounded-xl overflow-hidden border-8 border-gray-800' : 'w-[375px] shadow-2xl my-4 rounded-3xl overflow-hidden border-[12px] border-gray-800'}`}>
          {previewMode === 'mobile' && (
            <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 z-30 flex justify-center rounded-b-xl">
               <div className="w-24 h-4 bg-black rounded-b-xl"></div>
            </div>
          )}
          <iframe 
            ref={iframeRef} 
            src="/preview" 
            className="w-full h-full bg-white" 
            title="Live Preview" 
          />
        </div>
      </div>
      {mediaPickerTarget && (
        <MediaPickerModal 
          onClose={() => setMediaPickerTarget(null)}
          onSelect={(url) => {
            updateSectionSettings(mediaPickerTarget.sectionId, mediaPickerTarget.key, url);
            setMediaPickerTarget(null);
          }}
        />
      )}
    </div>
  );
}
