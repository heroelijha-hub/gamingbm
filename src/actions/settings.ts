'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, updateTag } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

const SENSITIVE_KEYS = new Set([
  'STRIPE_SECRET_KEY',
  'PAYPAL_SECRET',
  'SMTP_PASS',
]);

/**
 * Fetch settings map.
 *
 * SECURITY: If called without an active ADMIN session, sensitive credentials
 * (Stripe Secret Key, PayPal Secret, SMTP Password) are stripped to prevent
 * unauthorized extraction through Next.js Server Action RPCs.
 */
export async function getSettings() {
  const settings = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = {};
  
  let isAdmin = false;
  try {
    const { requireAdmin } = await import('@/lib/auth');
    await requireAdmin();
    isAdmin = true;
  } catch {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser?.role === 'ADMIN') {
          isAdmin = true;
        }
      }
    } catch {
      isAdmin = false;
    }
  }

  // Liste des clés secrètes à ne jamais exposer au public
  const hiddenKeys = ['STRIPE_SECRET_KEY', 'PAYPAL_SECRET', 'CRON_SECRET', 'SMTP_PASSWORD', 'SMTP_PASS'];

  settings.forEach(s => {
    // Si l'utilisateur est admin, on envoie tout. Sinon, on filtre les clés secrètes.
    if (isAdmin || (!hiddenKeys.includes(s.key) && !SENSITIVE_KEYS.has(s.key))) {
      settingsMap[s.key] = s.value;
    }
  });

  return settingsMap;
}

export async function updateSetting(key: string, value: string) {
  await requireAdmin();
  try {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    revalidatePath('/', 'layout');
    updateTag('settings');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSettingsBatch(settingsMap: Record<string, string>) {
  await requireAdmin();
  try {
    const transactions = Object.entries(settingsMap).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    });
    
    await prisma.$transaction(transactions);
    revalidatePath('/', 'layout');
    updateTag('settings');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
