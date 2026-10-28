import WishlistClient from './WishlistClient';
import { getTranslations } from 'next-intl/server';

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";

export async function generateMetadata() {
  const t = await getTranslations('Wishlist');
  return {
    title: `${t('page_title')} | ${storeName}`,
    description: t('page_description', { storeName }),
  };
}

export default async function WishlistPage() {
  const t = await getTranslations('Wishlist');

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('title')}</h1>
        <WishlistClient />
      </div>
    </div>
  );
}
