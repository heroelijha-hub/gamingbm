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
          <div className="text-gray-600 text-xs sm:text-sm md:text-base font-semibold mb-3">
            <span dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(subtitle) }} />
          </div>

          {/* Big Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-gray-900 tracking-tight leading-[1.18] mb-5">
            <span dangerouslySetInnerHTML={{ __html: basicSanitizeHtml(title) }} />
          </h2>

          {/* Price */}
          <div className="text-base sm:text-lg md:text-xl text-gray-700 font-medium mb-7">
            {priceLabel} <span className="text-[#e01b1b] font-bold text-2xl sm:text-3xl ml-1">{price}</span>
          </div>

          {/* Button */}
          <div>
            <Link 
              href={link} 
              className="inline-block bg-[#fed700] hover:bg-[#eab308] text-gray-900 font-extrabold px-8 py-3.5 rounded-md shadow-sm transition-all text-xs tracking-wider uppercase cursor-pointer"
            >
              {ctaText}
            </Link>
          </div>
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

