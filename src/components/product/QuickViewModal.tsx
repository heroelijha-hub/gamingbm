'use client';

import { useState, useEffect } from 'react';
import Price from '@/components/Price';
import { useCartStore } from '@/store/cartStore';
import { useTranslations } from 'next-intl';
import Image from "next/image";

type QuickViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: any;
};

export default function QuickViewModal({ isOpen, onClose, product }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const cartStore = useCartStore();
  const t = useTranslations('Product');

  // Reset state when product changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setActiveImage(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    const image = product.images && product.images.length > 0 ? product.images[0] : '';
    cartStore.addItem({
      id: product.id,
      productId: product.id,
      title: product.title,
      price: product.price,
      image: image,
      quantity,
    });
    cartStore.setIsOpen(true);
    onClose();
  };

  // UGS / SKU is usually the first part of the UUID or a dedicated field.
  // UGS / SKU is usually the first part of the UUID or a dedicated field.
  const sku = product.id ? product.id.split('-')[0].toUpperCase() : '';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      />

      {/* Modal Content */}
      <div 
        className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row z-10 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-gray-100 rounded-full text-gray-900 z-20 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Left Column: Images */}
        <div className="w-full md:w-1/2 bg-gray-50 p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Main Image */}
          <div className="w-full aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
            {product.images && product.images.length > 0 ? (
              <Image width={800} height={800} src={product.images[activeImage]} 
                alt={product.title} 
                className="w-full h-full object-contain p-4" />
            ) : (
              <div className="text-6xl text-gray-300">🛍️</div>
            )}
          </div>
          
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-2 custom-scrollbar">
              {product.images.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 flex-shrink-0 rounded-md border-2 overflow-hidden bg-white ${activeImage === idx ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <Image width={800} height={800} src={img} alt="" className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{product.title}</h2>
          
          <div className="mb-4">
            <Price amount={product.price} className="text-2xl font-bold text-red-600" />
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <Price amount={product.compareAtPrice} showTax={false} className="text-gray-500 line-through text-sm ml-2" />
            )}
          </div>

          {/* Short Description */}
          {(product.shortDescription || product.description) && (
            <div className="text-sm text-gray-600 mb-6 line-clamp-4">
              {String(product.shortDescription || product.description).replace(/<[^>]*>?/gm, '')}
            </div>
          )}

          {/* Actions: Qty + Add to cart */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex border border-gray-300 rounded-md overflow-hidden bg-gray-50 w-28 h-12">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 text-gray-600 hover:bg-gray-200 font-bold transition">-</button>
              <input type="text" value={quantity} readOnly className="w-full text-center bg-transparent font-semibold text-gray-900" />
              <button onClick={() => setQuantity(quantity + 1)} className="px-3 text-gray-600 hover:bg-gray-200 font-bold transition">+</button>
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-md h-12 transition shadow-sm"
            >
              {t('add_to_cart')}
            </button>
          </div>

          {/* Meta Info */}
          <div className="space-y-3 pt-6 border-t border-gray-100 text-sm text-gray-600">
            {sku && (
              <div className="flex items-start">
                <span className="w-32 mr-2 font-semibold text-gray-900">{t('sku')}</span>
                <span className="flex-1 break-words">{sku}</span>
              </div>
            )}
            
            {product.category && (
              <div className="flex items-start">
                <span className="w-32 mr-2 font-semibold text-gray-900">{t('categories')}</span>
                <span className="flex-1 break-words">{product.category.name}</span>
              </div>
            )}
            
            {product.tags && product.tags.length > 0 && (
              <div className="flex items-start">
                <span className="w-32 mr-2 font-semibold text-gray-900">{t('tags')}</span>
                <span className="flex-1 break-words">
                  {product.tags.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
