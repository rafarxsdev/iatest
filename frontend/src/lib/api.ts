import type { Card } from '@types/card';
import type { Filter } from '@types/filter';
import type { InteractionStatus } from '@types/interaction';
import type { User } from '@types/user';

export type ApiSuccess<T> = { success: true; data: T; meta?: { total: number; page: number; limit: number } };
export type ApiFailure = { success: false; message: string; data?: unknown };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * URL base del API.
 * - SSR / middleware: siempre BACKEND_URL (servidor Astro → Express directo).
 * - Navegador: PUBLIC_BACKEND_URL si está definida; si no, cadena vacía = rutas relativas `/api/...`
 *   (mismo origen que Astro; requiere proxy en Vite en desarrollo).
 */
function backendBaseUrl(): string {
  if (typeof window === 'undefined') {
    const url =
      import.meta.env.BACKEND_URL ??
      import.meta.env.PUBLIC_BACKEND_URL ??
      'http://localhost:3000';
    return url.replace(/\/$/, '');
  }
  const pub = import.meta.env.PUBLIC_BACKEND_URL;
  if (pub !== undefined && String(pub).trim() !== '') {
    return String(pub).replace(/\/$/, '');
  }
  return '';
}

/** Construye URL absoluta para fetch en cliente (login, etc.). */
export function clientApiUrl(path: string): string {
  const base = backendBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base === '' ? p : `${base}${p}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  cookieHeader?: string,
): Promise<ApiResponse<T>> {
  const baseURL = backendBaseUrl();
  const url = `${baseURL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(options.headers);
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  if (!cookieHeader) {
    fetchOptions.credentials = 'include';
  }

  const res = await fetch(url, fetchOptions);

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    json = { success: false, message: 'Respuesta inválida del servidor' };
  }

  if (res.status === 401) {
    const msg = json.success === false ? json.message : 'No autorizado';
    if (typeof window !== 'undefined' && !url.includes('/api/auth/login')) {
      window.location.href = '/login';
    }
    throw new ApiHttpError(msg, 401);
  }

  return json;
}

export async function getFilters(cookieHeader?: string): Promise<Filter[]> {
  const r = await apiFetch<Filter[]>('/api/filters', { method: 'GET' }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

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

export async function postInteraction(
  cardId: string,
  payload?: Record<string, unknown>,
): Promise<InteractionStatus> {
  const r = await apiFetch<InteractionStatus>(`/api/interactions/${cardId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  });
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

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

export async function postLogin(email: string, password: string): Promise<{ user: User }> {
  const r = await apiFetch<{ user: User }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

export async function postLogout(): Promise<void> {
  const r = await apiFetch<null>('/api/auth/logout', { method: 'POST' });
  if (!r.success) {
    throw new Error(r.message);
  }
}
