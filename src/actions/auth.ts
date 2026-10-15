'use server';

import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function loginUser(formData: FormData) {
  const ip = await getClientIp();
  const rl = await checkRateLimit(`login_${ip}`, 5, 300); // 5 attempts per 5 mins
  if (!rl.success) {
    return { error: 'Trop de tentatives de connexion. Veuillez patienter 5 minutes.' };
  }

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'L\'email et le mot de passe sont requis.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Identifiants incorrects.' };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function registerUser(formData: FormData) {
  const ip = await getClientIp();
  const rl = await checkRateLimit(`register_${ip}`, 5, 1800); // 5 registrations per 30 mins
  if (!rl.success) {
    return { error: 'Trop de tentatives d’inscription. Veuillez patienter plus tard.' };
  }

  const username = String(formData.get('username') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password || !username) {
    return { error: 'Tous les champs sont requis.' };
  }

  if (password.length < 8) {
    return { error: 'Le mot de passe doit comporter au moins 8 caractères.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
      }
    }
  });

  if (error) {
    console.warn('[Register] Supabase signup error:', error.message);
    // Generic sanitized error to avoid account enumeration
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'Un compte existe déjà avec cette adresse e-mail ou les données sont invalides.' };
    }
    return { error: 'Erreur lors de l’inscription. Veuillez vérifier vos informations.' };
  }

  if (data.user) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.user.email || email }
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email || email,
            role: 'CUSTOMER'
          }
        });
      } else if (existingUser.id !== data.user.id) {
        // Link any prior guest orders/reviews/notifications to the registered Supabase ID
        await prisma.$transaction([
          prisma.order.updateMany({ where: { userId: existingUser.id }, data: { userId: data.user.id } }),
          prisma.review.updateMany({ where: { userId: existingUser.id }, data: { userId: data.user.id } }),
          prisma.notification.updateMany({ where: { userId: existingUser.id }, data: { userId: data.user.id } }),
          prisma.user.delete({ where: { id: existingUser.id } }),
          prisma.user.create({
            data: {
              id: data.user.id,
              email: data.user.email || email,
              role: existingUser.role || 'CUSTOMER',
            }
          })
        ]);
      }
    } catch (e) {
      console.error("Error syncing Prisma user on signup:", e);
    }
  }

  revalidatePath('/', 'layout');
  
  if (!data.session) {
    return { success: true, message: "Inscription réussie ! Veuillez vérifier vos e-mails pour confirmer votre compte avant de vous connecter." };
  }
  
  return { success: true };
}

export async function logoutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'global' });
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function setupAdmin(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'All fields are required.' };
  }

  // Check that there is no existing admin
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount > 0) {
    return { error: 'An administrator already exists. Setup is locked.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: 'Admin' }
    }
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await prisma.user.upsert({
      where: { email: data.user.email || email },
      update: { role: 'ADMIN', id: data.user.id },
      create: {
        id: data.user.id,
        email: data.user.email || email,
        role: 'ADMIN',
      }
    });
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function loginAdmin(formData: FormData) {
  const ip = await getClientIp();
  const rl = await checkRateLimit(`login_admin_${ip}`, 5, 900); // 5 attempts per 15 mins
  if (!rl.success) {
    return { error: 'Trop de tentatives de connexion administrateur. Accès temporairement suspendu.' };
  }

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'L\'email et le mot de passe sont requis.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Identifiants incorrects.' };
  }

  if (data.user) {
    const user = await prisma.user.findUnique({ where: { id: data.user.id } });
    if (!user || user.role !== 'ADMIN') {
      await supabase.auth.signOut({ scope: 'global' });
      return { error: 'Accès refusé. Vous n’êtes pas administrateur.' };
    }
  }

  revalidatePath('/admin', 'layout');
  return { success: true };
}

export async function getUserRole() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (dbUser) return dbUser.role;
    }
  } catch (e) {
    console.error("Error fetching user role", e);
  }
  return null;
}
