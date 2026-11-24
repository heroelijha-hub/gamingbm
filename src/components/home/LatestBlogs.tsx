import Image from 'next/image';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getTranslations, getLocale } from 'next-intl/server';
import { getCachedSettings, ARTICLE_CARD_SELECT } from '@/lib/cache';

export default async function LatestBlogs({ config }: { config?: any }) {
  const displayMode = config?.displayMode || 'DATE_DESC';
  let articles: any[] = [];

  if (displayMode === 'MANUAL' && config?.manualIds) {
    const ids = config.manualIds.split(',').map((id: string) => id.trim()).filter(Boolean);
    if (ids.length > 0) {
      // Pour respecter l'ordre des ids, on fetch puis on trie en JS, ou on utilise IN
      const fetched = await prisma.article.findMany({
        where: { id: { in: ids }, isPublished: true },
        select: ARTICLE_CARD_SELECT
      });
      // Reorder according to manual order
      articles = ids.map((id: string) => fetched.find(a => a.id === id)).filter(Boolean);
    }
  } else {
    articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: displayMode === 'DATE_ASC' ? 'asc' : 'desc' },
      take: 4,
      select: ARTICLE_CARD_SELECT
    });
  }

  if (articles.length === 0) return null;

  const settings = { ...(await getCachedSettings()) };

  if (config) {
    Object.assign(settings, config);
  }

  const t = await getTranslations('Home');
  const locale = await getLocale();

  const getResponsiveVars = (baseKey: string, defaultSizes: { m: string, t: string, d: string }) => {
    return {
      '--sz-m': settings[`${baseKey}_SIZE_MOBILE`] || defaultSizes.m,
      '--sz-t': settings[`${baseKey}_SIZE_TABLET`] || defaultSizes.t,
      '--sz-d': settings[`${baseKey}_SIZE_DESKTOP`] || defaultSizes.d,
    } as React.CSSProperties;
  };

  return (
    <section className="max-w-7xl mx-auto px-4 w-full py-12 font-sans">

      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <h2
          className="font-bold text-gray-900 text-[length:var(--sz-m)] md:text-[length:var(--sz-t)] lg:text-[length:var(--sz-d)]"
          style={getResponsiveVars('title', { m: '20px', t: '24px', d: '24px' })}
        >
          {config?.title || t('latest_blogs_title')}
        </h2>
        {config?.SEE_ALL_TEXT !== '' && (
          <Link href="/blog" className="flex items-center text-sm font-semibold text-gray-900 hover:text-orange-600 transition text-[length:var(--sz-m)] md:text-[length:var(--sz-t)] lg:text-[length:var(--sz-d)]" style={getResponsiveVars('SEE_ALL_TEXT', { m: '14px', t: '14px', d: '14px' })}>
            {config?.SEE_ALL_TEXT || t('see_all')}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        )}
      </div>

      {/* Blogs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((blog) => (
          <Link href={`/blog/${blog.slug}`} key={blog.id} className="flex flex-col group cursor-pointer h-full">
            {/* Image Placeholder or Actual Image */}
            <div className={`w-full aspect-[4/3] rounded-xl mb-4 bg-gray-100 flex items-center justify-center overflow-hidden border`}>
              {blog.image ? (
                <Image src={blog.image} alt={blog.title} width={600} height={600} loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 250px" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              ) : (
                <div className="text-4xl text-gray-300">📝</div>
              )}
            </div>

            {/* Category Badge */}
            {blog.category && (
              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded">
                  {blog.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 leading-snug mb-3 group-hover:text-orange-600 transition line-clamp-2">
              {blog.title}
            </h3>

            {/* Metadata */}
            <div className="flex items-center text-sm text-gray-500 mt-auto">
              <span>{new Date(blog.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className="mx-2">/</span>
              <span>{t('comments', { count: blog._count.comments })}</span>
            </div>
          </Link>
        ))}
      </div>

    </section>
  );
}
