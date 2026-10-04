import prisma from '@/lib/prisma';
import ProductCard from '@/components/shop/ProductCard';
import ShopFilters from '@/components/shop/ShopFilters';
import ShopSort from '@/components/shop/ShopSort';
import ShopPagination from '@/components/shop/ShopPagination';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Top Kaminbrennstoffe";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Top Kaminbrennstoffe";
  
  // Extract category
  const categoryParams = params.category;
  const categories = Array.isArray(categoryParams) ? categoryParams : categoryParams ? [categoryParams] : [];
  
  if (categories.length === 1) {
    const category = await prisma.category.findFirst({
      where: { OR: [{ slug: categories[0] }, { id: categories[0] }] }
    });
    
    if (category) {
      return {
        title: category.metaTitle ? category.metaTitle : `${category.name} | ${storeName}`,
        description: category.metaDescription || `Kaufen Sie ${category.name} günstig online bei ${storeName}.`,
        alternates: {
          canonical: `/shop?category=${categories[0]}`,
        },
      };
    }
  }

  return {
    title: `Shop | ${storeName}`,
    description: 'Entdecken Sie unser großes Sortiment an Kaminöfen, Pelletöfen, Brennholz und Holzbriketts.',
    alternates: {
      canonical: '/shop',
    },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const t = await getTranslations('Shop');
  
  // Extract query params
  const categoryParams = params.category;
  const categories = Array.isArray(categoryParams) ? categoryParams : categoryParams ? [categoryParams] : [];
  
  const brandParams = params.brand;
  const brandsFilter = Array.isArray(brandParams) ? brandParams : brandParams ? [brandParams] : [];
  
  const minPrice = params.minPrice ? parseFloat(params.minPrice as string) : undefined;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice as string) : undefined;
  
  const ratingParams = params.rating;
  const ratings = Array.isArray(ratingParams) ? ratingParams.map(Number) : ratingParams ? [Number(ratingParams)] : [];
  
  const sort = params.sort as string;
  const page = params.page ? parseInt(params.page as string) : 1;
  const limit = 12;

  // Build Prisma where clause
  const where: any = {};
  
  if (categories.length > 0) {
    where.categories = { some: { slug: { in: categories } } };
  }
  
  if (brandsFilter.length > 0) {
    where.brand = { slug: { in: brandsFilter } };
  }
  
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Fetch all categories for the filter sidebar with product counts
  const allCategories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Get global min/max price for the slider
  const priceAgg = await prisma.product.aggregate({
    _min: { price: true },
    _max: { price: true }
  });
  const globalMinPrice = Math.floor(priceAgg._min?.price || 0);
  const globalMaxPrice = Math.ceil(priceAgg._max?.price || 1000);

  // Fetch all brands for the filter sidebar with product counts
  const allBrands = await prisma.brand.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Fetch shop specific settings
  const settingsDb = await prisma.setting.findMany({
    where: { key: { in: ['SHOP_CARD_STYLE', 'SHOP_CARD_BORDER_COLOR'] } }
  });
  const settingsMap = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
  const cardStyle = (settingsMap.SHOP_CARD_STYLE as 'design1' | 'design2') || 'design2';
  const borderColor = settingsMap.SHOP_CARD_BORDER_COLOR || '';

  // Since filtering by average rating requires relation aggregation not directly supported 
  // in a simple where clause, we fetch products and filter in memory if ratings filter is active.
  // For sorting, we can do it in Prisma.
  let orderBy: any = { createdAt: 'desc' }; // default 'newest'
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };

  // Fetch products
  const products = await prisma.product.findMany({
    where,
    include: {
      categories: { select: { name: true, slug: true } },
      reviews: { select: { rating: true } }
    },
    orderBy
  });

  // Filter by rating in memory if needed
  let filteredProducts = products;
  if (ratings.length > 0) {
    filteredProducts = products.filter(p => {
      const avg = p.reviews.length > 0 
        ? p.reviews.reduce((acc, curr) => acc + curr.rating, 0) / p.reviews.length 
        : 0;
      const roundedAvg = Math.round(avg);
      // We check if the rounded average rating is within the selected ratings
      return ratings.includes(roundedAvg) || (ratings.includes(0) && p.reviews.length === 0);
    });
  }

  const totalResults = filteredProducts.length;
  const totalPages = Math.ceil(totalResults / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalResults);
  
  // Paginate in memory (since we might have filtered in memory)
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + limit);

  const currentRange = `${totalResults > 0 ? startIndex + 1 : 0}-${endIndex}`;

  const validCategories = allCategories
    .filter(c => c.slug !== null)
    .map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug as string,
      _count: c._count
    }));

  const validBrands = allBrands
    .map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      _count: b._count
    }));

  const view = (params.view as 'grid' | 'list') || 'grid';

  let pageTitle = t('title');
  if (categories.length === 1) {
    const selectedCategory = allCategories.find(c => c.slug === categories[0] || c.id === categories[0]);
    if (selectedCategory) {
      pageTitle = selectedCategory.name;
    }
  }

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4 px-4 sm:px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto text-sm text-gray-500">
          <Link href="/" className="hover:text-orange-600">{t('home')}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{pageTitle}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">{pageTitle}</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar (Filters) */}
          <aside className="w-full lg:w-1/4 flex-shrink-0">
            <ShopFilters categories={validCategories} brands={validBrands} globalMinPrice={globalMinPrice} globalMaxPrice={globalMaxPrice} />
          </aside>

          {/* Main Content (Products) */}
          <section className="w-full lg:w-3/4">
            
            <ShopSort totalResults={totalResults} currentRange={currentRange} />

            {paginatedProducts.length > 0 ? (
              <div className={view === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-6"}>
                {paginatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} view={view} cardStyle={cardStyle} borderColor={borderColor} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('no_products_found')}</h3>
                <p className="text-gray-500">{t('try_modifying_filters')}</p>
              </div>
            )}

            <ShopPagination totalPages={totalPages} currentPage={page} />

          </section>
        </div>
      </div>
    </div>
  );
}
