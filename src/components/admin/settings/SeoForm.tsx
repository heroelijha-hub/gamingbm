'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettingsBatch } from '@/actions/settings';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import { useTranslations } from 'next-intl';
import Image from "next/image";

export default function SeoForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const router = useRouter();
  const tSeo = useTranslations('AdminSEO');
  
  const [metaTitle, setMetaTitle] = useState(initialSettings.HOME_META_TITLE || '');
  const [metaDescription, setMetaDescription] = useState(initialSettings.HOME_META_DESCRIPTION || '');
  const [ogImage, setOgImage] = useState(initialSettings.HEADER_LOGO_IMAGE || '');
  const [googleSiteVerification, setGoogleSiteVerification] = useState(initialSettings.GOOGLE_SITE_VERIFICATION || '');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(initialSettings.GOOGLE_ANALYTICS_ID || '');
  
  const [storeCountry, setStoreCountry] = useState(initialSettings.STORE_COUNTRY || 'FR');
  const [rssBeforeContent, setRssBeforeContent] = useState(initialSettings.RSS_BEFORE_CONTENT || '');
  const [rssAfterContent, setRssAfterContent] = useState(initialSettings.RSS_AFTER_CONTENT || 'L\'article {post_link} est apparu en premier sur {blog_link}.');

  const [showMediaModal, setShowMediaModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    const settingsMap: Record<string, string> = {
      HOME_META_TITLE: metaTitle,
      HOME_META_DESCRIPTION: metaDescription,
      HEADER_LOGO_IMAGE: ogImage,
      GOOGLE_SITE_VERIFICATION: googleSiteVerification,
      GOOGLE_ANALYTICS_ID: googleAnalyticsId,
      STORE_COUNTRY: storeCountry,
      RSS_BEFORE_CONTENT: rssBeforeContent,
      RSS_AFTER_CONTENT: rssAfterContent,
    };

    await updateSettingsBatch(settingsMap);

    setMessage('Paramètres SEO mis à jour avec succès');
    setIsLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{tSeo('seo_section_title') || 'SEO & OpenGraph'}</h2>
        <p className="text-gray-500 mt-1">{tSeo('home_seo_desc') || 'Paramètres de référencement globaux (appliqués à la page d\'accueil et par défaut).'}</p>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <label className="block text-sm font-medium text-gray-700">{tSeo('home_meta_title_label') || 'Meta Titre (Page d\'accueil)'}</label>
            <p className="text-xs text-gray-500 mt-1">{tSeo('home_meta_title_help') || 'L\'inspecteur recommande 50 à 60 caractères.'}</p>
          </div>
          <div className="md:w-2/3">
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Nom de la boutique | Slogan percutant"
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className={`text-xs mt-1 ${metaTitle.length < 50 ? 'text-red-500' : metaTitle.length > 60 ? 'text-orange-600' : 'text-green-600'}`}>
              {metaTitle.length} {tSeo('chars') || 'caractères'} {metaTitle.length > 0 && (metaTitle.length < 50 ? tSeo('too_short') : metaTitle.length > 60 ? tSeo('too_long') : tSeo('perfect'))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-100 pb-6">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <label className="block text-sm font-medium text-gray-700">{tSeo('home_meta_desc_label') || 'Meta Description'}</label>
            <p className="text-xs text-gray-500 mt-1">{tSeo('home_meta_desc_help') || 'L\'inspecteur recommande 80 à 125 caractères pour un meilleur taux de clic (CTR).'}</p>
          </div>
          <div className="md:w-2/3">
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              placeholder="Découvrez notre boutique..."
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className={`text-xs mt-1 ${metaDescription.length < 80 ? 'text-red-500' : metaDescription.length > 125 ? 'text-orange-600' : 'text-green-600'}`}>
              {metaDescription.length} {tSeo('chars') || 'caractères'} {metaDescription.length > 0 && (metaDescription.length < 80 ? tSeo('too_short') : metaDescription.length > 125 ? tSeo('too_long') : tSeo('perfect'))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-100 pb-6">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <label className="block text-sm font-medium text-gray-700">{tSeo('gsc_label') || 'Google Search Console'}</label>
            <p className="text-xs text-gray-500 mt-1">{tSeo('gsc_help') || 'Clé de vérification (ex: xxxxxxx-yyyyyy). Récupérez-la lors de l\'ajout de la propriété "Préfixe de l\'URL" (méthode balise HTML).'}</p>
          </div>
          <div className="md:w-2/3">
            <input
              type="text"
              value={googleSiteVerification}
              onChange={(e) => setGoogleSiteVerification(e.target.value)}
              placeholder={tSeo('gsc_placeholder') || "votre_code_de_verification"}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-100 pb-6">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <label className="block text-sm font-medium text-gray-700">{tSeo('ga_label') || 'Google Analytics (G-XXXXX)'}</label>
            <p className="text-xs text-gray-500 mt-1">{tSeo('ga_help') || 'ID de mesure de votre propriété Google Analytics 4. Le script s\'activera automatiquement quand l\'utilisateur accepte les cookies statistiques.'}</p>
          </div>
          <div className="md:w-2/3">
            <input
              type="text"
              value={googleAnalyticsId}
              onChange={(e) => setGoogleAnalyticsId(e.target.value)}
              placeholder={tSeo('ga_placeholder') || "G-XXXXXXXXXX"}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between pb-2">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <label className="block text-sm font-medium text-gray-700">{tSeo('og_image_label') || 'Image OpenGraph (og:image)'}</label>
            <p className="text-xs text-gray-500 mt-1">{tSeo('og_image_help') || 'Image utilisée lors du partage sur les réseaux sociaux. L\'inspecteur recommande un ratio de 1.91:1 (idéalement 1200x630 pixels).'}</p>
          </div>
          <div className="md:w-2/3">
            {ogImage && (
              <div className="mb-3">
                <Image width={800} height={800} src={ogImage} alt="OG Image" className="max-w-xs rounded-md border border-gray-200 shadow-sm" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowMediaModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {ogImage ? tSeo('change_image') : tSeo('choose_image')}
            </button>
            
            {showMediaModal && (
              <MediaPickerModal 
                onClose={() => setShowMediaModal(false)}
                onSelect={(url) => {
                  setOgImage(url);
                  setShowMediaModal(false);
                }}
              />
            )}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{tSeo('local_seo_title') || 'Local SEO & Données Structurées'}</h3>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6">
            <div className="mb-4 md:mb-0 md:w-1/3">
              <label className="block text-sm font-medium text-gray-700">{tSeo('store_country_label') || 'Pays de la Boutique (Code ISO)'}</label>
              <p className="text-xs text-gray-500 mt-1">{tSeo('store_country_help') || 'Ex: FR, DE, CH, CA. Utilisé pour indiquer à Google la localisation principale.'}</p>
            </div>
            <div className="md:w-2/3">
              <input
                type="text"
                value={storeCountry}
                onChange={(e) => setStoreCountry(e.target.value.toUpperCase())}
                placeholder="FR"
                maxLength={2}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{tSeo('rss_protection_title') || 'Flux RSS & Protection de Contenu'}</h3>
          <p className="text-sm text-gray-500 mb-6" dangerouslySetInnerHTML={{ __html: tSeo.raw ? tSeo.raw('rss_protection_desc') : tSeo('rss_protection_desc') || "Ajoutez du contenu personnalisé avant ou après chaque article dans votre flux RSS. Utilisez les variables <code>{post_link}</code>, <code>{blog_link}</code>, <code>{author}</code> et <code>{featuredimage}</code>." }}></p>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-100 pb-6 mb-6">
            <div className="mb-4 md:mb-0 md:w-1/3">
              <label className="block text-sm font-medium text-gray-700">{tSeo('rss_before_label') || 'Contenu avant l\'article (RSS)'}</label>
            </div>
            <div className="md:w-2/3">
              <textarea
                value={rssBeforeContent}
                onChange={(e) => setRssBeforeContent(e.target.value)}
                rows={2}
                placeholder={tSeo('rss_before_placeholder') || "Ex: Bienvenue sur notre blog..."}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between pb-2">
            <div className="mb-4 md:mb-0 md:w-1/3">
              <label className="block text-sm font-medium text-gray-700">{tSeo('rss_after_label') || 'Contenu après l\'article (RSS)'}</label>
              <p className="text-xs text-gray-500 mt-1">{tSeo('rss_after_help') || 'Recommandé pour l\'attribution SEO (RankMath style).'}</p>
            </div>
            <div className="md:w-2/3">
              <textarea
                value={rssAfterContent}
                onChange={(e) => setRssAfterContent(e.target.value)}
                rows={3}
                placeholder={tSeo('rss_after_placeholder') || "L'article {post_link} est apparu en premier sur {blog_link}."}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 text-sm font-semibold transition-colors"
        >
          {isLoading ? tSeo('saving') : tSeo('save_btn')}
        </button>
      </div>
    </form>
  );
}
