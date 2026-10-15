'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ARTICLES
export async function getArticles(publishedOnly = false) {
  if (!publishedOnly) {
    await requireAdmin();
  }
  return await prisma.article.findMany({
    where: publishedOnly ? { isPublished: true } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { comments: true }
      }
    }
  });
}

export async function getDistinctBlogCategories(): Promise<string[]> {
  const articles = await prisma.article.findMany({
    where: { category: { not: null }, isPublished: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' }
  });
  return articles.map(a => a.category).filter(Boolean) as string[];
}

export async function getDistinctBlogAuthors(): Promise<string[]> {
  const articles = await prisma.article.findMany({
    where: { authorName: { not: null }, isPublished: true },
    select: { authorName: true },
    distinct: ['authorName'],
    orderBy: { authorName: 'asc' }
  });
  return articles.map(a => a.authorName).filter(Boolean) as string[];
}

export async function getArticleBySlug(slug: string) {
  if (!slug || typeof slug !== 'string') return null;
  return await prisma.article.findUnique({
    where: { slug },
    include: {
      comments: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
}

export async function getArticleById(id: string) {
  await requireAdmin();
  if (!id || !UUID_REGEX.test(id)) return null;
  return await prisma.article.findUnique({
    where: { id }
  });
}

export async function createArticle(data: any) {
  await requireAdmin();
  try {
    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        image: data.image,
        category: data.category,
        authorName: data.authorName,
        isPublished: data.isPublished,
        tags: data.tags || [],
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null
      }
    });
    revalidatePath('/admin/blogs');
    revalidatePath('/blog');
    return { success: true, article };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateArticle(id: string, data: any) {
  await requireAdmin();
  try {
    const article = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        image: data.image,
        category: data.category,
        authorName: data.authorName,
        isPublished: data.isPublished,
        tags: data.tags || [],
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null
      }
    });
    revalidatePath('/admin/blogs');
    revalidatePath('/blog');
    revalidatePath(`/blog/${article.slug}`);
    return { success: true, article };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteArticle(id: string) {
  await requireAdmin();
  try {
    await prisma.article.delete({
      where: { id }
    });
    revalidatePath('/admin/blogs');
    revalidatePath('/blog');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function quickEditArticle(id: string, data: { title: string, slug: string, category: string, isPublished: boolean, createdAt: string }) {
  await requireAdmin();
  try {
    const article = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        category: data.category,
        isPublished: data.isPublished,
        createdAt: new Date(data.createdAt),
      }
    });
    revalidatePath('/admin/blogs');
    revalidatePath('/blog');
    revalidatePath(`/blog/${article.slug}`);
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { error: "Erreur lors de la modification rapide. Vérifiez que le slug est unique." };
  }
}

// COMMENTS
export async function addComment(articleId: string, data: any) {
  try {
    if (!articleId || !UUID_REGEX.test(articleId)) {
      return { error: 'Identifiant d’article invalide.' };
    }

    const ip = await getClientIp();
    const rateLimit = await checkRateLimit(`comment_${ip}`, 5, 600); // 5 comments per 10 mins
    if (!rateLimit.success) {
      return { error: 'Trop de commentaires envoyés. Veuillez patienter quelques minutes.' };
    }

    const author = String(data?.author || '').trim();
    const email = String(data?.email || '').trim().toLowerCase();
    const content = String(data?.content || '').trim();

    if (!author || author.length < 2 || author.length > 80) {
      return { error: 'Le nom doit comporter entre 2 et 80 caractères.' };
    }

    if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
      return { error: 'Adresse e-mail invalide.' };
    }

    if (!content || content.length < 3 || content.length > 2000) {
      return { error: 'Le commentaire doit comporter entre 3 et 2000 caractères.' };
    }

    // Verify article exists and is published
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, slug: true, isPublished: true },
    });

    if (!article || !article.isPublished) {
      return { error: 'Article introuvable.' };
    }

    await prisma.articleComment.create({
      data: {
        articleId,
        author,
        email,
        content,
        isApproved: false // Requires admin moderation
      }
    });

    revalidatePath(`/blog/${article.slug}`);
    return { success: true };
  } catch (error: any) {
    console.error('Comment submission error:', error);
    return { error: 'Une erreur est survenue lors de l’envoi de votre commentaire.' };
  }
}

export async function getRecentComments(take = 5) {
  const safeTake = Math.min(Math.max(1, Number(take) || 5), 20);
  return await prisma.articleComment.findMany({
    where: { isApproved: true },
    take: safeTake,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      author: true,
      createdAt: true,
      article: {
        select: { slug: true, title: true }
      }
    }
  });
}
