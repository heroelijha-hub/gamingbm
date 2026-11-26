'use client';

import { useState } from 'react';
import { toggleReviewApproval, deleteReview, updateReview } from '@/actions/reviews';
import { useTranslations, useLocale } from 'next-intl';

type Review = {
  id: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  product: { id?: string; title: string; slug: string };
  reviewerName?: string | null;
  reviewerEmail?: string | null;
  user?: { email: string } | null;
  purchaseInfo?: {
    hasPaidOrder: boolean;
    hasBoughtThisProduct: boolean;
    orderId?: string | null;
    orderTotal?: number | null;
    orderStatus?: string | null;
    orderCount?: number;
  };
};

export default function ReviewTable({ reviews }: { reviews: Review[] }) {
  const t = useTranslations('AdminReviews');
  const locale = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: '', createdAtStr: '' });

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await toggleReviewApproval(id, !currentStatus);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirm_delete'))) {
      await deleteReview(id);
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditForm({
      rating: review.rating,
      comment: review.comment,
      // Format datetime-local requires YYYY-MM-DDThh:mm
      createdAtStr: new Date(review.createdAt).toISOString().slice(0, 16)
    });
  };

  const handleSave = async (id: string) => {
    await updateReview(id, editForm.rating, editForm.comment, editForm.createdAtStr);
    setEditingId(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="px-6 py-3">{t('col_product')}</th>
            <th className="px-6 py-3">{t('col_customer')}</th>
            <th className="px-6 py-3">{t('col_rating_comment')}</th>
            <th className="px-6 py-3">{t('col_date')}</th>
            <th className="px-6 py-3">{t('col_status')}</th>
            <th className="px-6 py-3 text-right">{t('col_actions')}</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900 max-w-[200px] truncate">
                {review.product.title}
              </td>
              <td className="px-6 py-4 min-w-[220px]">
                <div className="space-y-1">
                  <div className="font-semibold text-gray-900">
                    {review.reviewerName || 'Client'}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {review.reviewerEmail || review.user?.email || 'Sans e-mail'}
                  </div>
                  {review.purchaseInfo?.hasBoughtThisProduct ? (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
                      title={`Commande n° ${review.purchaseInfo.orderId} payée (${review.purchaseInfo.orderTotal?.toFixed(2)} €)`}
                    >
                      <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Achat vérifié (Produit payé)
                    </span>
                  ) : review.purchaseInfo?.hasPaidOrder ? (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200"
                      title={`Client avec ${review.purchaseInfo.orderCount} commande(s) payée(s) (#${review.purchaseInfo.orderId?.slice(0, 8)})`}
                    >
                      <svg className="w-3 h-3 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Client du site ({review.purchaseInfo.orderCount} cmd)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                      Pas de commande payée
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 min-w-[300px]">
                {editingId === review.id ? (
                  <div className="space-y-2">
                    <select
                      value={editForm.rating}
                      onChange={e => setEditForm({ ...editForm, rating: Number(e.target.value) })}
                      className="border rounded p-1 w-20 text-sm"
                    >
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}★</option>)}
                    </select>
                    <textarea
                      value={editForm.comment}
                      onChange={e => setEditForm({ ...editForm, comment: e.target.value })}
                      className="w-full border rounded p-2 text-sm"
                      rows={3}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="font-bold text-orange-600">{review.rating} ★</div>
                    <div className="text-gray-700 line-clamp-2">{review.comment}</div>
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                {editingId === review.id ? (
                  <input
                    type="datetime-local"
                    value={editForm.createdAtStr}
                    onChange={e => setEditForm({ ...editForm, createdAtStr: e.target.value })}
                    className="border rounded p-1 text-sm"
                  />
                ) : (
                  new Date(review.createdAt).toLocaleDateString(locale)
                )}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleToggle(review.id, review.isApproved)}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${review.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}
                >
                  {review.isApproved ? t('approved') : t('pending')}
                </button>
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                {editingId === review.id ? (
                  <>
                    <button onClick={() => handleSave(review.id)} className="text-green-600 font-bold hover:underline">{t('save')}</button>
                    <button onClick={() => setEditingId(null)} className="text-gray-500 hover:underline">{t('cancel')}</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(review)} className="text-blue-600 font-bold hover:underline">{t('edit')}</button>
                    <button onClick={() => handleDelete(review.id)} className="text-red-600 font-bold hover:underline">{t('delete')}</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {reviews.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-gray-500">{t('no_reviews')}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
