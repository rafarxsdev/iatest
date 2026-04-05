import type { User } from '@types/user';
import { getMe } from './api';

/** Solo el rol `admin` puede abrir el panel de administración de cards (UI y SSR). */
export function canAccessAdminCards(user: User): boolean {
  return user.role === 'admin';
}

/**
 * Valida sesión vía GET /api/auth/me (cookie en SSR).
 * Si el endpoint no existe o falla (401, red, etc.), devuelve null.
 */
export async function getSession(cookieHeader: string): Promise<User | null> {
  try {
    const me = await getMe(cookieHeader);
    return {
      id: me.id,
      email: me.email,
      fullName: me.fullName,
      role: me.role.name,
    };
  } catch {
    return null;
  }
}
