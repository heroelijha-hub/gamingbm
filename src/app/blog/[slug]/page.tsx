import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import BlogSidebar from '@/components/blog/BlogSidebar';
import CommentForm from '@/components/blog/CommentForm';
import { getRecentComments, getArticleBySlug } from '@/actions/blog';
import SafeHTML from '@/components/SafeHTML';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

import { Metadata } from 'next';
import { safeJsonLd } from '@/lib/security';
import { SITE_URL } from '@/lib/site';
import Image from "next/image";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  
  if (!article || !article.isPublished) {
    const t = await getTranslations('Blog');
    return { title: t('article_not_found') };
  }
  
  const description = article.metaDescription || article.excerpt || article.content.replace(/<[^>]*>?/gm, '').substring(0, 160);
  
  return {
    title: article.metaTitle || article.title,
    description: description,
    keywords: article.metaKeywords || undefined,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: article.metaTitle || article.title,
      description: description,
      images: article.image ? [{ url: article.image }] : [],
      type: 'article',
      publishedTime: article.createdAt.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.metaTitle || article.title,
      description: description,
      images: article.image ? [article.image] : [],
    }
  };
}
export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const t = await getTranslations('Blog');
  const locale = await getLocale();
  
  if (!article || !article.isPublished) {
    notFound();
  }

  const recentArticles = await prisma.article.findMany({
    where: { isPublished: true, id: { not: article.id } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, title: true, slug: true }
  });

  const recentComments = await getRecentComments(5);

  const relatedPosts = await prisma.article.findMany({
    where: { isPublished: true, id: { not: article.id } },
    orderBy: { createdAt: 'desc' },
    take: 2,
    include: { _count: { select: { comments: { where: { isApproved: true } } } } }
  });

  // Calculate next post
  const nextPost = await prisma.article.findFirst({
    where: { isPublished: true, createdAt: { gt: article.createdAt } },
    orderBy: { createdAt: 'asc' }
  });

  const baseUrl = SITE_URL;
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Top Kaminbrennstoffe';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription || article.excerpt || article.content.replace(/<[^>]*>?/gm, '').substring(0, 160),
    image: article.image || undefined,
    datePublished: article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: article.authorName || storeName,
    },
    publisher: {
      '@type': 'Organization',
      name: storeName,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${article.slug}`,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${baseUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `${baseUrl}/blog/${article.slug}`,
      },
    ],
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />
      <div className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="bg-white p-8 md:p-12 rounded-lg border border-gray-200 shadow-sm">
              
              {/* Header */}
              {article.category && (
                <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full mb-4">
                  {article.category}
                </span>
              )}
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {article.title}
              </h1>
              
              <div className="flex items-center text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100 flex-wrap gap-4">
                {article.authorName && (
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {t('by')} {article.authorName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {new Date(article.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  {t('comments_count', { count: article.comments.length })}
                </span>
              </div>

              {/* Cover Image */}
              {article.image && (
                <div className="w-full mb-8 rounded-xl overflow-hidden bg-gray-100 flex justify-center">
                  <Image width={800} height={800} src={article.image} alt={article.title} className="max-h-[500px] object-cover" />
                </div>
              )}

              {/* Rich Content */}
              <SafeHTML 
                html={article.content}
                className="prose prose-orange max-w-none w-full break-words overflow-hidden text-gray-700 leading-relaxed"
              />

              {/* Footer / Links */}
              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{t('share')}</span>
                    {/* Share placeholders */}
                    <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition">f</button>
                    <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition">t</button>
                    <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition">in</button>
                  </div>
                  
                  {nextPost && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('next_article')}</div>
                      <Link href={`/blog/${nextPost.slug}`} className="font-semibold text-gray-900 hover:text-orange-700 transition">
                        {nextPost.title}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{t('related_post')}</h3>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedPosts.map(post => (
                    <Link href={`/blog/${post.slug}`} key={post.id} className="bg-white p-6 rounded-lg border border-gray-200 group hover:border-orange-200 transition h-full flex flex-col">
                      {post.category && (
                        <div className="mb-3">
                          <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 text-[10px] uppercase font-bold rounded-full">
                            {post.category}
                          </span>
                        </div>
                      )}
                      <h4 className="font-bold text-gray-900 mb-3 group-hover:text-orange-700 transition line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2 flex-1 mb-4">
                        {post.excerpt || post.content.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...'}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 gap-4 mt-auto">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {new Date(post.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          {t('comments_count', { count: post._count.comments })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Comment Form */}
            <CommentForm articleId={article.id} />
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
