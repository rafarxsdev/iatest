import type { User } from '@types/user';
import { getMe } from './api';

/** Panel de cards en administración: `admin` o `operator` (permisos `admin.cards.*`). */
export function canAccessAdminCards(user: User): boolean {
  return user.role === 'admin' || user.role === 'operator';
}

/** Panel de filtros en administración: `admin` o `operator` (permiso `admin.filters.manage`). */
export function canAccessAdminFilters(user: User): boolean {
  return user.role === 'admin' || user.role === 'operator';
}

/** Secciones solo para `admin`: usuarios, interacciones, etc. */
export function canAccessSystemAdmin(user: User): boolean {
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
