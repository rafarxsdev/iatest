import type { User } from '@types/user';
import { apiFetch } from './api';

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
    return r.data;
  } catch {
    return null;
  }
}
