'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCurrency } from '@/components/CurrencyProvider';
import { useTranslations } from 'next-intl';
import Image from "next/image";

interface ProductActionsProps {
  product: {
    id: string;
    title: string;
    price: number;
    compareAtPrice?: number | null;
    type: string;
    stock: number | null;
    images: string[];
    attributes?: { name: string; options: string[] }[];
    variations?: { id: string; price: string; stock?: string; image?: string; attributes: Record<string, string> }[];
    forceSales?: any[];
    saleTogether?: any[];
  };
  enableBuyNow?: boolean;
  onVariationChange?: (image: string | null) => void;
  shippingInfo?: string[];
  contactSlug?: string;
}

export default function ProductActions({ product, enableBuyNow = false, onVariationChange, shippingInfo, contactSlug = 'contact' }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const { formatPrice } = useCurrency();
  const [addedItemName, setAddedItemName] = useState<string | null>(null);
  const [wishlistedItemName, setWishlistedItemName] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedSaleTogether, setSelectedSaleTogether] = useState<string[]>([]);
  const t = useTranslations('Product');

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  
  const isWishlisted = wishlistStore.hasItem(product.id);

  // For variable products, we check if a variation matches the selected attributes
  const isVariable = product.type === 'VARIABLE';
  const attributes = product.attributes || [];
  const variations = product.variations || [];

  let currentVariation: { id: string; price: string; stock?: string; image?: string; attributes: Record<string, string> } | null = null;
  if (isVariable && Object.keys(selectedAttributes).length === attributes.length) {
    currentVariation = variations.find(v => {
      return Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value);
    }) || null;
  }

  // Notifier le parent de l'image de la variation courante
  useEffect(() => {
    if (onVariationChange) {
      onVariationChange(currentVariation?.image || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVariation?.id]);

  // Prix et stock dynamiques
  const currentPrice = currentVariation ? parseFloat(currentVariation.price) : product.price;
  const currentStock = currentVariation 
    ? (currentVariation.stock ? parseInt(currentVariation.stock) : null) 
    : product.stock;

  const getCartItemBase = (prod: any, price: number, qty: number = 1, currentVar: any = null, attrs: any = undefined) => ({
    id: currentVar ? `${prod.id}-${currentVar.id}` : prod.id,
    productId: prod.id,
    variationId: currentVar?.id,
    title: prod.title,
    price: price,
    image: currentVar?.image || prod.images?.[0] || '',
    quantity: qty,
    attributes: attrs,
  });

  const getLinkedItemsForCart = (qty: number) => {
    // Les forceSales sont forcés et prennent la quantité du produit principal
    const fsItems = (product.forceSales || []).map(fs => getCartItemBase(fs, fs.price, qty));
    
    // Les saleTogether cochés
    const stItems = (product.saleTogether || [])
      .filter(st => selectedSaleTogether.includes(st.id))
      .map(st => getCartItemBase(st, st.price, 1)); // ou `qty` selon la logique métier, mettons 1 par défaut pour un accessoire

    return [...fsItems, ...stItems];
  };

  const handleAddToCart = () => {
    if (isVariable && !currentVariation) {
      alert(t('select_options_cart'));
      return;
    }

    const mainItem = getCartItemBase(product, currentPrice, quantity, currentVariation, currentVariation ? selectedAttributes : undefined);
    const linkedItems = getLinkedItemsForCart(quantity);
    
    cartStore.addItem(mainItem, linkedItems);
    cartStore.setIsOpen(true);
    
    setAddedItemName(product.title);
    setTimeout(() => {
      setAddedItemName(null);
    }, 5000);
  };

  const handleBuyNow = () => {
    if (isVariable && !currentVariation) {
      alert(t('select_options_buy'));
      return;
    }

    const mainItem = getCartItemBase(product, currentPrice, quantity, currentVariation, currentVariation ? selectedAttributes : undefined);
    const linkedItems = getLinkedItemsForCart(quantity);
    
    cartStore.addItem(mainItem, linkedItems);
    
    router.push('/checkout');
  };

  const notificationPortal = isClient ? document.getElementById('cart-notification-portal') : null;

  const handleToggleWishlist = () => {
    const wasWishlisted = wishlistStore.hasItem(product.id);
    wishlistStore.toggleItem(product.id);
    
    // Only show notification and open drawer when ADDING to wishlist
    if (!wasWishlisted) {
      setWishlistedItemName(product.title);
      wishlistStore.setIsOpen(true);
      setTimeout(() => {
        setWishlistedItemName(null);
      }, 5000);
    }
  };

  return (
    <div>
      {addedItemName && notificationPortal && createPortal(
        <div className="bg-[#1b8448] text-white px-6 py-4 mb-8 flex flex-col sm:flex-row items-center justify-between shadow-sm rounded-sm">
          <div className="flex items-center gap-3 text-sm font-medium">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            <span>{t('added_to_cart', { name: addedItemName })}</span>
          </div>
          <Link href="/cart" className="mt-4 sm:mt-0 text-xs font-bold tracking-wider hover:underline whitespace-nowrap bg-black/10 hover:bg-black/20 transition-colors px-6 py-3 rounded-sm">
            {t('view_cart_caps')}
          </Link>
        </div>,
        notificationPortal
      )}

      {wishlistedItemName && notificationPortal && createPortal(
        <div className="bg-orange-600 text-white px-6 py-4 mb-8 flex flex-col sm:flex-row items-center justify-between shadow-sm rounded-sm">
          <div className="flex items-center gap-3 text-sm font-medium">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <span>{t('added_to_wishlist', { name: wishlistedItemName })}</span>
          </div>
          <Link href="/wishlist" className="mt-4 sm:mt-0 text-xs font-bold tracking-wider hover:underline whitespace-nowrap bg-black/10 hover:bg-black/20 transition-colors px-6 py-3 rounded-sm">
            {t('view_wishlist_caps')}
          </Link>
        </div>,
        notificationPortal
      )}

      {/* Price Display */}
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center">
          {product.compareAtPrice && !currentVariation && (
            <span className="text-2xl text-gray-500 line-through mr-3">{formatPrice(product.compareAtPrice)}</span>
          )}
          <span className="text-3xl font-bold text-red-600">{formatPrice(currentPrice)}</span>
        </div>
        
        {/* Total dynamique si des produits saleTogether sont cochés */}
        {selectedSaleTogether.length > 0 && (
          <div className="text-sm font-semibold text-gray-600 mt-2 bg-gray-50 p-2 rounded-md inline-block">
            {t('total_with_options')} <span className="text-red-600 ml-1">{formatPrice(
              (currentPrice * quantity) + 
              (product.saleTogether || []).filter(st => selectedSaleTogether.includes(st.id)).reduce((acc, curr) => acc + curr.price, 0)
            )}</span>
          </div>
        )}
      </div>

      {/* Force Sales UI */}
      {product.forceSales && product.forceSales.length > 0 && (
        <div className="mb-6 border-2 border-orange-500 bg-orange-50 rounded-lg p-4">
          <h4 className="text-sm font-bold text-orange-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {t('force_sales_title')}
          </h4>
          <div className="space-y-3">
            {product.forceSales.map(fs => (
              <div key={fs.id} className="flex items-center gap-3 bg-white p-2 rounded shadow-sm border border-orange-100">
                {fs.images?.[0] && <Image width={800} height={800} src={fs.images[0]} alt={fs.title} className="w-12 h-12 object-cover rounded" />}
                <div>
                  <div className="text-sm font-medium text-gray-900 leading-tight">{fs.title}</div>
                  <div className="text-sm font-bold text-gray-700">{formatPrice(fs.price)}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-orange-700 mt-3 leading-relaxed">
            {t('force_sales_msg')}
          </p>
        </div>
      )}

      {/* Attributes Selection (Only if Variable) */}
      {isVariable && attributes.length > 0 && (
        <div className="space-y-4 mb-6">
          {attributes.map(attr => (
            <div key={attr.name}>
              <span className="text-sm text-gray-500 mb-2 block">{attr.name} {selectedAttributes[attr.name] && <span className="text-gray-900 font-semibold ml-1">: {selectedAttributes[attr.name]}</span>}</span>
              <div className="flex flex-wrap gap-2">
                {attr.options.map((opt: string) => {
                  const isSelected = selectedAttributes[attr.name] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setSelectedAttributes({ ...selectedAttributes, [attr.name]: opt })}
                      className={`px-3 py-1 border rounded-md text-sm transition ${
                        isSelected ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold ring-1 ring-orange-500' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock status */}
      <p className="text-teal-600 font-semibold mb-6">
        {currentStock === null ? t('in_stock') : t('in_stock_count', { count: currentStock })}
      </p>

      {/* Shipping Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 space-y-3">
        {shippingInfo?.[0] && (
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {shippingInfo[0]}
            </div>
          </div>
        )}
        {shippingInfo?.[1] && (
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {shippingInfo[1]}
            </div>
          </div>
        )}
        {shippingInfo?.[2] && (
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {shippingInfo[2]}
            </div>
          </div>
        )}
        {shippingInfo?.[3] && (
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {shippingInfo[3]}
            </div>
          </div>
        )}
      </div>

      {/* Actions (Quantity + Cart + Buy) */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-4 w-full">
          {/* Qty */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden bg-gray-50 w-32 shrink-0">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-gray-600 hover:bg-gray-200 font-bold">-</button>
            <input type="text" value={quantity} readOnly className="w-full text-center bg-transparent font-semibold border-x border-gray-300" />
            <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 font-bold">+</button>
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={isVariable && !currentVariation}
            className={`flex-1 font-semibold rounded-md transition shadow-sm py-3 px-4 ${
              (isVariable && !currentVariation)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#0f172a] hover:bg-[#1e293b] text-white'
            }`}
          >
            {(isVariable && !currentVariation) ? t('select_options_btn') : t('add_to_cart')}
          </button>
        </div>
        
        {enableBuyNow && (
          <button 
            onClick={handleBuyNow}
            className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold rounded-md transition shadow-sm py-3"
          >
            {t('buy_now')}
          </button>
        )}
      </div>

      {/* Sale Together UI */}
      {product.saleTogether && product.saleTogether.length > 0 && (
        <div className="mb-8 border border-gray-200 rounded-lg p-4 bg-gray-50/50">
          <h4 className="text-sm font-bold text-gray-900 mb-4">{t('frequently_bought_together')}</h4>
          <div className="space-y-3">
            {product.saleTogether.map(st => (
              <label key={st.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded transition border border-transparent hover:border-gray-200">
                <input 
                  type="checkbox"
                  checked={selectedSaleTogether.includes(st.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedSaleTogether(prev => [...prev, st.id]);
                    else setSelectedSaleTogether(prev => prev.filter(id => id !== st.id));
                  }}
                  className="w-5 h-5 text-orange-700 rounded border-gray-300 focus:ring-orange-500"
                />
                {st.images?.[0] && <Image width={800} height={800} src={st.images[0]} alt={st.title} className="w-12 h-12 object-cover rounded bg-white border border-gray-100" />}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 leading-tight line-clamp-1">{st.title}</div>
                  <div className="text-sm font-bold text-gray-700">{formatPrice(st.price)}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Secondary Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button 
          onClick={handleToggleWishlist}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md border transition ${
            isWishlisted ? 'bg-orange-500 text-white border-orange-500' : 'text-gray-600 hover:text-orange-600 bg-orange-50/50 border-orange-100'
          }`}
        >
          <svg className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          {isWishlisted ? t('remove_wishlist') : t('add_wishlist')}
        </button>
        <button 
          type="button"
          onClick={() => router.push('/compare')}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600 bg-orange-50/50 px-4 py-2 rounded-md border border-orange-100 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          {t('compare')}
        </button>
        <button 
          type="button"
          onClick={() => router.push(`/${contactSlug}`)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600 bg-orange-50/50 px-4 py-2 rounded-md border border-orange-100 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {t('ask_question')}
        </button>
      </div>
    </div>
  );
}
