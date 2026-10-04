import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import Price from '@/components/Price';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const t = await getTranslations('AccountOrders');
  const locale = await getLocale();

  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! }
  });

  if (!dbUser) {
    redirect('/login');
  }

  // Fetch the order and verify ownership
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: { product: true }
      }
    }
  });

  if (!order) {
    notFound();
  }

  if (order.userId !== dbUser.id) {
    redirect('/account/orders'); // unauthorized
  }

  const statusLabels: Record<string, string> = {
    PENDING: t('status_pending'),
    PAID: t('status_paid'),
    PROCESSING: t('status_processing'),
    SHIPPED: t('status_shipped'),
    IN_TRANSIT: t('status_in_transit'),
    DELIVERED: t('status_delivered'),
    AT_PICKUP_POINT: t('status_at_pickup_point'),
    CANCELLED: t('status_cancelled')
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-800',
    PAID: 'bg-green-100 text-green-800',
    PROCESSING: 'bg-orange-100 text-orange-800',
    SHIPPED: 'bg-blue-100 text-blue-800',
    IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-teal-100 text-teal-800',
    AT_PICKUP_POINT: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-red-100 text-red-800'
  };

  const totalItems = order.orderItems.reduce((acc, item) => acc + item.quantity, 0);

  let formattedShippingAddress = "";
  let formattedBillingAddress = "";
  let customerNameShipping = "";
  let customerNameBilling = "";
  let customerPhone = "";
  let customerEmail = user.email;
  let shippingMethodName = "";
  let subTotalAmount = order.total;
  let shippingCostAmount = 0;

  if (order.destinationAddress && order.destinationAddress.startsWith('{')) {
    try {
      const parsed = JSON.parse(order.destinationAddress);
      
      const shipObj = parsed.shipping || parsed;
      const billObj = parsed.billing || parsed;

      // Shipping Name
      if (shipObj.firstName || shipObj.lastName) {
        customerNameShipping = `${shipObj.firstName || ''} ${shipObj.lastName || ''}`.trim();
      }
      
      // Billing Name
      if (billObj.firstName || billObj.lastName) {
        customerNameBilling = `${billObj.firstName || ''} ${billObj.lastName || ''}`.trim();
      }

      // Phone
      if (billObj.phone) {
         customerPhone = billObj.phone;
      } else if (shipObj.phone) {
         customerPhone = shipObj.phone;
      } else if (parsed.phone) {
         customerPhone = parsed.phone;
      }
      
      // Email
      if (billObj.email) {
        customerEmail = billObj.email;
      }
      
      // Totals
      if (parsed.subTotal) subTotalAmount = Number(parsed.subTotal);
      if (parsed.shippingCost !== undefined) shippingCostAmount = Number(parsed.shippingCost);
      else shippingCostAmount = order.total - subTotalAmount;
      
      if (parsed.shippingMethodName) shippingMethodName = parsed.shippingMethodName;

      // Format Shipping
      const sParts = [];
      if (shipObj.address1) sParts.push(shipObj.address1);
      if (shipObj.address2) sParts.push(shipObj.address2);
      if (shipObj.postalCode || shipObj.city) {
        sParts.push(`${shipObj.postalCode || ''} ${shipObj.city || ''}`.trim());
      }
      if (shipObj.country) sParts.push(shipObj.country);
      if (sParts.length > 0) formattedShippingAddress = sParts.filter(Boolean).join('\n');
      
      // Format Billing
      const bParts = [];
      if (billObj.address1) bParts.push(billObj.address1);
      if (billObj.address2) bParts.push(billObj.address2);
      if (billObj.postalCode || billObj.city) {
        bParts.push(`${billObj.postalCode || ''} ${billObj.city || ''}`.trim());
      }
      if (billObj.country) bParts.push(billObj.country);
      if (bParts.length > 0) formattedBillingAddress = bParts.filter(Boolean).join('\n');
      
    } catch (e) {
      formattedShippingAddress = order.destinationAddress;
      formattedBillingAddress = order.destinationAddress;
    }
  } else {
    formattedShippingAddress = order.destinationAddress || "";
    formattedBillingAddress = order.destinationAddress || "";
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentStatus = statusLabels[order.status] || order.status;
  const orderId = order.id.split('-')[0].toUpperCase();

  const paymentMethodLabels: Record<string, string> = {
    STRIPE: t('payment_stripe'),
    BANK_TRANSFER: t('payment_bank_transfer')
  };
  const currentPaymentMethod = paymentMethodLabels[order.paymentMethod] || order.paymentMethod;

  // Fallback for shipping address if it wasn't provided distinctly
  if (!formattedShippingAddress && formattedBillingAddress) {
    formattedShippingAddress = formattedBillingAddress;
    customerNameShipping = customerNameBilling;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
      
      {/* Order Intro */}
      <p className="text-gray-600 mb-8 text-sm md:text-base">
        {t.rich('order_intro', {
          id: orderId,
          date: orderDate,
          status: currentStatus,
          mark: (chunks) => <mark className="bg-gray-100 px-2 py-1 rounded text-gray-800 font-medium">{chunks}</mark>
        })}
      </p>

      {/* Order Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Articles — 2/3 */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('product')}</h2>
            <div className="space-y-4">
              {order.orderItems.map(item => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-0">
                  <div className="flex items-center space-x-4">
                    {item.product.images && item.product.images[0] ? (
                      <Image width={800} height={800} src={item.product.images[0]} alt={item.product.title} className="w-16 h-16 object-cover rounded border border-gray-100" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xs">No image</span>
                      </div>
                    )}
                    <div>
                      <Link href={`/product/${item.product.slug}`} className="font-semibold text-sm text-gray-900 hover:text-orange-700 transition-colors">
                        {item.product.title}
                      </Link>
                      {item.attributes && (
                        <p className="text-xs text-orange-700 font-medium mt-1">
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
                      <p className="text-xs text-gray-500 mt-1">Quantité: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-gray-900"><Price amount={item.price * item.quantity} showTax={false} /></p>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t('subtotal')}</span>
                <span><Price amount={subTotalAmount} showTax={false} /></span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t('shipping_cost')} {shippingMethodName ? `(${shippingMethodName})` : ''}</span>
                <span><Price amount={shippingCostAmount} showTax={false} /></span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t('payment_method')}</span>
                <span>{currentPaymentMethod}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-gray-900 pt-3 mt-1 border-t">
                <span>{t('total')}</span>
                <span className="text-lg"><Price amount={order.total} showTax={false} /></span>
              </div>
            </div>
          </div>
        </div>

        {/* Infos client — 1/3 */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4">👤 Informations client</h2>

            {/* Adresse de facturation */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">ADRESSE DE FACTURATION</p>
            <div className="space-y-2 text-sm text-gray-700 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-4 shrink-0">👤</span>
                <span className="font-medium">{customerNameBilling || (user.email ? user.email.split('@')[0] : '')}</span>
              </div>
              {customerEmail && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-4 shrink-0">✉️</span>
                  <a href={`mailto:${customerEmail}`} className="text-orange-700 hover:underline break-all text-xs">
                    {customerEmail}
                  </a>
                </div>
              )}
              {customerPhone && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-4 shrink-0">📞</span>
                  <a href={`tel:${customerPhone}`} className="hover:underline">{customerPhone}</a>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-gray-500 w-4 shrink-0 mt-0.5">📍</span>
                <p className="whitespace-pre-wrap leading-relaxed">{formattedBillingAddress}</p>
              </div>
            </div>

            {/* Adresse de livraison */}
            <div className="border-t pt-4">
              {formattedShippingAddress && formattedShippingAddress !== formattedBillingAddress ? (
                <>
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3">🚚 {t('shipping_address')}</p>
                  <div className="space-y-2 text-sm text-gray-700 bg-orange-50 border border-orange-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-4 shrink-0">👤</span>
                      <span className="font-medium">{customerNameShipping}</span>
                    </div>
                    {customerPhone && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-4 shrink-0">📞</span>
                        <a href={`tel:${customerPhone}`} className="hover:underline">{customerPhone}</a>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-4 shrink-0 mt-0.5">📍</span>
                      <p className="whitespace-pre-wrap leading-relaxed">{formattedShippingAddress}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🚚 {t('shipping_address')}</p>
                  <p className="text-sm text-gray-500 italic">Identique à l'adresse de facturation</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {order.trackingNumber && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-gray-700">
            <span className="font-bold mr-2">{t('tracking_number')} :</span> 
            <span className="bg-gray-100 px-3 py-1 rounded-md font-mono">{order.trackingNumber}</span>
          </p>
        </div>
      )}

    </div>
  );
}
