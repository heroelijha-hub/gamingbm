import Image from 'next/image';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import HeroMobileSliderWrapper from './HeroMobileSliderWrapper';
import { getTranslations } from 'next-intl/server';
import HeroPreviewEditButton from '@/components/admin/HeroPreviewEditButton';
import { basicSanitizeHtml } from '@/lib/security';

export default async function Hero({ config, isPreview, sectionId }: { config?: any, isPreview?: boolean, sectionId?: string }) {
  const settingsDb = await prisma.setting.findMany();
  let settings = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
  
  if (config) {
    settings = { ...settings, ...config };
  }
  
  const t = await getTranslations('Home');

  const getResponsiveVars = (baseKey: string, defaultSizes: { m: string, t: string, d: string }) => {
    const vars: any = {
      '--sz-m': settings[`${baseKey}_SIZE_MOBILE`] || defaultSizes.m,
      '--sz-t': settings[`${baseKey}_SIZE_TABLET`] || defaultSizes.t,
      '--sz-d': settings[`${baseKey}_SIZE_DESKTOP`] || defaultSizes.d,
    };
    
    if (settings[`${baseKey}_LINE_HEIGHT_MOBILE`]) vars['--lh-m'] = settings[`${baseKey}_LINE_HEIGHT_MOBILE`];
    if (settings[`${baseKey}_LINE_HEIGHT_TABLET`]) vars['--lh-t'] = settings[`${baseKey}_LINE_HEIGHT_TABLET`];
    if (settings[`${baseKey}_LINE_HEIGHT_DESKTOP`]) vars['--lh-d'] = settings[`${baseKey}_LINE_HEIGHT_DESKTOP`];
    
    if (settings[`${baseKey}_LETTER_SPACING_MOBILE`]) vars['--ls-m'] = settings[`${baseKey}_LETTER_SPACING_MOBILE`];
    if (settings[`${baseKey}_LETTER_SPACING_TABLET`]) vars['--ls-t'] = settings[`${baseKey}_LETTER_SPACING_TABLET`];
    if (settings[`${baseKey}_LETTER_SPACING_DESKTOP`]) vars['--ls-d'] = settings[`${baseKey}_LETTER_SPACING_DESKTOP`];

    return vars as React.CSSProperties;
  };

  const getAlignFlexClass = (prefix: string, defaultAlign: string) => {
    const align = settings[`${prefix}_ALIGN`] || defaultAlign;
    if (align === 'right') return 'items-end text-right';
    if (align === 'center') return 'items-center text-center';
    return 'items-start text-left';
  };

  const getVerticalAlignClass = (prefix: string, defaultValign: string = 'bottom') => {
    const valign = settings[`${prefix}_VALIGN`] || defaultValign;
    if (valign === 'top') return 'justify-start';
    if (valign === 'center') return 'justify-center';
    return 'justify-end'; // bottom
  };

  const getMarginClass = (prefix: string, defaultValign: string = 'bottom') => {
    const valign = settings[`${prefix}_VALIGN`] || defaultValign;
    if (valign === 'top') return 'mb-auto';
    if (valign === 'center') return 'my-auto';
    return 'mt-auto'; // bottom
  };

  const getAlignSelfClass = (prefix: string, defaultAlign: string) => {
    const align = settings[`${prefix}_ALIGN`] || defaultAlign;
    if (align === 'right') return 'ml-auto';
    if (align === 'center') return 'mx-auto';
    return 'mr-auto';
  };

  const getBtnRadiusClass = (prefix: string) => {
    const style = settings[`${prefix}_BTN_STYLE`] || 'pill';
    if (style === 'rounded') return 'rounded-lg';
    if (style === 'square') return 'rounded-none';
    return 'rounded-full'; // pill default
  };

  const getBadgeClasses = (prefix: string, type: 'subtitle' | 'price' = 'subtitle') => {
    const style = settings[`${prefix}_BADGE_STYLE`] || 'light';
    const mb = type === 'subtitle' ? 'mb-4' : 'mb-6';
    if (style === 'none') return `${mb} font-bold tracking-wider uppercase text-responsive`;
    if (style === 'dark') return `inline-block px-3 py-1 bg-gray-900/60 backdrop-blur-md rounded-md font-bold tracking-wide text-responsive border border-white/10 shadow-sm ${mb}`;
    if (style === 'custom') return `inline-block px-3 py-1 rounded-md font-bold tracking-wide uppercase text-responsive shadow-sm ${mb}`;
    return `inline-block px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full font-bold tracking-wider uppercase ${mb} shadow-sm border border-white/20 text-responsive`;
  };

  const getBadgeStyle = (prefix: string, colorKey: string, defaultColor: string) => {
    const style = settings[`${prefix}_BADGE_STYLE`] || 'light';
    const baseStyle: any = { ...getResponsiveVars(`${prefix}_SUBTITLE`, {m: '10px', t: '12px', d: '12px'}), color: settings[colorKey] || defaultColor };
    if (style === 'custom') {
      baseStyle.backgroundColor = settings[`${prefix}_BADGE_BG`] || '#ffffff';
    }
    return baseStyle;
  };

  const getOverlayClass = (prefix: string, defaultType: string) => {
    const type = settings[`${prefix}_OVERLAY_TYPE`] || defaultType;
    if (type === 'solid') return 'bg-black';
    if (type === 'grad-r') return 'bg-gradient-to-r from-gray-900/95 via-gray-900/70 to-transparent';
    return 'bg-gradient-to-t from-gray-900/95 via-gray-900/50 to-gray-900/10';
  };

  const block1 = (
    <div 
      className={`rounded-2xl overflow-hidden relative p-8 sm:p-10 flex-col h-full min-h-[400px] lg:min-h-0 border border-gray-100/10 group flex w-full shadow-lg ${getAlignFlexClass('HERO_1', 'center')} ${getVerticalAlignClass('HERO_1', 'bottom')}`}
      style={{
        backgroundColor: settings.HERO_1_BG_COLOR || '#111827',
      }}
    >
      
      {settings.HERO_1_BG_IMAGE && settings.HERO_1_SHOW_BG_IMAGE !== 'false' && (
        <>
          <Image src={settings.HERO_1_BG_IMAGE} alt="Background" fill priority fetchPriority="high" className="object-cover object-center z-0 transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px" quality={60} />
          <div className={`absolute inset-0 z-[1] transition-opacity duration-300 ${getOverlayClass('HERO_1', 'grad-t')}`} style={{ opacity: (parseInt(settings.HERO_1_BG_OVERLAY || '80', 10) / 100).toFixed(2) }}></div>
        </>
      )}

      <div className={`z-10 relative flex flex-col w-full max-w-md ${getMarginClass('HERO_1', 'bottom')} ${getAlignFlexClass('HERO_1', 'center')}`}>
        {settings.HERO_1_SUBTITLE && (
          <span 
            className={getBadgeClasses('HERO_1')}
            style={getBadgeStyle('HERO_1', 'HERO_1_SUBTITLE_COLOR', '#e11d48')}
            dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.HERO_1_SUBTITLE) }}
          />
        )}
        <h1 
          className="font-extrabold tracking-tight mb-4 text-responsive drop-shadow-md" 
          style={{...getResponsiveVars('HERO_1_TITLE', {m: '28px', t: '32px', d: '38px'}), color: settings.HERO_1_TEXT_COLOR || '#ffffff', lineHeight: '1.2'}}
          dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.HERO_1_TITLE || t('hero_1_title')) }}
        />
        {settings.HERO_1_PRICE && (
          <p 
            className={getBadgeClasses('HERO_1', 'price')} 
            style={getBadgeStyle('HERO_1', 'HERO_1_PRICE_COLOR', '#ffffff')}
          >
            {settings.HERO_1_PRICE}
          </p>
        )}
        <Link 
          href={settings.HERO_1_LINK || '/#'} 
          className={`inline-block font-bold px-8 py-3.5 shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl text-responsive ring-1 ring-white/20 w-full sm:w-auto text-center ${getBtnRadiusClass('HERO_1')}`}
          style={{
            ...getResponsiveVars('HERO_1_CTA', {m: '15px', t: '16px', d: '16px'}),
            backgroundColor: settings.HERO_1_BTN_BG_COLOR || '#c2410c',
            color: settings.HERO_1_BTN_TEXT_COLOR || '#ffffff'
          }}
          dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.HERO_1_CTA || t('shop_now')) }}
        />
      </div>
      {settings.HERO_1_IMAGE && settings.HERO_1_SHOW_IMAGE !== 'false' && (
        <Image src={settings.HERO_1_IMAGE} alt="Hero 1" width={800} height={800} className="absolute top-8 left-1/2 -translate-x-1/2 w-4/5 object-contain max-h-[40%] group-hover:scale-110 transition-transform duration-700 z-0 drop-shadow-2xl" priority />
      )}
      {isPreview && sectionId && <HeroPreviewEditButton sectionId={sectionId} blockNum={1} />}
    </div>
  );

  const block2 = (
    <div 
      className={`rounded-2xl overflow-hidden relative p-8 flex-col h-full min-h-[300px] lg:min-h-0 flex w-full group border border-gray-100/10 shadow-md ${getAlignFlexClass('HERO_2', 'left')} ${getVerticalAlignClass('HERO_2', 'bottom')}`}
      style={{
        backgroundColor: settings.HERO_2_BG_COLOR || '#1f2937',
      }}
    >
      
      {settings.HERO_2_BG_IMAGE && settings.HERO_2_SHOW_BG_IMAGE !== 'false' && (
        <>
          <Image src={settings.HERO_2_BG_IMAGE} alt="Background" fill priority fetchPriority="high" className="object-cover object-center z-0 transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px" quality={60} />
          <div className={`absolute inset-0 z-[1] transition-opacity duration-300 ${getOverlayClass('HERO_2', 'grad-t')}`} style={{ opacity: (parseInt(settings.HERO_2_BG_OVERLAY || '70', 10) / 100).toFixed(2) }}></div>
        </>
      )}
      <div className={`z-20 w-[65%] sm:w-[55%] relative flex flex-col ${getMarginClass('HERO_2', 'bottom')} ${getAlignFlexClass('HERO_2', 'left')} ${getAlignSelfClass('HERO_2', 'left')}`}>
        {settings.HERO_2_SUBTITLE && (
          <span 
            className={getBadgeClasses('HERO_2')}
            style={getBadgeStyle('HERO_2', 'HERO_2_SUBTITLE_COLOR', '#fca5a5')}
            dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.HERO_2_SUBTITLE) }}
          />
        )}
        <h2 
          className="font-extrabold mb-5 leading-snug whitespace-pre-line text-responsive drop-shadow-md" 
          style={{...getResponsiveVars('HERO_2_TITLE', {m: '22px', t: '24px', d: '26px'}), color: settings.HERO_2_TEXT_COLOR || '#ffffff'}}
          dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.HERO_2_TITLE || t('hero_2_title')) }}
        />
        <Link 
          href={settings.HERO_2_LINK || '/#'} 
          className={`inline-block font-bold px-6 py-2.5 shadow-md transition-all transform hover:-translate-y-1 hover:shadow-lg text-responsive ring-1 ring-white/10 text-center ${getBtnRadiusClass('HERO_2')} ${settings.HERO_2_ALIGN === 'right' ? 'self-end' : settings.HERO_2_ALIGN === 'center' ? 'self-center' : 'self-start'}`}
          style={{
            ...getResponsiveVars('HERO_2_CTA', {m: '13px', t: '14px', d: '14px'}),
            backgroundColor: settings.HERO_2_BTN_BG_COLOR || '#c2410c',
            color: settings.HERO_2_BTN_TEXT_COLOR || '#ffffff'
          }}
          dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.HERO_2_CTA || t('shop_now')) }}
        />
      </div>
      {settings.HERO_2_IMAGE && settings.HERO_2_SHOW_IMAGE !== 'false' && (
        <Image src={settings.HERO_2_IMAGE} alt="Hero 2" width={800} height={800} className={`absolute top-4 w-[45%] sm:w-[50%] object-contain group-hover:scale-110 transition-transform duration-700 z-10 drop-shadow-xl ${settings.HERO_2_ALIGN === 'right' ? 'left-0' : 'right-0'}`} priority />
      )}
      {isPreview && sectionId && <HeroPreviewEditButton sectionId={sectionId} blockNum={2} />}
    </div>
  );

  const block3 = (
    <div 
      className={`rounded-2xl overflow-hidden relative p-8 flex-col h-full min-h-[300px] lg:min-h-0 flex w-full group border border-gray-100/10 shadow-md ${getAlignFlexClass('HERO_3', 'left')} ${getVerticalAlignClass('HERO_3', 'bottom')}`}
      style={{
        backgroundColor: settings.HERO_3_BG_COLOR || '#1f2937',
      }}
    >
      
      {settings.HERO_3_BG_IMAGE && settings.HERO_3_SHOW_BG_IMAGE !== 'false' && (
        <>
          <Image src={settings.HERO_3_BG_IMAGE} alt="Background" fill priority fetchPriority="high" className="object-cover object-center z-0 transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px" quality={60} />
          <div className={`absolute inset-0 z-[1] transition-opacity duration-300 ${getOverlayClass('HERO_3', 'grad-t')}`} style={{ opacity: (parseInt(settings.HERO_3_BG_OVERLAY || '70', 10) / 100).toFixed(2) }}></div>
        </>
      )}
      <div className={`z-20 w-[65%] sm:w-[55%] relative flex flex-col ${getMarginClass('HERO_3', 'bottom')} ${getAlignFlexClass('HERO_3', 'left')} ${getAlignSelfClass('HERO_3', 'left')}`}>
        {settings.HERO_3_SUBTITLE && (
          <span 
            className={getBadgeClasses('HERO_3')}
            style={getBadgeStyle('HERO_3', 'HERO_3_SUBTITLE_COLOR', '#fca5a5')}
            dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.HERO_3_SUBTITLE) }}
          />
        )}
        <h2 
          className="font-extrabold mb-5 leading-snug whitespace-pre-line text-responsive drop-shadow-md" 
          style={{...getResponsiveVars('HERO_3_TITLE', {m: '22px', t: '24px', d: '26px'}), color: settings.HERO_3_TEXT_COLOR || '#ffffff'}}
          dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.HERO_3_TITLE || t('hero_3_title')) }}
        />
        <Link 
          href={settings.HERO_3_LINK || '/#'} 
          className={`inline-block font-bold px-6 py-2.5 shadow-md transition-all transform hover:-translate-y-1 hover:shadow-lg text-responsive ring-1 ring-white/10 text-center ${getBtnRadiusClass('HERO_3')} ${settings.HERO_3_ALIGN === 'right' ? 'self-end' : settings.HERO_3_ALIGN === 'center' ? 'self-center' : 'self-start'}`}
          style={{
            ...getResponsiveVars('HERO_3_CTA', {m: '13px', t: '14px', d: '14px'}),
            backgroundColor: settings.HERO_3_BTN_BG_COLOR || '#c2410c',
            color: settings.HERO_3_BTN_TEXT_COLOR || '#ffffff'
          }}
          dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.HERO_3_CTA || t('shop_now')) }}
        />
      </div>
      {settings.HERO_3_IMAGE && settings.HERO_3_SHOW_IMAGE !== 'false' && (
        <Image src={settings.HERO_3_IMAGE} alt="Hero 3" width={800} height={800} className={`absolute top-4 w-[45%] sm:w-[50%] object-contain group-hover:scale-110 transition-transform duration-700 z-10 drop-shadow-xl ${settings.HERO_3_ALIGN === 'right' ? 'left-0' : 'right-0'}`} priority />
      )}
      {isPreview && sectionId && <HeroPreviewEditButton sectionId={sectionId} blockNum={3} />}
    </div>
  );

  const block4 = (
    <div 
      className={`rounded-2xl overflow-hidden relative p-8 sm:p-10 flex-col h-full min-h-[300px] lg:min-h-0 border border-gray-100/10 group flex w-full shadow-md ${getAlignFlexClass('HERO_4', 'left')} ${getVerticalAlignClass('HERO_4', 'bottom')}`}
      style={{
        backgroundColor: settings.HERO_4_BG_COLOR || '#111827',
      }}
    >
      
      {settings.HERO_4_BG_IMAGE && settings.HERO_4_SHOW_BG_IMAGE !== 'false' && (
        <>
          <Image src={settings.HERO_4_BG_IMAGE} alt="Background" fill priority fetchPriority="high" className="object-cover object-center z-0 transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px" quality={60} />
          <div className={`absolute inset-0 z-[1] transition-opacity duration-300 ${getOverlayClass('HERO_4', 'grad-r')}`} style={{ opacity: (parseInt(settings.HERO_4_BG_OVERLAY || '80', 10) / 100).toFixed(2) }}></div>
        </>
      )}
      <div className={`z-20 w-[70%] sm:w-[60%] lg:w-[55%] relative flex flex-col ${getMarginClass('HERO_4', 'bottom')} ${getAlignFlexClass('HERO_4', 'left')} ${getAlignSelfClass('HERO_4', 'left')}`}>
        <h2 
          className="font-extrabold mb-3 leading-snug whitespace-pre-line text-responsive drop-shadow-md" 
          style={{...getResponsiveVars('HERO_4_TITLE', {m: '24px', t: '28px', d: '32px'}), color: settings.HERO_4_TEXT_COLOR || '#ffffff'}}
          dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.HERO_4_TITLE || t('hero_4_title')) }}
        />
        {settings.HERO_4_SUBTITLE && (
          <p 
            className="mb-6 font-medium text-responsive drop-shadow" 
            style={{...getResponsiveVars('HERO_4_SUBTITLE', {m: '14px', t: '16px', d: '16px'}), color: settings.HERO_4_SUBTITLE_COLOR || '#d1d5db'}}
            dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.HERO_4_SUBTITLE) }}
          />
        )}
        <Link 
          href={settings.HERO_4_LINK || '/#'} 
          className={`inline-block font-bold px-8 py-3 shadow-md transition-all transform hover:-translate-y-1 hover:shadow-lg text-responsive ring-1 ring-white/20 text-center ${getBtnRadiusClass('HERO_4')} ${settings.HERO_4_ALIGN === 'right' ? 'self-end' : settings.HERO_4_ALIGN === 'center' ? 'self-center' : 'self-start'}`}
          style={{
            ...getResponsiveVars('HERO_4_CTA', {m: '14px', t: '15px', d: '15px'}),
            backgroundColor: settings.HERO_4_BTN_BG_COLOR || '#c2410c',
            color: settings.HERO_4_BTN_TEXT_COLOR || '#ffffff'
          }}
          dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.HERO_4_CTA || t('shop_now')) }}
        />
      </div>
      {settings.HERO_4_IMAGE && settings.HERO_4_SHOW_IMAGE !== 'false' && (
        <Image src={settings.HERO_4_IMAGE} alt="Hero 4" width={800} height={800} className={`absolute sm:top-1/2 sm:-translate-y-1/2 bottom-0 w-[45%] sm:w-[40%] object-contain group-hover:scale-110 transition-transform duration-700 z-10 drop-shadow-2xl ${settings.HERO_4_ALIGN === 'right' ? 'left-0 sm:left-4' : 'right-0 sm:right-4'}`} priority />
      )}
      {isPreview && sectionId && <HeroPreviewEditButton sectionId={sectionId} blockNum={4} />}
    </div>
  );

  const isStyle2 = settings.HERO_LAYOUT !== 'STYLE_1';

  const block1Style2 = (
    <div 
      className="rounded-lg overflow-hidden relative p-8 sm:p-12 md:p-14 flex flex-col justify-between h-full min-h-[460px] border border-gray-200 group w-full bg-[#f8f9fa] shadow-sm"
      style={{
        backgroundColor: settings.STYLE2_HERO_1_BG_COLOR || '#f8f9fa',
      }}
    >
      {settings.STYLE2_HERO_1_BG_IMAGE && settings.STYLE2_HERO_1_SHOW_BG_IMAGE !== 'false' && (
        <>
          <Image src={settings.STYLE2_HERO_1_BG_IMAGE} alt="Background" fill priority fetchPriority="high" className="object-cover object-center z-0" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 800px" quality={75} />
          <div className="absolute inset-0 z-[1] transition-opacity duration-300" style={{ backgroundColor: `rgba(0,0,0,${(parseInt(settings.STYLE2_HERO_1_BG_OVERLAY || '0', 10) / 100).toFixed(2)})` }}></div>
        </>
      )}

      {/* Left Text Content */}
      <div className="z-20 w-full sm:w-[65%] md:w-[55%] flex flex-col justify-between h-full">
        <div>
          {/* Subtitle / Sale Offer */}
          <div className="text-gray-600 text-sm md:text-base font-semibold mb-3">
            {settings.STYLE2_HERO_1_SUBTITLE ? (
              <span dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.STYLE2_HERO_1_SUBTITLE) }} />
            ) : (
              <span>Sale Offer <span className="text-[#e01b1b] font-bold">Black Friday</span> This Week</span>
            )}
          </div>

          {/* Big Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-6">
            {settings.STYLE2_HERO_1_TITLE ? (
              <span dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(settings.STYLE2_HERO_1_TITLE) }} />
            ) : (
              <>Work Desk<br />Surface Studio 2018</>
            )}
          </h1>

          {/* Price */}
          <div className="text-lg md:text-xl text-gray-700 font-medium mb-8">
            Starting at <span className="text-[#e01b1b] font-bold text-2xl md:text-3xl ml-1">{settings.STYLE2_HERO_1_PRICE || '$824.00'}</span>
          </div>
        </div>

        {/* Yellow Button */}
        <div>
          <Link 
            href={settings.STYLE2_HERO_1_LINK || '/shop'} 
            className="inline-block bg-[#fed700] hover:bg-[#eab308] text-gray-900 font-extrabold px-8 py-3.5 rounded-md shadow-sm transition-all text-xs tracking-wider uppercase cursor-pointer"
          >
            {settings.STYLE2_HERO_1_CTA || 'SHOP NOW'}
          </Link>
        </div>
      </div>

      {/* Hero 1 Image */}
      {settings.STYLE2_HERO_1_IMAGE && settings.STYLE2_HERO_1_SHOW_IMAGE !== 'false' && (
        <Image 
          src={settings.STYLE2_HERO_1_IMAGE} 
          alt="Hero Product" 
          width={800} 
          height={800} 
          className="absolute right-0 bottom-4 w-3/4 md:w-2/3 lg:w-[58%] h-[85%] object-contain object-right-bottom group-hover:scale-105 transition-transform duration-700 z-10 pointer-events-none" 
        />
      )}

      {/* Slider dots pagination indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-20">
        <span className="w-2.5 h-2.5 rounded-full bg-[#fed700]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
      </div>

      {isPreview && sectionId && <HeroPreviewEditButton sectionId={sectionId} blockNum={1} />}
    </div>
  );

  const block2Style2 = (
    <div 
      className="rounded-lg overflow-hidden relative p-6 sm:p-7 flex flex-col justify-center border border-gray-200 group h-full w-full bg-[#f8f9fa] shadow-sm"
      style={{
        backgroundColor: settings.STYLE2_HERO_2_BG_COLOR || '#f8f9fa',
      }}
    >
      {settings.STYLE2_HERO_2_BG_IMAGE && settings.STYLE2_HERO_2_SHOW_BG_IMAGE !== 'false' && (
        <>
          <Image src={settings.STYLE2_HERO_2_BG_IMAGE} alt="Background" fill priority fetchPriority="high" className="object-cover object-center z-0" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px" quality={65} />
          <div className="absolute inset-0 z-[1] transition-opacity duration-300" style={{ backgroundColor: `rgba(0,0,0,${(parseInt(settings.STYLE2_HERO_2_BG_OVERLAY || '0', 10) / 100).toFixed(2)})` }}></div>
        </>
      )}

      <div className="z-20 w-[60%] flex flex-col justify-center">
        <span className="text-sky-600 font-semibold text-xs md:text-sm mb-2">
          {settings.STYLE2_HERO_2_CATEGORY || 'Full HD Display'}
        </span>
        <h2 className="font-bold text-gray-900 text-lg md:text-xl mb-3 leading-snug">
          {settings.STYLE2_HERO_2_TITLE || 'Smartphone Meizu M5 New Color Green'}
        </h2>
        <p className="text-[#e01b1b] font-bold text-sm md:text-base">
          {settings.STYLE2_HERO_2_SUBTITLE || 'Sale 20% Off'}
        </p>
      </div>

      {settings.STYLE2_HERO_2_IMAGE && settings.STYLE2_HERO_2_SHOW_IMAGE !== 'false' && (
        <div className="absolute right-0 top-0 bottom-0 w-[45%] p-3 flex items-center justify-end z-10 pointer-events-none">
          <Image src={settings.STYLE2_HERO_2_IMAGE} alt="Hero 2" width={500} height={500} className="w-full h-full object-contain object-right group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      {isPreview && sectionId && <HeroPreviewEditButton sectionId={sectionId} blockNum={2} />}
    </div>
  );

  const block3Style2 = (
    <div 
      className="rounded-lg overflow-hidden relative p-6 sm:p-7 flex flex-col justify-center border border-gray-200 group h-full w-full bg-[#f8f9fa] shadow-sm"
      style={{
        backgroundColor: settings.STYLE2_HERO_3_BG_COLOR || '#f8f9fa',
      }}
    >
      {settings.STYLE2_HERO_3_BG_IMAGE && settings.STYLE2_HERO_3_SHOW_BG_IMAGE !== 'false' && (
        <>
          <Image src={settings.STYLE2_HERO_3_BG_IMAGE} alt="Background" fill priority fetchPriority="high" className="object-cover object-center z-0" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px" quality={65} />
          <div className="absolute inset-0 z-[1] transition-opacity duration-300" style={{ backgroundColor: `rgba(0,0,0,${(parseInt(settings.STYLE2_HERO_3_BG_OVERLAY || '0', 10) / 100).toFixed(2)})` }}></div>
        </>
      )}

      <div className="z-20 w-[60%] flex flex-col justify-center">
        <span className="text-sky-600 font-semibold text-xs md:text-sm mb-2">
          {settings.STYLE2_HERO_3_CATEGORY || 'Sale 20% Off All Store'}
        </span>
        <h2 className="font-bold text-gray-900 text-lg md:text-xl mb-3 leading-snug">
          {settings.STYLE2_HERO_3_TITLE || 'Playstaytion VR Plus Network 2018'}
        </h2>
        <p className="text-[#e01b1b] font-bold text-sm md:text-base">
          {settings.STYLE2_HERO_3_SUBTITLE || 'Sale 20% Off'}
        </p>
      </div>

      {settings.STYLE2_HERO_3_IMAGE && settings.STYLE2_HERO_3_SHOW_IMAGE !== 'false' && (
        <div className="absolute right-0 top-0 bottom-0 w-[45%] p-3 flex items-center justify-end z-10 pointer-events-none">
          <Image src={settings.STYLE2_HERO_3_IMAGE} alt="Hero 3" width={500} height={500} className="w-full h-full object-contain object-right group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      {isPreview && sectionId && <HeroPreviewEditButton sectionId={sectionId} blockNum={3} />}
    </div>
  );

  return (
    <section className="max-w-7xl mx-auto px-4 w-full py-6 font-sans">
      {/* DESKTOP VIEW */}
      {isStyle2 ? (
        <div className="hidden lg:grid grid-cols-12 gap-6 h-[600px]">
          <div className="col-span-8 h-full">
            {block1Style2}
          </div>
          <div className="col-span-4 flex flex-col gap-6 h-full">
            <div className="h-[48%]">
              {block2Style2}
            </div>
            <div className="h-[48%] mt-auto">
              {block3Style2}
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:grid grid-cols-12 gap-6 h-[600px]">
          <div className="col-span-4 h-full">
            {block1}
          </div>
          <div className="col-span-8 flex flex-col gap-6 h-full">
            <div className="grid grid-cols-2 gap-6 h-[50%]">
              {block2}
              {block3}
            </div>
            <div className="h-[50%]">
              {block4}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE VIEW (AutoSlider) */}
      {isStyle2 ? (
        <HeroMobileSliderWrapper childCount={2}>
          <div className="w-full h-full flex-shrink-0 snap-center relative">
            {block1Style2}
          </div>
          <div className="w-full h-full flex-shrink-0 snap-center relative flex flex-col gap-4">
            <div className="flex-1 min-h-[250px]">{block2Style2}</div>
            <div className="flex-1 min-h-[250px]">{block3Style2}</div>
          </div>
        </HeroMobileSliderWrapper>
      ) : (
        <HeroMobileSliderWrapper childCount={[
          settings.HERO_1_HIDE_MOBILE !== 'true',
          settings.HERO_2_HIDE_MOBILE !== 'true',
          settings.HERO_3_HIDE_MOBILE !== 'true',
          settings.HERO_4_HIDE_MOBILE !== 'true'
        ].filter(Boolean).length}>
          {settings.HERO_1_HIDE_MOBILE !== 'true' && <div className="w-full h-full flex-shrink-0 snap-center relative">{block1}</div>}
          {settings.HERO_2_HIDE_MOBILE !== 'true' && <div className="w-full h-full flex-shrink-0 snap-center relative">{block2}</div>}
          {settings.HERO_3_HIDE_MOBILE !== 'true' && <div className="w-full h-full flex-shrink-0 snap-center relative">{block3}</div>}
          {settings.HERO_4_HIDE_MOBILE !== 'true' && <div className="w-full h-full flex-shrink-0 snap-center relative">{block4}</div>}
        </HeroMobileSliderWrapper>
      )}
    </section>
  );
}
