import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";

export async function generateMetadata() {
  const t = await getTranslations('StoreLocator');
  return {
    title: `${t('page_title')} - ${storeName}`,
    description: t('page_description'),
  };
}

export default async function StoreLocatorPage() {
  const t = await getTranslations('StoreLocator');
  const stores = [
    {
      id: 1,
      name: `${storeName} Paris Centre`,
      address: '15 Rue de Rivoli, 75001 Paris, France',
      phone: '+33 1 23 45 67 89',
      hours: t('hours_1'),
      status: t('status_open'),
    },
    {
      id: 2,
      name: `${storeName} Lyon Part-Dieu`,
      address: '17 Rue du Dr Bouchut, 69003 Lyon, France',
      phone: '+33 4 56 78 90 12',
      hours: t('hours_2'),
      status: t('status_open'),
    },
    {
      id: 3,
      name: `${storeName} Marseille Vieux-Port`,
      address: 'Quai des Belges, 13001 Marseille, France',
      phone: '+33 4 91 23 45 67',
      hours: t('hours_3'),
      status: t('status_closing'),
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-8 md:py-12 font-sans">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
          <p className="text-gray-600 text-lg">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des magasins */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={t('search_placeholder')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition"
                />
                <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>

            <div className="h-[600px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {stores.map((store) => (
                <div key={store.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-orange-500 hover:shadow-md transition cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 group-hover:text-orange-700 transition">{store.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${store.status === t('status_open') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {store.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {store.address}
                  </p>
                  <div className="space-y-1.5 mb-4">
                    <p className="text-sm text-gray-500 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {store.phone}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {store.hours}
                    </p>
                  </div>
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded-lg transition text-sm">
                    {t('directions')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Carte */}
          <div className="lg:col-span-2 bg-gray-200 rounded-xl border border-gray-300 overflow-hidden h-[400px] lg:h-[700px] relative">
            {/* Generic Google Maps embed (Paris by default) */}
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1m3!1d83998.95410651817!2d2.2770200870366666!3d48.85883773942006!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e1f06e2b70f%3A0x40b82c3688c9460!2sParis%2C%20France!5e0!3m2!1sen!2sus!4v1693245028475!5m2!1sen!2sus" 
              className="w-full h-full border-0" 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title={`${storeName} Store Locations`}
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
