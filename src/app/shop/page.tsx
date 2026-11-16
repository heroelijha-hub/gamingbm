import prisma from '@/lib/prisma';
import ProductCard from '@/components/shop/ProductCard';
import ShopFilters from '@/components/shop/ShopFilters';
import ShopSort from '@/components/shop/ShopSort';
import ShopPagination from '@/components/shop/ShopPagination';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import CategorySeoSection from '@/components/shop/CategorySeoSection';

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";

const isUuid = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";

  // Extract category
  const categoryParams = params.category;
  const rawCategories = Array.isArray(categoryParams) ? categoryParams : categoryParams ? [categoryParams] : [];
  const categories = rawCategories.map(c => decodeURIComponent(c));

  if (categories.length === 1) {
    const rawCat = categories[0];
    const orCond: any[] = [{ slug: rawCat }];
    if (isUuid(rawCat)) {
      orCond.push({ id: rawCat });
    }
    const category = await prisma.category.findFirst({
      where: { OR: orCond }
    });

    if (category) {
      return {
        title: category.metaTitle ? category.metaTitle : `${category.name} | ${storeName}`,
        description: category.metaDescription || `Entdecken Sie unsere Auswahl an ${category.name} zum besten Preis bei ${storeName}. Geprüfte Qualität und schneller Versand.`,
        alternates: {
          canonical: `/product-category/${category.slug}`,
        },
      };
    }
  }

  return {
    title: `Online-Shop | ${storeName}`,
    description: `Entdecken Sie unser gesamtes Sortiment im ${storeName} Online-Shop. Konsolen, Gaming-PCs, Smartphones und Zubehör mit 2 Jahren Garantie und schnellem Versand.`,
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
  const rawCategories = Array.isArray(categoryParams) ? categoryParams : categoryParams ? [categoryParams] : [];
  const categories = rawCategories.map(c => decodeURIComponent(c));

  const brandParams = params.brand;
  const rawBrands = Array.isArray(brandParams) ? brandParams : brandParams ? [brandParams] : [];
  const brandsFilter = rawBrands.map(b => decodeURIComponent(b));

  const minPrice = params.minPrice ? parseFloat(params.minPrice as string) : undefined;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice as string) : undefined;

  const ratingParams = params.rating;
  const ratings = Array.isArray(ratingParams) ? ratingParams.map(Number) : ratingParams ? [Number(ratingParams)] : [];

  const sort = params.sort as string;
  const page = params.page ? parseInt(params.page as string) : 1;
  const limit = 12;

  // Build Prisma where clause
  const where: any = {
    isDeleted: false,
  };

  if (categories.length > 0) {
    const catUuids = categories.filter(isUuid);
    const catSlugs = categories.filter(s => !isUuid(s));
    const catConditions: any[] = [];
    if (catSlugs.length > 0) catConditions.push({ slug: { in: catSlugs } });
    if (catUuids.length > 0) catConditions.push({ id: { in: catUuids } });

    if (catConditions.length > 0) {
      where.categories = {
        some: {
          OR: catConditions
        }
      };
    }
  }

  if (brandsFilter.length > 0) {
    const brandUuids = brandsFilter.filter(isUuid);
    const brandSlugs = brandsFilter.filter(s => !isUuid(s));
    const brandConditions: any[] = [];
    if (brandSlugs.length > 0) {
      brandConditions.push({ slug: { in: brandSlugs } });
      brandConditions.push({ name: { in: brandSlugs } });
    }
    if (brandUuids.length > 0) {
      brandConditions.push({ id: { in: brandUuids } });
    }

    if (brandConditions.length > 0) {
      where.brand = {
        OR: brandConditions
      };
    }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined && !isNaN(minPrice)) where.price.gte = minPrice;
    if (maxPrice !== undefined && !isNaN(maxPrice)) where.price.lte = maxPrice;
  }

  // Fetch all categories for the filter sidebar with product counts
  const allCategories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: { where: { isDeleted: false } } }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Get global min/max price for the slider
  const priceAgg = await prisma.product.aggregate({
    where: { isDeleted: false },
    _min: { price: true },
    _max: { price: true }
  });
  const globalMinPrice = Math.floor(priceAgg._min?.price || 0);
  const globalMaxPrice = Math.ceil(priceAgg._max?.price || 1000);

  // Fetch all brands for the filter sidebar with product counts
  const allBrands = await prisma.brand.findMany({
    include: {
      _count: {
        select: { products: { where: { isDeleted: false } } }
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
  let currentCategory = null;
  if (categories.length === 1) {
    const rawCat = categories[0];
    const selectedCategory = allCategories.find(c => c.slug === rawCat || (isUuid(rawCat) && c.id === rawCat));
    if (selectedCategory) {
      pageTitle = selectedCategory.name;
      currentCategory = selectedCategory;
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
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">{pageTitle}</h1>
          {currentCategory?.metaDescription && (
            <p className="text-gray-600 max-w-4xl text-base leading-relaxed">
              {currentCategory.metaDescription}
            </p>
          )}
        </div>
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

        {/* Section Éditoriale SEO & FAQ Catégorie */}
        <CategorySeoSection
          categoryName={currentCategory ? currentCategory.name : 'Unsere Gaming-Produkte'}
          categorySlug={currentCategory?.slug || undefined}
          storeName={storeName}
          metaDescription={currentCategory?.metaDescription}
        />
      </div>
    </div>
  );
}
