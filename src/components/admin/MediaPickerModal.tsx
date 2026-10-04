'use client';
import { useState, useEffect, useRef } from 'react';
import { getMediaList, uploadMediaAction } from '@/actions/media';
import { useTranslations } from 'next-intl';
import Image from "next/image";

type Tab = 'library' | 'upload';

export default function MediaPickerModal({ 
  onClose, 
  onSelect 
}: { 
  onClose: () => void; 
  onSelect: (url: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [media, setMedia] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = useTranslations('AdminMedia');

  const fetchMedia = async (p = 1, s = '') => {
    setIsLoading(true);
    try {
      const res = await getMediaList(p, 20, s);
      setMedia(res.items);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      console.error('Error fetching media', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'library') {
      fetchMedia(page, search);
    }
  }, [page, search, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadError('');
    setUploadSuccess('');
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await uploadMediaAction(formData);
      if (res.error) {
        setUploadError(res.error);
      } else if (res.url) {
        setUploadSuccess('Téléversement réussi !');
        onSelect(res.url);
      }
    } catch (e) {
      setUploadError('Erreur lors du téléversement.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onload = () => setUploadPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const isImageFile = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(name);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-900">Médiathèque</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'library' 
                ? 'border-orange-500 text-orange-700' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Bibliothèque de médias
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'upload' 
                ? 'border-orange-500 text-orange-700' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Téléverser un fichier
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-grow overflow-hidden flex flex-col">

          {/* LIBRARY TAB */}
          {activeTab === 'library' && (
            <>
              <div className="p-4 border-b">
                <input 
                  type="text" 
                  placeholder="Rechercher des médias..."
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-orange-500 focus:border-orange-500 outline-none"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>

              <div className="p-4 overflow-y-auto flex-grow">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : media.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <svg className="w-16 h-16 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Aucun média trouvé</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {media.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => onSelect(m.url)}
                        className="relative aspect-square border-2 border-transparent rounded-lg overflow-hidden cursor-pointer hover:border-orange-500 group transition-all shadow-sm"
                      >
                        {isImageFile(m.url) ? (
                          <Image width={800} height={800} unoptimized src={m.url} alt={m.altText || m.title || 'media'} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-2">
                            <svg className="w-8 h-8 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[10px] text-gray-500 truncate w-full text-center">{m.title || 'Fichier'}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-orange-500/20 hidden group-hover:flex items-center justify-center">
                          <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">Sélectionner</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="p-4 border-t flex items-center justify-between bg-gray-50">
                <div className="flex gap-2 items-center">
                  <button 
                    type="button"
                    disabled={page === 1} 
                    onClick={() => setPage(p => p - 1)} 
                    className="px-3 py-1.5 border rounded-md disabled:opacity-40 text-sm bg-white hover:bg-gray-100 transition"
                  >
                    ← Précédent
                  </button>
                  <span className="text-sm text-gray-500">Page {page} / {Math.max(totalPages, 1)}</span>
                  <button 
                    type="button"
                    disabled={page >= totalPages} 
                    onClick={() => setPage(p => p + 1)} 
                    className="px-3 py-1.5 border rounded-md disabled:opacity-40 text-sm bg-white hover:bg-gray-100 transition"
                  >
                    Suivant →
                  </button>
                </div>
                <button type="button" onClick={onClose} className="px-4 py-1.5 bg-gray-200 rounded-md hover:bg-gray-300 text-sm transition">
                  Fermer
                </button>
              </div>
            </>
          )}

          {/* UPLOAD TAB */}
          {activeTab === 'upload' && (
            <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-grow">
              
              {/* Dropzone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  uploadPreview ? 'border-orange-300 bg-orange-50' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                }`}
              >
                {uploadPreview && uploadFile && isImageFile(uploadFile.name) ? (
                  <div className="flex flex-col items-center gap-3">
                    <Image width={800} height={800} src={uploadPreview} alt="Aperçu" className="max-h-48 max-w-full rounded-lg object-contain shadow-md" />
                    <p className="text-sm text-gray-600 font-medium">{uploadFile.name}</p>
                    <p className="text-xs text-gray-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : uploadFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{uploadFile.name}</p>
                    <p className="text-xs text-gray-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Glissez-déposez un fichier ici</p>
                      <p className="text-xs text-gray-500 mt-1">ou cliquez pour sélectionner</p>
                    </div>
                    <p className="text-xs text-gray-500">Images, vidéos, documents — tous formats acceptés</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
              </div>

              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
                  ✓ {uploadSuccess}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                {uploadFile && !uploadSuccess && (
                  <button
                    type="button"
                    onClick={() => { setUploadFile(null); setUploadPreview(null); setUploadError(''); }}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 transition"
                  >
                    Réinitialiser
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!uploadFile || isUploading || !!uploadSuccess}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Téléversement...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Téléverser et sélectionner
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


