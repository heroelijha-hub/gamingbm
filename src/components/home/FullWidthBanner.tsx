import Image from 'next/image';
import Link from 'next/link';
import { basicSanitizeHtml } from '@/lib/security';

interface FullWidthBannerProps {
  config?: any;
}

export default function FullWidthBanner({ config }: FullWidthBannerProps) {
  const subtitle = config?.BANNER_SUBTITLE || 'Sale Offer <span class="text-[#e01b1b] font-bold">-20% Off</span> This Week';
  const title = config?.BANNER_TITLE || 'Featured Product<br />Apple Accessories 2018';
  const price = config?.BANNER_PRICE || '$1209.00';
  const priceLabel = config?.BANNER_PRICE_LABEL || 'Starting at';
  const ctaText = config?.BANNER_CTA || 'SHOPPING NOW';
  const link = config?.BANNER_LINK || '/shop';
  const bgColor = config?.BANNER_BG_COLOR || '#f8f9fa';
  const bgImage = config?.BANNER_BG_IMAGE;
  const mainImage = config?.BANNER_IMAGE;

  // Colors
  const titleColor = config?.BANNER_TITLE_COLOR || '#111827';
  const subtitleColor = config?.BANNER_SUBTITLE_COLOR || '#4b5563';
  const priceColor = config?.BANNER_PRICE_COLOR || '#e01b1b';
  const priceLabelColor = config?.BANNER_PRICE_LABEL_COLOR || '#374151';
  const btnBgColor = config?.BANNER_BTN_BG_COLOR || '#fed700';
  const btnTextColor = config?.BANNER_BTN_TEXT_COLOR || '#111827';

  // Responsive typography variables helper
  const getResponsiveVars = (baseKey: string, defaultSizes: { m: string, t: string, d: string }, defaultLh?: string) => {
    const vars: any = {
      '--sz-m': config?.[`${baseKey}_SIZE_MOBILE`] || defaultSizes.m,
      '--sz-t': config?.[`${baseKey}_SIZE_TABLET`] || defaultSizes.t,
      '--sz-d': config?.[`${baseKey}_SIZE_DESKTOP`] || defaultSizes.d,
    };
    
    if (config?.[`${baseKey}_LINE_HEIGHT_MOBILE`]) vars['--lh-m'] = config[`${baseKey}_LINE_HEIGHT_MOBILE`];
    else if (defaultLh) vars['--lh-m'] = defaultLh;

    if (config?.[`${baseKey}_LINE_HEIGHT_TABLET`]) vars['--lh-t'] = config[`${baseKey}_LINE_HEIGHT_TABLET`];
    else if (defaultLh) vars['--lh-t'] = defaultLh;

    if (config?.[`${baseKey}_LINE_HEIGHT_DESKTOP`]) vars['--lh-d'] = config[`${baseKey}_LINE_HEIGHT_DESKTOP`];
    else if (defaultLh) vars['--lh-d'] = defaultLh;
    
    if (config?.[`${baseKey}_LETTER_SPACING_MOBILE`]) vars['--ls-m'] = config[`${baseKey}_LETTER_SPACING_MOBILE`];
    if (config?.[`${baseKey}_LETTER_SPACING_TABLET`]) vars['--ls-t'] = config[`${baseKey}_LETTER_SPACING_TABLET`];
    if (config?.[`${baseKey}_LETTER_SPACING_DESKTOP`]) vars['--ls-d'] = config[`${baseKey}_LETTER_SPACING_DESKTOP`];

    return vars as React.CSSProperties;
  };

  return (
    <section className="max-w-7xl mx-auto px-4 w-full py-6 font-sans">
      <div 
        className="rounded-xl overflow-hidden relative border border-gray-200 group w-full min-h-[300px] md:min-h-[340px] flex items-center shadow-sm p-8 sm:p-12 md:p-14"
        style={{
          backgroundColor: bgColor,
        }}
      >
        {/* Background image if provided */}
        {bgImage && (
          <>
            <Image 
              src={bgImage} 
              alt="Background" 
              fill 
              priority 
              className="object-cover object-center z-0" 
              sizes="100vw"
              quality={80} 
            />
            <div 
              className="absolute inset-0 z-[1] transition-opacity duration-300" 
              style={{ backgroundColor: `rgba(0,0,0,${(parseInt(config?.BANNER_BG_OVERLAY || '0', 10) / 100).toFixed(2)})` }}
            />
          </>
        )}

        {/* Content Side */}
        <div className="z-20 w-full sm:w-[65%] md:w-[50%] flex flex-col justify-center">
          {/* Subtitle */}
          {subtitle && (
            <div 
              className="text-responsive font-semibold mb-3"
              style={{
                ...getResponsiveVars('BANNER_SUBTITLE', { m: '13px', t: '14px', d: '15px' }, '1.3'),
                color: subtitleColor,
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(subtitle) }} />
            </div>
          )}

          {/* Big Title */}
          {title && (
            <h2 
              className="text-responsive font-extrabold tracking-tight mb-5"
              style={{
                ...getResponsiveVars('BANNER_TITLE', { m: '24px', t: '32px', d: '40px' }, '1.18'),
                color: titleColor,
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(title) }} />
            </h2>
          )}

          {/* Price */}
          {(price || priceLabel) && (
            <div 
              className="text-responsive font-medium mb-7 flex items-baseline flex-wrap gap-1"
              style={{
                ...getResponsiveVars('BANNER_PRICE_LABEL', { m: '15px', t: '16px', d: '18px' }),
                color: priceLabelColor,
              }}
            >
              {priceLabel && <span>{priceLabel}</span>}
              {price && (
                <span 
                  className="font-bold ml-1 inline-block"
                  style={{
                    ...getResponsiveVars('BANNER_PRICE', { m: '22px', t: '26px', d: '30px' }),
                    color: priceColor,
                  }}
                  dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(price) }}
                />
              )}
            </div>
          )}

          {/* Button */}
          {ctaText && (
            <div>
              <Link 
                href={link} 
                className="inline-block font-extrabold px-8 py-3.5 rounded-md shadow-sm transition-all duration-200 tracking-wider uppercase cursor-pointer hover:opacity-90 hover:scale-[1.02] text-responsive"
                style={{
                  ...getResponsiveVars('BANNER_CTA', { m: '12px', t: '13px', d: '13px' }),
                  backgroundColor: btnBgColor,
                  color: btnTextColor,
                }}
              >
                {ctaText}
              </Link>
            </div>
          )}
        </div>

        {/* Main Banner Image (Right-aligned / overflow visual) */}
        {mainImage && (
          <div className="absolute right-0 top-0 bottom-0 w-3/4 sm:w-3/5 md:w-1/2 lg:w-[55%] pointer-events-none z-10 flex items-center justify-end">
            <Image 
              src={mainImage} 
              alt="Banner Product" 
              width={1000} 
              height={600} 
              className="w-full h-full object-contain object-right group-hover:scale-105 transition-transform duration-700" 
            />
          </div>
        )}
      </div>
    </section>
  );
}

