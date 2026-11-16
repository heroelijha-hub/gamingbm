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
  
  const description = article.metaDescription || article.excerpt || article.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').substring(0, 160);
  
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
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Gaming BM';

  // Calculate reading time
  const textOnly = (article.content || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textOnly ? textOnly.split(' ').length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  // Extract Table of Contents from h2 tags
  const headingRegex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const toc: { id: string; text: string }[] = [];
  let hMatch;
  let tocIdx = 0;
  while ((hMatch = headingRegex.exec(article.content || '')) !== null) {
    const rawText = hMatch[1].replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
    if (rawText) {
      toc.push({ id: `section-${tocIdx++}`, text: rawText });
    }
  }

  let processedHtml = article.content || '';
  let insertIdx = 0;
  processedHtml = processedHtml.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attrs, inner) => {
    if (attrs.includes('id=')) return match;
    const id = `section-${insertIdx++}`;
    return `<h2 id="${id}"${attrs}>${inner}</h2>`;
  });

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription || article.excerpt || article.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').substring(0, 160),
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
        name: 'Startseite',
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {readingTimeMin} Min. Lesezeit
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  {t('comments_count', { count: article.comments.length })}
                </span>
              </div>

              {/* Cover Image */}
              {article.image && (
                <div className="w-full mb-8 rounded-xl overflow-hidden bg-gray-100 flex justify-center">
                  <Image width={800} height={800} src={article.image} alt={article.title} priority fetchPriority="high" className="max-h-[500px] object-cover" />
                </div>
              )}

              {/* Table of Contents */}
              {toc.length >= 2 && (
                <nav aria-label="Inhaltsverzeichnis" className="mb-8 p-6 bg-gradient-to-br from-orange-50/70 via-amber-50/30 to-white rounded-xl border border-orange-200/80 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-orange-900 font-bold text-sm tracking-wide uppercase">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                    Inhaltsverzeichnis
                  </div>
                  <ol className="space-y-2 text-sm">
                    {toc.map((item, idx) => (
                      <li key={item.id} className="flex items-baseline gap-2">
                        <span className="text-orange-600 font-semibold text-xs">{idx + 1}.</span>
                        <a href={`#${item.id}`} className="text-gray-700 hover:text-orange-600 hover:underline transition font-medium">
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              {/* Rich Content */}
              <SafeHTML 
                html={processedHtml}
                className="prose prose-orange max-w-none w-full overflow-hidden text-gray-700 leading-relaxed"
              />

              {/* Commercial CTA Banner */}
              <div className="my-10 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-xs font-semibold tracking-wider uppercase text-orange-100 bg-white/10 px-3 py-1 rounded-full inline-block">Gaming BM Spezialangebot</span>
                  <h3 className="text-xl md:text-2xl font-black">Möchten Sie Ihr Setup zum besten Preis aufrüsten?</h3>
                  <p className="text-sm text-orange-100 max-w-xl">
                    Entdecken Sie unsere Konsolen, High-End Gaming-PCs und zertifiziertes Zubehör mit schnellem Versand und 2 Jahren Herstellergarantie.
                  </p>
                </div>
                <Link 
                  href="/shop" 
                  className="px-6 py-3.5 bg-white text-orange-700 hover:bg-orange-50 font-bold text-sm rounded-xl shadow-md transition transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  Jetzt im Shop entdecken &rarr;
                </Link>
              </div>

              {/* Author E-E-A-T Box */}
              <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-inner">
                  {(article.authorName || 'GBM').substring(0, 2).toUpperCase()}
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h4 className="font-bold text-gray-900 text-base">{article.authorName || 'Gaming BM Redaktionsteam'}</h4>
                    <span className="text-[11px] bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full">Verifizierter Experte</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Spezialisten für Hardware, Next-Gen-Gaming und High-Tech-Ausrüstung. Unsere Kaufberater und Vergleichstests werden sorgfältig geprüft, um Ihnen die beste Hardware zum fairen Preis zu empfehlen.
                  </p>
                </div>
              </div>

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
                        {post.excerpt || post.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').substring(0, 100) + '...'}
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
