'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import Price from '@/components/Price';
import { useTranslations } from 'next-intl';
import { validateCoupon } from '@/actions/checkout';
import Image from "next/image";

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems, coupon, setCoupon } = useCartStore();
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const t = useTranslations('CartDrawer');

  const cartTotal = getTotalPrice();
  let discountAmount = 0;
  if (coupon) {
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = cartTotal * (coupon.value / 100);
    } else {
      discountAmount = coupon.value;
    }
  }
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    
    setIsApplying(true);
    const res = await validateCoupon(couponCode);
    if (res.error) {
      setCouponError(res.error);
      setCoupon(null);
    } else if (res.coupon) {
      setCoupon(res.coupon as any);
      setShowCoupon(false);
    }
    setIsApplying(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return early or provide a skeleton if needed
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 z-[101] w-full sm:w-[400px] h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center">
            <div className="relative mr-2">
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                {getTotalItems()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            {items.length > 0 && (
              <button 
                onClick={clearCart}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                {t('clear_all')}
              </button>
            )}
            <button 
              onClick={onClose}
              aria-label={t('close') || "Close"}
              className="p-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              {/* Sad Bag SVG / Illustration placeholder */}
              <div className="w-48 h-48 mb-6 relative opacity-70">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-gray-300 stroke-current">
                   <rect x="50" y="70" width="100" height="100" rx="4" strokeWidth="4"/>
                   <path d="M70 70V50C70 33.4315 83.4315 20 100 20C116.569 20 130 33.4315 130 50V70" strokeWidth="4"/>
                   <path d="M80 130C80 130 90 140 100 140C110 140 120 130 120 130" strokeWidth="4" strokeLinecap="round"/>
                   <circle cx="85" cy="100" r="4" fill="currentColor"/>
                   <circle cx="115" cy="100" r="4" fill="currentColor"/>
                </svg>
              </div>
              <p className="text-gray-800 font-medium mb-6">{t('empty_cart')}</p>
              <button 
                onClick={onClose}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-8 rounded-md transition"
              >
                {t('continue_shopping')}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4">
                  <div className="w-20 h-20 bg-gray-50 border border-gray-100 flex-shrink-0 rounded flex items-center justify-center relative overflow-hidden">
                    {item.image ? (
                       <Image width={800} height={800} src={item.image} alt={item.title} className="w-full h-full object-contain p-1" />
                    ) : (
                       <span className="text-xs text-gray-500">{t('no_image')}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <Link href={`/product/${item.productId}`} onClick={onClose} className="font-medium text-gray-900 text-sm hover:text-orange-700 line-clamp-2 leading-tight mb-2">
                      {item.title}
                    </Link>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center border border-gray-200 rounded-sm">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          min="1" 
                          value={item.quantity} 
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-10 h-7 text-center text-sm outline-none border-x border-gray-200"
                        />
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right flex flex-col">
                        <Price amount={item.price * item.quantity} className="font-bold text-gray-900" />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-gray-500 hover:text-red-500 flex items-center mt-3 self-end"
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      {t('remove')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (Totals & CTA) */}
        <div className="p-4 bg-white border-t border-gray-100 mt-auto">
          {/* Coupon */}
          <div className="mb-4">
              <button 
                onClick={() => setShowCoupon(!showCoupon)}
                className="flex items-center text-sm text-gray-700 hover:text-orange-700 transition"
              >
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                <span className="font-semibold text-orange-700 mr-1">{t('click_here')}</span> {t('apply_coupon_text')}
              </button>
              {showCoupon && (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder={t('coupon_placeholder')} className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-orange-500 uppercase" />
                    <button onClick={handleApplyCoupon} disabled={isApplying} className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 transition disabled:opacity-50">{isApplying ? '...' : t('apply_btn')}</button>
                  </div>
                  {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                </div>
              )}
            </div>

          <div className="border border-orange-500 rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-900 font-medium">{t('subtotal')}</span>
                <Price amount={cartTotal} className={coupon ? 'text-gray-500 line-through' : 'text-gray-900'} />
              </div>
              {coupon && (
                <div className="flex justify-between items-center mb-2 text-green-600">
                  <span className="font-medium flex items-center gap-1">
                    Coupon ({coupon.code})
                    <button onClick={() => setCoupon(null)} className="text-red-500 hover:text-red-700 ml-2 text-xs">Remove</button>
                  </span>
                  <Price amount={-discountAmount} />
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold border-t border-gray-100 mt-2 pt-2">
                <span className="text-gray-900">{t('total')}</span>
                <Price amount={finalTotal} className="text-gray-900" />
              </div>
          </div>

          <div className="flex gap-3">
            <Link 
              href="/cart" 
                onClick={onClose}
                className="flex-1 flex justify-center items-center py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition"
              >
                {t('view_cart')}
              </Link>
              <Link 
                href="/checkout" 
                onClick={onClose}
                className="flex-1 flex justify-center items-center py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md transition"
              >
                {t('checkout')}
              </Link>
          </div>
        </div>
      </div>
    </>
  );
}
