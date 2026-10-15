'use server';

import prisma from '@/lib/prisma';
import { ChatSender, ChatSessionStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

// UUID validation helper
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;

// Client actions
export async function getOrCreateSession(guestId: string, guestName?: string, guestEmail?: string) {
  // Validate guestId format
  if (!guestId || !UUID_REGEX.test(guestId)) {
    throw new Error('Invalid guest identifier.');
  }

  // Validate optional fields
  if (guestName && guestName.length > MAX_NAME_LENGTH) {
    throw new Error('Name is too long.');
  }
  if (guestEmail && (guestEmail.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))) {
    throw new Error('Invalid email format.');
  }

  let session = await prisma.chatSession.findFirst({
    where: { guestId, status: 'OPEN' },
  });

  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        guestId,
        guestName: guestName?.slice(0, MAX_NAME_LENGTH),
        guestEmail: guestEmail?.slice(0, MAX_EMAIL_LENGTH),
        status: 'OPEN',
      },
    });
  }

  return session;
}

/**
 * Internal helper (NOT exported => not callable from the browser).
 */
async function createChatMessage(sessionId: string, sender: ChatSender, content: string) {
  // Validate content
  if (!content || content.trim().length === 0) {
    throw new Error('Message cannot be empty.');
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`);
  }

  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      sender,
      content: content.trim(),
    },
  });
  
  // Update session updatedAt to bring it to top
  const updatedSession = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  // Create notification
  const { createNotification } = await import('@/lib/notifications');
  if (sender === ChatSender.CUSTOMER) {
    // Notify Admin via Email
    try {
      const allSettings = await prisma.setting.findMany({
        where: { key: { in: ['CONTACT_RECEIVER_EMAIL'] } }
      });
      const settingsMap = allSettings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
      const adminEmail = settingsMap['CONTACT_RECEIVER_EMAIL'] || 'admin@mystore.com';
      const storeUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.topkaminbrennstoffe.com';
      
      const { sendAdminNewChatMessageEmail } = await import('@/lib/mailer');
      sendAdminNewChatMessageEmail(
        updatedSession.guestName || 'Visiteur',
        updatedSession.guestEmail,
        content.trim(),
        adminEmail,
        storeUrl
      ).catch(e => console.error('Chat admin email failed', e));
    } catch (e) {
      console.error('Failed to send chat email', e);
    }

    // Notify Admin via push notification
    await createNotification({
      isAdmin: true,
      type: 'CHAT',
      message: JSON.stringify({ key: 'new_chat_from', name: updatedSession.guestName || 'Visiteur' }),
      link: '/admin/chat',
    });
  } else {
    // Notify Customer
    await createNotification({
      isAdmin: false,
      guestId: updatedSession.guestId,
      type: 'CHAT',
      message: JSON.stringify({ key: 'new_support_message' }),
    });
  }

  revalidatePath('/admin/chat');
  return message;
}

/**
 * Verify that the chat session exists AND belongs to the given guest.
 */
async function getOwnedSession(sessionId: string, guestId: string) {
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    throw new Error('Invalid session identifier.');
  }
  if (!guestId || !UUID_REGEX.test(guestId)) {
    throw new Error('Invalid guest identifier.');
  }
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session || session.guestId !== guestId) {
    throw new Error('Chat session not found.');
  }
  return session;
}

/**
 * Customer sends a message. The sender is ALWAYS forced to CUSTOMER
 * (previously the client could choose ADMIN and impersonate support).
 */
export async function sendMessage(sessionId: string, guestId: string, content: string) {
  const rl = await checkRateLimit(`chat_${guestId}`, 10, 60); // 10 messages per min
  if (!rl.success) {
    throw new Error('Too many messages sent. Please wait a moment.');
  }

  await getOwnedSession(sessionId, guestId);
  return createChatMessage(sessionId, ChatSender.CUSTOMER, content);
}

/**
 * Customer reads the messages of their OWN session only.
 */
export async function getSessionMessages(sessionId: string, guestId: string) {
  await getOwnedSession(sessionId, guestId);

  return await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
}

// Admin actions
export async function sendAdminMessage(sessionId: string, content: string) {
  await requireAdmin();
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    throw new Error('Invalid session identifier.');
  }
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw new Error('Chat session not found.');
  }
  return createChatMessage(sessionId, ChatSender.ADMIN, content);
}

export async function getAdminSessionMessages(sessionId: string) {
  await requireAdmin();
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    throw new Error('Invalid session identifier.');
  }
  return await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
}

// Admin actions
export async function getAdminSessions() {
  await requireAdmin();
  return await prisma.chatSession.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1, // Get last message for preview
      },
    },
  });
}

export async function closeSession(sessionId: string) {
  await requireAdmin();
  // Validate sessionId format
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    throw new Error('Invalid session identifier.');
  }
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: 'CLOSED' },
  });
  revalidatePath('/admin/chat');
}

