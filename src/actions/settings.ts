'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, updateTag } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

const SENSITIVE_KEYS = new Set([
  'STRIPE_SECRET_KEY',
  'PAYPAL_SECRET',
  'SMTP_PASS',
  'SMTP_PASSWORD',
  'CRON_SECRET',
  'SETUP_TOKEN',
]);

const PUBLIC_HIDDEN_KEYS = new Set([
  ...SENSITIVE_KEYS,
  'SMTP_HOST',
  'SMTP_USER',
  'CONTACT_RECEIVER_EMAIL',
  'SUPABASE_SERVICE_ROLE_KEY',
]);

function maskSecret(value: string): string {
  if (!value) return '';
  return value.length > 4 ? `••••${value.slice(-4)}` : '••••';
}

function isMaskedSecret(value: string): boolean {
  return /^••••.{0,4}$/.test(value);
}

/**
 * Fetch settings map.
 *
 * SECURITY: Unauthenticated callers never receive private operational settings or secrets.
 * Authenticated ADMIN callers receive masked placeholders for secret keys so raw credentials
 * are never serialized into browser RSC props.
 */
export async function getSettings() {
  const settings = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = {};

  let isAdmin = false;
  try {
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

  settings.forEach(s => {
    if (!isAdmin && PUBLIC_HIDDEN_KEYS.has(s.key)) {
      return;
    }
    settingsMap[s.key] = SENSITIVE_KEYS.has(s.key) ? maskSecret(s.value) : s.value;
  });

  return settingsMap;
}

export async function updateSetting(key: string, value: string) {
  await requireAdmin();
  try {
    if (SENSITIVE_KEYS.has(key) && isMaskedSecret(value)) {
      return { success: true };
    }
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
    const transactions = Object.entries(settingsMap)
      .filter(([key, value]) => !(SENSITIVE_KEYS.has(key) && isMaskedSecret(value)))
      .map(([key, value]) => {
        return prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      });

    if (transactions.length > 0) {
      await prisma.$transaction(transactions);
      revalidatePath('/', 'layout');
      updateTag('settings');
    }
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
