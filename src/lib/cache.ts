import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

// Sensitive secret keys that must NEVER be leaked to public cache or RSC props
const HIDDEN_SETTING_KEYS = new Set([
  'STRIPE_SECRET_KEY',
  'PAYPAL_SECRET',
  'CRON_SECRET',
  'SMTP_PASSWORD',
  'SMTP_PASS',
  'SMTP_HOST',
  'SMTP_USER',
  'CONTACT_RECEIVER_EMAIL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SETUP_TOKEN',
]);

// Anti-Egress #1: Strict projection for product cards/grids (excludes heavy columns: description, content, attributes, etc.)
export const PRODUCT_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  images: true,
  type: true,
  stock: true,
  isBestSeller: true,
  isDealOfTheDay: true,
  discountLabel: true,
  categories: {
    select: {
      id: true,
      name: true,
      slug: true,
    }
  },
  reviews: {
    where: { isApproved: true },
    select: {
      rating: true,
    }
  }
} as const;

// Anti-Egress #1: Strict projection for blog article cards (excludes heavy HTML content)
export const ARTICLE_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  image: true,
  excerpt: true,
  category: true,
  authorName: true,
  metaDescription: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      comments: { where: { isApproved: true } }
    }
  }
} as const;

// Helper to get raw settings with minimal projection
async function fetchSettings() {
  const settingsDb = await prisma.setting.findMany({
    select: { key: true, value: true }
  });
  return settingsDb
    .filter(s => !HIDDEN_SETTING_KEYS.has(s.key))
    .reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
}

// Cached version of global settings
export const getCachedSettings = unstable_cache(
  async () => fetchSettings(),
  ['global-settings'],
  { tags: ['settings'], revalidate: 3600 }
);

// Cached single product detail (Allowed to load full relations only on single page)
export const getCachedProductBySlug = async (slug: string) => {
  return unstable_cache(
    async () => {
      const encodedSlugLower = encodeURIComponent(slug).toLowerCase();
      const encodedSlugUpper = encodeURIComponent(slug);
      let decodedSlug = slug;
      try { decodedSlug = decodeURIComponent(slug); } catch (e) {}

      const product = await prisma.product.findFirst({
        where: { 
          OR: [
            { slug: slug },
            { slug: encodedSlugLower },
            { slug: encodedSlugUpper },
            { slug: decodedSlug }
          ]
        },
        include: {
          categories: { select: { id: true, name: true, slug: true } },
          Product_ForceSales_A: true,
          Product_SaleTogether_A: true,
          brand: true,
          tags: true,
          reviews: {
            where: { isApproved: true },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true } } }
          }
        }
      });

      if (!product) return null;

      // RGPD: Never leak raw emails to client RSC payload
      const sanitizedReviews = product.reviews.map(r => ({
        id: r.id,
        productId: r.productId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewerName: r.reviewerName || (r.user?.email ? r.user.email.split('@')[0] : 'Kunde'),
      }));

      return {
        ...product,
        reviews: sanitizedReviews,
      };
    },
    ['product-details', slug],
    { tags: ['products', `product-${slug}`], revalidate: 3600 }
  )();
};

export const getCachedRelatedProducts = async (categoryIds: string[], excludeProductId: string) => {
  const sortedIds = [...categoryIds].sort();
  return unstable_cache(
    async () => prisma.product.findMany({
      where: { 
        categories: { some: { id: { in: categoryIds } } }, 
        id: { not: excludeProductId },
        isDeleted: false,
      },
      select: PRODUCT_CARD_SELECT,
      take: 4,
    }),
    ['related-products', sortedIds.join(','), excludeProductId],
    { tags: ['products'], revalidate: 3600 }
  )();
};

// Caching for Homepage best sellers (Minimal projection)
export const getCachedBestSellers = unstable_cache(
  async () => prisma.product.findMany({
    where: { isBestSeller: true, isDeleted: false },
    take: 8,
    select: PRODUCT_CARD_SELECT,
    orderBy: { createdAt: 'desc' }
  }),
  ['home-best-sellers'],
  { tags: ['products'], revalidate: 3600 }
);

// Caching for Homepage latest products (Minimal projection)
export const getCachedLatestProducts = unstable_cache(
  async () => prisma.product.findMany({
    where: { isDeleted: false },
    take: 8,
    orderBy: { createdAt: 'desc' },
    select: PRODUCT_CARD_SELECT,
  }),
  ['home-latest-products'],
  { tags: ['products'], revalidate: 3600 }
);

// Caching categories tree (Minimal projection)
export const getCachedCategoriesTree = unstable_cache(
  async () => prisma.category.findMany({
    where: { parentId: null },
    select: {
      id: true,
      name: true,
      slug: true,
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      }
    },
    orderBy: { name: 'asc' }
  }),
  ['categories-tree'],
  { tags: ['categories'], revalidate: 3600 }
);

// Caching global product counts for layout badges
export const getCachedProductCounts = unstable_cache(
  async () => {
    const [newCount, hotCount, saleCount] = await Promise.all([
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.product.count({ where: { isDeleted: false, orderItems: { some: {} } } }),
      prisma.product.count({ where: { isDeleted: false, compareAtPrice: { not: null } } })
    ]);
    return { newCount, hotCount, saleCount };
  },
  ['layout-product-counts'],
  { tags: ['products'], revalidate: 3600 }
);

// Anti-CPU: Caching shop filter metadata (categories, brands, price range)
export const getCachedShopFilterMetadata = unstable_cache(
  async () => {
    const [allCategories, allBrands, priceAgg] = await Promise.all([
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          metaDescription: true,
          _count: {
            select: { products: { where: { isDeleted: false } } }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.brand.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: { products: { where: { isDeleted: false } } }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.product.aggregate({
        where: { isDeleted: false },
        _min: { price: true },
        _max: { price: true }
      })
    ]);

    return {
      allCategories,
      allBrands,
      globalMinPrice: Math.floor(priceAgg._min?.price || 0),
      globalMaxPrice: Math.ceil(priceAgg._max?.price || 1000)
    };
  },
  ['shop-filter-metadata'],
  { tags: ['categories', 'products'], revalidate: 3600 }
);

// Caching special listing pages: Sale
export const getCachedSaleProducts = unstable_cache(
  async (limit: number = 30) => prisma.product.findMany({
    where: {
      isDeleted: false,
      compareAtPrice: { not: null }
    },
    select: PRODUCT_CARD_SELECT,
    orderBy: { updatedAt: 'desc' },
    take: limit
  }),
  ['cached-sale-products'],
  { tags: ['products'], revalidate: 3600 }
);

// Caching special listing pages: New Arrivals
export const getCachedNewArrivals = unstable_cache(
  async (limit: number = 24) => prisma.product.findMany({
    where: { isDeleted: false },
    select: PRODUCT_CARD_SELECT,
    orderBy: { createdAt: 'desc' },
    take: limit
  }),
  ['cached-new-arrivals'],
  { tags: ['products'], revalidate: 3600 }
);

// Caching special listing pages: Hot Products
export const getCachedHotProducts = unstable_cache(
  async (limit: number = 30) => prisma.product.findMany({
    where: { isDeleted: false },
    select: PRODUCT_CARD_SELECT,
    orderBy: {
      orderItems: {
        _count: 'desc'
      }
    },
    take: limit
  }),
  ['cached-hot-products'],
  { tags: ['products'], revalidate: 3600 }
);

// Caching blog articles listing
export const getCachedBlogArticles = unstable_cache(
  async () => prisma.article.findMany({
    where: { isPublished: true },
    select: ARTICLE_CARD_SELECT,
    orderBy: { createdAt: 'desc' }
  }),
  ['cached-blog-articles'],
  { tags: ['articles'], revalidate: 3600 }
);
