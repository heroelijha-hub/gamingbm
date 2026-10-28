import ShopPage from '@/app/shop/page';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { SITE_URL } from '@/lib/site';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";
  const category = await prisma.category.findUnique({
    where: { slug: resolvedParams.slug }
  });
  
  if (!category) {
    return {
      title: `Category not found - ${storeName}`,
    };
  }

  return {
    title: category?.metaTitle ? category.metaTitle : `${category?.name || 'Category'} | ${storeName}`,
    description: category?.metaDescription || `Shop products in ${category?.name}`,
    keywords: category?.metaKeywords || undefined,
    alternates: {
      canonical: `/product-category/${category?.slug}`,
    },
    openGraph: {
      title: category?.metaTitle || category?.name || 'Category',
      description: category?.metaDescription || `Shop products in ${category?.name}`,
      url: `${SITE_URL}/product-category/${category?.slug}`,
      siteName: storeName,
      type: 'website',
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
  
  // Pass the slug as category to the shop page logic
  const newSearchParams = Promise.resolve({
    ...resolvedSearchParams,
    category: resolvedParams.slug
  });
  
  return <ShopPage searchParams={newSearchParams} />;
}
