'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Fetch admin-only notifications.
 * Protected by requireAdmin().
 */
export async function getAdminNotifications() {
  await requireAdmin();
  return await prisma.notification.findMany({
    where: {
      isAdmin: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });
}

/**
 * Fetch customer/guest notifications.
 * Verifies that the caller can only read notifications belonging to themselves.
 */
export async function getUserNotifications(claimedUserId?: string, claimedGuestId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated, use their verified Supabase ID
  const effectiveUserId = user?.id || null;

  // Validate guestId format if present
  const validGuestId = claimedGuestId && UUID_REGEX.test(claimedGuestId) ? claimedGuestId : null;

  if (!effectiveUserId && !validGuestId) {
    return [];
  }

  const orConditions: any[] = [];
  if (effectiveUserId) {
    orConditions.push({ userId: effectiveUserId });
  }
  if (validGuestId) {
    orConditions.push({ guestId: validGuestId });
  }

  return await prisma.notification.findMany({
    where: {
      isAdmin: false,
      OR: orConditions,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });
}

/**
 * Mark a single notification as read.
 * Checks permissions so non-admins cannot mark admin notifications as read,
 * and users cannot mark others' notifications as read.
 */
export async function markAsRead(notificationId: string) {
  if (!notificationId || !UUID_REGEX.test(notificationId)) {
    return;
  }

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (notification.isAdmin) {
    // Only admins can mark admin notifications
    await requireAdmin();
  } else {
    // For user notifications, verify ownership if userId is set
    if (notification.userId && notification.userId !== user?.id) {
      // Allow if the caller is an admin
      let isAdmin = false;
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser?.role === 'ADMIN') isAdmin = true;
      }
      if (!isAdmin) {
        throw new Error('Forbidden: You can only modify your own notifications.');
      }
    }
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

/**
 * Mark all relevant notifications as read.
 */
export async function markAllAsRead(isAdmin: boolean, claimedUserId?: string, claimedGuestId?: string) {
  if (isAdmin) {
    await requireAdmin();
    await prisma.notification.updateMany({
      where: { isAdmin: true },
      data: { isRead: true },
    });
    return;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || null;
  const validGuestId = claimedGuestId && UUID_REGEX.test(claimedGuestId) ? claimedGuestId : null;

  if (!effectiveUserId && !validGuestId) return;

  const orConditions: any[] = [];
  if (effectiveUserId) orConditions.push({ userId: effectiveUserId });
  if (validGuestId) orConditions.push({ guestId: validGuestId });

  await prisma.notification.updateMany({
    where: {
      isAdmin: false,
      OR: orConditions,
    },
    data: { isRead: true },
  });
}
