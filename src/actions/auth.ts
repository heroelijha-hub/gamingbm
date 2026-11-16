'use server';

import crypto from 'crypto';
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

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !signInData.user) {
    return { error: 'Identifiants incorrects.' };
  }

  // Once authenticated with verified password/email:
  // Link prior guest orders if a guest customer record with this email exists in Prisma
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: signInData.user.email || email }
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: signInData.user.id,
          email: signInData.user.email || email,
          role: 'CUSTOMER'
        }
      });
    } else if (existingUser.id !== signInData.user.id && existingUser.role !== 'ADMIN' && Boolean(signInData.user.email_confirmed_at)) {
      // Safe transaction after verified credentials: link guest orders to registered account
      await prisma.$transaction([
        prisma.order.updateMany({ where: { userId: existingUser.id }, data: { userId: signInData.user.id } }),
        prisma.review.updateMany({ where: { userId: existingUser.id }, data: { userId: signInData.user.id } }),
        prisma.notification.updateMany({ where: { userId: existingUser.id }, data: { userId: signInData.user.id } }),
        prisma.user.delete({ where: { id: existingUser.id } }),
        prisma.user.create({
          data: {
            id: signInData.user.id,
            email: signInData.user.email || email,
            role: 'CUSTOMER'
          }
        })
      ]);
    }
  } catch (e) {
    console.error("[Login] Error syncing guest orders on verified login:", e);
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
      } else {
        // Un compte existe déjà. Ne JAMAIS supprimer ni écraser lors de l'inscription
        // pour empêcher tout déni de service admin ou vol de commandes invitées.
        // La liaison sécurisée s'effectue au login vérifié.
        console.warn(`[Register] User already exists in DB for ${email}. Deferring linking to verified login.`);
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
  const ip = await getClientIp();
  const rl = await checkRateLimit(`setup_admin_${ip}`, 3, 3600); // 3 attempts per hour
  if (!rl.success) {
    return { error: 'Trop de tentatives de configuration. Accès restreint.' };
  }

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'Tous les champs sont requis.' };
  }

  if (password.length < 12) {
    return { error: 'Le mot de passe administrateur doit comporter au moins 12 caractères.' };
  }

  const expectedSetupToken = process.env.SETUP_TOKEN;
  if (expectedSetupToken) {
    const providedToken = String(formData.get('setupToken') || '');
    const expectedHash = crypto.createHash('sha256').update(expectedSetupToken).digest();
    const providedHash = crypto.createHash('sha256').update(providedToken).digest();
    if (!providedToken || !crypto.timingSafeEqual(expectedHash, providedHash)) {
      return { error: 'Token d\'initialisation invalide ou manquant.' };
    }
  }

  // Check that there is no existing admin before calling Supabase
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount > 0) {
    return { error: 'Un administrateur existe déjà. L\'initialisation est verrouillée.' };
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
    console.error('[setupAdmin] Supabase error:', error.message);
    return { error: 'Erreur lors de la création du compte administrateur.' };
  }

  if (data.user) {
    // Re-verify inside a serializable transaction so concurrent signups cannot create multiple admins
    try {
      const createdUser = data.user;
      await prisma.$transaction(async (tx) => {
        const recheckCount = await tx.user.count({ where: { role: 'ADMIN' } });
        if (recheckCount > 0) {
          throw new Error('ADMIN_ALREADY_EXISTS');
        }
        await tx.user.upsert({
          where: { email: createdUser.email || email },
          update: { role: 'ADMIN', id: createdUser.id },
          create: {
            id: createdUser.id,
            email: createdUser.email || email,
            role: 'ADMIN',
          }
        });
      }, { isolationLevel: 'Serializable' });
    } catch (txErr: any) {
      if (txErr?.message === 'ADMIN_ALREADY_EXISTS') {
        return { error: 'Un administrateur a déjà été configuré.' };
      }
      throw txErr;
    }
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
