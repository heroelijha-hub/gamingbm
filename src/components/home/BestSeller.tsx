import Image from 'next/image';
import Link from 'next/link';
import prisma from '@/lib/prisma';

import { getFilteredProducts } from '@/actions/public';
import Price from '@/components/Price';
import { getTranslations } from 'next-intl/server';
import { AddToCartBtn, AddToCartBtnBig, WishlistBtn, QuickviewBtn } from './BestSellerActions';

// ... (Star component kept the same)
const Star = ({ filled = true }: { filled?: boolean }) => (
  <svg 
    className={`w-4 h-4 ${filled ? 'text-orange-600' : 'text-gray-300'}`} 
    fill="currentColor" 
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const DummyProduct = {
  id: 'dummy-123',
  title: 'Demo Product',
  price: 29.99,
  imageUrl: 'https://via.placeholder.com/150',
  slug: 'demo-product'
};

const SmallCard = ({ product, icon, title, price, rating, ratingText, imageUrl, linkUrl = '#', borderColor }: { product?: any, icon: string, title: string, price: number, rating?: number, ratingText?: string, imageUrl?: string, linkUrl?: string, borderColor?: string }) => {
  const p = product || { ...DummyProduct, title, price, imageUrl };
  return (
    <div className="flex flex-col h-full relative group">
      <div className="flex flex-col flex-1">
        <Link href={linkUrl} className="cursor-pointer group/img">
          <div className="border rounded-xl mb-2 sm:mb-3 aspect-square flex items-center justify-center p-2 sm:p-4 bg-white shadow-sm group-hover/img:shadow-md transition overflow-hidden" style={{ borderColor: borderColor || '#f3f4f6' }}>
            {imageUrl ? (
              <Image src={imageUrl} alt={title} width={600} height={600} loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 250px" className="w-full h-full object-cover group-hover/img:scale-105 transition duration-500" />
            ) : (
              <div className="text-3xl sm:text-5xl group-hover/img:scale-110 transition duration-500">{icon}</div>
            )}
          </div>
        </Link>
        <Link href={linkUrl} className="cursor-pointer">
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 leading-snug line-clamp-2 mb-1 group-hover:text-orange-600 transition">
            {title}
          </h3>
        </Link>
        {rating !== undefined && ratingText && (
          <div className="flex items-center gap-1 mb-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} filled={star <= rating} />
              ))}
            </div>
            <span className="text-[10px] text-gray-500 font-medium">{ratingText}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-auto pt-2">
        <Price amount={price} className="text-xs sm:text-sm font-bold text-gray-900" />
        <AddToCartBtn 
          product={p} 
          btnBgColor={(p as any).btnBgColor} 
          btnTextColor={(p as any).btnTextColor} 
          btnHoverBgColor={(p as any).btnHoverBgColor}
          btnHoverTextColor={(p as any).btnHoverTextColor}
        />
      </div>
    </div>
  );
};

const BigCard = ({ 
  product, icon, category, title, price, rating, ratingText, imageUrl, linkUrl = '#', borderColor 
}: { 
  product?: any, icon: string, category: string, title: string, price: number, rating: number, ratingText: string, imageUrl?: string, linkUrl?: string, borderColor?: string 
}) => {
  const p = product || { ...DummyProduct, title, price, imageUrl };
  return (
    <div className="border rounded-xl p-5 flex flex-col h-full group bg-white relative transition hover:shadow-lg" style={{ borderColor: borderColor || '#e5e7eb' }}>
      
      {/* Action buttons (Wishlist, Quickview) on top right */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto">
        <WishlistBtn 
          product={p} 
          btnBgColor={(p as any).btnBgColor} 
          btnTextColor={(p as any).btnTextColor} 
          btnHoverBgColor={(p as any).btnHoverBgColor}
          btnHoverTextColor={(p as any).btnHoverTextColor}
        />
        <QuickviewBtn 
          product={p} 
          btnBgColor={(p as any).btnBgColor} 
          btnTextColor={(p as any).btnTextColor} 
          btnHoverBgColor={(p as any).btnHoverBgColor}
          btnHoverTextColor={(p as any).btnHoverTextColor}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <Link href={linkUrl} className="flex-1 flex items-center justify-center mb-6 py-10 bg-gray-50/50 rounded-lg overflow-hidden cursor-pointer group/img">
          {imageUrl ? (
            <Image src={imageUrl} alt={title} width={600} height={600} loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 250px" className="w-full h-full object-contain group-hover/img:scale-105 transition duration-500" />
          ) : (
            <div className="text-8xl group-hover/img:scale-110 transition duration-500">{icon}</div>
          )}
        </Link>
        <div className="mt-auto">
          <p className="text-xs text-gray-500 mb-1 z-20 relative">
            <Link href={(p as any).categorySlug ? `/product-category/${(p as any).categorySlug}` : '/shop'} className="hover:text-orange-600 hover:underline">
              {category}
            </Link>
          </p>
          <Link href={linkUrl} className="cursor-pointer">
            <h3 className="text-base font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-orange-600 transition">
              {title}
            </h3>
          </Link>
          {ratingText && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} filled={star <= rating} />
                ))}
              </div>
              <span className="text-xs text-gray-500 font-medium">{ratingText}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <Price amount={price} className="font-bold text-gray-900" />
        <AddToCartBtnBig 
          product={p} 
          btnBgColor={(p as any).btnBgColor} 
          btnTextColor={(p as any).btnTextColor} 
          btnHoverBgColor={(p as any).btnHoverBgColor}
          btnHoverTextColor={(p as any).btnHoverTextColor}
        />
      </div>
    </div>
  );
};

export default async function BestSeller({ config }: { config?: any }) {
  const filterType = config?.filterType || 'POPULAR';
  const categoryId = config?.categoryId || undefined;

  const dbProducts = await getFilteredProducts(filterType, categoryId, 10, config?.productIds);
  const settings = await import('@/lib/cache').then(m => m.getCachedSettings());
  
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

  const displayProducts = dbProducts.length > 0 ? dbProducts.map(p => {
    const approvedReviews = (p as any).reviews || [];
    const ratingCount = approvedReviews.length;
    const avgRating = ratingCount > 0 ? approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / ratingCount : 0;
    
    return {
      id: p.id,
      slug: p.slug,
      imageUrl: p.images[0],
      category: p.categories && p.categories.length > 0 ? p.categories[0].name : 'N/A',
      categorySlug: p.categories && p.categories.length > 0 ? p.categories[0].slug : '',
      title: p.title,
      rating: ratingCount > 0 ? Math.round(avgRating) : 0,
      ratingText: ratingCount > 0 ? `(${avgRating.toFixed(2)})` : '',
      price: p.price,
      oldPrice: p.compareAtPrice ? p.compareAtPrice : undefined,
      imagePlaceholder: '🛍️',
      btnBgColor: config?.btnBgColor || settings.BESTSELLER_BTN_BG_COLOR,
      btnTextColor: config?.btnTextColor || settings.BESTSELLER_BTN_TEXT_COLOR,
      btnHoverBgColor: config?.btnHoverBgColor || settings.BESTSELLER_BTN_HOVER_BG_COLOR,
      btnHoverTextColor: config?.btnHoverTextColor || settings.BESTSELLER_BTN_HOVER_TEXT_COLOR,
    };
  }) : [];

  const seeAllUrl = config?.seeAllUrl || (categoryId ? `/product-category/${categoryId}` : '/best-seller');

  const bigProduct1 = displayProducts[0];
  const bigProduct2 = displayProducts[5];

  const smallProductsGroup1 = displayProducts.slice(1, 5);
  const smallProductsGroup2 = displayProducts.slice(6, 10);

  return (
    <section className={`max-w-7xl mx-auto px-4 w-full py-12 font-sans${config?.hideMobile ? ' hidden sm:block' : ''}`}>
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <h2 
          className="font-bold text-gray-900 text-[length:var(--sz-m)] md:text-[length:var(--sz-t)] lg:text-[length:var(--sz-d)]"
          style={getResponsiveVars('title', {m: '20px', t: '24px', d: '24px'})}
        >
          {config?.title || t('best_seller_title')}
        </h2>
        {config?.SEE_ALL_TEXT !== '' && (
          <Link href={seeAllUrl} className="flex items-center text-sm font-semibold text-gray-900 hover:text-orange-600 transition text-[length:var(--sz-m)] md:text-[length:var(--sz-t)] lg:text-[length:var(--sz-d)]" style={getResponsiveVars('SEE_ALL_TEXT', {m: '14px', t: '14px', d: '14px'})}>
            {config?.SEE_ALL_TEXT || t('see_all')}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        )}
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Column 1: Big Card */}
        <div className="col-span-1">
          <BigCard 
            product={bigProduct1}
            icon={bigProduct1?.imagePlaceholder || "👟"} 
            category={bigProduct1?.category || "Cosmetics"} 
            title={bigProduct1?.title || "Comfortable Regular Comfort Sports Sneakers"} 
            price={bigProduct1?.price || 33.00} 
            rating={bigProduct1?.rating || 0} 
            ratingText={bigProduct1?.ratingText || ''} 
            imageUrl={bigProduct1?.imageUrl}
            linkUrl={bigProduct1 ? `/product/${bigProduct1.slug}` : '#'}
            borderColor={settings.BESTSELLER_CARD_BORDER_COLOR}
          />
        </div>

        {/* Column 2: 2x2 Small Cards */}
        <div className="col-span-1 grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => {
            const p = smallProductsGroup1[i];
            return (
              <SmallCard 
                key={i}
                product={p}
                icon={["📱", "👟", "🍯", "⌚"][i]} 
                title={p?.title || "Product placeholder"} 
                price={p ? p.price : 18.00} 
                rating={p?.rating || 0}
                ratingText={p?.ratingText || ''}
                imageUrl={p?.imageUrl}
                linkUrl={p ? `/product/${p.slug}` : '#'}
                borderColor={settings.BESTSELLER_CARD_BORDER_COLOR}
              />
            );
          })}
        </div>

        {/* Column 3: Big Card */}
        <div className="col-span-1">
          <BigCard 
            product={bigProduct2}
            icon="🧀" 
            category={bigProduct2?.category || "Cosmetics"} 
            title={bigProduct2?.title || "Comfortable Regular Comfort Sports Sneakers"} 
            price={bigProduct2 ? bigProduct2.price : 35.00} 
            rating={bigProduct2?.rating || 0} 
            ratingText={bigProduct2?.ratingText || ''} 
            imageUrl={bigProduct2?.imageUrl}
            linkUrl={bigProduct2 ? `/product/${bigProduct2.slug}` : '#'}
            borderColor={settings.BESTSELLER_CARD_BORDER_COLOR}
          />
        </div>

        {/* Column 4: 2x2 Small Cards */}
        <div className="col-span-1 grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => {
            const p = smallProductsGroup2[i];
            return (
              <SmallCard 
                key={i}
                product={p}
                icon={["🩳", "🧀", "🎒", "👟"][i]} 
                title={p?.title || "Product placeholder"} 
                price={p ? p.price : 35.00} 
                rating={p?.rating || 0}
                ratingText={p?.ratingText || ''}
                imageUrl={p?.imageUrl}
                linkUrl={p ? `/product/${p.slug}` : '#'}
                borderColor={settings.BESTSELLER_CARD_BORDER_COLOR}
              />
            );
          })}
        </div>

      </div>

    </section>
  );
}
