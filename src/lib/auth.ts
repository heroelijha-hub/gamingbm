// Server-only authorization helpers (internal, not client-callable server actions)

import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

/**
 * Vérifie que l'utilisateur courant est authentifié et a le rôle ADMIN.
 * Lance une erreur si non autorisé — à utiliser dans toutes les server actions admin.
 * 
 * @returns L'utilisateur Prisma vérifié
 * @throws Error si non authentifié ou non admin
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    throw new Error('Unauthorized: You must be logged in.');
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
  });

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required.');
  }

  return user;
}

/**
 * Vérifie que l'utilisateur courant est authentifié (n'importe quel rôle).
 * 
 * @returns L'utilisateur Prisma vérifié
 * @throws Error si non authentifié
 */
export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    throw new Error('Unauthorized: You must be logged in.');
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
  });

  if (!user) {
    throw new Error('Unauthorized: User not found.');
  }

  return user;
}
