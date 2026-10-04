'use client';

import { useEffect, useState } from 'react';
import { useWishlistStore } from '@/store/wishlistStore';
import { getProductsByIds } from '@/actions/public';
import Link from 'next/link';
import Price from '@/components/Price';
import { useCartStore } from '@/store/cartStore';
import { useTranslations } from 'next-intl';
import Image from "next/image";

export default function WishlistClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const wishlistItems = useWishlistStore((state) => state.items);
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const cartStore = useCartStore();
  const t = useTranslations('Wishlist');

  useEffect(() => {
    async function loadWishlist() {
      if (wishlistItems.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }
      
      try {
        const fetchedProducts = await getProductsByIds(wishlistItems);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Erreur lors du chargement des favoris', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadWishlist();
  }, [wishlistItems]);

  const handleAddToCart = (product: any) => {
    const image = product.images && product.images.length > 0 ? product.images[0] : '';
    cartStore.addItem({
      id: product.id,
      productId: product.id,
      title: product.title,
      price: product.price,
      image: image,
      quantity: 1,
    });
    cartStore.setIsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg p-10 text-center shadow-sm border border-gray-200">
        <div className="text-6xl mb-4">🤍</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('empty_title')}</h2>
        <p className="text-gray-500 mb-6">{t('empty_subtitle')}</p>
        <Link 
          href="/search" 
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-md transition"
        >
          {t('discover_products')}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map(p => (
        <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group flex flex-col">
          <Link href={`/product/${p.slug}`} className="relative bg-gray-50 aspect-square p-4 flex items-center justify-center">
            {p.images && p.images.length > 0 ? (
              <Image width={800} height={800} src={p.images[0]} alt={p.title} className="w-full h-full object-contain group-hover:scale-105 transition duration-300" />
            ) : (
              <div className="text-5xl">🛍️</div>
            )}
          </Link>
          <div className="p-4 flex flex-col flex-1">
            <Link href={`/product/${p.slug}`}>
              <p className="text-xs text-blue-500 font-semibold mb-1">{p.categories && p.categories.length > 0 ? p.categories[0].name : t('general')}</p>
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-orange-600">{p.title}</h3>
            </Link>
            <div className="mt-auto mb-4">
              <Price amount={p.price} className="font-bold text-red-600" />
            </div>
            
            <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
              <button 
                onClick={() => handleAddToCart(p)}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold py-2 rounded transition flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {t('add_to_cart')}
              </button>
              <button 
                onClick={() => toggleItem(p.id)}
                className="p-2 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 rounded text-gray-500 transition"
                title={t('remove')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
