import type { Card } from '@types/card';
import { apiFetch } from './api-base';

/** GET /api/cards — solo dependencias ligeras (islas React del dashboard). */
export async function getCards(
  params: { filterId?: string; page?: number; limit?: number },
  cookieHeader?: string,
): Promise<{ data: Card[]; meta: { total: number; page: number; limit: number } }> {
  const q = new URLSearchParams();
  if (params.filterId) {
    q.set('filterId', params.filterId);
  }
  if (params.page !== undefined) {
    q.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    q.set('limit', String(params.limit));
  }
  const qs = q.toString();
  const path = qs ? `/api/cards?${qs}` : '/api/cards';
  const r = await apiFetch<Card[]>(path, { method: 'GET' }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  if (!r.meta) {
    throw new Error('Respuesta de cards sin meta');
  }
  return { data: r.data, meta: r.meta };
}
