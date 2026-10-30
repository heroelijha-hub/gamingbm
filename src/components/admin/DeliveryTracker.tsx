'use client';

import { useState } from 'react';
import { updateOrderTracking, addDeliveryPosition, deleteDeliveryPosition, activatePreparation, cancelPreparation, addDelayNote } from '@/actions/delivery';
import { useTranslations, useLocale } from 'next-intl';
import { computeAutoStatus } from '@/lib/autoTracking';

type DeliveryPosition = {
  id: string;
  city: string;
  country: string;
  note: string | null;
  createdAt: Date;
};

type OrderTrackingProps = {
  orderId: string;
  trackingNumber: string | null;
  originCity: string | null;
  originCountry: string | null;
  destinationAddress: string | null;
  destinationCountry: string | null;
  deliveryPositions: DeliveryPosition[];
  // Auto-tracking fields
  preparationStartedAt: Date | null;
  deliveryDays: number | null;
  delayNote: string | null;
  orderStatus: string;
};

export default function DeliveryTracker({
  orderId,
  trackingNumber,
  originCity,
  originCountry,
  destinationAddress,
  destinationCountry,
  deliveryPositions,
  preparationStartedAt,
  deliveryDays,
  delayNote,
  orderStatus,
}: OrderTrackingProps) {
  const t = useTranslations('AdminOrders');
  const locale = useLocale();

  // ── Auto-tracking state ──────────────────────────────────────────────
  const isAutoMode = !!preparationStartedAt && !delayNote;
  const [selectedDays, setSelectedDays] = useState<number>(deliveryDays || 5);
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [delayNoteValue, setDelayNoteValue] = useState(delayNote || '');
  const [loadingDelay, setLoadingDelay] = useState(false);

  // Compute auto status at read time
  const autoStatus = preparationStartedAt
    ? computeAutoStatus(new Date(preparationStartedAt), deliveryDays || selectedDays)
    : null;

  const handleActivatePreparation = async () => {
    if (!confirm(t('confirm_activate_preparation'))) return;
    setLoadingAuto(true);
    await activatePreparation(orderId, selectedDays);
    setLoadingAuto(false);
  };

  const handleCancelPreparation = async () => {
    if (!confirm(t('confirm_cancel_preparation'))) return;
    setLoadingAuto(true);
    await cancelPreparation(orderId);
    setLoadingAuto(false);
  };

  const handleAddDelayNote = async () => {
    if (!delayNoteValue.trim()) return;
    setLoadingDelay(true);
    await addDelayNote(orderId, delayNoteValue);
    setLoadingDelay(false);
    alert(t('delay_note_saved'));
  };

  // ── Manual tracking state ────────────────────────────────────────────
  const [loadingBase, setLoadingBase] = useState(false);
  const [baseForm, setBaseForm] = useState({
    trackingNumber: trackingNumber || '',
    originCity: originCity || '',
    originCountry: originCountry || '',
    destinationAddress: destinationAddress || '',
    destinationCountry: destinationCountry || '',
  });

  const [loadingPos, setLoadingPos] = useState(false);
  const [posForm, setPosForm] = useState({ city: '', country: '', note: '' });

  const handleUpdateBase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingBase(true);
    await updateOrderTracking(
      orderId,
      baseForm.trackingNumber,
      baseForm.originCity,
      baseForm.originCountry,
      baseForm.destinationAddress,
      baseForm.destinationCountry
    );
    setLoadingBase(false);
    alert(t('saved_success'));
  };

  const handleAddPos = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPos(true);
    try {
      await addDeliveryPosition(orderId, posForm.city, posForm.country, posForm.note);
      setPosForm({ city: '', country: '', note: '' });
    } catch (err: any) {
      alert(err.message || t('add_pos_error'));
    }
    setLoadingPos(false);
  };

  const handleDeletePos = async (posId: string) => {
    if (confirm(t('confirm_delete_pos'))) {
      await deleteDeliveryPosition(posId, orderId);
    }
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusSteps = autoStatus
    ? [
        {
          key: 'PROCESSING',
          label: t('status_processing'),
          icon: '📦',
          date: preparationStartedAt ? formatDate(new Date(preparationStartedAt)) : '',
          done: ['PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(autoStatus.currentStatus),
          active: autoStatus.currentStatus === 'PROCESSING',
        },
        {
          key: 'SHIPPED',
          label: t('status_shipped'),
          icon: '🚚',
          date: formatDate(autoStatus.shippedAt),
          done: ['SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(autoStatus.currentStatus),
          active: autoStatus.currentStatus === 'SHIPPED',
        },
        {
          key: 'IN_TRANSIT',
          label: t('status_in_transit'),
          icon: '🛣️',
          date: formatDate(autoStatus.inTransitAt),
          done: ['IN_TRANSIT', 'DELIVERED'].includes(autoStatus.currentStatus),
          active: autoStatus.currentStatus === 'IN_TRANSIT',
        },
        {
          key: 'DELIVERED',
          label: t('status_delivered'),
          icon: '✅',
          date: formatDate(autoStatus.deliveredAt),
          done: autoStatus.currentStatus === 'DELIVERED',
          active: autoStatus.currentStatus === 'DELIVERED',
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Colonne gauche : Automatisches Tracking + Versandinformationen empilés l'un sous l'autre */}
      <div className="space-y-6">

      {/* ══════════════════════════════════════════════════
          SECTION 1 — MODE AUTOMATIQUE "EN PRÉPARATION"
      ══════════════════════════════════════════════════ */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-orange-200">
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          🚀 {t('auto_tracking_title')}
        </h2>
        <p className="text-xs text-gray-500 mb-4">{t('auto_tracking_desc')}</p>

        {!preparationStartedAt ? (
          /* Pas encore activé */
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('delivery_days_label')}</p>
              <div className="flex gap-3">
                {[3, 5, 7].map((days) => (
                  <label
                    key={days}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedDays === days
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold'
                        : 'border-gray-200 text-gray-600 hover:border-orange-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryDays"
                      value={days}
                      checked={selectedDays === days}
                      onChange={() => setSelectedDays(days)}
                      className="sr-only"
                    />
                    {days} {t('days')}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleActivatePreparation}
              disabled={loadingAuto}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingAuto ? '⏳ ...' : `📦 ${t('activate_preparation_btn')}`}
            </button>
          </div>
        ) : delayNote ? (
          /* Mode contretemps → afficher la note */
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-700 mb-1">⚠️ {t('delay_note_active')}</p>
            <p className="text-sm text-red-600 italic">"{delayNote}"</p>
            <p className="text-xs text-red-500 mt-2">{t('delay_note_manual_mode_hint')}</p>
          </div>
        ) : (
          /* Mode automatique actif */
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-green-700">✅ {t('preparation_active')}</p>
                <p className="text-xs text-green-600">
                  {t('started_at')} {formatDate(new Date(preparationStartedAt))} • {deliveryDays} {t('days')}
                </p>
              </div>
              <button
                onClick={handleCancelPreparation}
                disabled={loadingAuto}
                className="text-xs text-red-500 hover:underline"
              >
                {t('cancel_auto')}
              </button>
            </div>

            {/* Timeline des étapes */}
            <div className="space-y-0">
              {statusSteps.map((step, idx) => (
                <div key={step.key} className="flex items-start gap-3">
                  {/* Indicateur */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0 ${
                      step.done
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}>
                      {step.done ? step.icon : idx + 1}
                    </div>
                    {idx < statusSteps.length - 1 && (
                      <div className={`w-0.5 h-8 ${step.done ? 'bg-orange-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  {/* Texte */}
                  <div className="pb-6">
                    <p className={`text-sm font-semibold ${step.active ? 'text-orange-700' : step.done ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.label}
                      {step.active && <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{t('current_step')}</span>}
                    </p>
                    <p className={`text-xs ${step.done ? 'text-gray-500' : 'text-gray-300'}`}>{step.date}</p>
                  </div>
                </div>
              ))}
            </div>

        {/* Note de contretemps — intégrée dans la carte Auto Tracking */}
        {preparationStartedAt && !delayNote && (
          <div className="mt-4 pt-4 border-t border-amber-100">
            <p className="text-xs font-semibold text-amber-600 mb-2">⚠️ {t('delay_note_title')}</p>
            <p className="text-xs text-gray-500 mb-2">{t('delay_note_hint')}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={delayNoteValue}
                onChange={(e) => setDelayNoteValue(e.target.value)}
                placeholder={t('delay_note_placeholder')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                onClick={handleAddDelayNote}
                disabled={loadingDelay || !delayNoteValue.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors"
              >
                {loadingDelay ? '⏳' : t('save')}
              </button>
            </div>
          </div>
        )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 3 — INFORMATIONS DE LIVRAISON (MANUEL)
          Toujours disponible
      ══════════════════════════════════════════════════ */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{t('shipping_info')}</h2>
        <p className="text-xs text-gray-500 mb-4">{t('shipping_info_manual_hint')}</p>
        <form onSubmit={handleUpdateBase} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('tracking_number')}</label>
            <input
              type="text"
              value={baseForm.trackingNumber}
              onChange={e => setBaseForm({ ...baseForm, trackingNumber: e.target.value })}
              placeholder={t('tracking_placeholder')}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border p-4 rounded bg-gray-50">
              <h3 className="font-semibold text-sm mb-3">{t('origin')}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('city')}</label>
                  <input type="text" value={baseForm.originCity} onChange={e => setBaseForm({ ...baseForm, originCity: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded" placeholder={t('city_placeholder')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('country')}</label>
                  <input type="text" value={baseForm.originCountry} onChange={e => setBaseForm({ ...baseForm, originCountry: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded" placeholder={t('country_placeholder')} />
                </div>
              </div>
            </div>

            <div className="border p-4 rounded bg-gray-50">
              <h3 className="font-semibold text-sm mb-3">{t('destination')}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('address')}</label>
                  <input type="text" value={baseForm.destinationAddress} onChange={e => setBaseForm({ ...baseForm, destinationAddress: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded" placeholder={t('address_placeholder')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('country')}</label>
                  <input type="text" value={baseForm.destinationCountry} onChange={e => setBaseForm({ ...baseForm, destinationCountry: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded" placeholder={t('dest_country_placeholder')} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loadingBase} className="bg-orange-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50 text-sm">
            {loadingBase ? t('saving') : t('save')}
          </button>
        </form>
      </div>

      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 4 — HISTORIQUE DES POSITIONS (MANUEL)
      ══════════════════════════════════════════════════ */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('delivery_history')}</h2>

        {deliveryPositions.length > 0 ? (
          <div className="mb-6">
            <ul className="relative border-l border-gray-200 ml-3 space-y-4">
              {deliveryPositions.map(pos => (
                <li key={pos.id} className="pl-6">
                  <span className="absolute w-3 h-3 bg-orange-500 rounded-full -left-1.5 mt-1.5 border border-white"></span>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{pos.city}, {pos.country}</p>
                      <p className="text-xs text-gray-500">{new Date(pos.createdAt).toLocaleString()}</p>
                      {pos.note && <p className="text-sm text-gray-700 italic mt-1">{pos.note}</p>}
                    </div>
                    <button onClick={() => handleDeletePos(pos.id)} className="text-red-500 text-xs hover:underline">{t('delete')}</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-6">{t('no_position')}</p>
        )}

        <form onSubmit={handleAddPos} className="bg-gray-50 p-4 rounded border">
          <h3 className="font-semibold text-sm mb-3">{t('add_position_title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <input type="text" required value={posForm.city} onChange={e => setPosForm({ ...posForm, city: e.target.value })} placeholder={t('current_city_placeholder')} className="w-full px-3 py-1.5 text-sm border rounded" />
            </div>
            <div>
              <input type="text" required value={posForm.country} onChange={e => setPosForm({ ...posForm, country: e.target.value })} placeholder={t('country')} className="w-full px-3 py-1.5 text-sm border rounded" />
            </div>
            <div className="md:col-span-2">
              <input type="text" value={posForm.note} onChange={e => setPosForm({ ...posForm, note: e.target.value })} placeholder={t('note_placeholder')} className="w-full px-3 py-1.5 text-sm border rounded" />
            </div>
          </div>
          <button type="submit" disabled={loadingPos} className="bg-gray-900 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50">
            {loadingPos ? t('adding') : t('add_position_btn')}
          </button>
        </form>
      </div>
    </div>
  );
}
