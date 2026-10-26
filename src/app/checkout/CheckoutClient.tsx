'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import { processCheckout, validateCoupon } from '@/actions/checkout';
import { useCurrency } from '@/components/CurrencyProvider';
import { useTranslations } from 'next-intl';

interface CheckoutClientProps {
  settings: {
    ENABLE_STRIPE: string;
    ENABLE_PAYPAL: string;
    ENABLE_BANK_TRANSFER: string;
    BANK_TRANSFER_CHECKOUT_MESSAGE?: string;
  };
  zones: Array<{
    name: string;
    methods: Array<{
      id: string;
      type: string;
      rate: number;
    }>;
  }>;
}

export default function CheckoutClient({ settings, zones }: CheckoutClientProps) {
  const router = useRouter();
  const { items: cart, getTotalPrice, clearCart, coupon, setCoupon } = useCartStore();
  
  const [selectedCountry, setSelectedCountry] = useState(zones.length > 0 ? zones[0].name : '');
  const [shippingCountry, setShippingCountry] = useState(zones.length > 0 ? zones[0].name : '');
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);

  const effectiveShippingCountry = shipToDifferentAddress ? shippingCountry : selectedCountry;
  const activeZone = zones.find(z => z.name === effectiveShippingCountry);
  const activeMethods = activeZone?.methods || [];

  const [shippingMethodId, setShippingMethodId] = useState(activeMethods.length > 0 ? activeMethods[0].id : '');

  useEffect(() => {
    const newActiveZone = zones.find(z => z.name === effectiveShippingCountry);
    const newMethods = newActiveZone?.methods || [];
    if (newMethods.length > 0) {
      setShippingMethodId(newMethods[0].id);
    } else {
      setShippingMethodId('');
    }
  }, [effectiveShippingCountry, zones]);
  
  const enableBankTransfer = settings.ENABLE_BANK_TRANSFER !== 'false';
  const enableStripe = settings.ENABLE_STRIPE !== 'false';
  const enablePaypal = settings.ENABLE_PAYPAL !== 'false';
  
  const defaultPaymentMethod = enableBankTransfer ? 'BANK_TRANSFER' : enableStripe ? 'STRIPE' : enablePaypal ? 'PAYPAL' : '';
  const [paymentMethod, setPaymentMethod] = useState<string>(defaultPaymentMethod);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  // appliedCoupon state removed, using coupon from cartStore
  const [couponError, setCouponError] = useState('');
  const { formatPrice } = useCurrency();
  const t = useTranslations('Checkout');
  const tCountries = useTranslations('Countries');

  const cartTotal = getTotalPrice();
  
  // Calculate Discount
  let discountAmount = 0;
  if (coupon) {
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = cartTotal * (coupon.value / 100);
    } else {
      discountAmount = coupon.value;
    }
  }

  const selectedMethod = activeMethods.find(m => m.id === shippingMethodId);
  const shippingCost = selectedMethod ? selectedMethod.rate : 0;

  const finalTotal = Math.max(0, cartTotal - discountAmount) + shippingCost;

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    
    const res = await validateCoupon(couponCode);
    if (res.error) {
      setCouponError(res.error);
      setCoupon(null);
    } else if (res.coupon) {
      setCoupon(res.coupon as any);
      setShowCouponInput(false);
    }
  };

  const [fallbackModal, setFallbackModal] = useState<{
    unavailableMethod: string;
    fallbackMethod: string;
  } | null>(null);

  const getPaymentMethodName = (method: string) => {
    if (method === 'BANK_TRANSFER') return t('direct_bank_transfer');
    if (method === 'STRIPE') return t('credit_card_stripe');
    if (method === 'PAYPAL') return t('paypal');
    return method;
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!paymentMethod) {
      alert(t('select_payment'));
      return;
    }
    
    setIsProcessing(true);
    setFallbackModal(null);
    
    const formData = new FormData(e.currentTarget);
    if (coupon) {
      formData.append('couponCode', coupon.code);
    }
    
    const res = await processCheckout(formData, cart, finalTotal, paymentMethod as any);
    
    if (res.error) {
      if (res.error === 'payment_unavailable' && res.fallbackPaymentMethod) {
        setFallbackModal({
          unavailableMethod: res.unavailableMethod || paymentMethod,
          fallbackMethod: res.fallbackPaymentMethod,
        });
        setIsProcessing(false);
        return;
      }
      alert(res.error);
      setIsProcessing(false);
      return;
    }

    if (res.redirectUrl) {
      clearCart();
      router.push(res.redirectUrl);
    } else if (paymentMethod === 'PAYPAL') {
      clearCart();
      alert('Opening PayPal (Simulation)... Order ' + res.orderId);
      router.push('/checkout/success?orderId=' + res.orderId);
    }
    
    setIsProcessing(false);
  };

  const handleSwitchToFallback = (fallbackMethod: string) => {
    setPaymentMethod(fallbackMethod);
    setFallbackModal(null);
    // Smooth scroll to payment section
    const elem = document.getElementById('payment-methods-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const captureAbandonedCart = (e: React.FocusEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    setTimeout(async () => {
      const formData = new FormData(form);
      const email = formData.get('email') as string;
      if (email && email.includes('@') && cart.length > 0) {
        try {
          await fetch('/api/abandoned-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              firstName: formData.get('firstName') as string,
              lastName: formData.get('lastName') as string,
              phone: formData.get('phone') as string,
              cartData: cart,
              totalAmount: finalTotal
            })
          });
        } catch (err) {
          // Silent fail
        }
      }
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      {/* Modal / Alerte Fallback Mode de Paiement */}
      {fallbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 text-left">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-5 text-2xl">
              ⚠️
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              {t('payment_unavailable_title')}
            </h3>
            
            <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
              {fallbackModal.unavailableMethod === 'STRIPE'
                ? t('payment_unavailable_stripe')
                : t('payment_unavailable_paypal')}
              <br />
              <span className="font-semibold text-gray-800 mt-2 block">
                {t('payment_fallback_suggestion', { method: getPaymentMethodName(fallbackModal.fallbackMethod) })}
              </span>
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSwitchToFallback(fallbackModal.fallbackMethod)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2"
              >
                <span>✓</span>
                <span>{t('continue_with_fallback', { method: getPaymentMethodName(fallbackModal.fallbackMethod) })}</span>
              </button>

              <button
                type="button"
                onClick={() => setFallbackModal(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl text-sm transition"
              >
                {t('remove_btn') || 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleCheckout} onBlurCapture={captureAbandonedCart} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Colonne de Gauche : Formulaire de Facturation */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="bg-gray-50 p-4 rounded text-sm text-gray-700">
            {t('have_coupon')} <button type="button" onClick={() => setShowCouponInput(!showCouponInput)} className="text-orange-700 hover:underline font-medium">{t('click_to_enter_code')}</button>
          </div>
          
          {showCouponInput && !coupon && (
            <div className="bg-white p-4 border border-gray-200 rounded">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder={t('coupon_placeholder')} 
                  className="flex-grow px-4 py-2 border border-gray-200 rounded focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
                <button type="button" onClick={handleApplyCoupon} className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors">
                  {t('apply_btn')}
                </button>
              </div>
              {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
            </div>
          )}
          
          {coupon && (
            <div className="bg-green-50 text-green-800 px-4 py-3 rounded-md flex justify-between items-center">
              <div>
                <span className="font-medium mr-2">{coupon.code}</span>
                <span className="text-sm opacity-90">{t('coupon_applied')}</span>
              </div>
              <button type="button" onClick={() => setCoupon(null)} className="text-sm font-medium text-green-700 hover:text-green-900">
                {t('remove_btn')}
              </button>
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded text-sm text-gray-700">
            {t('already_customer')} <Link href="/login" className="text-orange-700 hover:underline font-medium">{t('click_to_login')}</Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('billing_details')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('first_name')} <span className="text-red-500">*</span></label>
              <input type="text" name="firstName" required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('last_name')} <span className="text-red-500">*</span></label>
              <input type="text" name="lastName" required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('country_region')} <span className="text-red-500">*</span></label>
            <select 
              name="country" 
              required 
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500"
            >
              {zones.map((zone) => (
                <option key={zone.name} value={zone.name}>{tCountries(zone.name) || zone.name}</option>
              ))}
              {zones.length === 0 && <option value="">{t('no_shipping_zones')}</option>}
            </select>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('street_address')} <span className="text-red-500">*</span></label>
              <input type="text" name="address1" placeholder={t('street_address_placeholder_1')} required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
            </div>
            <div>
              <input type="text" name="address2" placeholder={t('street_address_placeholder_2')} className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('postcode_zip')} <span className="text-red-500">*</span></label>
            <input type="text" name="postalCode" required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('city')} <span className="text-red-500">*</span></label>
            <input type="text" name="city" required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone_optional')}</label>
            <input type="tel" name="phone" className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email_address')} <span className="text-red-500">*</span></label>
            <input type="email" name="email" required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="createAccount" name="createAccount" className="w-4 h-4 text-orange-700 rounded border-gray-300 focus:ring-orange-500" />
            <label htmlFor="createAccount" className="text-sm text-gray-700 cursor-pointer">{t('create_account_question')}</label>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input 
              type="checkbox" 
              id="shipToDifferentAddress" 
              name="shipToDifferentAddress" 
              checked={shipToDifferentAddress}
              onChange={(e) => setShipToDifferentAddress(e.target.checked)}
              className="w-5 h-5 text-orange-700 rounded border-gray-300 focus:ring-orange-500" 
            />
            <label htmlFor="shipToDifferentAddress" className="text-lg font-bold text-gray-900 cursor-pointer">{t('ship_different_address')}</label>
          </div>

          {shipToDifferentAddress && (
            <div className="space-y-6 mt-4 p-6 border border-gray-200 rounded-lg bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('first_name')} <span className="text-red-500">*</span></label>
                  <input type="text" name="shippingFirstName" placeholder={t('first_name')} required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('last_name')} <span className="text-red-500">*</span></label>
                  <input type="text" name="shippingLastName" placeholder={t('last_name')} required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('company_name')} <span className="text-red-500">*</span></label>
                <input type="text" name="shippingCompany" required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('country_region')} <span className="text-red-500">*</span></label>
                <select 
                  name="shippingCountry" 
                  required 
                  value={shippingCountry}
                  onChange={(e) => setShippingCountry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500"
                >
                  {zones.map((zone) => (
                    <option key={zone.name} value={zone.name}>{zone.name}</option>
                  ))}
                  {zones.length === 0 && <option value="">{t('no_shipping_zones')}</option>}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('street_address')} <span className="text-red-500">*</span></label>
                  <input type="text" name="shippingAddress1" placeholder={t('street_address_placeholder_1')} required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <div>
                  <input type="text" name="shippingAddress2" placeholder={t('street_address_placeholder_2')} className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('postcode_zip')} <span className="text-red-500">*</span></label>
                <input type="text" name="shippingPostalCode" required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('city')} <span className="text-red-500">*</span></label>
                <input type="text" name="shippingCity" required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')} <span className="text-red-500">*</span></label>
                <input type="tel" name="shippingPhone" required className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('order_notes')}</label>
            <textarea 
              name="orderNotes" 
              rows={3} 
              placeholder={t('order_notes_placeholder')}
              className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded focus:ring-orange-500 focus:border-orange-500"
            ></textarea>
          </div>

        </div>

        {/* Right Column: Summary and Payment */}
        <div className="lg:col-span-5">
          <div className="bg-gray-50 p-6 sm:p-8 rounded-lg border border-gray-100 sticky top-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('your_order')}</h2>
            
            <div className="border-b border-gray-200 pb-4 mb-4">
              <div className="flex justify-between font-bold text-sm text-gray-900 mb-4">
                <span>{t('product')}</span>
                <span>{t('subtotal')}</span>
              </div>
              
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between text-sm text-gray-600 mb-4">
                  <div className="pr-4">
                    {item.title} <strong className="text-gray-900">× {item.quantity}</strong>
                  </div>
                  <div className="whitespace-nowrap font-medium text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between text-sm font-bold text-gray-900">
              <span>{t('subtotal')}</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>

            {coupon && (
              <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between text-sm font-bold text-green-600">
                <span>{t('discount', { code: coupon.code })}</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between text-sm text-gray-900">
              <span className="font-bold">{t('shipping')}</span>
              <div className="text-right space-y-2">
                {activeMethods.length === 0 ? (
                  <div className="text-gray-500 text-sm">{t('no_shipping_method')}</div>
                ) : (
                  activeMethods.map((method) => (
                    <label key={method.id} className="flex items-center justify-end gap-2 cursor-pointer">
                      <span className="text-gray-600">{method.type}: {formatPrice(method.rate)}</span>
                      <input 
                        type="radio" 
                        name="shippingMethod" 
                        value={method.id} 
                        checked={shippingMethodId === method.id} 
                        onChange={() => setShippingMethodId(method.id)} 
                        className="text-orange-700 focus:ring-orange-500" 
                      />
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold text-gray-900 mb-8">
              <span>{t('total')}</span>
              <span>{formatPrice(finalTotal)}</span>
            </div>

            {/* Payment method accordion */}
            <div id="payment-methods-section" className="space-y-4 mb-8">
              {!enableBankTransfer && !enableStripe && !enablePaypal && (
                <div className="p-4 bg-red-50 text-red-600 rounded text-sm text-center font-medium">
                  {t('no_payment_method')}
                </div>
              )}

              {/* Virement Bancaire */}
              {enableBankTransfer && (
                <div className="border border-gray-200 rounded overflow-hidden">
                  <label className="flex items-center p-4 bg-gray-100 cursor-pointer border-b border-gray-200">
                    <input 
                      type="radio" 
                      name="payment" 
                      value="BANK_TRANSFER"
                      checked={paymentMethod === 'BANK_TRANSFER'} 
                      onChange={() => setPaymentMethod('BANK_TRANSFER')}
                      className="w-4 h-4 text-orange-700 mr-3 focus:ring-orange-500" 
                    />
                    <span className="font-medium text-gray-900">{t('direct_bank_transfer')}</span>
                  </label>
                  {paymentMethod === 'BANK_TRANSFER' && (
                    <div className="p-4 bg-gray-50 text-sm text-gray-600">
                      <p className="bg-gray-200/50 p-4 rounded text-gray-600 whitespace-pre-wrap">
                        {settings.BANK_TRANSFER_CHECKOUT_MESSAGE || t('bank_transfer_msg')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Stripe (Carte Bancaire) */}
              {enableStripe && (
                <div className="border border-gray-200 rounded overflow-hidden">
                  <label className="flex items-center p-4 bg-gray-100 cursor-pointer border-b border-gray-200">
                    <input 
                      type="radio" 
                      name="payment" 
                      value="STRIPE"
                      checked={paymentMethod === 'STRIPE'} 
                      onChange={() => setPaymentMethod('STRIPE')}
                      className="w-4 h-4 text-orange-700 mr-3 focus:ring-orange-500" 
                    />
                    <span className="font-medium text-gray-900">{t('credit_card_stripe')}</span>
                  </label>
                  {paymentMethod === 'STRIPE' && (
                    <div className="p-4 bg-gray-50 text-sm text-gray-600">
                      <p className="bg-gray-200/50 p-4 rounded text-gray-600">
                        {t('stripe_msg')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PayPal */}
              {enablePaypal && (
                <div className="border border-gray-200 rounded overflow-hidden">
                  <label className="flex items-center p-4 bg-gray-100 cursor-pointer">
                    <input 
                      type="radio" 
                      name="payment" 
                      value="PAYPAL"
                      checked={paymentMethod === 'PAYPAL'} 
                      onChange={() => setPaymentMethod('PAYPAL')}
                      className="w-4 h-4 text-orange-700 mr-3 focus:ring-orange-500" 
                    />
                    <span className="font-medium text-gray-900">{t('paypal')}</span>
                  </label>
                  {paymentMethod === 'PAYPAL' && (
                    <div className="p-4 bg-gray-50 text-sm text-gray-600">
                      <p className="bg-gray-200/50 p-4 rounded text-gray-600">
                        {t('paypal_msg')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 mb-6">
              {t('privacy_policy_msg_1')}<Link href="/privacy" className="text-orange-700 hover:underline">{t('privacy_policy_link')}</Link>{t('privacy_policy_msg_2')}
            </div>

            <button 
              type="submit" 
              disabled={isProcessing || cart.length === 0 || !paymentMethod}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded transition-colors flex justify-center items-center disabled:opacity-50"
            >
              {isProcessing ? t('processing') : t('place_order')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
