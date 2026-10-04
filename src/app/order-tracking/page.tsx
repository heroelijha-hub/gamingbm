import prisma from '@/lib/prisma';
import TrackingMap from '@/components/tracking/TrackingMap';
import { getTranslations, getLocale } from 'next-intl/server';
import { computeAutoStatus } from '@/lib/autoTracking';

export const dynamic = 'force-dynamic';

export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ number?: string }> }) {
  const { number } = await searchParams;
  const trackingNumber = number;
  const t = await getTranslations('OrderTracking');
  const locale = await getLocale();
  
  let order = null;
  let error = null;

  if (trackingNumber) {
    order = await prisma.order.findUnique({
      where: { trackingNumber },
      include: {
        deliveryPositions: {
          orderBy: { createdAt: 'asc' }
        },
        user: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      error = t('not_found');
    }
  }

  // ── Determine tracking mode ──────────────────────────────────────────────
  const isAutoMode = !!(order?.preparationStartedAt && !order?.delayNote);
  
  // Compute auto status at read-time (no cron needed)
  const autoStatus = isAutoMode && order?.preparationStartedAt && order?.deliveryDays
    ? computeAutoStatus(new Date(order.preparationStartedAt), order.deliveryDays)
    : null;

  // Parse customer metadata
  let orderMeta: any = null;
  try {
    if (order?.destinationAddress) {
      const parsed = JSON.parse(order.destinationAddress);
      if (parsed?.billing) orderMeta = parsed;
    }
  } catch { /* plain string */ }

  const billing = orderMeta?.billing || null;
  const customerName = billing
    ? [billing.firstName, billing.lastName].filter(Boolean).join(' ')
    : '';

  const maskName = (name: string) => name ? name.split(' ').map(n => n.charAt(0) + '***').join(' ') : '';
  const maskAddress = (address: string) => address ? address.substring(0, 3) + '***' : '';

  // First product info
  const firstItem = order?.orderItems?.[0];
  const allProducts = order?.orderItems?.map(i => i.product.title).join(', ') || '';

  // ── Manual mode: calculate percentage via Haversine ──────────────────────
  let percentage = 0;
  if (order && order.deliveryPositions.length > 0 && order.originLat && order.originLng && order.destinationLat && order.destinationLng) {
    const lastPos = order.deliveryPositions[order.deliveryPositions.length - 1];
    const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    const totalDist = distanceKm(order.originLat, order.originLng, order.destinationLat, order.destinationLng);
    const coveredDist = distanceKm(order.originLat, order.originLng, lastPos.latitude, lastPos.longitude);
    if (totalDist > 0) {
      percentage = Math.min(100, Math.round((coveredDist / totalDist) * 100));
    }
  }

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      
      {!order ? (
        /* ─── FORMULAIRE DE RECHERCHE ─────────────────────────────────────── */
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">{t('track_delivery')}</h1>
          
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">{error}</div>}
          
          <form method="GET" action="/order-tracking" className="flex flex-col gap-4">
            <div>
              <label htmlFor="number" className="sr-only">{t('tracking_number_label')}</label>
              <input 
                type="text" 
                id="number"
                name="number" 
                placeholder={t('tracking_number_placeholder')}
                required
                defaultValue={trackingNumber}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
              />
            </div>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors">
              {t('search_btn')}
            </button>
          </form>
        </div>

      ) : isAutoMode && autoStatus && autoStatus.currentStatus !== 'DELIVERED' ? (
        /* ─── MODE AUTOMATIQUE "EN PRÉPARATION / EXPÉDIÉ / EN TRANSIT" ──────── */
        <div className="space-y-6">

          {/* Carte info commande — style capture fournie */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{t('order_number_label')}</p>
            <p className="text-lg font-bold text-gray-900 mb-3">
              {order.id.split('-')[0].toUpperCase()}
            </p>

            {customerName && (
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium text-gray-700">{t('customer_label')}</span> {maskName(customerName)}
              </p>
            )}

            {allProducts && (
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium text-gray-700">{t('product_label')}</span> {allProducts}
              </p>
            )}

            {/* Statut actuel avec animation */}
            <div className="flex items-center gap-3 mt-4">
              {autoStatus.currentStatus === 'PROCESSING' && (
                <>
                  <div className="w-6 h-6 rounded-full border-2 border-orange-400 border-t-transparent animate-spin flex-shrink-0" />
                  <p className="text-base font-semibold text-gray-800">{t('preparing_message')}</p>
                </>
              )}
              {autoStatus.currentStatus === 'SHIPPED' && (
                <>
                  <span className="text-2xl">🚚</span>
                  <p className="text-base font-semibold text-gray-800">{t('shipped_message')}</p>
                </>
              )}
              {autoStatus.currentStatus === 'IN_TRANSIT' && (
                <>
                  <span className="text-2xl">🛣️</span>
                  <p className="text-base font-semibold text-gray-800">{t('in_transit_message')}</p>
                </>
              )}
            </div>

            <div className="mt-4">
              <a href="/order-tracking" className="text-orange-600 text-sm font-medium hover:underline">
                ← {t('track_another')}
              </a>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between text-sm font-medium text-gray-500 mb-3">
              <span>{t('departure')}</span>
              <span>{t('arrival')} {billing?.address1 ? `${maskAddress(billing.address1)}, ${billing.city || ''}` : (maskAddress(order.destinationAddress || '') || order.destinationCountry || '')}</span>
            </div>
            <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-1000 rounded-full" 
                style={{ width: `${autoStatus.progressPercent}%` }}
              />
            </div>
            <div className="text-center mt-2 text-xs text-gray-500">
              {autoStatus.progressPercent}{t('estimated_flight_dist')}
            </div>
          </div>

          {/* Timeline des étapes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">{t('tracking_steps_title')}</h2>
            
            {[
              {
                key: 'PROCESSING',
                icon: '📦',
                label: t('step_preparing'),
                date: formatDate(new Date(order.preparationStartedAt!)),
                done: true,
                active: autoStatus.currentStatus === 'PROCESSING',
              },
              {
                key: 'SHIPPED',
                icon: '🚚',
                label: t('step_shipped'),
                date: formatDate(autoStatus.shippedAt),
                done: ['SHIPPED', 'IN_TRANSIT'].includes(autoStatus.currentStatus),
                active: autoStatus.currentStatus === 'SHIPPED',
              },
              {
                key: 'IN_TRANSIT',
                icon: '🛣️',
                label: t('step_in_transit'),
                date: formatDate(autoStatus.inTransitAt),
                done: autoStatus.currentStatus === 'IN_TRANSIT',
                active: autoStatus.currentStatus === 'IN_TRANSIT',
              },
              {
                key: 'DELIVERED',
                icon: '✅',
                label: t('step_delivered'),
                date: formatDate(autoStatus.deliveredAt),
                done: false,
                active: false,
              },
            ].map((step, idx, arr) => (
              <div key={step.key} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 flex-shrink-0 ${
                    step.active
                      ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200'
                      : step.done
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-white border-gray-200 text-gray-500'
                  }`}>
                    {step.icon}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className={`w-0.5 h-10 ${step.done ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="pb-6">
                  <p className={`text-sm font-semibold ${step.active ? 'text-orange-700' : step.done ? 'text-green-700' : 'text-gray-500'}`}>
                    {step.label}
                    {step.active && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{t('current_step_badge')}</span>
                    )}
                  </p>
                  <p className={`text-xs mt-0.5 ${step.done || step.active ? 'text-gray-500' : 'text-gray-300'}`}>
                    {step.done || step.active ? '' : '~ '}{step.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      ) : autoStatus?.currentStatus === 'DELIVERED' ? (
        /* ─── LIVRÉ (MODE AUTO) ────────────────────────────────────────────── */
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center py-10 bg-green-50 rounded-xl mb-8">
            <span className="text-5xl mb-4 block">✅</span>
            <h2 className="text-2xl font-bold text-green-800 mb-2">{t('delivery_complete')}</h2>
            <p className="text-green-700">{t('thanks')}</p>
          </div>
          {customerName && (
            <p className="text-sm text-center text-gray-600">{maskName(customerName)}</p>
          )}
          <div className="text-center mt-4">
            <a href="/order-tracking" className="text-orange-600 font-medium hover:underline">← {t('track_another')}</a>
          </div>
        </div>

      ) : (
        /* ─── MODE MANUEL (existant) ──────────────────────────────────────── */
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{t('tracking_title')} <span className="text-orange-600">{order.trackingNumber}</span></h1>
            <span className={`px-4 py-1 rounded-full text-sm font-bold ${
              order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {order.status === 'DELIVERED' ? t('delivered') : t('in_transit')}
            </span>
          </div>

          {/* Note de contretemps */}
          {order.delayNote && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <span className="text-amber-500 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-700">{t('delay_note_public_title')}</p>
                <p className="text-sm text-amber-600 italic mt-1">"{order.delayNote}"</p>
              </div>
            </div>
          )}

          {order.status === 'DELIVERED' ? (
            <div className="text-center py-10 bg-green-50 rounded-xl mb-8">
              <span className="text-5xl mb-4 block">✅</span>
              <h2 className="text-2xl font-bold text-green-800 mb-2">{t('delivery_complete')}</h2>
              <p className="text-green-700">{t('thanks')}</p>
            </div>
          ) : (
            <div className="mb-10">
              <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
                <span>{t('departure')} {order.originCity}</span>
                <span>{t('arrival')} {maskAddress(order.destinationAddress || '') || order.destinationCountry}</span>
              </div>
              <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
              </div>
              <div className="text-center mt-2 text-xs text-gray-500">{percentage}{t('estimated_flight_dist')}</div>
            </div>
          )}

          {order.deliveryPositions.length > 0 && order.status !== 'DELIVERED' && (
            <div className="mb-8">
              <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-orange-600 text-xl">📍</span> 
                {t('current_pos')} {order.deliveryPositions[order.deliveryPositions.length - 1].city}, {order.deliveryPositions[order.deliveryPositions.length - 1].country}
              </p>
              <p className="text-sm text-gray-500 ml-7 mt-1">
                {t('last_update')} {new Date(order.deliveryPositions[order.deliveryPositions.length - 1].createdAt).toLocaleString(locale)}
              </p>
              {order.deliveryPositions[order.deliveryPositions.length - 1].note && (
                <p className="text-sm text-gray-700 italic ml-7 mt-2 bg-gray-50 p-3 rounded border">
                  "{order.deliveryPositions[order.deliveryPositions.length - 1].note}"
                </p>
              )}
            </div>
          )}

          <div className="mb-8">
            <TrackingMap 
              originLat={order.originLat}
              originLng={order.originLng}
              originName={`${order.originCity}, ${order.originCountry}`}
              destinationLat={order.destinationLat}
              destinationLng={order.destinationLng}
              destinationName={`${maskAddress(order.destinationAddress || '')}, ${order.destinationCountry}`}
              positions={order.deliveryPositions}
              departureText={t('departure').replace(':', '').trim()}
              arrivalText={t('arrival').replace(':', '').trim()}
            />
          </div>

          <div className="text-center">
            <a href="/order-tracking" className="text-orange-600 font-medium hover:underline">&larr; {t('track_another')}</a>
          </div>
        </div>
      )}
    </div>
  );
}
