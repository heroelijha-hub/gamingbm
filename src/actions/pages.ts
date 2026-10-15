'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function getPages() {
  await requireAdmin();
  try {
    const pages = await prisma.page.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: pages };
  } catch (error: any) {
    console.error("Error fetching pages:", error);
    return { success: false, error: 'Erreur lors du chargement des pages.' };
  }
}

export async function getPage(id: string) {
  await requireAdmin();
  try {
    const page = await prisma.page.findUnique({
      where: { id }
    });
    if (!page) throw new Error("Page introuvable");
    return { success: true, data: page };
  } catch (error: any) {
    console.error("Error fetching page:", error);
    return { success: false, error: 'Page introuvable.' };
  }
}

export async function getPageBySlug(slug: string) {
  try {
    if (!slug || typeof slug !== 'string') return { success: true, data: null };
    const page = await prisma.page.findUnique({
      where: { slug }
    });
    if (!page || !page.isPublished) return { success: true, data: null };
    return { success: true, data: page };
  } catch (error: any) {
    console.error("Error fetching page by slug:", error);
    return { success: false, error: 'Erreur lors du chargement de la page.' };
  }
}

export async function createPage(data: {
  title: string;
  slug: string;
  desktopContent?: string;
  mobileContent?: string;
  isPublished?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}) {
  await requireAdmin();
  try {
    const newPage = await prisma.page.create({
      data: {
        title: data.title,
        slug: data.slug,
        desktopContent: data.desktopContent || '',
        mobileContent: data.mobileContent || '',
        isPublished: data.isPublished || false,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null,
      }
    });
    revalidatePath('/admin/pages');
    revalidatePath(`/${data.slug}`);
    return { success: true, data: newPage };
  } catch (error: any) {
    console.error("Error creating page:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePage(id: string, data: {
  title?: string;
  slug?: string;
  desktopContent?: string;
  mobileContent?: string;
  isPublished?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}) {
  await requireAdmin();
  try {
    const page = await prisma.page.update({
      where: { id },
      data
    });
    revalidatePath('/admin/pages');
    if (page.slug) {
      revalidatePath(`/${page.slug}`);
    }
    return { success: true, data: page };
  } catch (error: any) {
    console.error("Error updating page:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePage(id: string) {
  await requireAdmin();
  try {
    const page = await prisma.page.delete({
      where: { id }
    });
    revalidatePath('/admin/pages');
    if (page.slug) {
      revalidatePath(`/${page.slug}`);
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting page:", error);
    return { success: false, error: error.message };
  }
}
