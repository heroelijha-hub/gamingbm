import Link from 'next/link';
import { getFilteredProducts } from '@/actions/public';
import ProductGridCard from './ProductGridCard';
import DynamicProductGrid from './DynamicProductGrid';
import prisma from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { getCachedSettings } from '@/lib/cache';

type ProductGridProps = {
  config: {
    title: string;
    filterType: string;
    categoryId?: string;
    variant?: string;
    cardBorderColor?: string;
    btnBgColor?: string;
    btnTextColor?: string;
    maxProducts?: string;
    colsMobile?: string;
    colsTablet?: string;
    colsDesktop?: string;
  };
};

export default async function ProductGrid({ config }: ProductGridProps) {
  const { 
    title = 'Products', 
    filterType = 'LATEST', 
    categoryId,
    variant = '1',
    cardBorderColor = '#ea580c',
    btnBgColor = '#ea580c',
    btnTextColor = '#ffffff',
    maxProducts = '12',
    colsMobile = '1',
    colsTablet = '3',
    colsDesktop = '5'
  } = config;

  const maxNum = parseInt(maxProducts, 10) || 12;
  const products = await getFilteredProducts(filterType, categoryId, maxNum, (config as any).productIds);

  if (products.length === 0) {
    return null; // Do not render section if no products
  }

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

  // Priority: custom seeAllUrl from config > category-based URL > /search
  const seeAllUrl = (config as any).seeAllUrl || (categoryId ? `/product-category/${categoryId}` : '/shop');

  return (
    <section className={`max-w-7xl mx-auto px-4 w-full py-12 font-sans${(config as any)?.hideMobile ? ' hidden sm:block' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 
          className="text-gray-900 font-bold text-[length:var(--sz-m)] md:text-[length:var(--sz-t)] lg:text-[length:var(--sz-d)]"
          style={getResponsiveVars('title', {m: '24px', t: '24px', d: '24px'})}
        >
          {title}
        </h2>
        {settings.SEE_ALL_TEXT !== '' && (
          <Link 
            href={seeAllUrl} 
            className="flex items-center text-sm font-semibold text-gray-900 hover:text-orange-600 transition text-[length:var(--sz-m)] md:text-[length:var(--sz-t)] lg:text-[length:var(--sz-d)]" 
            style={getResponsiveVars('SEE_ALL_TEXT', {m: '14px', t: '14px', d: '14px'})}
          >
            {settings.SEE_ALL_TEXT || t('view_all')}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        )}
      </div>

      <DynamicProductGrid 
        colsMobile={parseInt(colsMobile, 10) || 1}
        colsTablet={parseInt(colsTablet, 10) || 3}
        colsDesktop={parseInt(colsDesktop, 10) || 5}
      >
        {products.map(p => (
          <div key={p.id} className="h-full">
            <ProductGridCard 
              product={p}
              variant={variant}
              cardBorderColor={cardBorderColor}
              btnBgColor={btnBgColor}
              btnTextColor={btnTextColor}
            />
          </div>
        ))}
      </DynamicProductGrid>
    </section>
  );
}
