import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Price from '@/components/Price';
import ProductCard from '@/components/shop/ProductCard';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q.trim() : '';
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Gaming BM';

  return {
    title: q ? `Recherche : "${q}" | ${storeName}` : `Recherche de produits | ${storeName}`,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';
  const category = typeof resolvedParams.category === 'string' ? resolvedParams.category : 'all';

  let where: any = {};
  
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (category && category !== 'all') {
    where.categories = { some: { id: category } };
  }

  const products = await prisma.product.findMany({
    where,
    include: { 
      categories: true,
      reviews: { select: { rating: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const settingsDb = await prisma.setting.findMany({
    where: { key: { in: ['SHOP_CARD_STYLE', 'SHOP_CARD_BORDER_COLOR'] } }
  });
  const settingsMap = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
  const cardStyle = (settingsMap.SHOP_CARD_STYLE as 'design1' | 'design2') || 'design2';
  const borderColor = settingsMap.SHOP_CARD_BORDER_COLOR || '';

  const t = await getTranslations('Search');

  return (
    <div className="bg-gray-50 min-h-screen py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('search_results')}</h1>
        <p className="text-gray-600 mb-8">
          {t('products_found', { count: products.length, q })}
          {category !== 'all' ? t('in_category') : ''}
        </p>

        {products.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg border border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 className="text-xl font-medium text-gray-900 mb-2">{t('no_results')}</h2>
            <p className="text-gray-500 mb-6">{t('no_products_match')}</p>
            <Link href="/" className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-medium px-6 py-2 rounded transition">
              {t('back_to_home')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} view="grid" cardStyle={cardStyle} borderColor={borderColor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
