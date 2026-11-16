'use client';
import Image from 'next/image';
import Link from 'next/link';

import { useRouter } from 'next/navigation';
import Price from '@/components/Price';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import QuickViewModal from '@/components/product/QuickViewModal';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

const Star = ({ filled = true }: { filled?: boolean }) => (
  <svg 
    className={`w-3.5 h-3.5 ${filled ? 'text-orange-600' : 'text-gray-300'}`} 
    fill="currentColor" 
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

type ProductGridCardProps = {
  product: any;
  variant: string;
  cardBorderColor: string;
  btnBgColor: string;
  btnTextColor: string;
  btnHoverBgColor?: string;
  btnHoverTextColor?: string;
};

export default function ProductGridCard({
  product,
  variant,
  cardBorderColor,
  btnBgColor,
  btnTextColor,
  btnHoverBgColor,
  btnHoverTextColor,
}: ProductGridCardProps) {
  const router = useRouter();
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const t = useTranslations('Home');
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const isWishlisted = wishlistStore.hasItem(product.id);
  const image = product.images && product.images.length > 0 ? product.images[0] : '';
  
  const reviews = product.reviews || [];
  const ratingCount = reviews.length;
  const avgRating = ratingCount > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / ratingCount : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasWishlisted = wishlistStore.hasItem(product.id);
    wishlistStore.toggleItem(product.id);
    if (!wasWishlisted) {
      wishlistStore.setIsOpen(true);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const navigateToProduct = () => {
    router.push(`/product/${product.slug}`);
  };

  return (
    <div
      className="group flex flex-col rounded-xl overflow-hidden bg-white transition relative cursor-pointer"
      style={{
        border: `2px solid ${cardBorderColor}`,
      }}
      onClick={navigateToProduct}
    >
      {/* Image Container */}
      <div className="block relative bg-gray-50 aspect-square p-6 overflow-hidden">
        {image ? (
          <Image src={image} alt={product.title} width={600} height={600} loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 250px" className="w-full h-full object-contain transition duration-300 group-hover:opacity-80" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🛒</div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10 backdrop-blur-[1px]">
          {/* Variant 2: Button is in the overlay */}
          {variant === '2' && (
            <button
              onClick={handleAddToCart}
              aria-label={`${t('add_to_cart')} - ${product.title}`}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-all duration-300 transform hover:scale-105 hover:[background-color:var(--btn-hover-bg)] hover:[color:var(--btn-hover-text)] z-10"
              style={{ backgroundColor: btnBgColor, color: btnTextColor, '--btn-hover-bg': btnHoverBgColor || '#c2410c', '--btn-hover-text': btnHoverTextColor || '#ffffff' } as React.CSSProperties}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {t('add_to_cart')}
            </button>
          )}

          {/* Icons */}
          <div className="flex items-center justify-center gap-2 z-10">
            <button
              onClick={handleToggleWishlist}
              aria-label={t('wishlist') || "Wishlist"}
              className="p-2 rounded-md shadow-sm transition-all duration-300 transform hover:scale-105 hover:[background-color:var(--btn-hover-bg)] hover:[color:var(--btn-hover-text)]"
              style={
                (variant === '1'
                  ? { backgroundColor: isWishlisted ? btnBgColor : 'white', color: isWishlisted ? btnTextColor : '#374151', '--btn-hover-bg': btnHoverBgColor || '#c2410c', '--btn-hover-text': btnHoverTextColor || '#ffffff' }
                  : { backgroundColor: btnBgColor, color: btnTextColor, '--btn-hover-bg': btnHoverBgColor || '#c2410c', '--btn-hover-text': btnHoverTextColor || '#ffffff' }) as React.CSSProperties
              }
            >
              <svg className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <button
              onClick={handleQuickView}
              aria-label={t('quick_view') || "Quick View"}
              className="p-2 rounded-md shadow-sm transition-all duration-300 transform hover:scale-105 hover:[background-color:var(--btn-hover-bg)] hover:[color:var(--btn-hover-text)]"
              style={
                (variant === '1'
                  ? { backgroundColor: 'white', color: '#374151', '--btn-hover-bg': btnHoverBgColor || '#c2410c', '--btn-hover-text': btnHoverTextColor || '#ffffff' }
                  : { backgroundColor: btnBgColor, color: btnTextColor, '--btn-hover-bg': btnHoverBgColor || '#c2410c', '--btn-hover-text': btnHoverTextColor || '#ffffff' }) as React.CSSProperties
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
            <button
              onClick={handleQuickView}
              aria-label={t('view') || "View"}
              className="p-2 rounded-md shadow-sm transition-all duration-300 transform hover:scale-105 hover:[background-color:var(--btn-hover-bg)] hover:[color:var(--btn-hover-text)]"
              style={
                (variant === '1'
                  ? { backgroundColor: 'white', color: '#374151', '--btn-hover-bg': btnHoverBgColor || '#c2410c', '--btn-hover-text': btnHoverTextColor || '#ffffff' }
                  : { backgroundColor: btnBgColor, color: btnTextColor, '--btn-hover-bg': btnHoverBgColor || '#c2410c', '--btn-hover-text': btnHoverTextColor || '#ffffff' }) as React.CSSProperties
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1 flex flex-col">
          <p className="text-xs text-gray-500 font-medium mb-1 truncate">
            {product.categories && product.categories.length > 0 ? product.categories.map((c: any) => c.name).join(', ') : 'General'}
          </p>
          <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 mb-2 transition" title={product.title}>
            <Link href={`/product/${product.slug}`} className="hover:text-orange-700" onClick={(e) => e.stopPropagation()}>
              {product.title}
            </Link>
          </h3>
          
          {ratingCount > 0 && (
            <div className="flex items-center gap-1 mb-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} filled={i < Math.round(avgRating)} />
                ))}
              </div>
              <span className="text-[10px] text-gray-500 font-medium">({avgRating.toFixed(2)})</span>
            </div>
          )}

          <div className="mt-auto pt-1">
            <Price amount={product.price} className="text-sm font-bold text-gray-900" />
          </div>
        </div>

        {/* Variant 1: Add to Cart Button at the bottom */}
        {variant === '1' && (
          <div className="mt-4">
            <button
              onClick={handleAddToCart}
              aria-label={`${t('add_to_cart')} - ${product.title}`}
              className="w-full flex items-center justify-center gap-2 py-2 border rounded-md font-medium text-sm transition-all duration-300 hover:[background-color:var(--btn-hover-bg)] hover:[color:var(--btn-hover-text)] hover:[border-color:var(--btn-hover-bg)] z-10 relative"
              style={
                {
                  borderColor: '#e5e7eb',
                  backgroundColor: btnBgColor,
                  color: btnTextColor,
                  '--btn-hover-bg': btnHoverBgColor || '#c2410c',
                  '--btn-hover-text': btnHoverTextColor || '#ffffff',
                } as React.CSSProperties
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {t('add_to_cart')}
            </button>
          </div>
        )}
      </div>

      <QuickViewModal 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
        product={product} 
      />
    </div>
  );
}
