import ShopPage from '@/app/shop/page';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { SITE_URL } from '@/lib/site';
import { safeJsonLd } from '@/lib/security';

export const revalidate = 3600; // 1 hour ISR cache

const isUuid = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";
  const rawSlug = resolvedParams.slug;
  const decodedSlug = decodeURIComponent(rawSlug);

  const orConditions: any[] = [
    { slug: decodedSlug },
    { slug: rawSlug },
  ];
  if (isUuid(rawSlug)) {
    orConditions.push({ id: rawSlug });
  }

  const category = await prisma.category.findFirst({
    where: {
      OR: orConditions,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
    }
  });

  if (!category) {
    return {
      title: `Category not found - ${storeName}`,
    };
  }

  const title = category?.metaTitle ? category.metaTitle : `${category?.name || 'Kategorie'} | ${storeName}`;
  const description = category?.metaDescription || `Entdecken Sie ${category?.name || 'unsere Produkte'} bei ${storeName}. Top-Preise, schneller Versand in Deutschland und 30 Tage Rückgaberecht.`;

  return {
    title,
    description,
    keywords: category?.metaKeywords || undefined,
    alternates: {
      canonical: `/product-category/${category?.slug || decodedSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/product-category/${category?.slug || decodedSlug}`,
      siteName: storeName,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function ProductCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const rawSlug = resolvedParams.slug;
  const decodedSlug = decodeURIComponent(rawSlug);

  const orConditions: any[] = [
    { slug: decodedSlug },
    { slug: rawSlug },
  ];
  if (isUuid(rawSlug)) {
    orConditions.push({ id: rawSlug });
  }

  const category = await prisma.category.findFirst({
    where: {
      OR: orConditions,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
    }
  });

  if (!category) {
    notFound();
  }

  // If searchParams explicitly specifies category, respect it. Otherwise, default to this category's slug.
  const activeCategory = resolvedSearchParams.category !== undefined
    ? resolvedSearchParams.category
    : (category.slug || decodedSlug);

  const newSearchParams = Promise.resolve({
    ...resolvedSearchParams,
    category: activeCategory
  });

  const baseUrl = SITE_URL;
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Startseite',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: `${baseUrl}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `${baseUrl}/product-category/${category.slug || decodedSlug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbSchema)
        }}
      />
      <ShopPage searchParams={newSearchParams} />
    </>
  );
}
