'use server';

import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export const getBestDeals = unstable_cache(
  async () => {
    return await prisma.product.findMany({
      where: { isDealOfTheDay: true },
      include: { categories: true, reviews: { where: { isApproved: true } } },
      take: 4,
      orderBy: { createdAt: 'desc' }
    });
  },
  ['public-best-deals'],
  { tags: ['products'], revalidate: 3600 }
);

export const getBestSellers = unstable_cache(
  async () => {
    return await prisma.product.findMany({
      where: { isBestSeller: true },
      include: { categories: true, reviews: { where: { isApproved: true } } },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
  },
  ['public-best-sellers'],
  { tags: ['products'], revalidate: 3600 }
);

export const getFilteredProducts = async (filterType: string, categoryId?: string, limit: number = 8, productIds?: string[]) => {
  return unstable_cache(
    async () => {
      if (filterType === 'MANUAL' && productIds && productIds.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          include: { categories: true, reviews: { where: { isApproved: true } } },
          take: limit,
        });
        return products.sort((a, b) => productIds.indexOf(a.id) - productIds.indexOf(b.id));
      }

      let where: any = {};
      let orderBy: any = { createdAt: 'desc' };

      if (filterType === 'ON_SALE') {
        where.isDealOfTheDay = true;
      } else if (filterType === 'POPULAR') {
        where.isBestSeller = true;
      }

      // Always apply category filter when categoryId is provided
      if (categoryId) {
        where.categories = { some: { id: categoryId } };
      }

      return await prisma.product.findMany({
        where,
        include: { categories: true, reviews: { where: { isApproved: true } } },
        take: limit,
        orderBy
      });
    },
    ['filtered-products', filterType, categoryId || 'all', limit.toString(), (productIds || []).join(',')],
    { tags: ['products'], revalidate: 3600 }
  )();
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function searchProducts(query: string, categoryId?: string, limit: number = 5) {
  const safeQuery = String(query || '').trim().slice(0, 100);
  if (!safeQuery) return [];

  const safeLimit = Math.min(Math.max(1, Number(limit) || 5), 20);

  let where: any = {
    isDeleted: false,
    OR: [
      { title: { contains: safeQuery, mode: 'insensitive' } },
      { description: { contains: safeQuery, mode: 'insensitive' } },
    ]
  };

  if (categoryId && categoryId !== 'all' && UUID_REGEX.test(categoryId)) {
    where.categories = { some: { id: categoryId } };
  }

  return await prisma.product.findMany({
    where,
    select: {
      id: true,
      title: true,
      price: true,
      compareAtPrice: true,
      images: true,
      slug: true,
    },
    take: safeLimit,
  });
}

export async function getProductsByIds(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const safeIds = ids.slice(0, 50).filter(id => typeof id === 'string' && UUID_REGEX.test(id));
  if (safeIds.length === 0) return [];
  
  return await prisma.product.findMany({
    where: {
      id: { in: safeIds },
      isDeleted: false,
    },
    include: {
      categories: true,
      reviews: {
        where: { isApproved: true },
        select: {
          id: true,
          rating: true,
          comment: true,
          reviewerName: true,
          createdAt: true,
        }
      }
    }
  });
}
