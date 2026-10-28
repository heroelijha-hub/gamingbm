import Hero from '@/components/home/Hero';
import BestDeals from '@/components/home/BestDeals';
import BestSeller from '@/components/home/BestSeller';
import LatestBlogs from '@/components/home/LatestBlogs';
import Newsletter from '@/components/home/Newsletter';
import PromoBanners from '@/components/home/PromoBanners';
import ProductGrid from '@/components/home/ProductGrid';
import FullWidthBanner from '@/components/home/FullWidthBanner';
import { getSettings } from '@/actions/settings';
import { SectionConfig, SectionType } from '@/app/admin/(dashboard)/landing/LandingForm';

export const revalidate = 3600; // Cache for 1 hour

export default async function Home() {
  const settings = await import('@/lib/cache').then(m => m.getCachedSettings());
  
  let layout: SectionConfig[] = [];
  try {
    if (settings.HOMEPAGE_LAYOUT) {
      layout = JSON.parse(settings.HOMEPAGE_LAYOUT);
    } else {
      layout = [
        { id: 'sec_1', type: 'Hero', name: 'Hero', enabled: true, settings: {} },
        { id: 'sec_2', type: 'BestDeals', name: 'Best Deals', enabled: true, settings: { title: "Today's Best Deals", countdown: '2026-12-31T23:59:59', filterType: 'ON_SALE' } },
        { id: 'sec_3', type: 'PromoBanners', name: 'Banners', enabled: false, settings: {} },
        { id: 'sec_4', type: 'BestSeller', name: 'Best Seller', enabled: true, settings: { title: "Best Seller", filterType: 'POPULAR' } },
        { id: 'sec_5', type: 'LatestBlogs', name: 'Blogs', enabled: true, settings: {} },
        { id: 'sec_6', type: 'Newsletter', name: 'Newsletter', enabled: false, settings: {} }
      ];
    }
  } catch (e) {
    console.error("Failed to parse HOMEPAGE_LAYOUT", e);
  }

  // Filter only enabled sections
  const activeSections = layout.filter(s => s.enabled);

  const renderSection = (section: SectionConfig) => {
    switch (section.type) {
      case 'Hero':
        return <Hero key={section.id} config={section.settings} />;
      case 'BestDeals':
        return <BestDeals key={section.id} config={section.settings} />;
      case 'BestSeller':
        return <BestSeller key={section.id} config={section.settings} />;
      case 'LatestBlogs':
        return <LatestBlogs key={section.id} config={section.settings} />;
      case 'Newsletter':
        return <Newsletter key={section.id} config={section.settings} />;
      case 'PromoBanners':
        return <PromoBanners key={section.id} config={section.settings} />;
      case 'ProductGrid':
        return <ProductGrid key={section.id} config={section.settings} />;
      case 'FullWidthBanner':
        return <FullWidthBanner key={section.id} config={section.settings} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main>
        {activeSections.map(renderSection)}
      </main>
    </div>
  );
}
