import type { InteractionStatus } from '@types/interaction';
import type { ApiResponse } from './api-base';
import { backendBaseUrl } from './api-base';

export type PostInteractionHandledResult =
  | { type: 'success'; data: InteractionStatus }
  | { type: 'blocked'; data: InteractionStatus }
  | { type: 'failed'; message: string; httpStatus: number };

/**
 * POST /api/interactions/:cardId desde el cliente.
 * No lanza en 403 (límite): devuelve { type: 'blocked', data }.
 * 401: redirige a login y devuelve failed.
 */
export async function postInteractionHandled(
  cardId: string,
  payload?: Record<string, unknown>,
): Promise<PostInteractionHandledResult> {
  const baseURL = backendBaseUrl();
  const url =
    baseURL === ''
      ? `/api/interactions/${cardId}`
      : `${baseURL}/api/interactions/${cardId}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload ?? {}),
  });

  let json: ApiResponse<InteractionStatus>;
  try {
    json = (await res.json()) as ApiResponse<InteractionStatus>;
  } catch {
    return { type: 'failed', message: 'Respuesta inválida del servidor', httpStatus: res.status };
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined' && !url.includes('/api/auth/login')) {
      window.location.href = '/login';
    }
    return { type: 'failed', message: 'No autorizado', httpStatus: 401 };
  }

  if (res.status === 200 && json.success) {
    return { type: 'success', data: json.data };
  }

  if (res.status === 403 && json.success === false && json.data !== undefined && json.data !== null) {
    const data = normalizeInteractionPayload(json.data);
    if (data) {
      return { type: 'blocked', data };
    }
  }

  const message = json.success === false ? json.message : 'Error al registrar la interacción';
  return { type: 'failed', message, httpStatus: res.status };
}

function normalizeInteractionPayload(raw: unknown): InteractionStatus | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (
    typeof o.used !== 'number' ||
    typeof o.limit !== 'number' ||
    typeof o.remaining !== 'number' ||
    typeof o.isBlocked !== 'boolean'
  ) {
    return null;
  }
  return {
    used: o.used,
    limit: o.limit,
    remaining: o.remaining,
    isBlocked: o.isBlocked,
    lastInteractionAt: typeof o.lastInteractionAt === 'string' ? o.lastInteractionAt : undefined,
  };
}
