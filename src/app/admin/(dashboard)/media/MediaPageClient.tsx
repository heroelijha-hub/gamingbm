'use client';
import { useState, useEffect } from 'react';
import { getMediaList, uploadMediaAction, updateMediaAction, deleteMediaAction, deleteMultipleMediaAction } from '@/actions/media';
import { useTranslations } from 'next-intl';
import Image from "next/image";

export default function MediaPageClient() {
  const [media, setMedia] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [mediaType, setMediaType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const t = useTranslations('AdminMedia');
  
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);

  const toggleSelection = (m: any) => {
    setSelectedMedia(prev => {
      if (prev.some(item => item.id === m.id)) {
        return prev.filter(item => item.id !== m.id);
      } else {
        return [...prev, m];
      }
    });
  };

  const fetchMedia = async (p = 1, s = '', t = mediaType, d = dateFilter) => {
    setIsLoading(true);
    const res = await getMediaList(p, 24, s, t, d);
    setMedia(res.items);
    setTotal(res.total);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMedia(page, search, mediaType, dateFilter);
  }, [page, search, mediaType, dateFilter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await uploadMediaAction(formData);
    if (res.success) {
      setPage(1);
      fetchMedia(1, search, mediaType, dateFilter);
    } else {
      alert(res.error || t('upload_error'));
    }
    setIsUploading(false);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedMedia.length !== 1) return;
    const mediaToUpdate = selectedMedia[0];

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      altText: formData.get('altText') as string,
      description: formData.get('description') as string,
      legend: formData.get('legend') as string,
      link: formData.get('link') as string,
    };

    const res = await updateMediaAction(mediaToUpdate.id, data);
    if (res.success) {
      alert(t('update_success'));
      setMedia(media.map(m => m.id === mediaToUpdate.id ? res.media : m));
      setSelectedMedia([res.media]);
    } else {
      alert(res.error);
    }
  };

  const handleDeleteMultiple = async () => {
    if (!confirm(t('delete_confirm'))) return;
    
    const ids = selectedMedia.map(m => m.id);
    const res = await deleteMultipleMediaAction(ids);
    if (res.success) {
      setSelectedMedia([]);
      setIsBulkSelectMode(false);
      fetchMedia(page, search, mediaType, dateFilter);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center gap-4 text-sm bg-white p-4 shadow-sm border border-gray-200 rounded">
        {/* View toggles */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
          <button className="p-1.5 text-gray-500 hover:text-gray-700" title={t('list_view') || "List view"}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <button className="p-1.5 text-gray-900 border border-gray-300 rounded bg-gray-100" title={t('grid_view') || "Grid view"}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          </button>
        </div>

        {/* Filters */}
        <select 
          className="border border-gray-300 rounded px-3 py-1.5 text-gray-700 outline-none"
          value={mediaType}
          onChange={(e) => { setMediaType(e.target.value); setPage(1); }}
        >
          <option value="all">{t('filter_all_media', { defaultMessage: 'Tous les médias' })}</option>
          <option value="images">{t('filter_images', { defaultMessage: 'Images' })}</option>
          <option value="videos">{t('filter_videos', { defaultMessage: 'Vidéos' })}</option>
          <option value="documents">{t('filter_documents', { defaultMessage: 'Documents' })}</option>
          <option value="audios">{t('filter_audios', { defaultMessage: 'Audios' })}</option>
        </select>
        
        <select 
          className="border border-gray-300 rounded px-3 py-1.5 text-gray-700 outline-none"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
        >
          <option value="all">{t('filter_all_dates', { defaultMessage: 'Toutes les dates' })}</option>
          <option value="last_30_days">{t('filter_last_30_days', { defaultMessage: '30 derniers jours' })}</option>
          <option value="this_year">{t('filter_this_year', { defaultMessage: 'Cette année' })}</option>
          <option value="last_year">{t('filter_last_year', { defaultMessage: 'L\'année dernière' })}</option>
        </select>

        <button 
          onClick={() => {
            setIsBulkSelectMode(true);
            setSelectedMedia([]);
          }}
          className="border border-[#2271b1] text-[#2271b1] px-4 py-1.5 rounded font-medium hover:bg-[#f6f7f7] transition"
        >
          {t('bulk_select', { defaultMessage: 'Sélection groupée' })}
        </button>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-4">
          <label className="border border-[#2271b1] text-[#2271b1] px-4 py-1.5 rounded font-medium hover:bg-[#f6f7f7] transition cursor-pointer flex items-center">
            {isUploading ? t('uploading') : t('add_media_file', { defaultMessage: 'Ajouter un fichier média' })}
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
          </label>

          <div className="relative">
            <input 
              type="text" 
              placeholder={t('search_media', { defaultMessage: 'Rechercher des médias' })}
              className="border border-gray-300 rounded px-3 py-1.5 outline-none w-64 pr-8"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {isBulkSelectMode && (
        <div className="bg-white border border-gray-200 p-3 flex items-center gap-4 mb-4 shadow-sm rounded">
          <button 
            onClick={handleDeleteMultiple}
            disabled={selectedMedia.length === 0}
            className="bg-[#2271b1] text-white px-4 py-1.5 rounded font-medium hover:bg-[#135e96] disabled:opacity-50 transition"
          >
            {t('delete_permanently', { defaultMessage: 'Supprimer définitivement' })}
          </button>
          <button 
            onClick={() => { setIsBulkSelectMode(false); setSelectedMedia([]); }}
            className="border border-[#2271b1] text-[#2271b1] px-4 py-1.5 rounded font-medium hover:bg-[#f6f7f7] transition"
          >
            {t('cancel', { defaultMessage: 'Annuler' })}
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Grille */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 w-full`}>
          {isLoading ? (
            <p className="col-span-full py-10 text-center text-gray-500">{t('loading')}</p>
          ) : media.length === 0 ? (
            <p className="col-span-full py-10 text-center text-gray-500">{t('no_media')}</p>
          ) : (
            media.map(m => {
              const isSelected = selectedMedia.some(item => item.id === m.id);
              return (
                <div 
                  key={m.id} 
                  onClick={() => {
                    if (isBulkSelectMode) {
                      toggleSelection(m);
                    } else {
                      setSelectedMedia([m]);
                    }
                  }}
                  className={`relative aspect-square border overflow-hidden cursor-pointer transition-all bg-white shadow-sm ${
                    isSelected ? 'border-[#2271b1] border-4' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Image width={800} height={800} unoptimized src={m.url} alt={m.altText || m.title || 'media'} className="object-contain w-full h-full bg-gray-50" />
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-[#2271b1] text-white w-6 h-6 flex items-center justify-center border-2 border-white rounded-sm shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Panneau Latéral de modification */}
        {!isBulkSelectMode && selectedMedia.length === 1 && (
          <div className="fixed top-0 right-0 h-full w-80 bg-white border-l shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {t('details')}
              </h2>
              <button onClick={() => setSelectedMedia([])} className="text-gray-500 hover:text-black focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4">
              <Image width={800} height={800} src={selectedMedia[0].url} className="w-full h-auto mb-4 border bg-gray-50" alt="Aperçu" />
              
              <div className="mb-4">
                <span className="text-xs text-gray-500 block mb-1 font-medium">{t('file_url')}</span>
                <div className="flex">
                  <input type="text" readOnly value={selectedMedia[0].url} className="w-full text-xs p-2 border border-gray-300 rounded-l bg-gray-50 outline-none" />
                  <button 
                    onClick={() => { navigator.clipboard.writeText(selectedMedia[0].url); alert(t('copied')); }}
                    className="bg-gray-100 px-3 text-xs border border-gray-300 border-l-0 rounded-r hover:bg-gray-200"
                  >
                    {t('copy')}
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4 text-sm">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">{t('media_title')}</label>
                  <input type="text" name="title" defaultValue={selectedMedia[0].title || ''} className="w-full p-2 border border-gray-300 rounded outline-none" />
                </div>
                
                <div>
                  <label className="block font-medium mb-1 text-gray-700">{t('alt_text')}</label>
                  <input type="text" name="altText" defaultValue={selectedMedia[0].altText || ''} className="w-full p-2 border border-gray-300 rounded outline-none" />
                </div>
                
                <div>
                  <label className="block font-medium mb-1 text-gray-700">{t('legend')}</label>
                  <input type="text" name="legend" defaultValue={selectedMedia[0].legend || ''} className="w-full p-2 border border-gray-300 rounded outline-none" />
                </div>
                
                <div>
                  <label className="block font-medium mb-1 text-gray-700">{t('description')}</label>
                  <textarea name="description" defaultValue={selectedMedia[0].description || ''} className="w-full p-2 border border-gray-300 rounded outline-none" rows={3}></textarea>
                </div>
                
                <div>
                  <label className="block font-medium mb-1 text-gray-700">{t('link')}</label>
                  <input type="text" name="link" defaultValue={selectedMedia[0].link || ''} className="w-full p-2 border border-gray-300 rounded outline-none" />
                </div>

                <div className="flex justify-between pt-4 border-t mt-6">
                  <button type="button" onClick={handleDeleteMultiple} className="text-red-600 text-sm hover:underline font-medium">
                    {t('delete')}
                  </button>
                  <button type="submit" className="bg-[#2271b1] text-white px-4 py-2 rounded text-sm hover:bg-[#135e96] font-medium transition">
                    {t('update')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-8">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">{t('previous')}</button>
        <span className="px-3 py-1">{t('page', { page })}</span>
        <button disabled={media.length < 24} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">{t('next')}</button>
      </div>
    </div>
  );
}
