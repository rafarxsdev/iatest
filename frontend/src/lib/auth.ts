import type { User } from '@types/user';
import { apiFetch } from './api';

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
    const r = await apiFetch<User>('/api/auth/me', { method: 'GET' }, cookieHeader);
    if (!r.success) {
      return null;
    }
    const u = r.data;
    return {
      ...u,
      permissions: u.permissions ?? [],
    };
  } catch {
    return null;
  }
}
