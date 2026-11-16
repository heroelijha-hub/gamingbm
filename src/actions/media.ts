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

async function uploadBufferToCloudinary(buffer: Buffer, mimeType: string): Promise<string> {
  const options: any = {
    folder: 'topkaminbrennstoffe/media',
    resource_type: 'auto',
  };

  if (mimeType.startsWith('image/') && mimeType !== 'image/svg+xml' && mimeType !== 'image/gif') {
    options.format = 'webp';
    options.transformation = [{ width: 1600, crop: 'limit', quality: 'auto:good' }];
  }

  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error || !result) reject(error);
        else resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

const ALLOWED_MEDIA_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  'application/pdf'
]);

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function validateMediaBuffer(buffer: Buffer, mimeType: string): string | null {
  if (buffer.length === 0) return 'Fichier vide.';

  switch (mimeType) {
    case 'image/jpeg':
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
        ? null : 'Signature JPEG invalide.';
    case 'image/png':
      return buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_MAGIC)
        ? null : 'Signature PNG invalide.';
    case 'image/gif': {
      const head = buffer.subarray(0, 6).toString('ascii');
      return head === 'GIF87a' || head === 'GIF89a' ? null : 'Signature GIF invalide.';
    }
    case 'image/webp':
      return buffer.length >= 12 &&
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
        ? null : 'Signature WebP invalide.';
    case 'application/pdf':
      return buffer.subarray(0, 5).toString('ascii') === '%PDF-' ? null : 'Signature PDF invalide.';
    case 'video/webm':
      return buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3
        ? null : 'Signature WebM invalide.';
    case 'video/ogg':
      return buffer.subarray(0, 4).toString('ascii') === 'OggS' ? null : 'Signature Ogg invalide.';
    case 'video/mp4':
    case 'video/quicktime':
      return buffer.length >= 8 && buffer.subarray(4, 8).toString('ascii') === 'ftyp'
        ? null : 'Signature vidéo MP4/MOV invalide.';
    case 'image/svg+xml': {
      const svgText = buffer.toString('utf8');
      if (!/<svg[\s>]/i.test(svgText)) return 'Contenu SVG invalide.';
      if (/<script\b|<foreignObject\b|<iframe\b|javascript:|vbscript:|data:text\/html|\bon[a-z]+\s*=/i.test(svgText)) {
        return 'SVG rejeté : contenu actif ou script interdit.';
      }
      return null;
    }
    default:
      return 'Type de fichier non supporté.';
  }
}

async function processAndCreateMedia(file: File): Promise<{ url: string; media: any }> {
  if (!ALLOWED_MEDIA_MIME_TYPES.has(file.type)) {
    throw new Error('Type de fichier non autorisé. Formats acceptés : images, vidéos web et PDF.');
  }
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
    throw new Error('Taille de fichier invalide (max 10 Mo).');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const magicErr = validateMediaBuffer(buffer, file.type);
  if (magicErr) {
    throw new Error(magicErr);
  }

  const secureUrl = await uploadBufferToCloudinary(buffer, file.type);
  const safeTitle = String(file.name || 'media').slice(0, 200);
  const media = await prisma.media.create({
    data: {
      url: secureUrl,
      title: safeTitle,
    }
  });
  return { url: secureUrl, media };
}

export async function uploadMediaAction(formData: FormData) {
  await requireAdmin();
  
  try {
    const file = formData.get('file') as File;
    if (!file) return { error: 'Aucun fichier fourni' };

    const { url, media } = await processAndCreateMedia(file);

    revalidatePath('/admin/media');
    return { success: true, url, media };
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return { error: error?.message || 'Erreur lors de l\'upload' };
  }
}

export async function uploadMultipleMediaAction(formData: FormData) {
  await requireAdmin();
  
  try {
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;
    const allFiles = files && files.length > 0 ? files : (singleFile ? [singleFile] : []);

    if (allFiles.length === 0) return { error: 'Aucun fichier fourni' };
    if (allFiles.length > 30) return { error: 'Maximum 30 fichiers par envoi.' };

    const results: Array<{ url: string; media: any }> = [];
    const errors: string[] = [];

    for (const file of allFiles) {
      try {
        const uploaded = await processAndCreateMedia(file);
        results.push(uploaded);
      } catch (err: any) {
        console.error(`Error uploading ${file.name}:`, err);
        errors.push(`${file.name}: ${err?.message || 'Échec du téléversement.'}`);
      }
    }

    if (results.length > 0) {
      revalidatePath('/admin/media');
    }

    return { 
      success: results.length > 0, 
      urls: results.map(r => r.url),
      items: results,
      errors: errors.length > 0 ? errors : undefined 
    };
  } catch (error: any) {
    console.error('Error uploading multiple media:', error);
    return { error: 'Erreur lors du téléversement' };
  }
}

