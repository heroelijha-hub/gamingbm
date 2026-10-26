'use client';

import { useState } from 'react';
import { updateOrderCustomerDetails, resendOrderConfirmationEmail } from '@/actions/admin';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface EditCustomerModalProps {
  orderId: string;
  initialCustomerEmail: string;
  initialBilling: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  initialShipping?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  } | null;
}

export default function OrderCustomerManager({
  orderId,
  initialCustomerEmail,
  initialBilling,
  initialShipping,
}: EditCustomerModalProps) {
  const router = useRouter();
  const t = useTranslations('AdminOrders');
  const [isOpen, setIsOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [customerEmail, setCustomerEmail] = useState(initialCustomerEmail || '');
  const [billing, setBilling] = useState(initialBilling || {});
  const [hasShippingDiff, setHasShippingDiff] = useState(Boolean(initialShipping));
  const [shipping, setShipping] = useState(initialShipping || {});

  const handleResendConfirmation = async () => {
    if (!confirm(t('confirm_resend_title'))) return;
    setIsResending(true);
    setMessage(null);

    const res = await resendOrderConfirmationEmail(orderId);
    if (res.success) {
      setMessage({
        text: t('resend_success', { email: res.emailSentTo }),
        type: 'success',
      });
    } else {
      setMessage({
        text: res.error || t('resend_error'),
        type: 'error',
      });
    }
    setIsResending(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const res = await updateOrderCustomerDetails(orderId, {
      customerEmail,
      billing,
      shipping: hasShippingDiff ? shipping : null,
    });

    if (res.success) {
      setMessage({ text: t('update_success'), type: 'success' });
      setIsOpen(false);
      router.refresh();
    } else {
      setMessage({ text: res.error || 'Error', type: 'error' });
    }
    setIsSaving(false);
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex-1 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-semibold text-xs py-2 px-3 rounded-md transition shadow-sm flex items-center justify-center gap-1.5"
        >
          <span>✏️</span>
          <span>{t('edit_customer_details')}</span>
        </button>

        <button
          type="button"
          disabled={isResending}
          onClick={handleResendConfirmation}
          className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold text-xs py-2 px-3 rounded-md transition shadow-sm flex items-center justify-center gap-1.5"
        >
          <span>📨</span>
          <span>{isResending ? t('resending') : t('resend_confirmation_btn')}</span>
        </button>
      </div>

      {/* Modal d'édition des coordonnées */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>✏️</span> {t('modal_edit_title')}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 text-sm">
              {/* E-mail client */}
              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('customer_recipient_email')}
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm"
                  placeholder="client@exemple.com"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  {t('customer_email_hint')}
                </p>
              </div>

              {/* Adresse de Facturation */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📄</span> {t('billing_address_title')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('first_name')}</label>
                    <input
                      type="text"
                      value={billing.firstName || ''}
                      onChange={(e) => setBilling({ ...billing, firstName: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('last_name')}</label>
                    <input
                      type="text"
                      value={billing.lastName || ''}
                      onChange={(e) => setBilling({ ...billing, lastName: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('phone')}</label>
                    <input
                      type="text"
                      value={billing.phone || ''}
                      onChange={(e) => setBilling({ ...billing, phone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('country')}</label>
                    <input
                      type="text"
                      value={billing.country || ''}
                      onChange={(e) => setBilling({ ...billing, country: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">{t('street_1')}</label>
                    <input
                      type="text"
                      value={billing.address1 || ''}
                      onChange={(e) => setBilling({ ...billing, address1: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">{t('street_2')}</label>
                    <input
                      type="text"
                      value={billing.address2 || ''}
                      onChange={(e) => setBilling({ ...billing, address2: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('postal_code')}</label>
                    <input
                      type="text"
                      value={billing.postalCode || ''}
                      onChange={(e) => setBilling({ ...billing, postalCode: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('city')}</label>
                    <input
                      type="text"
                      value={billing.city || ''}
                      onChange={(e) => setBilling({ ...billing, city: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse de Livraison */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <span>🚚</span> {t('shipping_address_title')}
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={hasShippingDiff}
                      onChange={(e) => setHasShippingDiff(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>{t('shipping_different_checkbox')}</span>
                  </label>
                </div>

                {hasShippingDiff && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">{t('first_name')}</label>
                      <input
                        type="text"
                        value={shipping.firstName || ''}
                        onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">{t('last_name')}</label>
                      <input
                        type="text"
                        value={shipping.lastName || ''}
                        onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">{t('company_optional')}</label>
                      <input
                        type="text"
                        value={shipping.company || ''}
                        onChange={(e) => setShipping({ ...shipping, company: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">{t('shipping_phone')}</label>
                      <input
                        type="text"
                        value={shipping.phone || ''}
                        onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">{t('street_1')}</label>
                      <input
                        type="text"
                        value={shipping.address1 || ''}
                        onChange={(e) => setShipping({ ...shipping, address1: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">{t('street_2')}</label>
                      <input
                        type="text"
                        value={shipping.address2 || ''}
                        onChange={(e) => setShipping({ ...shipping, address2: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">{t('postal_code')}</label>
                      <input
                        type="text"
                        value={shipping.postalCode || ''}
                        onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">{t('city')}</label>
                      <input
                        type="text"
                        value={shipping.city || ''}
                        onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">{t('country')}</label>
                      <input
                        type="text"
                        value={shipping.country || ''}
                        onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow"
                >
                  {isSaving ? t('saving_changes') : t('save_changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
