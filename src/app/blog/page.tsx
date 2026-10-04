import Link from 'next/link';
import prisma from '@/lib/prisma';
import BlogSidebar from '@/components/blog/BlogSidebar';
import { getRecentComments } from '@/actions/blog';
import { getTranslations, getLocale } from 'next-intl/server';
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams.q || '';
  const t = await getTranslations('Blog');
  const locale = await getLocale();
  
  const articles = await prisma.article.findMany({
    where: {
      isPublished: true,
      ...(query ? { title: { contains: query, mode: 'insensitive' } } : {})
    },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { comments: { where: { isApproved: true } } } } }
  });

  const recentArticles = await prisma.article.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, title: true, slug: true }
  });

  const recentComments = await getRecentComments(5);

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 font-sans text-center">{t('title')}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content: Blog List */}
          <div className="lg:col-span-8 space-y-8">
            {articles.length === 0 ? (
              <div className="bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-500">
                {t('no_articles')}{query ? ` ${t('for')} "${query}"` : ''}.
              </div>
            ) : (
              articles.map(article => (
                <div key={article.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col md:flex-row h-full md:h-64 group">
                  <div className="md:w-2/5 h-48 md:h-full bg-gray-100 flex-shrink-0 relative overflow-hidden">
                    {article.image ? (
                       <Image width={800} height={800} src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">📝</div>
                    )}
                  </div>
                  <div className="p-6 md:w-3/5 flex flex-col">
                    {article.category && (
                      <div className="mb-2">
                        <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full">
                          {article.category}
                        </span>
                      </div>
                    )}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-orange-700 transition">
                      <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                    </h2>
                    <div className="flex items-center text-xs text-gray-500 mb-4 gap-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {new Date(article.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {t('comments_count', { count: article._count.comments })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                      {article.excerpt || article.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'}
                    </p>
                    <Link href={`/blog/${article.slug}`} className="inline-block mt-auto bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded transition self-start">
                      {t('read_more')}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <BlogSidebar recentArticles={recentArticles} recentComments={recentComments} />
          </div>

        </div>
      </div>
    </div>
  );
}
