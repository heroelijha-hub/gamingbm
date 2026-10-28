import Hero from '@/components/home/Hero';
import BestDeals from '@/components/home/BestDeals';
import BestSeller from '@/components/home/BestSeller';
import LatestBlogs from '@/components/home/LatestBlogs';
import Newsletter from '@/components/home/Newsletter';
import PromoBanners from '@/components/home/PromoBanners';
import ProductGrid from '@/components/home/ProductGrid';
import FullWidthBanner from '@/components/home/FullWidthBanner';
import { SectionConfig, SectionType } from '@/app/admin/(dashboard)/landing/LandingForm';
import PreviewSectionWrapper from '@/components/admin/PreviewSectionWrapper';
import { cookies } from 'next/headers';
import { getSettings } from '@/actions/settings';

import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PreviewPage() {
  const draftLayoutSetting = await prisma.setting.findUnique({ where: { key: 'PREVIEW_LAYOUT_DRAFT' } });
  const draftFontSetting = await prisma.setting.findUnique({ where: { key: 'PREVIEW_FONT_DRAFT' } });
  
  let layoutCookieStr = draftLayoutSetting?.value || '';
  // We can use the draft font if needed later
  
  let layout: SectionConfig[] = [];
  if (layoutCookieStr) {
    try {
      layout = JSON.parse(layoutCookieStr);
    } catch (e) {
      console.error(e);
    }
  } else {
    const settings = await getSettings();
    if (settings.HOMEPAGE_LAYOUT) {
      layout = JSON.parse(settings.HOMEPAGE_LAYOUT);
    }
  }

  const activeSections = layout.filter(s => s.enabled);

  const renderSection = (section: SectionConfig) => {
    let content = null;
    switch (section.type) {
      case 'Hero':
        content = <Hero config={section.settings} isPreview={true} sectionId={section.id} />;
        break;
      case 'BestDeals':
        content = <BestDeals config={section.settings} />;
        break;
      case 'BestSeller':
        content = <BestSeller config={section.settings} />;
        break;
      case 'LatestBlogs':
        content = <LatestBlogs config={section.settings} />;
        break;
      case 'Newsletter':
        content = <Newsletter config={section.settings} />;
        break;
      case 'PromoBanners':
        content = <PromoBanners config={section.settings} />;
        break;
      case 'ProductGrid':
        content = <ProductGrid config={section.settings} />;
        break;
      case 'FullWidthBanner':
        content = <FullWidthBanner config={section.settings} />;
        break;
      default:
        return null;
    }

    return (
      <PreviewSectionWrapper key={section.id} sectionId={section.id} sectionName={section.name || section.type}>
        {content}
      </PreviewSectionWrapper>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <main>
        {activeSections.length > 0 ? activeSections.map(renderSection) : (
          <div className="flex items-center justify-center h-64 text-gray-500">No active sections.</div>
        )}
      </main>
    </div>
  );
}
