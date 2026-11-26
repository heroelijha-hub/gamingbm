'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireAdmin } from '@/lib/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// --- Client Actions ---

export async function submitReview(
  productId: string,
  rating: number,
  comment: string,
  reviewerName?: string,
  reviewerEmail?: string
) {
  let user: { id: string; email?: string } | null = null;
  try {
    user = await requireAuth();
  } catch {
    // Guest submission is permitted
  }

  if (!productId || !UUID_REGEX.test(productId)) {
    return { error: "Ungültige Produkt-ID." };
  }

  const intRating = Number(rating);
  if (!Number.isInteger(intRating) || intRating < 1 || intRating > 5) {
    return { error: "Die Bewertung muss zwischen 1 und 5 Sternen liegen." };
  }

  const cleanComment = String(comment || '').trim();
  if (cleanComment.length < 3 || cleanComment.length > 2000) {
    return { error: "Ihre Bewertung muss zwischen 3 und 2000 Zeichen lang sein." };
  }

  const cleanName = String(reviewerName || (user?.email ? user.email.split('@')[0] : '')).trim();
  if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
    return { error: "Bitte geben Sie einen gültigen Namen ein (mindestens 2 Zeichen)." };
  }

  const cleanEmail = String(reviewerEmail || user?.email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return { error: "Bitte geben Sie eine gültige E-Mail-Adresse ein." };
  }

  // Check product existence
  const product = await prisma.product.findUnique({
    where: { id: productId, isDeleted: false },
    select: { id: true, slug: true },
  });
  if (!product) {
    return { error: "Produkt nicht gefunden." };
  }

  // Prevent spamming multiple reviews on the same product within 5 minutes
  const spamConditions: any[] = [];
  if (user?.id) spamConditions.push({ userId: user.id });
  if (cleanEmail) spamConditions.push({ reviewerEmail: cleanEmail });

  if (spamConditions.length > 0) {
    const recentReview = await prisma.review.findFirst({
      where: {
        productId,
        OR: spamConditions,
        createdAt: { gte: new Date(Date.now() - 300_000) },
      },
    });
    if (recentReview) {
      return { error: "Sie haben kürzlich bereits eine Bewertung für dieses Produkt abgegeben." };
    }
  }

  try {
    await prisma.review.create({
      data: {
        productId,
        userId: user?.id || null,
        reviewerName: cleanName,
        reviewerEmail: cleanEmail,
        rating: intRating,
        comment: cleanComment,
        isApproved: false // Requires admin moderation by default
      }
    });

    if (product.slug) {
      revalidatePath(`/product/${product.slug}`, 'page');
    }
    revalidatePath(`/product/[slug]`, 'page');
    revalidatePath(`/admin/reviews`);
    if (user?.id) {
      revalidatePath(`/account/reviews`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'avis:", error);
    return { error: "Eine Fehler ist beim Speichern Ihrer Bewertung aufgetreten." };
  }
}

// --- Admin Actions ---

export async function toggleReviewApproval(reviewId: string, isApproved: boolean) {
  await requireAdmin();
  if (!reviewId || !UUID_REGEX.test(reviewId)) return;

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { isApproved: Boolean(isApproved) },
    include: { product: { select: { slug: true } } }
  });

  revalidatePath('/admin/reviews');
  if (review?.product?.slug) {
    revalidatePath(`/product/${review.product.slug}`, 'page');
  }
  revalidatePath(`/product/[slug]`, 'page');
}

export async function updateReview(reviewId: string, rating: number, comment: string, createdAtStr: string) {
  await requireAdmin();
  if (!reviewId || !UUID_REGEX.test(reviewId)) return;

  const intRating = Math.min(Math.max(1, Math.round(Number(rating) || 5)), 5);

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { 
      rating: intRating, 
      comment: String(comment || '').trim().slice(0, 5000),
      createdAt: new Date(createdAtStr)
    },
    include: { product: { select: { slug: true } } }
  });

  revalidatePath('/admin/reviews');
  if (review?.product?.slug) {
    revalidatePath(`/product/${review.product.slug}`, 'page');
  }
  revalidatePath(`/product/[slug]`, 'page');
}

export async function deleteReview(reviewId: string) {
  await requireAdmin();
  if (!reviewId || !UUID_REGEX.test(reviewId)) return;

  const review = await prisma.review.delete({
    where: { id: reviewId },
    include: { product: { select: { slug: true } } }
  });

  revalidatePath('/admin/reviews');
  if (review?.product?.slug) {
    revalidatePath(`/product/${review.product.slug}`, 'page');
  }
  revalidatePath(`/product/[slug]`, 'page');
}
