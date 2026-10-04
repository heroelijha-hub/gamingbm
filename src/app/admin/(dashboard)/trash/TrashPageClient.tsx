'use client';

import { useState } from 'react';
import { restoreProduct, restoreMedia, permanentlyDeleteProduct, permanentlyDeleteMedia, emptyTrash } from '@/actions/trash';
import { useTranslations } from 'next-intl';
import Image from "next/image";

export default function TrashPageClient({ initialProducts, initialMedia }: { initialProducts: any[], initialMedia: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [media, setMedia] = useState(initialMedia);
  const [activeTab, setActiveTab] = useState<'products' | 'media'>('products');
  const [loading, setLoading] = useState(false);
  const t = useTranslations('AdminTrash');

  const handleRestoreProduct = async (id: string) => {
    setLoading(true);
    const res = await restoreProduct(id);
    if (res.success) {
      setProducts(products.filter(p => p.id !== id));
      alert(t('restore_product_success'));
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleRestoreMedia = async (id: string) => {
    setLoading(true);
    const res = await restoreMedia(id);
    if (res.success) {
      setMedia(media.filter(m => m.id !== id));
      alert(t('restore_media_success'));
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(t('delete_product_confirm'))) return;
    setLoading(true);
    const res = await permanentlyDeleteProduct(id);
    if (res.success) {
      setProducts(products.filter(p => p.id !== id));
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm(t('delete_media_confirm'))) return;
    setLoading(true);
    const res = await permanentlyDeleteMedia(id);
    if (res.success) {
      setMedia(media.filter(m => m.id !== id));
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleEmptyTrash = async () => {
    if (!confirm(t('empty_trash_confirm'))) return;
    setLoading(true);
    const res = await emptyTrash();
    if (res.success) {
      setProducts([]);
      setMedia([]);
      alert(t('empty_trash_success'));
    } else {
      alert(res.error || t('empty_trash_error'));
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <button 
          onClick={handleEmptyTrash} 
          disabled={loading || (products.length === 0 && media.length === 0)}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {t('empty_trash')}
        </button>
      </div>

      <div className="flex border-b mb-6">
        <button 
          className={`py-2 px-4 ${activeTab === 'products' ? 'border-b-2 border-primary font-bold text-primary' : 'text-gray-500 hover:text-black'}`}
          onClick={() => setActiveTab('products')}
        >
          {t('tab_products')} ({products.length})
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'media' ? 'border-b-2 border-primary font-bold text-primary' : 'text-gray-500 hover:text-black'}`}
          onClick={() => setActiveTab('media')}
        >
          {t('tab_media')} ({media.length})
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">{t('no_products')}</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-4 font-semibold text-gray-600">{t('product')}</th>
                  <th className="p-4 font-semibold text-gray-600">{t('deleted_at')}</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <Image width={800} height={800} src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">?</div>
                        )}
                      </div>
                      <span className="font-medium text-gray-800">{product.title}</span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {product.deletedAt ? new Date(product.deletedAt).toLocaleDateString() : t('na')}
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button 
                        onClick={() => handleRestoreProduct(product.id)} 
                        disabled={loading}
                        className="text-green-600 font-medium hover:underline disabled:opacity-50"
                      >
                        {t('restore')}
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)} 
                        disabled={loading}
                        className="text-red-600 font-medium hover:underline disabled:opacity-50"
                      >
                        {t('delete_permanently')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'media' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg shadow">{t('no_media')}</div>
          ) : (
            media.map(m => (
              <div key={m.id} className="relative aspect-square border rounded overflow-hidden group bg-gray-100">
                <Image width={800} height={800} unoptimized src={m.url} alt="media" className="object-cover w-full h-full opacity-70" />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2">
                  <button 
                    onClick={() => handleRestoreMedia(m.id)} 
                    disabled={loading}
                    className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600"
                  >
                    {t('restore')}
                  </button>
                  <button 
                    onClick={() => handleDeleteMedia(m.id)} 
                    disabled={loading}
                    className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
