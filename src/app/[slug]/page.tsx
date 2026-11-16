import { notFound } from 'next/navigation';
import { getPageBySlug } from '@/actions/pages';
import SafeHTML from '@/components/SafeHTML';
import { getContactSettings } from '@/actions/contactSettings';
import ContactPageContent from '@/components/contact/ContactPageContent';
import { SITE_URL } from '@/lib/site';
import { safeJsonLd } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  const contactSettings = await getContactSettings();
  if (resolvedParams.slug === contactSettings.slug) {
    return {
      title: contactSettings.title,
      alternates: {
        canonical: `${SITE_URL}/${contactSettings.slug}`,
      },
    };
  }

  const { data: page } = await getPageBySlug(resolvedParams.slug);
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";

  if (!page || !page.isPublished) {
    return {
      title: `Page not found - ${storeName}`,
    };
  }

  const title = page.metaTitle ? page.metaTitle : `${page.title} - ${storeName}`;
  const description = page.metaDescription || undefined;
  const canonicalUrl = `${SITE_URL}/${page.slug}`;

  return {
    title,
    description,
    keywords: page.metaKeywords || undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: page.metaTitle || page.title,
      description,
      url: canonicalUrl,
      siteName: storeName,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  const contactSettings = await getContactSettings();
  if (resolvedParams.slug === contactSettings.slug) {
    return <ContactPageContent />;
  }

  const { data: page, success } = await getPageBySlug(resolvedParams.slug);

  if (!success || !page || !page.isPublished) {
    notFound();
  }

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";
  const canonicalUrl = `${SITE_URL}/${page.slug}`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Startseite',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.title,
        item: canonicalUrl,
      },
    ],
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    url: canonicalUrl,
    description: page.metaDescription || undefined,
    publisher: {
      '@type': 'Organization',
      name: storeName,
      url: SITE_URL,
    },
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(webPageSchema) }}
      />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">
        {/* Basic page header if needed, otherwise leave content free */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">{page.title}</h1>

        {/* Container for the custom page */}
        <div className="w-full">
          {/* Desktop Content */}
          <SafeHTML
            html={page.desktopContent || ''}
            className="hidden md:block w-full prose max-w-none"
          />

          {/* Mobile Content */}
          <SafeHTML
            html={page.mobileContent || (page.desktopContent || '')}
            className="block md:hidden w-full prose max-w-none"
          />
        </div>
      </main>
    </div>
  );
}
