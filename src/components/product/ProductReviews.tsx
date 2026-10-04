'use client';

import { useState } from 'react';
import { submitReview } from '@/actions/reviews';
import { useTranslations, useLocale } from 'next-intl';
// import DOMPurify from 'isomorphic-dompurify'; // Removed to avoid Vercel 500 error
import SafeHTML from '@/components/SafeHTML';

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  reviewerName?: string | null;
  reviewerEmail?: string | null;
  user?: {
    email: string;
  } | null;
};

type ProductReviewsProps = {
  productId: string;
  productTitle?: string;
  reviews: Review[];
  description?: string | null;
  isLoggedIn: boolean;
};

const Star = ({ filled = true }: { filled?: boolean }) => (
  <svg 
    className={`w-4 h-4 ${filled ? 'text-orange-600' : 'text-gray-300'}`} 
    fill="currentColor" 
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function ProductReviews({ productId, productTitle, reviews, description, isLoggedIn }: ProductReviewsProps) {
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const t = useTranslations('Product');
  const locale = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    const res = await submitReview(productId, rating, comment);
    
    if (res.error) {
      setMsg({ type: 'error', text: res.error });
    } else {
      setMsg({ type: 'success', text: t('review_submitted') });
      setComment('');
      setRating(5);
    }
    setLoading(false);
  };

  return (
    <div className="mt-20">
      <div className="flex justify-center gap-2 mb-0 relative z-10">
        <button 
          onClick={() => setActiveTab('desc')}
          className={`px-8 py-3 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'desc' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
        >
          {t('description_tab')}
        </button>
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`px-8 py-3 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'reviews' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
        >
          {t('reviews_tab')}
        </button>
      </div>

      <div className="w-full border border-gray-200 rounded-b-lg rounded-tl-lg rounded-tr-lg p-6 sm:p-10 bg-[#fafafa]">
        {activeTab === 'desc' ? (
          <div className="text-sm text-gray-700 leading-relaxed space-y-6">
            {description ? (
              <div className="w-full overflow-x-auto">
                <SafeHTML 
                  html={description}
                  className="prose prose-sm max-w-none w-full whitespace-normal" 
                />
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{t('no_description')}</div>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Liste des avis */}
            <div>
              <h3 className="text-sm font-bold mb-2 text-gray-900">{t('reviews_tab')}</h3>
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-xs">{t('no_reviews_yet')}</p>
              ) : (
                <div className="space-y-8 mt-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-100 pb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1,2,3,4,5].map(i => <Star key={i} filled={i <= review.rating} />)}
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {review.reviewerName || (review.user?.email ? review.user.email.split('@')[0] : 'Anonyme')}
                        </span>
                        <span className="text-xs text-gray-500">- {new Date(review.createdAt).toLocaleDateString(locale)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulaire d'avis */}
            <div className="pt-2">
              <h4 className="text-sm font-bold text-gray-800 mb-1">
                {t('be_first_to_review', { name: productTitle || 'ce produit' })}
              </h4>
              <p className="text-xs text-gray-500 mb-6">
                {t('email_not_published')}
              </p>
              
              {!isLoggedIn ? (
                <p className="text-sm text-gray-600">{t('must_be_logged_in')} <a href="/login" className="text-orange-600 hover:underline">{t('login')}</a></p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {msg.text && (
                    <div className={`p-3 rounded text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {msg.text}
                    </div>
                  )}
                  
                  {/* Note */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-gray-800">{t('your_rating_text')}</label>
                    <div className="flex gap-1 cursor-pointer">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star}
                          onClick={() => setRating(star)}
                          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  
                  {/* Commentaire */}
                  <div>
                    <textarea 
                      required
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:ring-orange-500 focus:border-orange-500 outline-none text-sm text-gray-700 bg-white"
                      placeholder={t('your_review_placeholder')}
                    ></textarea>
                  </div>

                  {/* Nom et E-mail */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder={t('name_placeholder')} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:ring-orange-500 focus:border-orange-500 outline-none text-sm text-gray-700 bg-white"
                    />
                    <input 
                      type="email" 
                      placeholder={t('email_placeholder')} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:ring-orange-500 focus:border-orange-500 outline-none text-sm text-gray-700 bg-white"
                    />
                  </div>

                  {/* Checkbox */}
                  <div className="flex items-start gap-2 pt-1">
                    <input 
                      type="checkbox" 
                      id="save-info" 
                      className="mt-1 w-3.5 h-3.5 text-orange-700 border-gray-300 rounded-sm focus:ring-orange-500"
                    />
                    <label htmlFor="save-info" className="text-[11px] text-gray-600 font-medium">
                      {t('save_info')}
                    </label>
                  </div>
                  
                  {/* Submit */}
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors text-sm"
                    >
                      {loading ? t('sending') : t('submit_review')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
