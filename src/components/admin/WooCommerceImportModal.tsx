'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { 
  countWooCommerceProducts, 
  importWooCommerceProductsBatch, 
  importWooCommerceCategories,
  fetchWooCommerceCategoriesList,
  fetchWooCommerceProductsList,
  importWooCommerceSelectedProducts,
  testWooCommerceConnection
} from '@/actions/woocommerce';

type ImportMode = 'ALL' | 'CATEGORIES' | 'INDIVIDUAL';

export default function WooCommerceImportModal() {
  const t = useTranslations('AdminProducts');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingRemote, setFetchingRemote] = useState(false);
  
  // Credentials
  const [url, setUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [credentialsVerified, setCredentialsVerified] = useState(false);
  
  // Mode
  const [importMode, setImportMode] = useState<ImportMode>('ALL');

  // Categories Selection State
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string; count: number; slug: string }>>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // Individual Products State
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: number; name: string; price: string; image: string | null; categories: string[]; alreadyImported: boolean }>>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [totalRemoteProducts, setTotalRemoteProducts] = useState(0);
  const [totalRemotePages, setTotalRemotePages] = useState(0);

  // Results & Progress
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [importingCategories, setImportingCategories] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [importedProducts, setImportedProducts] = useState(0);

  const resetModal = () => {
    setLoading(false);
    setFetchingRemote(false);
    setResultMessage(null);
    setImportingCategories(false);
    setTotalProducts(0);
    setImportedProducts(0);
  };

  // Step 1: Connect and load categories / products metadata
  const handleConnectAndFetch = async () => {
    if (!url || !consumerKey || !consumerSecret) return;
    setFetchingRemote(true);
    setResultMessage(null);

    try {
      const test = await testWooCommerceConnection(url, consumerKey, consumerSecret);
      if (!test.success) {
        setResultMessage({ type: 'error', text: test.message });
        setFetchingRemote(false);
        return;
      }

      setCredentialsVerified(true);

      // Fetch Categories
      const catRes = await fetchWooCommerceCategoriesList(url, consumerKey, consumerSecret);
      if (catRes.success && catRes.categories) {
        setAvailableCategories(catRes.categories);
      }

      // Fetch First page of Products
      const prodRes = await fetchWooCommerceProductsList(url, consumerKey, consumerSecret, '', 1);
      if (prodRes.success && prodRes.products) {
        setAvailableProducts(prodRes.products);
        setTotalRemoteProducts(prodRes.total || 0);
        setTotalRemotePages(prodRes.totalPages || 0);
        setProductPage(1);
      }
    } catch (e: any) {
      setResultMessage({ type: 'error', text: e.message || 'Erreur lors de la connexion' });
    } finally {
      setFetchingRemote(false);
    }
  };

  // Search or paginate individual products
  const handleSearchProducts = async (page: number = 1) => {
    if (!credentialsVerified) return;
    setFetchingRemote(true);
    try {
      const prodRes = await fetchWooCommerceProductsList(url, consumerKey, consumerSecret, productSearch, page);
      if (prodRes.success && prodRes.products) {
        setAvailableProducts(prodRes.products);
        setTotalRemoteProducts(prodRes.total || 0);
        setTotalRemotePages(prodRes.totalPages || 0);
        setProductPage(page);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setFetchingRemote(false);
    }
  };

  // Toggle Category selection
  const toggleCategory = (catId: number) => {
    setSelectedCategoryIds(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  // Toggle Product selection
  const toggleProduct = (prodId: number) => {
    setSelectedProductIds(prev => 
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  const handleSelectAllVisibleProducts = () => {
    const unimportedIds = availableProducts.filter(p => !p.alreadyImported).map(p => p.id);
    const allSelected = unimportedIds.every(id => selectedProductIds.includes(id));
    if (allSelected) {
      setSelectedProductIds(prev => prev.filter(id => !unimportedIds.includes(id)));
    } else {
      setSelectedProductIds(prev => Array.from(new Set([...prev, ...unimportedIds])));
    }
  };

  // Launch Import
  const handleStartImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResultMessage(null);
    setImportedProducts(0);
    setTotalProducts(0);

    try {
      // 0. Toujours synchroniser la hiérarchie des catégories au préalable
      setImportingCategories(true);
      const catRes = await importWooCommerceCategories(url, consumerKey, consumerSecret);
      setImportingCategories(false);

      if (!catRes.success) {
        setResultMessage({ type: 'error', text: t('import_error') + ': ' + catRes.message });
        setLoading(false);
        return;
      }

      // Case A: Import Individual Products
      if (importMode === 'INDIVIDUAL') {
        if (selectedProductIds.length === 0) {
          setResultMessage({ type: 'error', text: 'Veuillez sélectionner au moins un produit à importer.' });
          setLoading(false);
          return;
        }

        setTotalProducts(selectedProductIds.length);
        const importRes = await importWooCommerceSelectedProducts(url, consumerKey, consumerSecret, selectedProductIds);
        
        if (!importRes.success) {
          setResultMessage({ type: 'error', text: t('import_error') + ': ' + importRes.message });
          setLoading(false);
          return;
        }

        setImportedProducts(importRes.count || 0);
        setResultMessage({ type: 'success', text: t('import_success').replace('{count}', (importRes.count || 0).toString()) });
        
        // Refresh product list status
        await handleSearchProducts(productPage);
        setSelectedProductIds([]);
        setTimeout(() => setIsOpen(false), 2500);
        return;
      }

      // Case B: Import By Category or ALL
      const catFilter = importMode === 'CATEGORIES' ? selectedCategoryIds : undefined;
      if (importMode === 'CATEGORIES' && selectedCategoryIds.length === 0) {
        setResultMessage({ type: 'error', text: 'Veuillez sélectionner au moins une catégorie.' });
        setLoading(false);
        return;
      }

      const countRes = await countWooCommerceProducts(url, consumerKey, consumerSecret, catFilter);
      if (!countRes.success || countRes.total === undefined) {
        setResultMessage({ type: 'error', text: t('import_error') + ': ' + countRes.message });
        setLoading(false);
        return;
      }

      const total = countRes.total;
      setTotalProducts(total);

      if (total === 0) {
        setResultMessage({ type: 'success', text: t('import_success').replace('{count}', '0') });
        setLoading(false);
        return;
      }

      // Import batch by batch
      const perPage = 1; // 1 par 1 pour éviter timeouts
      const totalPages = Math.ceil(total / perPage);
      let totalImported = 0;

      for (let page = 1; page <= totalPages; page++) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('user-activity'));
        }

        const batchRes = await importWooCommerceProductsBatch(url, consumerKey, consumerSecret, page, perPage, catFilter);
        if (!batchRes.success) {
          setResultMessage({ type: 'error', text: t('import_error') + ': ' + batchRes.message });
          setLoading(false);
          return;
        }

        totalImported += (batchRes.count || 0);
        setImportedProducts(totalImported);
      }

      setResultMessage({ type: 'success', text: t('import_success').replace('{count}', totalImported.toString()) });
      setTimeout(() => setIsOpen(false), 2500);

    } catch (error: any) {
      setResultMessage({ type: 'error', text: t('import_error') + ': ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => { resetModal(); setIsOpen(true); }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition flex items-center space-x-2 shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        <span>{t('import_woo_btn')}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('import_woo_title')}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Importez des catégories entières, tous vos articles ou des produits au choix.</p>
              </div>
              <button 
                onClick={() => !loading && setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
                disabled={loading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleStartImport} className="flex-1 overflow-y-auto pr-1 space-y-4">
              
              {/* Credentials Section */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Identifiants WooCommerce</span>
                  {credentialsVerified && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      ✓ Connecté
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-3">
                    <input 
                      type="url" 
                      required
                      placeholder="https://votreboutique.com"
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setCredentialsVerified(false); }}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      disabled={loading}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <input 
                      type="text" 
                      required
                      placeholder="Client Key (ck_...)"
                      value={consumerKey}
                      onChange={(e) => { setConsumerKey(e.target.value); setCredentialsVerified(false); }}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      disabled={loading}
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <input 
                      type="password" 
                      required
                      placeholder="Client Secret (cs_...)"
                      value={consumerSecret}
                      onChange={(e) => { setConsumerSecret(e.target.value); setCredentialsVerified(false); }}
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={handleConnectAndFetch}
                      disabled={fetchingRemote || loading || !url || !consumerKey || !consumerSecret}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-semibold shrink-0 disabled:opacity-50 transition"
                    >
                      {fetchingRemote ? 'Connexion...' : 'Charger'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Import Mode Selector */}
              {credentialsVerified && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Méthode d'importation</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('ALL')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col ${importMode === 'ALL' ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <span className="font-bold text-xs text-gray-900">Tout importer</span>
                      <span className="text-[10px] text-gray-500 mt-0.5">Tous les produits du catalogue</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportMode('CATEGORIES')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col ${importMode === 'CATEGORIES' ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <span className="font-bold text-xs text-gray-900">Par catégorie</span>
                      <span className="text-[10px] text-gray-500 mt-0.5">Sélectionner des catégories</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportMode('INDIVIDUAL')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col ${importMode === 'INDIVIDUAL' ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <span className="font-bold text-xs text-gray-900">Produits au choix</span>
                      <span className="text-[10px] text-gray-500 mt-0.5">Sélectionner individuellement</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode A: Categories List */}
              {credentialsVerified && importMode === 'CATEGORIES' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Catégories disponibles ({availableCategories.length}) :</span>
                    <span className="text-gray-500 font-medium">{selectedCategoryIds.length} sélectionnée(s)</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                    {availableCategories.length === 0 ? (
                      <p className="p-4 text-xs text-gray-400 text-center">Aucune catégorie trouvée.</p>
                    ) : (
                      availableCategories.map(cat => (
                        <label key={cat.id} className="flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 cursor-pointer text-xs">
                          <div className="flex items-center gap-2.5">
                            <input 
                              type="checkbox"
                              checked={selectedCategoryIds.includes(cat.id)}
                              onChange={() => toggleCategory(cat.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="font-medium text-gray-800">{cat.name}</span>
                          </div>
                          <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
                            {cat.count} prod.
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Mode B: Individual Products List */}
              {credentialsVerified && importMode === 'INDIVIDUAL' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        placeholder="Rechercher un produit distant..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchProducts(1))}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                      />
                      <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSearchProducts(1)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition"
                    >
                      Rechercher
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllVisibleProducts}
                      className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold rounded-lg transition"
                    >
                      Tout cocher page
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{selectedProductIds.length} produit(s) sélectionné(s) pour import</span>
                    <span>Total distant : {totalRemoteProducts}</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                    {availableProducts.length === 0 ? (
                      <p className="p-4 text-xs text-gray-400 text-center">Aucun produit trouvé.</p>
                    ) : (
                      availableProducts.map(prod => (
                        <div key={prod.id} className="flex items-center justify-between p-2.5 hover:bg-gray-50 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <input 
                              type="checkbox"
                              checked={selectedProductIds.includes(prod.id)}
                              onChange={() => toggleProduct(prod.id)}
                              disabled={prod.alreadyImported}
                              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 disabled:opacity-40"
                            />
                            {prod.image ? (
                              <Image 
                                src={prod.image} 
                                alt="" 
                                width={36} 
                                height={36} 
                                className="w-9 h-9 object-cover rounded-md border shrink-0 bg-gray-50" 
                              />
                            ) : (
                              <div className="w-9 h-9 bg-gray-100 rounded-md shrink-0 flex items-center justify-center text-[10px] text-gray-400">
                                No img
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 truncate">{prod.name}</p>
                              <p className="text-[10px] text-gray-500">
                                {prod.categories.join(', ') || 'Sans catégorie'} &bull; <span className="font-bold text-gray-700">{prod.price}€</span>
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {prod.alreadyImported ? (
                              <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                Déjà importé
                              </span>
                            ) : selectedProductIds.includes(prod.id) ? (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                Sélectionné
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination */}
                  {totalRemotePages > 1 && (
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        disabled={productPage <= 1 || fetchingRemote}
                        onClick={() => handleSearchProducts(productPage - 1)}
                        className="px-2.5 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40"
                      >
                        Précédent
                      </button>
                      <span className="text-gray-500 text-[11px]">Page {productPage} sur {totalRemotePages}</span>
                      <button
                        type="button"
                        disabled={productPage >= totalRemotePages || fetchingRemote}
                        onClick={() => handleSearchProducts(productPage + 1)}
                        className="px-2.5 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40"
                      >
                        Suivant
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              {loading && importingCategories && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-medium text-blue-700">
                    <span>Synchronisation des catégories...</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full"></div>
                  </div>
                </div>
              )}

              {loading && !importingCategories && totalProducts > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>Importation des produits...</span>
                    <span>{importedProducts} / {totalProducts}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, Math.round((importedProducts / totalProducts) * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Result Message */}
              {resultMessage && (
                <div className={`p-3 rounded-xl text-xs font-medium ${resultMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {resultMessage.text}
                </div>
              )}

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="w-1/3 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !credentialsVerified}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>Traitement en cours...</span>
                    </>
                  ) : (
                    <span>
                      {importMode === 'INDIVIDUAL' 
                        ? `Importer les ${selectedProductIds.length} produit(s) sélectionné(s)`
                        : importMode === 'CATEGORIES' 
                          ? `Importer les catégories sélectionnées`
                          : `Importer tout le catalogue`}
                    </span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
