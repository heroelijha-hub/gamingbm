import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import DeliveryTracker from '@/components/admin/DeliveryTracker';
import Price from '@/components/Price';
import { getTranslations } from 'next-intl/server';
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('AdminOrders');
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      orderItems: {
        include: {
          product: true
        }
      },
      deliveryPositions: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!order) {
    notFound();
  }

  // Parse customer metadata stored in destinationAddress field
  let orderMeta: any = null;
  try {
    if (order.destinationAddress) {
      const parsed = JSON.parse(order.destinationAddress);
      // Check if it's the metadata object (has billing key) vs a plain address string
      if (parsed && parsed.billing) {
        orderMeta = parsed;
      }
    }
  } catch {
    // Plain address string, not JSON metadata
  }

  const billing = orderMeta?.billing || null;
  const shipping = orderMeta?.shipping || null;
  const couponCode = orderMeta?.couponCode || null;
  const discount = orderMeta?.discount || 0;
  
  let subTotal = orderMeta?.subTotal;
  if (subTotal === undefined || subTotal === null) {
    subTotal = order.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }
  
  let shippingCost = orderMeta?.shippingCost;
  if (shippingCost === undefined || shippingCost === null) {
    shippingCost = order.total - subTotal;
    // ensure no floating point weirdness
    shippingCost = Math.max(0, Math.round(shippingCost * 100) / 100);
  }
  
  const shippingMethodName = orderMeta?.shippingMethodName || null;

  // For old orders without JSON metadata, look up name from AbandonedCart by email
  let fallbackCustomerName = '';
  if (!billing && order.user?.email) {
    const abandonedCart = await prisma.abandonedCart.findUnique({
      where: { email: order.user.email },
      select: { firstName: true, lastName: true }
    });
    if (abandonedCart) {
      fallbackCustomerName = [abandonedCart.firstName, abandonedCart.lastName].filter(Boolean).join(' ');
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('order_number')}{order.id.split('-')[0]}</h1>
        <a href="/admin/orders" className="text-sm font-medium text-gray-600 hover:text-gray-900">{t('back_to_orders')}</a>
      </div>

      {/* ── ROW 1 : Articles (gauche) + Infos client (droite) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Articles — 2/3 */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('items')}</h2>
            <div className="space-y-4">
              {order.orderItems.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div className="flex items-center space-x-4">
                    {item.product.images[0] && (
                      <Image width={800} height={800} src={item.product.images[0]} alt={item.product.title} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.product.title}</p>
                      {item.attributes && (
                        <p className="text-xs text-orange-700 font-medium">
                          {(() => {
                            try {
                              const attrs = typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes;
                              return Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ');
                            } catch (e) {
                              return '';
                            }
                          })()}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">{t('qty')}: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium text-sm"><Price amount={item.price * item.quantity} showTax={false} /></p>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="mt-4 pt-4 border-t space-y-2">
              {subTotal !== null && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t('subtotal')}</span>
                  <span><Price amount={subTotal} showTax={false} /></span>
                </div>
              )}
              {couponCode && discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>
                    🏷️ {t('coupon_applied_label')}{' '}
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-xs">{couponCode}</span>
                  </span>
                  <span>- <Price amount={discount} showTax={false} /></span>
                </div>
              )}
              {shippingCost !== null && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t('shipping_cost')}{shippingMethodName ? ` (${shippingMethodName})` : ''}</span>
                  <span><Price amount={shippingCost} showTax={false} /></span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t('payment_method')}</span>
                <span>{order.paymentMethod === 'BANK_TRANSFER' ? t('payment_bank_transfer') : order.paymentMethod === 'STRIPE' ? t('payment_stripe') : order.paymentMethod === 'PAYPAL' ? 'PayPal' : order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-gray-900 pt-2 border-t">
                <span>{t('total')}</span>
                <span><Price amount={order.total} showTax={false} /></span>
              </div>
            </div>
          </div>
        </div>

        {/* Infos client — 1/3 */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4">👤 {t('customer_info')}</h2>

            {billing ? (
              <>
                {/* Adresse de facturation */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('billing_address')}</p>
                <div className="space-y-2 text-sm text-gray-700 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-4 shrink-0">👤</span>
                    <span className="font-medium">{[billing.firstName, billing.lastName].filter(Boolean).join(' ') || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-4 shrink-0">✉️</span>
                    <a href={`mailto:${billing.email || order.user?.email}`} className="text-orange-700 hover:underline break-all text-xs">
                      {billing.email || order.user?.email || '—'}
                    </a>
                  </div>
                  {billing.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-4 shrink-0">📞</span>
                      <a href={`tel:${billing.phone}`} className="hover:underline">{billing.phone}</a>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 w-4 shrink-0 mt-0.5">📍</span>
                    <div className="leading-5">
                      {billing.address1 && <p>{billing.address1}</p>}
                      {billing.address2 && <p>{billing.address2}</p>}
                      <p>{[billing.postalCode, billing.city].filter(Boolean).join(' ')}</p>
                      {billing.country && <p className="font-medium">{billing.country}</p>}
                    </div>
                  </div>
                </div>

                {/* Adresse de livraison */}
                <div className="border-t pt-4">
                  {shipping ? (
                    <>
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3">🚚 {t('shipping_address_different')}</p>
                      <div className="space-y-2 text-sm text-gray-700 bg-orange-50 border border-orange-100 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-4 shrink-0">👤</span>
                          <span className="font-medium">{[shipping.firstName, shipping.lastName].filter(Boolean).join(' ') || '—'}</span>
                        </div>
                        {shipping.company && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-4 shrink-0">🏢</span>
                            <span>{shipping.company}</span>
                          </div>
                        )}
                        {shipping.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-4 shrink-0">📞</span>
                            <a href={`tel:${shipping.phone}`} className="hover:underline">{shipping.phone}</a>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-4 shrink-0 mt-0.5">📍</span>
                          <div className="leading-5">
                            {shipping.address1 && <p>{shipping.address1}</p>}
                            {shipping.address2 && <p>{shipping.address2}</p>}
                            <p>{[shipping.postalCode, shipping.city].filter(Boolean).join(' ')}</p>
                            {shipping.country && <p className="font-medium">{shipping.country}</p>}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🚚 {t('shipping_address')}</p>
                      <p className="text-sm text-gray-500 italic">{t('same_as_billing')}</p>
                    </>
                  )}
                </div>
              </>
            ) : (
              /* Fallback: commandes sans métadonnées JSON */
              <div className="space-y-3 text-sm text-gray-700">
                {fallbackCustomerName && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-4 shrink-0">👤</span>
                    <span className="font-medium">{fallbackCustomerName}</span>
                  </div>
                )}
                {order.user?.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-4 shrink-0">✉️</span>
                    <a href={`mailto:${order.user.email}`} className="text-orange-700 hover:underline break-all text-xs">
                      {order.user.email}
                    </a>
                  </div>
                )}
                {order.destinationAddress && (
                  <div className="flex items-start gap-2 pt-1">
                    <span className="text-gray-500 w-4 shrink-0 mt-0.5">📍</span>
                    <p className="whitespace-pre-wrap leading-relaxed">{order.destinationAddress}</p>
                  </div>
                )}
                <div className="border-t pt-3 mt-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">🚚 {t('shipping_address')}</p>
                  <p className="text-sm text-gray-500 italic">{t('same_as_billing')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 2 : Tracking (3 colonnes via DeliveryTracker) ── */}
      <DeliveryTracker
        orderId={order.id}
        trackingNumber={order.trackingNumber}
        originCity={order.originCity}
        originCountry={order.originCountry}
        destinationAddress={orderMeta ? null : order.destinationAddress}
        destinationCountry={order.destinationCountry}
        deliveryPositions={order.deliveryPositions}
        preparationStartedAt={order.preparationStartedAt ?? null}
        deliveryDays={order.deliveryDays ?? null}
        delayNote={order.delayNote ?? null}
        orderStatus={order.status}
      />
    </div>
  );
}
