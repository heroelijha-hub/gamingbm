'use client';
import { useState, useEffect } from 'react';
import { SectionConfig } from '@/app/admin/(dashboard)/landing/LandingForm';
import Image from "next/image";

interface HeroSectionEditorProps {
  section: SectionConfig;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  updateSectionSettings: (id: string, keyOrUpdates: string | Record<string, any>, value?: any) => void;
  handleUpload: (id: string, key: string) => void;
  editingBlockNum?: number;
}

export default function HeroSectionEditor({ section, previewMode, updateSectionSettings, handleUpload, editingBlockNum }: HeroSectionEditorProps) {
  // If not set, default is Style 2 (3 blocks with slider)
  const isStyle2 = section.settings.HERO_LAYOUT !== 'STYLE_1';
  const totalBlocks = isStyle2 ? 3 : 4;
  
  const [activeBlock, setActiveBlock] = useState<number>(editingBlockNum || 0);
  const [openSection, setOpenSection] = useState<'content' | 'design' | ''>('content');

  useEffect(() => {
    if (editingBlockNum !== undefined) {
      setActiveBlock(editingBlockNum);
    }
  }, [editingBlockNum]);

  // Determine visibility for active block or main section
  const currentDeviceKey = previewMode.toUpperCase(); // 'DESKTOP' | 'TABLET' | 'MOBILE'
  const activePrefix = isStyle2 ? `STYLE2_HERO_${activeBlock}` : `HERO_${activeBlock}`;
  const blockHideKey = `${activePrefix}_HIDE_${currentDeviceKey}`;
  // For backwards compatibility on mobile, also check STYLE2_HERO_X_HIDE_MOBILE
  const isBlockHiddenOnCurrentDevice = activeBlock > 0
    ? (section.settings[blockHideKey] === 'true' || (previewMode === 'mobile' && section.settings[`${activePrefix}_HIDE_MOBILE`] === 'true'))
    : false;

  const toggleActiveBlockVisibility = () => {
    if (activeBlock === 0) return;
    const nextHidden = !isBlockHiddenOnCurrentDevice;
    const updates: Record<string, string> = {
      [blockHideKey]: nextHidden ? 'true' : 'false'
    };
    if (previewMode === 'mobile') {
      updates[`${activePrefix}_HIDE_MOBILE`] = nextHidden ? 'true' : 'false';
    }
    updateSectionSettings(section.id, updates);
  };

  const renderContentInput = (label: string, baseKey: string, placeholder: string) => {
    return (
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
        <input 
          type="text" 
          value={section.settings[baseKey] || ''} 
          onChange={e => updateSectionSettings(section.id, baseKey, e.target.value)} 
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 outline-none transition-colors" 
          placeholder={placeholder} 
        />
      </div>
    );
  };

  const renderDesignTextControls = (label: string, baseKey: string, colorKey: string, defaultColor: string) => {
    const mode = previewMode.toUpperCase();
    const sizeKey = `${baseKey}_SIZE_${mode}`;
    const lhKey = `${baseKey}_LINE_HEIGHT_${mode}`;
    const lsKey = `${baseKey}_LETTER_SPACING_${mode}`;
    
    const currentSize = section.settings[sizeKey] ? parseInt(section.settings[sizeKey].replace('px', '')) : 16;
    const currentLh = section.settings[lhKey] || '';
    const currentLs = section.settings[lsKey] ? parseInt(section.settings[lsKey].replace('px', '')) : 0;

    return (
      <div className="mb-5 flex flex-col gap-2">
        <label className="block text-xs font-medium text-gray-700">{label}</label>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          {/* Size */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Taille</span>
            <div className="flex items-center border border-gray-300 rounded overflow-hidden bg-white w-[72px] shrink-0" title="Taille (px)">
               <input 
                  type="number" 
                  value={currentSize || ''} 
                  onChange={e => updateSectionSettings(section.id, sizeKey, e.target.value + 'px')} 
                  className="flex-1 w-full text-center text-[13px] border-0 py-1.5 px-1 outline-none bg-transparent min-w-0"
                  placeholder="Taille"
               />
               <span className="text-[10px] text-gray-500 bg-gray-50 h-8 px-1.5 border-l border-gray-300 flex items-center justify-center shrink-0">px</span>
            </div>
          </div>
          
          {/* Line Height */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Interligne</span>
            <div className="flex items-center border border-gray-300 rounded overflow-hidden bg-white w-[72px] shrink-0" title="Interligne (ex: 1.2)">
               <input 
                  type="number" step="0.1"
                  value={currentLh} 
                  onChange={e => updateSectionSettings(section.id, lhKey, e.target.value)} 
                  className="flex-1 w-full text-center text-[13px] border-0 py-1.5 px-1 outline-none bg-transparent min-w-0"
                  placeholder="LH"
               />
               <span className="text-[10px] text-gray-500 bg-gray-50 h-8 px-1.5 border-l border-gray-300 flex items-center justify-center shrink-0">lh</span>
            </div>
          </div>

          {/* Letter Spacing */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Espace (lettres)</span>
            <div className="flex items-center border border-gray-300 rounded overflow-hidden bg-white w-[72px] shrink-0" title="Espacement (px)">
               <input 
                  type="number" step="1"
                  value={currentLs || 0} 
                  onChange={e => updateSectionSettings(section.id, lsKey, e.target.value + 'px')} 
                  className="flex-1 w-full text-center text-[13px] border-0 py-1.5 px-1 outline-none bg-transparent min-w-0"
                  placeholder="LS"
               />
               <span className="text-[10px] text-gray-500 bg-gray-50 h-8 px-1.5 border-l border-gray-300 flex items-center justify-center shrink-0">px</span>
            </div>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Couleur</span>
            <div className="relative w-[72px] h-8 rounded overflow-hidden border border-gray-300 shadow-sm shrink-0 cursor-pointer" title="Couleur">
              <input 
                type="color" 
                value={section.settings[colorKey] || defaultColor} 
                onChange={e => updateSectionSettings(section.id, colorKey, e.target.value)} 
                className="absolute -top-2 -left-2 w-24 h-24 cursor-pointer border-0 p-0" 
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getPrefix = (blockNum: number) => isStyle2 ? `STYLE2_HERO_${blockNum}` : `HERO_${blockNum}`;

  const renderContentTab = (blockNum: number) => {
    const prefix = getPrefix(blockNum);
    let titlePlaceholder = 'Enter the title...';
    let subtitlePlaceholder = 'Subtitle...';
    let ctaPlaceholder = 'Shop Now';
    
    if (!isStyle2 && blockNum === 1) {
      titlePlaceholder = 'Apple Iphone 17 Pro Max';
      subtitlePlaceholder = 'Super Discount';
    } else if (!isStyle2 && blockNum === 4) {
      titlePlaceholder = 'Headphones Listen With Heart';
      subtitlePlaceholder = 'Last call for up to 25% off';
    }

    return (
      <div className="space-y-4 mt-4">
        {/* For Block 2 & 3 in Style 2, provide Category field (the blue text on top) */}
        {isStyle2 && (blockNum === 2 || blockNum === 3) && (
          renderContentInput('Category / Tagline (texte bleu)', `${prefix}_CATEGORY`, blockNum === 2 ? 'Full HD Display' : 'Sale 20% Off All Store')
        )}
        {renderContentInput('Title', `${prefix}_TITLE`, titlePlaceholder)}
        {renderContentInput('Subtitle / badge', `${prefix}_SUBTITLE`, subtitlePlaceholder)}
        {((!isStyle2 && blockNum === 1) || (isStyle2 && blockNum === 1)) && (
          <>
            {renderContentInput('Price Label (ex: Starting at)', isStyle2 ? 'STYLE2_HERO_1_PRICE_LABEL' : 'HERO_1_PRICE_LABEL', 'Starting at')}
            {renderContentInput('Price/Text', isStyle2 ? 'STYLE2_HERO_1_PRICE' : 'HERO_1_PRICE', isStyle2 ? '$824.00' : 'from $349.99')}
          </>
        )}
        {renderContentInput('Button Text', `${prefix}_CTA`, ctaPlaceholder)}
        {renderContentInput('Button Link', `${prefix}_LINK`, '/shop')}

        {isStyle2 && blockNum === 1 && (
          <div className="pt-6 mt-6 border-t border-gray-200 space-y-4">
            <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fed700]"></span>
              Slide 2 (Auto-Slide)
            </h4>
            {renderContentInput('Slide 2 Title', 'STYLE2_HERO_1_SLIDE2_TITLE', 'Samsung\nGalaxy S9 | S9+')}
            {renderContentInput('Slide 2 Subtitle / badge', 'STYLE2_HERO_1_SLIDE2_SUBTITLE', 'Sale Offer -20% Off This Week')}
            {renderContentInput('Slide 2 Price Label', 'STYLE2_HERO_1_SLIDE2_PRICE_LABEL', 'Starting at')}
            {renderContentInput('Slide 2 Price/Text', 'STYLE2_HERO_1_SLIDE2_PRICE', '$1209.00')}
            {renderContentInput('Slide 2 Button Text', 'STYLE2_HERO_1_SLIDE2_CTA', 'SHOP NOW')}
            {renderContentInput('Slide 2 Button Link', 'STYLE2_HERO_1_SLIDE2_LINK', '/shop')}

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Slide 2 Product Image</label>
              <div className="border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[120px] transition hover:bg-gray-100">
                {section.settings['STYLE2_HERO_1_SLIDE2_IMAGE'] ? (
                  <>
                    <Image width={800} height={800} src={section.settings['STYLE2_HERO_1_SLIDE2_IMAGE']} className="absolute inset-0 w-full h-full object-contain p-2 rounded-xl" alt="" />
                    <div className="relative z-10 flex gap-2 opacity-0 hover:opacity-100 bg-white/80 p-2 rounded-lg transition">
                      <button type="button" onClick={() => handleUpload(section.id, 'STYLE2_HERO_1_SLIDE2_IMAGE')} className="bg-white text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm border">Edit</button>
                      <button type="button" onClick={() => updateSectionSettings(section.id, 'STYLE2_HERO_1_SLIDE2_IMAGE', '')} className="bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm">Remove</button>
                    </div>
                  </>
                ) : (
                  <button type="button" onClick={() => handleUpload(section.id, 'STYLE2_HERO_1_SLIDE2_IMAGE')} className="flex flex-col items-center text-gray-500 hover:text-gray-600 transition">
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    <span className="text-xs font-medium">Add Slide 2 Image</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Slide 2 Background Image (Optional)</label>
              <div className="border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[120px] transition hover:bg-gray-100">
                {section.settings['STYLE2_HERO_1_SLIDE2_BG_IMAGE'] ? (
                  <>
                    <Image width={800} height={800} src={section.settings['STYLE2_HERO_1_SLIDE2_BG_IMAGE']} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-60" alt="" />
                    <div className="relative z-10 flex gap-2">
                      <button type="button" onClick={() => handleUpload(section.id, 'STYLE2_HERO_1_SLIDE2_BG_IMAGE')} className="bg-white text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm border">Edit</button>
                      <button type="button" onClick={() => updateSectionSettings(section.id, 'STYLE2_HERO_1_SLIDE2_BG_IMAGE', '')} className="bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm">Remove</button>
                    </div>
                  </>
                ) : (
                  <button type="button" onClick={() => handleUpload(section.id, 'STYLE2_HERO_1_SLIDE2_BG_IMAGE')} className="flex flex-col items-center text-gray-500 hover:text-gray-600 transition">
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    <span className="text-xs font-medium">Add Slide 2 Background Image</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDesignTab = (blockNum: number) => {
    const basePrefix = isStyle2 ? 'STYLE2_HERO' : 'HERO';
    const prefix = `${basePrefix}_${blockNum}`;
    
    return (
      <div className="space-y-5 mt-4">
        {/* Background Image */}
        <div>
          <label className="block text-sm font-semibold text-red-700 mb-2">Background image</label>
          <div className="border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[120px] transition hover:bg-gray-100">
            {section.settings[`${prefix}_BG_IMAGE`] ? (
              <>
                <Image width={800} height={800} src={section.settings[`${prefix}_BG_IMAGE`]} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-50" alt="" />
                <div className="relative z-10 flex gap-2">
                  <button type="button" onClick={() => handleUpload(section.id, `${prefix}_BG_IMAGE`)} className="bg-white text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm border">Edit</button>
                  <button type="button" onClick={() => updateSectionSettings(section.id, `${prefix}_BG_IMAGE`, '')} className="bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm">Remove</button>
                </div>
              </>
            ) : (
              <button type="button" onClick={() => handleUpload(section.id, `${prefix}_BG_IMAGE`)} className="flex flex-col items-center text-gray-500 hover:text-gray-600 transition">
                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                <span className="text-xs font-medium">Add an image</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id={`show_bg_${prefix}`} checked={section.settings[`${prefix}_SHOW_BG_IMAGE`] !== 'false'} onChange={e => updateSectionSettings(section.id, `${prefix}_SHOW_BG_IMAGE`, e.target.checked ? 'true' : 'false')} className="rounded text-orange-700 focus:ring-orange-500" />
            <label htmlFor={`show_bg_${prefix}`} className="text-xs text-gray-600">Show background image</label>
          </div>
          {section.settings[`${prefix}_SHOW_BG_IMAGE`] !== 'false' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Dark Overlay</label>
              <select 
                value={section.settings[`${prefix}_BG_OVERLAY`] || '40'} 
                onChange={e => updateSectionSettings(section.id, `${prefix}_BG_OVERLAY`, e.target.value)}
                className="w-full border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="0">None (0%)</option>
                <option value="20">Light (20%)</option>
                <option value="40">Medium (40%)</option>
                <option value="60">Dark (60%)</option>
                <option value="80">Very Dark (80%)</option>
              </select>
            </div>
          )}
        </div>

        {/* Main Image */}
        <div>
          <label className="block text-sm font-semibold text-red-700 mb-2">Main image (Product)</label>
          <div className="border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[120px] transition hover:bg-gray-100">
            {section.settings[`${prefix}_IMAGE`] ? (
              <>
                <Image width={800} height={800} src={section.settings[`${prefix}_IMAGE`]} className="absolute inset-0 w-full h-full object-contain p-2 rounded-xl" alt="" />
                <div className="relative z-10 flex gap-2 opacity-0 hover:opacity-100 bg-white/80 p-2 rounded-lg transition">
                  <button type="button" onClick={() => handleUpload(section.id, `${prefix}_IMAGE`)} className="bg-white text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm border">Edit</button>
                  <button type="button" onClick={() => updateSectionSettings(section.id, `${prefix}_IMAGE`, '')} className="bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm">Remove</button>
                </div>
              </>
            ) : (
              <button type="button" onClick={() => handleUpload(section.id, `${prefix}_IMAGE`)} className="flex flex-col items-center text-gray-500 hover:text-gray-600 transition">
                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                <span className="text-xs font-medium">Add an image</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id={`show_img_${prefix}`} checked={section.settings[`${prefix}_SHOW_IMAGE`] !== 'false'} onChange={e => updateSectionSettings(section.id, `${prefix}_SHOW_IMAGE`, e.target.checked ? 'true' : 'false')} className="rounded text-orange-700 focus:ring-orange-500" />
            <label htmlFor={`show_img_${prefix}`} className="text-xs text-gray-600">Show main image</label>
          </div>
        </div>

        {/* Premium Layout & Styles */}
        <div className="mt-8 border-t pt-6">
          <h4 className="text-sm font-semibold text-gray-800 mb-4">Styles & Alignement</h4>
          
          {/* Position (3x3 Grid) */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">Position du Contenu (Grille 3x3)</label>
            <div className="grid grid-cols-3 gap-1 w-[88px] h-[88px] bg-gray-100 p-1.5 rounded-lg border border-gray-200 shadow-inner">
              {['top', 'center', 'bottom'].map(v => 
                ['left', 'center', 'right'].map(h => {
                  const currentV = section.settings[`${prefix}_VALIGN`] || 'bottom';
                  const currentH = section.settings[`${prefix}_ALIGN`] || (blockNum === 1 || blockNum === 2 || blockNum === 3 ? (blockNum === 1 ? 'center' : 'left') : 'left');
                  const isSelected = currentV === v && currentH === h;
                  
                  let title = '';
                  if (v === 'top') title = 'Haut ';
                  if (v === 'center') title = 'Milieu ';
                  if (v === 'bottom') title = 'Bas ';
                  if (h === 'left') title += 'Gauche';
                  if (h === 'center') title += 'Centre';
                  if (h === 'right') title += 'Droite';

                  return (
                    <button
                      key={`${v}-${h}`}
                      type="button"
                      onClick={() => {
                        updateSectionSettings(section.id, {
                          [`${prefix}_VALIGN`]: v,
                          [`${prefix}_ALIGN`]: h
                        });
                      }}
                      className={`rounded-[4px] transition-all flex items-center justify-center ${
                        isSelected 
                          ? 'bg-orange-500 shadow-md ring-1 ring-orange-600 ring-inset' 
                          : 'bg-white border border-gray-200 hover:bg-orange-50'
                      }`}
                      title={title}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-gray-300'}`} />
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Gère l'alignement horizontal et vertical</p>
          </div>

          {/* Button Style */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">Style du Bouton (CTA)</label>
            <select
              value={section.settings[`${prefix}_BTN_STYLE`] || 'pill'}
              onChange={e => updateSectionSettings(section.id, `${prefix}_BTN_STYLE`, e.target.value)}
              className="w-full border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="pill">Pilule (Très arrondi)</option>
              <option value="rounded">Arrondi léger</option>
              <option value="square">Carré</option>
            </select>
          </div>

          {/* Badge Style */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">Style des Badges</label>
            <select
              value={section.settings[`${prefix}_BADGE_STYLE`] || 'light'}
              onChange={e => updateSectionSettings(section.id, `${prefix}_BADGE_STYLE`, e.target.value)}
              className="w-full border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="light">Badge Clair (Effet verre)</option>
              <option value="dark">Badge Sombre (Effet verre)</option>
              <option value="custom">Couleur personnalisée</option>
              <option value="none">Texte simple (Sans badge)</option>
            </select>
            
            {section.settings[`${prefix}_BADGE_STYLE`] === 'custom' && (
              <div className="mt-2 flex items-center gap-3">
                <input 
                  type="color" 
                  value={section.settings[`${prefix}_BADGE_BG`] || '#ffffff'} 
                  onChange={e => updateSectionSettings(section.id, `${prefix}_BADGE_BG`, e.target.value)} 
                  className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                />
                <span className="text-xs text-gray-500">Couleur de fond du badge</span>
              </div>
            )}
          </div>
          
          {/* Overlay Type */}
          {section.settings[`${prefix}_SHOW_BG_IMAGE`] !== 'false' && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Background Overlay</label>
              <select
                value={section.settings[`${prefix}_OVERLAY_TYPE`] || (blockNum === 4 ? 'grad-r' : 'grad-t')}
                onChange={e => updateSectionSettings(section.id, `${prefix}_OVERLAY_TYPE`, e.target.value)}
                className="w-full border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="grad-t">Dégradé Bas ➔ Haut</option>
                <option value="grad-r">Dégradé Gauche ➔ Droite</option>
                <option value="solid">Couleur Unie</option>
              </select>
            </div>
          )}
        </div>

        {/* Typographie & Couleurs des textes */}
        <div className="mt-8 border-t pt-6">
          <h4 className="text-sm font-semibold text-gray-800 mb-4">Typography & Colors</h4>
          {isStyle2 && (blockNum === 2 || blockNum === 3) && (
            renderDesignTextControls('Category / Tagline (texte haut)', `${prefix}_CATEGORY`, `${prefix}_CATEGORY_COLOR`, '#0284c7')
          )}
          {renderDesignTextControls('Title', `${prefix}_TITLE`, `${prefix}_TEXT_COLOR`, '#1e293b')}
          {renderDesignTextControls('Subtitle', `${prefix}_SUBTITLE`, `${prefix}_SUBTITLE_COLOR`, '#ef4444')}
          {!isStyle2 && blockNum === 1 && renderDesignTextControls('Price/Text', 'HERO_1_PRICE', 'HERO_1_PRICE_COLOR', '#6b7280')}
          {renderDesignTextControls('Button', `${prefix}_CTA`, `${prefix}_BTN_TEXT_COLOR`, '#ffffff')}
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div>
            <label className="block text-[11px] font-medium mb-1 text-gray-500">Block Background</label>
            <div className="relative w-full h-10 rounded-md overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
              <input type="color" value={section.settings[`${prefix}_BG_COLOR`] || '#ffffff'} onChange={e => updateSectionSettings(section.id, `${prefix}_BG_COLOR`, e.target.value)} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1 text-gray-500">Button Background</label>
            <div className="relative w-full h-10 rounded-md overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
              <input type="color" value={section.settings[`${prefix}_BTN_BG_COLOR`] || '#c2410c'} onChange={e => updateSectionSettings(section.id, `${prefix}_BTN_BG_COLOR`, e.target.value)} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0" />
            </div>
          </div>
        </div>

        {/* Link */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Redirect link (URL)</label>
          <input type="text" value={section.settings[`${prefix}_LINK`] || ''} onChange={e => updateSectionSettings(section.id, `${prefix}_LINK`, e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 outline-none text-gray-500 placeholder-gray-300" placeholder="/product/..." />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {activeBlock > 0 ? (
            <button type="button" onClick={() => setActiveBlock(0)} className="text-gray-500 hover:text-gray-900 transition flex items-center justify-center bg-gray-100 rounded-full w-8 h-8">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <button type="button" className="text-gray-500 hover:text-gray-900 transition flex items-center justify-center w-8 h-8">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0">HERO</span>
          <h2 className="font-bold text-base text-gray-800 whitespace-nowrap">
            {activeBlock === 0 ? 'Main Header' : `Block ${activeBlock}`}
          </h2>
        </div>
        {activeBlock > 0 ? (
          <button 
            type="button" 
            onClick={toggleActiveBlockVisibility}
            title={isBlockHiddenOnCurrentDevice ? `Show Block ${activeBlock} on ${previewMode}` : `Hide Block ${activeBlock} on ${previewMode}`}
            className={`transition p-1.5 rounded-full flex items-center justify-center ${
              isBlockHiddenOnCurrentDevice 
                ? 'text-gray-400 bg-gray-100 hover:bg-gray-200' 
                : 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
            }`}
          >
            {isBlockHiddenOnCurrentDevice ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        ) : (
          <div className="text-green-600 bg-green-50 p-1.5 rounded-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-5 lg:p-6 bg-gray-50/30 min-h-[500px]">
        {activeBlock === 0 ? (
          <div className="space-y-8">
            
            {/* Layout Design */}
            <div>
              <h3 className="font-bold text-sm text-gray-800 mb-3">Layout design</h3>
              <div className="flex flex-col gap-2">
                <label className={`flex items-center space-x-3 text-sm text-gray-700 cursor-pointer px-4 py-3 rounded-xl border transition ${!isStyle2 ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                  <input 
                    type="radio" 
                    name={`layout-${section.id}`}
                    checked={!isStyle2}
                    onChange={() => updateSectionSettings(section.id, 'HERO_LAYOUT', 'STYLE_1')}
                    className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="font-medium">Style 1 (4 blocks)</span>
                </label>
                <label className={`flex items-center space-x-3 text-sm text-gray-700 cursor-pointer px-4 py-3 rounded-xl border transition ${isStyle2 ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                  <input 
                    type="radio" 
                    name={`layout-${section.id}`}
                    checked={isStyle2}
                    onChange={() => updateSectionSettings(section.id, 'HERO_LAYOUT', 'STYLE_2')}
                    className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="font-medium">Style 2 (3 blocks)</span>
                </label>
              </div>
            </div>

            {/* Device Display Settings */}
            <div>
              <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center justify-between">
                <span>Display by Device</span>
                <span className="text-xs font-normal text-gray-500 capitalize">Active mode: {previewMode}</span>
              </h3>
              <div className="flex flex-col gap-2">
                {Array.from({ length: totalBlocks }).map((_, i) => {
                  const num = i + 1;
                  const prefix = isStyle2 ? `STYLE2_HERO_${num}` : `HERO_${num}`;
                  
                  const isHiddenDesk = section.settings[`${prefix}_HIDE_DESKTOP`] === 'true';
                  const isHiddenTab = section.settings[`${prefix}_HIDE_TABLET`] === 'true';
                  const isHiddenMob = section.settings[`${prefix}_HIDE_MOBILE`] === 'true';

                  return (
                    <div key={num} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-3">
                      <span className="font-medium text-sm text-gray-700">Block {num}</span>
                      <div className="flex items-center gap-1.5">
                        {/* Desktop toggle */}
                        <button
                          type="button"
                          onClick={() => updateSectionSettings(section.id, `${prefix}_HIDE_DESKTOP`, isHiddenDesk ? 'false' : 'true')}
                          title={isHiddenDesk ? 'Desktop: Hidden (click to show)' : 'Desktop: Visible (click to hide)'}
                          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                            !isHiddenDesk ? 'bg-green-50 border-green-200 text-green-700 font-semibold' : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          <span className="hidden sm:inline">Desktop</span>
                        </button>

                        {/* Tablet toggle */}
                        <button
                          type="button"
                          onClick={() => updateSectionSettings(section.id, `${prefix}_HIDE_TABLET`, isHiddenTab ? 'false' : 'true')}
                          title={isHiddenTab ? 'Tablet: Hidden (click to show)' : 'Tablet: Visible (click to hide)'}
                          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                            !isHiddenTab ? 'bg-green-50 border-green-200 text-green-700 font-semibold' : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          <span className="hidden sm:inline">Tablet</span>
                        </button>

                        {/* Mobile toggle */}
                        <button
                          type="button"
                          onClick={() => updateSectionSettings(section.id, `${prefix}_HIDE_MOBILE`, isHiddenMob ? 'false' : 'true')}
                          title={isHiddenMob ? 'Mobile: Hidden (click to show)' : 'Mobile: Visible (click to hide)'}
                          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                            !isHiddenMob ? 'bg-green-50 border-green-200 text-green-700 font-semibold' : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          <span className="hidden sm:inline">Mobile</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BLOCS List */}
            <div className="pt-2">
              <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-3">Blocks</h3>
              <div className="flex flex-col gap-2">
                {Array.from({ length: totalBlocks }).map((_, i) => {
                  const num = i + 1;
                  const blockTitle = isStyle2 
                    ? (num === 1 ? 'Block 1 (left)' : num === 2 ? 'Block 2 (top right)' : 'Block 3 (bottom right)') 
                    : (num === 1 ? 'Block 1 (left)' : num === 2 ? 'Block 2 (top center)' : num === 3 ? 'Block 3 (top right)' : 'Block 4 (bottom right)');
                  
                  return (
                    <button 
                      key={num}
                      type="button"
                      onClick={() => setActiveBlock(num)}
                      className="w-full text-left px-5 py-4 font-bold text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700 flex justify-between items-center shadow-sm hover:shadow"
                    >
                      <span>{blockTitle}</span>
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            {/* CONTENT ACCORDION */}
            <div className="max-w-2xl border border-gray-200 rounded-lg overflow-hidden bg-white mb-6">
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
                <div className="p-4 border-t border-gray-200">
                  {renderContentTab(activeBlock)}
                </div>
              )}
            </div>

            {/* DESIGN ACCORDION */}
            <div className="max-w-2xl border border-gray-200 rounded-lg overflow-hidden bg-white">
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
                  {renderDesignTab(activeBlock)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
