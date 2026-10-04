'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteArticle, quickEditArticle } from '@/actions/blog';
import { useTranslations, useLocale } from 'next-intl';
import Image from "next/image";

export default function BlogTable({ initialArticles }: { initialArticles: any[] }) {
  const t = useTranslations('AdminBlogs');
  const locale = useLocale();
  const router = useRouter();
  const [articles, setArticles] = useState(initialArticles);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: '', slug: '', category: '', isPublished: true, createdAt: '' });

  const startEdit = (a: any) => {
    setEditingId(a.id);
    setEditData({
      title: a.title,
      slug: a.slug,
      category: a.category || '',
      isPublished: a.isPublished,
      createdAt: new Date(a.createdAt).toISOString().slice(0, 16)
    });
  };

  const handleQuickEditSubmit = async (id: string) => {
    setLoadingId(id);
    const res = await quickEditArticle(id, editData);
    setLoadingId(null);
    if (res.error) {
      alert(res.error);
    } else {
      setEditingId(null);
      setArticles(articles.map(a => a.id === id ? { ...a, ...editData, createdAt: new Date(editData.createdAt) } : a));
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete'))) return;
    
    setLoadingId(id);
    const res = await deleteArticle(id);
    setLoadingId(null);
    
    if (res.success) {
      setArticles(articles.filter(a => a.id !== id));
    } else {
      alert(res.error || t('delete_error'));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-800 font-semibold">
          <tr>
            <th className="px-6 py-4">{t('col_article')}</th>
            <th className="px-6 py-4">{t('col_category')}</th>
            <th className="px-6 py-4">{t('col_status')}</th>
            <th className="px-6 py-4">{t('col_date')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {articles.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                {t('no_articles')}
              </td>
            </tr>
          ) : (
            articles.map(article => {
              const isEditing = editingId === article.id;
              
              return (
                <tr key={article.id} className={`transition ${isEditing ? 'bg-orange-50/30' : 'hover:bg-gray-50 group'}`}>
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
                        <div className="flex gap-4">
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-semibold text-gray-600">{t('quick_edit_category')}</label>
                            <input type="text" value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})} className="border px-2 py-1 rounded text-sm w-full" />
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-semibold text-gray-600">{t('quick_edit_date')}</label>
                            <input type="datetime-local" value={editData.createdAt} onChange={e => setEditData({...editData, createdAt: e.target.value})} className="border px-2 py-1 rounded text-sm w-full" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input 
                            type="checkbox" 
                            id={`quick-pub-${article.id}`} 
                            checked={editData.isPublished} 
                            onChange={e => setEditData({...editData, isPublished: e.target.checked})} 
                          />
                          <label htmlFor={`quick-pub-${article.id}`} className="text-xs font-medium text-gray-700">{t('published_checkbox')}</label>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button onClick={() => setEditingId(null)} className="text-sm px-3 py-1 text-gray-500 border border-gray-300 rounded hover:bg-gray-50">{t('cancel')}</button>
                          <button onClick={() => handleQuickEditSubmit(article.id)} disabled={loadingId === article.id} className="text-sm px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600">{t('save')}</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          {article.image ? (
                            <Image width={800} height={800} src={article.image} alt={article.title} className="w-10 h-10 object-cover rounded border" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-gray-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{article.title}</div>
                            <div className="text-xs text-gray-500">/{article.slug}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/blogs/edit/${article.id}`} className="text-blue-600 hover:underline">{t('edit')}</Link>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => startEdit(article)} className="text-blue-600 hover:underline">{t('quick_edit')}</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleDelete(article.id)} disabled={loadingId === article.id} className="text-red-600 hover:underline">{t('trash')}</button>
                          <span className="text-gray-300">|</span>
                          <Link href={`/blog/${article.slug}`} target="_blank" className="text-blue-600 hover:underline">{t('view')}</Link>
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top">{article.category || '-'}</td>
                  <td className="px-6 py-4 align-top">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${article.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {article.isPublished ? t('published') : t('draft')}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    {new Date(article.createdAt).toLocaleDateString(locale)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <style dangerouslySetInnerHTML={{__html: `
        tr { cursor: default; }
        tr:hover .opacity-0 { opacity: 1 !important; }
      `}} />

    </div>
  );
}
