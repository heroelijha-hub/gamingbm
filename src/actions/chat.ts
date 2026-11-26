'use server';

import prisma from '@/lib/prisma';
import { ChatSender, ChatSessionStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    // SECURITY: the guestId is client-chosen, so limit session creation per IP
    const ip = await getClientIp();
    const rlIp = await checkRateLimit(`chat_session_ip_${ip}`, 5, 3600); // 5 new sessions / hour / IP
    if (!rlIp.success) {
      throw new Error('Too many chat sessions created. Please try again later.');
    }

    session = await prisma.chatSession.create({
      data: {
        guestId,
        guestName: guestName?.slice(0, MAX_NAME_LENGTH),
        guestEmail: guestEmail?.slice(0, MAX_EMAIL_LENGTH),
        status: 'OPEN',
      },
    });

    try {
      const { createNotification } = await import('@/lib/notifications');
      await createNotification({
        isAdmin: true,
        type: 'CHAT',
        message: JSON.stringify({ key: 'new_chat_from', name: session.guestName || 'Visiteur' }),
        link: '/admin/chat',
      });
    } catch (e) {
      console.error('Chat session notif error', e);
    }
  }

  return session;
}

/**
 * Internal helper (NOT exported => not callable from the browser).
 */
async function createChatMessage(sessionId: string, sender: ChatSender, content: string, imageUrl?: string) {
  const trimmed = content ? content.trim() : '';
  if (!trimmed && !imageUrl) {
    throw new Error('Message cannot be empty.');
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`);
  }

  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      sender,
      content: trimmed,
      imageUrl: imageUrl || null,
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
      const adminEmail = settingsMap['CONTACT_RECEIVER_EMAIL'] || 'info@gamingbm.com';
      const storeUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.gamingbm.com';
      
      const { sendAdminNewChatMessageEmail } = await import('@/lib/mailer');
      sendAdminNewChatMessageEmail(
        updatedSession.guestName || 'Visiteur',
        updatedSession.guestEmail,
        trimmed || (imageUrl ? '📷 [Image partagée]' : ''),
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
 * Customer sends a message (text and/or image).
 */
export async function sendMessage(sessionId: string, guestId: string, content: string, imageUrl?: string) {
  const rl = await checkRateLimit(`chat_${guestId}`, 15, 60); // 15 messages per min
  if (!rl.success) {
    throw new Error('Too many messages sent. Please wait a moment.');
  }

  const ip = await getClientIp();
  const rlIp = await checkRateLimit(`chat_msg_ip_${ip}`, 40, 3600); // 40 messages / hour / IP
  if (!rlIp.success) {
    throw new Error('Too many messages sent. Please try again later.');
  }

  const session = await getOwnedSession(sessionId, guestId);

  if (imageUrl && !session.allowCustomerImages) {
    throw new Error("L'envoi d'images n'est pas autorisé par l'administrateur.");
  }

  return createChatMessage(sessionId, ChatSender.CUSTOMER, content, imageUrl);
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

/**
 * Returns session details + messages for the customer widget
 */
export async function getChatSessionDetails(sessionId: string, guestId: string) {
  const session = await getOwnedSession(sessionId, guestId);
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
  return {
    session: {
      id: session.id,
      guestId: session.guestId,
      guestName: session.guestName,
      status: session.status,
      allowCustomerImages: session.allowCustomerImages,
    },
    messages,
  };
}

// Admin actions
export async function sendAdminMessage(sessionId: string, content: string, imageUrl?: string) {
  await requireAdmin();
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    throw new Error('Invalid session identifier.');
  }
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw new Error('Chat session not found.');
  }
  return createChatMessage(sessionId, ChatSender.ADMIN, content, imageUrl);
}

export async function toggleSessionCustomerImages(sessionId: string, allow: boolean) {
  await requireAdmin();
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    throw new Error('Invalid session identifier.');
  }
  const updated = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { allowCustomerImages: allow },
  });
  revalidatePath('/admin/chat');
  return updated;
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
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    throw new Error('Invalid session identifier.');
  }
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: 'CLOSED' },
  });
  revalidatePath('/admin/chat');
}

export async function deleteSession(sessionId: string) {
  await requireAdmin();
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    throw new Error('Invalid session identifier.');
  }
  await prisma.chatSession.delete({
    where: { id: sessionId },
  });
  revalidatePath('/admin/chat');
}

/**
 * Upload an image for the chat (Admin or authorized Customer).
 */
export async function uploadChatImage(formData: FormData, sessionId: string, guestId?: string): Promise<{ url: string }> {
  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('Aucun fichier fourni.');
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error('Format de fichier non supporté. Veuillez envoyer une image (JPEG, PNG, WebP, GIF).');
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("L'image dépasse la taille maximale autorisée (5 Mo).");
  }

  if (guestId) {
    const session = await getOwnedSession(sessionId, guestId);
    if (!session.allowCustomerImages) {
      throw new Error("L'administrateur n'a pas autorisé l'envoi d'images pour cette conversation.");
    }
    const ip = await getClientIp();
    const rlIp = await checkRateLimit(`chat_img_ip_${ip}`, 10, 3600); // 10 uploads / hour / IP
    if (!rlIp.success) {
      throw new Error("Limite d'envoi d'images atteinte. Veuillez réessayer plus tard.");
    }
  } else {
    await requireAdmin();
    if (!sessionId || !UUID_REGEX.test(sessionId)) {
      throw new Error('Invalid session identifier.');
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<{ url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'gamingbm/chat',
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          console.error("Erreur d'upload Cloudinary:", error);
          reject(new Error("Erreur lors de l'hébergement de l'image."));
        } else {
          resolve({ url: result.secure_url });
        }
      }
    ).end(buffer);
  });
}
