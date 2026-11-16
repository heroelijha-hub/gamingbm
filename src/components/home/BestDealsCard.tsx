'use client';
import Image from 'next/image';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import QuickViewModal from '@/components/product/QuickViewModal';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Price from '@/components/Price';

const Star = ({ filled = true }: { filled?: boolean }) => (
  <svg 
    className={`w-4 h-4 ${filled ? 'text-orange-600' : 'text-gray-300'}`} 
    fill="currentColor" 
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function BestDealsCard({
  product,
  borderColor,
  btnBgColor,
  btnTextColor,
  btnHoverBgColor,
  btnHoverTextColor
}: {
  product: any;
  borderColor: string;
  btnBgColor: string;
  btnTextColor: string;
  btnHoverBgColor?: string;
  btnHoverTextColor?: string;
}) {
  const router = useRouter();
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const t = useTranslations('Home');
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const isWishlisted = wishlistStore.hasItem(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cartStore.addItem({
      id: product.id,
      productId: product.id,
      title: product.title,
      price: product.rawPrice || 0,
      image: product.imageUrl || '',
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

  return (
    <>
      <div 
        onClick={() => router.push(`/product/${product.slug || product.id}`)}
        className="flex-none w-[250px] md:w-[300px] p-5 flex flex-col group/card cursor-pointer hover:shadow-lg transition bg-white border rounded-lg snap-start relative"
        style={{ borderColor }}
      >
        {/* Product Image Area */}
        <div className="relative h-48 w-full bg-white mb-4 flex items-center justify-center overflow-hidden">
          {product.discount && (
            <span className="absolute top-0 left-0 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded z-10">
              {product.discount}
            </span>
          )}
          
          {/* Image or Placeholder */}
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.title} width={600} height={600} loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 250px" className="w-full h-full object-contain group-hover/card:scale-105 transition duration-500" />
          ) : (
            <div className="text-7xl group-hover/card:scale-110 transition duration-500">
              {product.imagePlaceholder}
            </div>
          )}

          {/* Hover Overlay Icons Vertical Stack */}
          <div className="absolute top-2 right-2 flex flex-col items-center justify-center gap-2 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleAddToCart}
              className="p-2 rounded-md shadow-sm transition-all duration-300 transform hover:scale-105 hover:[background-color:var(--btn-hover-bg)] hover:[color:var(--btn-hover-text)]"
              style={{ backgroundColor: btnBgColor, color: btnTextColor, '--btn-hover-bg': btnHoverBgColor || '#c2410c', '--btn-hover-text': btnHoverTextColor || '#ffffff' } as React.CSSProperties}
              title={t('add_to_cart')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            <button
              onClick={handleQuickView}
              className="p-2 rounded-md shadow-sm transition-all duration-300 transform hover:scale-105 hover:[background-color:var(--btn-hover-bg)] hover:[color:var(--btn-hover-text)]"
              style={{ backgroundColor: btnBgColor, color: btnTextColor, '--btn-hover-bg': btnHoverBgColor || '#c2410c', '--btn-hover-text': btnHoverTextColor || '#ffffff' } as React.CSSProperties}
              title="Quick view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={handleToggleWishlist}
              className="p-2 rounded-md shadow-sm transition-all duration-300 transform hover:scale-105 hover:[background-color:var(--btn-hover-bg)] hover:[color:var(--btn-hover-text)]"
              style={{ backgroundColor: isWishlisted ? (btnHoverBgColor || '#c2410c') : btnBgColor, color: isWishlisted ? (btnHoverTextColor || '#ffffff') : btnTextColor, '--btn-hover-bg': btnHoverBgColor || '#c2410c', '--btn-hover-text': btnHoverTextColor || '#ffffff' } as React.CSSProperties}
              title="Wishlist"
            >
              <svg className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Product Info */}
        <div className="mt-auto">
          <p className="text-xs text-gray-500 mb-1">{product.category}</p>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 transition" title={product.title}>
            <Link href={`/product/${product.slug || product.id}`} className="hover:text-orange-600" onClick={(e) => e.stopPropagation()}>
              {product.title}
            </Link>
          </h3>
          
          {/* Rating */}
          {product.ratingText && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} filled={i < product.rating} />
                ))}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {product.ratingText}
              </span>
            </div>
          )}
          <p className="font-bold text-gray-900">
            {product.rawPrice ? <Price amount={product.rawPrice} showTax={false} /> : product.price}
          </p>
        </div>
      </div>
      
      {/* Quick View Modal */}
      <QuickViewModal 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
        product={{...product, price: product.rawPrice || 0, images: product.imageUrl ? [product.imageUrl] : []}} 
      />
    </>
  );
}
