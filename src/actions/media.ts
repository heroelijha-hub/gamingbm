'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getMediaList(page = 1, limit = 24, search = '', mediaType = 'all', dateFilter = 'all') {
  await requireAdmin();
  const skip = (page - 1) * limit;

  let typeCondition = {};
  if (mediaType === 'images') {
    typeCondition = { OR: [{ url: { endsWith: '.jpg', mode: 'insensitive' as const } }, { url: { endsWith: '.jpeg', mode: 'insensitive' as const } }, { url: { endsWith: '.png', mode: 'insensitive' as const } }, { url: { endsWith: '.gif', mode: 'insensitive' as const } }, { url: { endsWith: '.webp', mode: 'insensitive' as const } }, { url: { endsWith: '.svg', mode: 'insensitive' as const } }] };
  } else if (mediaType === 'videos') {
    typeCondition = { OR: [{ url: { endsWith: '.mp4', mode: 'insensitive' as const } }, { url: { endsWith: '.webm', mode: 'insensitive' as const } }, { url: { endsWith: '.ogg', mode: 'insensitive' as const } }, { url: { endsWith: '.mov', mode: 'insensitive' as const } }] };
  } else if (mediaType === 'documents') {
    typeCondition = { OR: [{ url: { endsWith: '.pdf', mode: 'insensitive' as const } }, { url: { endsWith: '.doc', mode: 'insensitive' as const } }, { url: { endsWith: '.docx', mode: 'insensitive' as const } }, { url: { endsWith: '.xls', mode: 'insensitive' as const } }, { url: { endsWith: '.xlsx', mode: 'insensitive' as const } }] };
  } else if (mediaType === 'audios') {
    typeCondition = { OR: [{ url: { endsWith: '.mp3', mode: 'insensitive' as const } }, { url: { endsWith: '.wav', mode: 'insensitive' as const } }] };
  }

  let dateCondition = {};
  if (dateFilter !== 'all') {
    const now = new Date();
    let startDate = new Date();
    if (dateFilter === 'last_30_days') {
      startDate.setDate(now.getDate() - 30);
    } else if (dateFilter === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (dateFilter === 'last_year') {
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      const endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      dateCondition = { createdAt: { gte: startDate, lte: endDate } };
    }
    
    if (dateFilter !== 'last_year') {
      dateCondition = { createdAt: { gte: startDate } };
    }
  }

  const baseWhere = { isDeleted: false, ...typeCondition, ...dateCondition };

  const where: any = search
    ? {
        ...baseWhere,
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { altText: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : baseWhere;

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.media.count({ where }),
  ]);

  return { items, total, totalPages: Math.ceil(total / limit) };
}

export async function getMediaByUrl(url: string) {
  return await prisma.media.findUnique({
    where: { url },
  });
}

export async function updateMediaAction(id: string, data: { title?: string; altText?: string; description?: string; legend?: string; link?: string }) {
  await requireAdmin();
  
  try {
    const updated = await prisma.media.update({
      where: { id },
      data,
    });
    revalidatePath('/admin/media');
    return { success: true, media: updated };
  } catch (error: any) {
    console.error('Error updating media:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du média' };
  }
}

export async function deleteMediaAction(id: string) {
  await requireAdmin();
  
  try {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return { success: false, error: 'Média introuvable' };

    await prisma.media.update({ 
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    revalidatePath('/admin/media');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting media:', error);
    return { success: false, error: 'Erreur lors de la suppression du média' };
  }
}

export async function deleteMultipleMediaAction(ids: string[]) {
  await requireAdmin();
  
  try {
    await prisma.media.updateMany({ 
      where: { id: { in: ids } },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    revalidatePath('/admin/media');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting multiple media:', error);
    return { success: false, error: 'Erreur lors de la suppression des médias' };
  }
}

export async function uploadMediaAction(formData: FormData) {
  await requireAdmin();
  
  try {
    const file = formData.get('file') as File;
    if (!file) return { error: 'Aucun fichier fourni' };

    const ALLOWED_MIME_TYPES = new Set([
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'application/pdf'
    ]);
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return { error: 'Type de fichier non autorisé. Formats acceptés : images, vidéos web et PDF.' };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { error: 'Fichier trop volumineux (max 10 Mo).' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const secureUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'topkaminbrennstoffe/media' },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result.secure_url);
        }
      ).end(buffer);
    });

    // Create media entry
    const media = await prisma.media.create({
      data: {
        url: secureUrl,
        title: file.name,
      }
    });

    revalidatePath('/admin/media');
    return { success: true, url: secureUrl, media };
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return { error: 'Erreur lors de l\'upload' };
  }
}
