import Image from 'next/image';
import { getFilteredProducts } from '@/actions/public';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import CountdownTimer from './CountdownTimer';
import ProductSliderWrapper from './ProductSliderWrapper';
import BestDealsCard from './BestDealsCard';
import { getTranslations } from 'next-intl/server';
import { getCachedSettings } from '@/lib/cache';

// Internal star component
const Star = ({ filled = true }: { filled?: boolean }) => (
  <svg 
    className={`w-4 h-4 ${filled ? 'text-orange-600' : 'text-gray-300'}`} 
    fill="currentColor" 
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const staticProducts = [
  { id: 1, imagePlaceholder: '📱', category: 'Electronics', title: '256GB iphone 16 pro max Ratina Reday', rating: 5, ratingText: '(5.00)', rawPrice: 18.00 },
  { id: 2, imagePlaceholder: '👟', category: 'Clothings', title: 'Niki Dust & Water Proof Comfort Sneakers', rating: 5, ratingText: '(5.00)', rawPrice: 19.00 },
  { id: 3, imagePlaceholder: '🍯', category: 'Gift Box', title: 'Heinz Portion Healthy Food For Everyday', rating: 3, ratingText: '(2.00)', rawPrice: 18.00 },
  { id: 4, imagePlaceholder: '⌚', category: 'Clothings', title: 'Explore Pixel and Samsung Watches with...', rating: 5, ratingText: '(5.00)', rawPrice: 33.00, discount: '-14%' },
  { id: 5, imagePlaceholder: '🪑', category: 'Electronics', title: 'Soft Bamboo Entryway Flexible Sofa set', rating: 5, ratingText: '(5.00)', rawPrice: 18.00, discount: '-18%' },
  { id: 6, imagePlaceholder: '🚲', category: 'Cosmetics', title: 'Bike Frame Performance 700C 49/51/54/57cm', rating: 5, ratingText: '(5.00)', rawPrice: 23.00 },
];

export default async function BestDeals({ config }: { config?: any }) {
  const filterType = config?.filterType || 'ON_SALE';
  const categoryId = config?.categoryId || undefined;
  
  const maxNum = parseInt(config?.maxProducts || '6', 10) || 6;
  const dbProducts = await getFilteredProducts(filterType, categoryId, maxNum, config?.productIds);
  const settings = { ...(await getCachedSettings()) };
  
  if (config) {
    Object.assign(settings, config);
  }
  
  const t = await getTranslations('Home');

  const getResponsiveVars = (baseKey: string, defaultSizes: { m: string, t: string, d: string }) => {
    return {
      '--sz-m': settings[`${baseKey}_SIZE_MOBILE`] || defaultSizes.m,
      '--sz-t': settings[`${baseKey}_SIZE_TABLET`] || defaultSizes.t,
      '--sz-d': settings[`${baseKey}_SIZE_DESKTOP`] || defaultSizes.d,
    } as React.CSSProperties;
  };
  
  const showMobileTimer = settings.SHOW_TIMER_MOBILE !== 'false';
  const showTabletTimer = settings.SHOW_TIMER_TABLET !== 'false';
  const showDesktopTimer = settings.SHOW_TIMER_DESKTOP !== 'false';
  
  // Utiliser les produits de la BDD s'il y en a, sinon fallback sur les statiques
  const displayProducts = dbProducts.map(p => {
    const approvedReviews = (p as any).reviews || [];
    const ratingCount = approvedReviews.length;
    const avgRating = ratingCount > 0 ? approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / ratingCount : 0;
    
    return {
      id: p.id,
      slug: p.slug,
      imageUrl: p.images[0],
      category: p.categories && p.categories.length > 0 ? p.categories[0].name : 'N/A',
      title: p.title,
      rating: ratingCount > 0 ? Math.round(avgRating) : 0,
      ratingText: ratingCount > 0 ? `(${avgRating.toFixed(2)})` : '',
      rawPrice: p.price,
      discount: p.discountLabel || undefined,
      imagePlaceholder: '🛍️'
    };
  });

  const seeAllUrl = config?.seeAllUrl || (categoryId ? `/product-category/${categoryId}` : '/deals');

  return (
    <section className={`max-w-7xl mx-auto px-4 w-full py-12 font-sans${config?.hideMobile ? ' hidden sm:block' : ''}`}>
      
      {/* Header Section */}
      <div className="flex flex-col gap-3 mb-6">
        
        {/* Mobile Timer (visible only on mobile) */}
        {showMobileTimer && (
          <div className="block md:hidden">
            <div className="flex items-center gap-1 sm:gap-2 border border-orange-200 bg-orange-50/50 px-2 sm:px-4 py-1.5 rounded text-xs sm:text-sm text-gray-800 font-semibold w-fit">
              <CountdownTimer targetDate={config?.countdown || '2026-12-31T23:59:59'} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 
              className="font-bold text-gray-900 text-[length:var(--sz-m)] md:text-[length:var(--sz-t)] lg:text-[length:var(--sz-d)]"
              style={getResponsiveVars('title', {m: '20px', t: '24px', d: '24px'})}
            >
              {config?.title || t('best_deals_title')}
            </h2>
            
            {/* Desktop / Tablet Timer */}
            {(showTabletTimer || showDesktopTimer) && (
              <div className={`hidden ${showTabletTimer ? 'md:flex' : 'md:hidden'} ${showDesktopTimer ? 'lg:flex' : 'lg:hidden'} items-center gap-1 sm:gap-2 border border-orange-200 bg-orange-50/50 px-2 sm:px-4 py-1.5 rounded text-xs sm:text-sm text-gray-800 font-semibold`}>
                <CountdownTimer targetDate={config?.countdown || '2026-12-31T23:59:59'} />
              </div>
            )}
          </div>

          {config?.SEE_ALL_TEXT !== '' && (
            <Link href={seeAllUrl} className="flex items-center text-sm font-semibold text-gray-900 hover:text-orange-600 transition whitespace-nowrap text-[length:var(--sz-m)] md:text-[length:var(--sz-t)] lg:text-[length:var(--sz-d)]" style={getResponsiveVars('SEE_ALL_TEXT', {m: '14px', t: '14px', d: '14px'})}>
              {config?.SEE_ALL_TEXT || t('see_all')}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Products Slider */}
      <div className="mb-8 relative">
        {displayProducts.length > 0 ? (
          <ProductSliderWrapper>
            {displayProducts.map((product) => (
              <BestDealsCard 
                key={product.id}
                product={product}
                borderColor={config?.cardBorderColor || settings.BESTDEALS_CARD_BORDER_COLOR || '#e5e7eb'}
                btnBgColor={config?.btnBgColor || settings.BESTDEALS_BTN_BG_COLOR || '#ea580c'}
                btnTextColor={config?.btnTextColor || settings.BESTDEALS_BTN_TEXT_COLOR || '#ffffff'}
                btnHoverBgColor={config?.btnHoverBgColor || settings.BESTDEALS_BTN_HOVER_BG_COLOR || '#c2410c'}
                btnHoverTextColor={config?.btnHoverTextColor || settings.BESTDEALS_BTN_HOVER_TEXT_COLOR || '#ffffff'}
              />
            ))}
          </ProductSliderWrapper>
        ) : (
          <div className="text-center py-12 text-gray-500 font-medium">Aucun produit ne correspond à ces critères (ex: catégorie ou promotion).</div>
        )}
      </div>

      {/* Promo Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Banner */}
        {settings.SHOW_PROMO_1 !== 'false' && (
          <div 
            className="bg-[#E5F1FC] rounded-xl overflow-hidden relative flex p-6 sm:p-8 h-[240px] border border-gray-100 items-center"
            style={{
              backgroundColor: settings.PROMO_1_BG_COLOR || undefined,
              backgroundImage: settings.PROMO_1_BG_IMAGE ? `url(${settings.PROMO_1_BG_IMAGE})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="z-20 w-[60%] sm:w-1/2">
              <span 
                className="text-orange-700 font-bold block mb-2 text-[length:var(--sz-m)] md:text-[length:var(--sz-t)] lg:text-[length:var(--sz-d)]"
                style={getResponsiveVars('PROMO_1_SUBTITLE', {m: '14px', t: '14px', d: '14px'})}
              >
                {settings.PROMO_1_SUBTITLE || t('promo_1_subtitle')}
              </span>
              <h2 
                className="font-bold text-gray-900 mb-6 leading-tight whitespace-pre-line text-[length:var(--sz-m)] md:text-[length:var(--sz-t)] lg:text-[length:var(--sz-d)]" 
                style={{ ...getResponsiveVars('PROMO_1_TITLE', {m: '24px', t: '30px', d: '30px'}), ...(settings.PROMO_1_TEXT_COLOR ? { color: settings.PROMO_1_TEXT_COLOR } : {}) }}
              >
                {settings.PROMO_1_TITLE || t('promo_1_title')}
              </h2>
              <Link 
                href={settings.PROMO_1_LINK || '/#'} 
                className="inline-block bg-white text-gray-900 font-semibold px-6 py-2.5 rounded hover:bg-gray-50 transition shadow-sm"
                style={{
                  backgroundColor: settings.PROMO_1_BTN_BG_COLOR || undefined,
                  color: settings.PROMO_1_BTN_TEXT_COLOR || undefined
                }}
              >
                {settings.PROMO_1_CTA || t('shop_now')}
              </Link>
            </div>
            {/* Image */}
            {settings.PROMO_1_IMAGE && (
               <Image src={settings.PROMO_1_IMAGE} alt={settings.PROMO_1_TITLE || "Offre promotionnelle"} width={800} height={800} className="absolute right-0 top-0 h-full w-[45%] sm:w-1/2 object-contain z-10" />
            )}
            {!settings.PROMO_1_IMAGE && !settings.PROMO_1_BG_IMAGE && (
              <div className="absolute right-[-10%] sm:right-[-5%] top-4 w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center z-10">
                 <div className="w-20 h-24 sm:w-24 sm:h-28 bg-zinc-800 rounded-3xl border-[6px] border-zinc-700 shadow-xl rotate-12 z-20 flex items-center justify-center -mr-4">
                     <span className="text-white text-xs font-mono">09:28</span>
                 </div>
                 <div className="w-20 h-24 sm:w-24 sm:h-28 bg-zinc-800 rounded-3xl border-[6px] border-gray-300 shadow-xl -rotate-12 z-10 flex items-center justify-center">
                     <span className="text-pink-400 text-xs font-mono">09:28</span>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* Right Banner */}
        {settings.SHOW_PROMO_2 !== 'false' && (
          <div 
            className="bg-[#FBE9DC] rounded-xl overflow-hidden relative flex p-6 sm:p-8 h-[240px] border border-gray-100 items-center"
            style={{
              backgroundColor: settings.PROMO_2_BG_COLOR || undefined,
              backgroundImage: settings.PROMO_2_BG_IMAGE ? `url(${settings.PROMO_2_BG_IMAGE})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="z-20 w-[60%] sm:w-1/2">
              <h2 
                className="font-bold text-gray-900 mb-2 leading-tight whitespace-pre-line text-[length:var(--sz-m)] md:text-[length:var(--sz-t)] lg:text-[length:var(--sz-d)]" 
                style={{ ...getResponsiveVars('PROMO_2_TITLE', {m: '24px', t: '30px', d: '30px'}), ...(settings.PROMO_2_TEXT_COLOR ? { color: settings.PROMO_2_TEXT_COLOR } : {}) }}
              >
                {settings.PROMO_2_TITLE || t('promo_2_title')}
              </h2>
              <p 
                className="font-bold text-gray-800 mb-6 text-[length:var(--sz-m)] md:text-[length:var(--sz-t)] lg:text-[length:var(--sz-d)]" 
                style={{ ...getResponsiveVars('PROMO_2_SUBTITLE', {m: '18px', t: '18px', d: '18px'}), ...(settings.PROMO_2_TEXT_COLOR ? { color: settings.PROMO_2_TEXT_COLOR } : {}) }}
              >
                {settings.PROMO_2_SUBTITLE || t('promo_2_subtitle')}
              </p>
              <Link 
                href={settings.PROMO_2_LINK || '/#'} 
                className="inline-block bg-[#FF5C00] text-white font-semibold px-6 py-2.5 rounded hover:bg-[#E55300] transition shadow-sm"
                style={{
                  backgroundColor: settings.PROMO_2_BTN_BG_COLOR || undefined,
                  color: settings.PROMO_2_BTN_TEXT_COLOR || undefined
                }}
              >
                {settings.PROMO_2_CTA || t('shop_now')}
              </Link>
            </div>
            {/* Image */}
            {settings.PROMO_2_IMAGE && (
               <Image src={settings.PROMO_2_IMAGE} alt={settings.PROMO_2_TITLE || "Offre promotionnelle"} width={800} height={800} className="absolute right-0 bottom-0 h-full w-[45%] sm:w-1/2 object-contain z-10" />
            )}
            {!settings.PROMO_2_IMAGE && !settings.PROMO_2_BG_IMAGE && (
              <div className="absolute right-2 sm:right-4 bottom-0 w-[45%] sm:w-1/2 h-[90%] flex items-end justify-center space-x-1 z-10">
                  <div className="w-12 h-32 sm:w-16 sm:h-40 bg-teal-200 rounded-t-full rounded-b-lg border-2 border-white shadow-lg z-10 -ml-2 sm:-ml-4"></div>
                  <div className="w-12 h-36 sm:w-16 sm:h-44 bg-amber-200 rounded-t-full rounded-b-lg border-2 border-white shadow-lg z-20"></div>
                  <div className="w-12 h-28 sm:w-16 sm:h-36 bg-orange-200 rounded-t-full rounded-b-lg border-2 border-white shadow-lg z-10"></div>
              </div>
            )}
          </div>
        )}

      </div>

    </section>
  );
}
