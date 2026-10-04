'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createArticle, updateArticle } from '@/actions/blog';
import { uploadImage } from '@/actions/admin';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { useTranslations } from 'next-intl';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import Image from "next/image";

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

type BlogFormProps = {
  article?: any;
  existingCategories?: string[];
  existingAuthors?: string[];
};

export default function BlogForm({ article, existingCategories = [], existingAuthors = [] }: BlogFormProps) {
  const t = useTranslations('AdminBlogs');
  const tSeo = useTranslations('AdminSEO');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMediaModal, setShowMediaModal] = useState(false);
  
  const [formData, setFormData] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    content: article?.content || '',
    excerpt: article?.excerpt || '',
    category: article?.category || '',
    authorName: article?.authorName || '',
    image: article?.image || '',
    tags: article?.tags?.join(', ') || '',
    isPublished: article ? article.isPublished : true,
    createdAt: article?.createdAt ? new Date(article.createdAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    metaTitle: article?.metaTitle || '',
    metaDescription: article?.metaDescription || '',
    metaKeywords: article?.metaKeywords || ''
  });

  const generateSlug = (text: string) => 
    text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      ...(!article ? { slug: generateSlug(newTitle) } : {})
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      setLoading(true);
      const data = new FormData();
      data.append('file', e.target.files[0]);
      const url = await uploadImage(data);
      if (url) setFormData({ ...formData, image: url });
    } catch (err) {
      console.error(err);
      setError(t('upload_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    };

    const res = article 
      ? await updateArticle(article.id, payload)
      : await createArticle(payload);
      
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/admin/blogs');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('title_label')}</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={handleTitleChange}
                required
                className="w-full border px-4 py-2 rounded text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('slug_label')}</label>
              <input 
                type="text" 
                value={formData.slug} 
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                required
                className="w-full border px-4 py-2 rounded text-sm"
                placeholder={t('slug_placeholder')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('excerpt_label')}</label>
              <textarea 
                value={formData.excerpt} 
                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                className="w-full border px-4 py-2 rounded text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('content_label')}</label>
              <div className="bg-white">
                <ReactQuill 
                  theme="snow" 
                  value={formData.content} 
                  onChange={(content: string) => setFormData({ ...formData, content })} 
                  className="h-96 mb-12"
                />
              </div>
            </div>
          </div>
          
          {/* SEO SECTION */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-50 pb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              {tSeo('seo_section_title') || 'Référencement (SEO)'}
            </h2>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">{tSeo('meta_title_label') || 'Meta Titre (Optionnel)'}</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                placeholder={tSeo('meta_title_placeholder') || "Titre personnalisé pour Google"}
                value={formData.metaTitle}
                onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">{tSeo('meta_desc_label') || 'Meta Description (Optionnel)'}</label>
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                placeholder={tSeo('meta_desc_placeholder') || "Description courte affichée dans les résultats..."}
                value={formData.metaDescription}
                onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">{tSeo('meta_keywords_label') || 'Meta Mots-clés (Optionnel)'}</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                placeholder={tSeo('meta_keywords_placeholder') || "mot-clé 1, mot-clé 2..."}
                value={formData.metaKeywords}
                onChange={(e) => setFormData({...formData, metaKeywords: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-semibold text-gray-800">{t('organization_title')}</h3>
            
            <div className="flex items-center gap-2 mb-4">
              <input 
                type="checkbox" 
                id="isPublished"
                checked={formData.isPublished}
                onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
              />
              <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                {t('published_checkbox')}
              </label>
            </div>
            
            <div className="mb-4 border-t pt-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">Date de publication</label>
              <input 
                type="datetime-local" 
                value={formData.createdAt}
                onChange={e => setFormData({ ...formData, createdAt: e.target.value })}
                className="w-full border px-3 py-2 rounded text-sm outline-none focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Vous pouvez programmer un article dans le futur en choisissant une date ultérieure.</p>
            </div>

            {/* Category with suggestions */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('category_label')}</label>
              <input 
                type="text" 
                value={formData.category} 
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full border px-3 py-2 rounded text-sm"
                placeholder={t('category_placeholder')}
              />
              {existingCategories.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1.5">Catégories existantes :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {existingCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                          formData.category === cat
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('keywords_label')}</label>
              <input 
                type="text" 
                value={formData.tags} 
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                className="w-full border px-3 py-2 rounded text-sm"
                placeholder={t('keywords_placeholder')}
              />
            </div>

            {/* Author with suggestions */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('author_label')}</label>
              <input 
                type="text" 
                value={formData.authorName} 
                onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                className="w-full border px-3 py-2 rounded text-sm"
              />
              {existingAuthors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1.5">Auteurs existants :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {existingAuthors.map((author) => (
                      <button
                        key={author}
                        type="button"
                        onClick={() => setFormData({ ...formData, authorName: author })}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          formData.authorName === author
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-current opacity-20 inline-block" />
                        {author}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">{t('cover_image')}</h3>
            {formData.image && (
              <Image width={800} height={800} src={formData.image} alt="Cover" className="w-full h-auto rounded mb-3 border object-cover" />
            )}
            <button
              type="button"
              onClick={() => setShowMediaModal(true)}
              className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-200 transition w-full text-center"
            >
              {formData.image ? 'Changer l\'image' : 'Choisir une image'}
            </button>
            {showMediaModal && (
              <MediaPickerModal 
                onClose={() => setShowMediaModal(false)}
                onSelect={(url) => {
                  setFormData({ ...formData, image: url });
                  setShowMediaModal(false);
                }}
              />
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded transition-colors disabled:opacity-50"
          >
            {loading ? t('saving') : (article ? t('update') : t('publish'))}
          </button>
        </div>
      </div>
    </form>
  );
}


