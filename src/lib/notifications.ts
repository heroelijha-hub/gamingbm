import prisma from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Internal (server-only) helper to create a notification.
 *
 * SECURITY: This lives in /lib (NOT in a 'use server' file) on purpose, so it is
 * never exposed as a callable Server Action. Previously anyone could create fake
 * admin notifications with arbitrary links (phishing vector).
 */
export async function createNotification({
  userId,
  guestId,
  isAdmin,
  type,
  message,
  link
}: {
  userId?: string;
  guestId?: string;
  isAdmin: boolean;
  type: NotificationType;
  message: string;
  link?: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      guestId,
      isAdmin,
      type,
      message,
      link,
    }
  });

  if (isAdmin) {
    revalidatePath('/admin');
  } else {
    revalidatePath('/');
  }

  return notification;
}
