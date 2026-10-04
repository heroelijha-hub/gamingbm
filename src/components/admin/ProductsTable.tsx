'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteProduct, duplicateProduct, quickEditProduct, bulkDeleteProducts } from '@/actions/admin';
import Price from '@/components/Price';
import Image from "next/image";

export default function ProductsTable({ products, categories }: { products: any[], categories: any[] }) {
  const t = useTranslations('AdminProducts');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{title: string, categoryIds: string[], slug: string, price: number, compareAtPrice: number | '', gtin: string}>({ title: '', categoryIds: [], slug: '', price: 0, compareAtPrice: '', gtin: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const router = useRouter();

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditData({ 
      title: p.title, 
      categoryIds: p.categories?.map((c: any) => c.id) || [], 
      slug: p.slug,
      price: p.price || 0,
      compareAtPrice: p.compareAtPrice || '',
      gtin: p.gtin || ''
    });
  };

  const handleQuickEditSubmit = async (id: string) => {
    setIsLoading(true);
    const res = await quickEditProduct(id, editData);
    if (res.error) {
      alert(res.error);
    } else {
      setEditingId(null);
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirm_delete'))) {
      setIsLoading(true);
      const res = await deleteProduct(id);
      if (res.error) alert(res.error);
      else {
        setSelectedIds(selectedIds.filter(selId => selId !== id));
        router.refresh();
      }
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Êtes-vous sûr de vouloir supprimer ces ${selectedIds.length} produits ?`)) {
      setIsLoading(true);
      const res = await bulkDeleteProducts(selectedIds);
      if (res.error) alert(res.error);
      else {
        setSelectedIds([]);
        router.refresh();
      }
      setIsLoading(false);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDuplicate = async (id: string) => {
    setIsLoading(true);
    const res = await duplicateProduct(id);
    if (res.error) alert(res.error);
    else router.refresh();
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {selectedIds.length > 0 && (
        <div className="bg-orange-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-orange-800">
            {selectedIds.length} sélectionné(s)
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={isLoading}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition"
          >
            Supprimer la sélection
          </button>
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left w-12">
              <input 
                type="checkbox" 
                checked={products.length > 0 && selectedIds.length === products.length}
                onChange={toggleSelectAll}
                className="rounded border-gray-300 text-orange-700 focus:ring-orange-500"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('image_th')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('product_th')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('price_th')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('stock_th')}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                {t('no_products')}
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const isEditing = editingId === product.id;

              return (
                <tr key={product.id} className={`hover:bg-gray-50 transition ${isEditing || selectedIds.includes(product.id) ? 'bg-orange-50/30' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap align-top">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded border-gray-300 text-orange-700 focus:ring-orange-500 mt-3"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-top">
                    {product.images && product.images[0] ? (
                      <Image width={800} height={800} src={product.images[0]} alt={product.title} className="h-12 w-12 rounded object-cover border border-gray-200" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500 border border-gray-200">N/A</div>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top w-full">
                    {isEditing ? (
                      <div className="space-y-3 bg-white p-4 border border-gray-200 rounded-md shadow-sm">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-600">{t('quick_edit_title')}</label>
                          <input type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="border px-2 py-1 rounded text-sm w-full" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-600">{t('quick_edit_slug')}</label>
                          <input type="text" value={editData.slug} onChange={e => setEditData({...editData, slug: e.target.value})} className="border px-2 py-1 rounded text-sm w-full" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-600">GTIN (EAN / UPC)</label>
                          <input type="text" value={editData.gtin} onChange={e => setEditData({...editData, gtin: e.target.value})} className="border px-2 py-1 rounded text-sm w-full" />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-semibold text-gray-600">{t('quick_edit_price')}</label>
                            <input type="number" step="0.01" value={editData.price} onChange={e => setEditData({...editData, price: parseFloat(e.target.value) || 0})} className="border px-2 py-1 rounded text-sm w-full" />
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-semibold text-gray-600">{t('quick_edit_promo')}</label>
                            <input type="number" step="0.01" value={editData.compareAtPrice} onChange={e => setEditData({...editData, compareAtPrice: e.target.value ? parseFloat(e.target.value) : ''})} className="border px-2 py-1 rounded text-sm w-full" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-600">{t('quick_edit_categories')}</label>
                          <div className="border rounded p-2 max-h-32 overflow-y-auto bg-gray-50 flex flex-col gap-1 text-sm">
                            {categories.map(c => (
                              <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={editData.categoryIds.includes(c.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditData({...editData, categoryIds: [...editData.categoryIds, c.id]});
                                    } else {
                                      setEditData({...editData, categoryIds: editData.categoryIds.filter(id => id !== c.id)});
                                    }
                                  }}
                                  className="rounded border-gray-300 text-orange-700 focus:ring-orange-500"
                                />
                                {c.name}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button onClick={() => setEditingId(null)} className="text-sm px-3 py-1 text-gray-500 border border-gray-300 rounded hover:bg-gray-50">{t('cancel')}</button>
                          <button onClick={() => handleQuickEditSubmit(product.id)} disabled={isLoading} className="text-sm px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600">{t('save')}</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold text-gray-900 mb-1">{product.title}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">ID: {product.id.substring(0,8)}</span>
                          <span>•</span>
                          <span className="text-orange-700 font-medium">{product.categories?.length > 0 ? product.categories.map((c: any) => c.name).join(', ') : t('uncategorized')}</span>
                        </div>
                        
                        {/* Woo-style Row Actions */}
                        <div className="flex items-center gap-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/products/edit/${product.id}`} className="text-blue-600 hover:underline">{t("product_edit")}</Link>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => startEdit(product)} className="text-blue-600 hover:underline">{t("product_quick_edit")}</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleDelete(product.id)} disabled={isLoading} className="text-red-600 hover:underline">{t("product_trash")}</button>
                          <span className="text-gray-300">|</span>
                          <Link href={`/product/${product.slug}`} target="_blank" className="text-blue-600 hover:underline">{t("product_view")}</Link>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleDuplicate(product.id)} disabled={isLoading} className="text-blue-600 hover:underline">{t("product_duplicate")}</button>
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium align-top">
                    <Price amount={product.price} showTax={false} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm align-top">
                    {product.stock === null ? (
                      <span className="text-teal-600 font-medium">{t("in_stock")}</span>
                    ) : product.stock > 0 ? (
                      <span className="text-teal-600 font-medium">{product.stock} {t('remaining')}</span>
                    ) : (
                      <span className="text-red-600 font-medium">{t("out_of_stock")}</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {/* CSS trick to show actions on full row hover */}
      <style dangerouslySetInnerHTML={{__html: `
        tr { cursor: default; }
        tr:hover .opacity-0 { opacity: 1 !important; }
      `}} />
    </div>
  );
}
