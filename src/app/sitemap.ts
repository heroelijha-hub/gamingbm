import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

import { getContactSettings } from '@/actions/contactSettings';

import { SITE_URL } from '@/lib/site';

export const revalidate = 3600; // Revalidate sitemap every hour (ISR)

function sanitizeSitemapImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Strip query parameters to avoid unescaped ampersands in XML (e.g. ?auto=format&fit=crop)
  const cleanUrl = trimmed.split('?')[0];
  return cleanUrl
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const contactSettings = await getContactSettings();

  // 1. Pages statiques
  const staticPages = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/${contactSettings.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sale`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/new`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/hot`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }
  ];

  // 2. Produits dynamiques (valides, avec prix > 0 et image)
  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      price: { gt: 0 }
    },
    select: { slug: true, updatedAt: true, images: true },
  });

  const productPages = products
    .filter((product) => product.images && product.images.length > 0)
    .map((product) => {
      const rawImage = product.images[0];
      const cleanImage = sanitizeSitemapImageUrl(rawImage);
      return {
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        images: cleanImage ? [cleanImage] : undefined,
      };
    });

  // 3. Articles de Blog dynamiques
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true, image: true },
  });

  const articlePages = articles.map((article) => {
    const cleanImage = sanitizeSitemapImageUrl(article.image);
    return {
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
      images: cleanImage ? [cleanImage] : undefined,
    };
  });

  // 4. Dynamic categories (landing pages e-commerce prioritaires)
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });

  const categoryPages = categories
    .filter(c => c.slug)
    .map((category) => ({
      url: `${baseUrl}/product-category/${category.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));

  // 5. CMS Pages (uniquement les pages publiées)
  const pages = await prisma.page.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
  });

  const cmsPages = pages.map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...productPages, ...articlePages, ...categoryPages, ...cmsPages];
}
