import type { AdminCard, Card, CardFormData } from '@types/card';
import type { AdminFilter, Filter, FilterFormData, FilterType, WidgetTypeOption } from '@types/filter';
import type { InteractionStatus } from '@types/interaction';
import type {
  AdminUser,
  AuthMeUser,
  ProfileFormData,
  User,
  UserFormData,
  UserRole,
  UserSecurityStatus,
} from '@types/user';

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

export async function getAdminCards(
  params: { page?: number; limit?: number; search?: string },
  cookieHeader?: string,
): Promise<{ data: AdminCard[]; meta: { total: number; page: number; limit: number } }> {
  const q = new URLSearchParams();
  if (params.page !== undefined) {
    q.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    q.set('limit', String(params.limit));
  }
  if (params.search !== undefined && params.search.length > 0) {
    q.set('search', params.search);
  }
  const qs = q.toString();
  const path = qs ? `/api/admin/cards?${qs}` : '/api/admin/cards';
  const r = await apiFetch<AdminCard[]>(path, { method: 'GET' }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  if (!r.meta) {
    throw new Error('Respuesta de cards admin sin meta');
  }
  return { data: r.data, meta: r.meta };
}

export async function getWidgetTypes(cookieHeader?: string): Promise<WidgetTypeOption[]> {
  const r = await apiFetch<WidgetTypeOption[]>('/api/admin/widget-types', { method: 'GET' }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

export async function createCard(data: CardFormData): Promise<AdminCard> {
  const body = {
    title: data.title,
    htmlContent: data.htmlContent,
    filterId: data.filterId,
    widgetTypeId: data.widgetTypeId,
    widgetConfiguration: data.widgetConfiguration,
    sortOrder: data.sortOrder,
  };
  const r = await apiFetch<AdminCard>('/api/admin/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

export async function updateCard(id: string, data: Partial<CardFormData>): Promise<AdminCard> {
  const r = await apiFetch<AdminCard>(`/api/admin/cards/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

export async function deleteCard(id: string): Promise<void> {
  const r = await apiFetch<null>(`/api/admin/cards/${id}`, { method: 'DELETE' });
  if (!r.success) {
    throw new Error(r.message);
  }
}

export async function restoreCard(id: string): Promise<void> {
  const r = await apiFetch<AdminCard>(`/api/admin/cards/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deletedAt: null }),
  });
  if (!r.success) {
    throw new Error(r.message);
  }
}

export async function getAdminFilters(
  params: { page?: number; limit?: number; search?: string },
  cookieHeader?: string,
): Promise<{ data: AdminFilter[]; meta: { total: number; page: number; limit: number } }> {
  const q = new URLSearchParams();
  if (params.page !== undefined) {
    q.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    q.set('limit', String(params.limit));
  }
  if (params.search !== undefined && params.search.length > 0) {
    q.set('search', params.search);
  }
  const qs = q.toString();
  const path = qs ? `/api/admin/filters?${qs}` : '/api/admin/filters';
  const r = await apiFetch<AdminFilter[]>(path, { method: 'GET' }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  if (!r.meta) {
    throw new Error('Respuesta de filtros admin sin meta');
  }
  return { data: r.data, meta: r.meta };
}

export async function getAdminFilterById(id: string, cookieHeader?: string): Promise<AdminFilter> {
  const r = await apiFetch<AdminFilter>(`/api/admin/filters/${id}`, { method: 'GET' }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

export async function getFilterTypes(cookieHeader?: string): Promise<FilterType[]> {
  const r = await apiFetch<FilterType[]>('/api/admin/filter-types', { method: 'GET' }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

export async function createFilter(data: FilterFormData): Promise<AdminFilter> {
  const body = {
    label: data.label,
    value: data.value,
    filterTypeId: data.filterTypeId,
    parentFilterId: data.parentFilterId ?? undefined,
    configuration: data.configuration,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
  };
  const r = await apiFetch<AdminFilter>('/api/admin/filters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

export async function updateFilter(id: string, data: Partial<FilterFormData>): Promise<AdminFilter> {
  const r = await apiFetch<AdminFilter>(`/api/admin/filters/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

export async function deactivateFilter(id: string): Promise<void> {
  const r = await apiFetch<unknown>(`/api/admin/filters/${id}`, { method: 'DELETE' });
  if (!r.success) {
    throw new Error(r.message);
  }
}

export async function restoreFilter(id: string): Promise<void> {
  const r = await apiFetch<unknown>(`/api/admin/filters/${id}/restore`, { method: 'PATCH' });
  if (!r.success) {
    throw new Error(r.message);
  }
}

function mapUserRole(r: { id: string; name: string; description?: string | null }): UserRole {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
  };
}

function mapSecurityStatus(s: UserSecurityStatus): UserSecurityStatus {
  return {
    failedLoginAttempts: s.failedLoginAttempts,
    loginBlockedUntil: s.loginBlockedUntil,
    passwordChangedAt: s.passwordChangedAt,
  };
}

/** Respuesta del backend para un usuario admin (sin `isDeleted` ni `description` en rol). */
type AdminUserApi = Omit<AdminUser, 'isDeleted' | 'role'> & {
  role: { id: string; name: string };
  isDeleted?: boolean;
};

function mapAdminUser(raw: AdminUserApi): AdminUser {
  return {
    id: raw.id,
    email: raw.email,
    fullName: raw.fullName,
    role: mapUserRole({ ...raw.role, description: (raw.role as { description?: string }).description }),
    isActive: raw.isActive,
    isDeleted: raw.isDeleted ?? false,
    lastLoginAt: raw.lastLoginAt,
    createdAt: raw.createdAt,
    securityStatus: mapSecurityStatus(raw.securityStatus),
  };
}

export async function getMe(cookieHeader?: string): Promise<AuthMeUser> {
  const r = await apiFetch<{
    id: string;
    email: string;
    fullName: string;
    role: { id: string; name: string; description?: string | null };
    lastLoginAt: string | null;
    createdAt: string;
  }>('/api/auth/me', { method: 'GET' }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  const d = r.data;
  return {
    id: d.id,
    email: d.email,
    fullName: d.fullName,
    role: mapUserRole(d.role),
    lastLoginAt: d.lastLoginAt,
    createdAt: d.createdAt,
  };
}

export async function updateProfile(data: Omit<ProfileFormData, 'confirmPassword'>): Promise<User> {
  const body: Record<string, string> = {};
  if (data.fullName !== undefined) {
    body.fullName = data.fullName;
  }
  if (data.currentPassword !== undefined) {
    body.currentPassword = data.currentPassword;
  }
  if (data.newPassword !== undefined) {
    body.newPassword = data.newPassword;
  }
  const r = await apiFetch<{
    id: string;
    email: string;
    fullName: string;
    role: { id: string; name: string; description?: string | null };
    lastLoginAt: string | null;
    createdAt: string;
  }>('/api/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.success) {
    throw new Error(r.message);
  }
  const d = r.data;
  return {
    id: d.id,
    email: d.email,
    fullName: d.fullName,
    role: mapUserRole(d.role).name,
  };
}

export async function getAdminUsers(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    isActive?: boolean;
  },
  cookieHeader?: string,
): Promise<{ data: AdminUser[]; meta: { total: number; page: number; limit: number } }> {
  const q = new URLSearchParams();
  if (params.page !== undefined) {
    q.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    q.set('limit', String(params.limit));
  }
  if (params.search !== undefined && params.search.length > 0) {
    q.set('search', params.search);
  }
  if (params.roleId !== undefined && params.roleId.length > 0) {
    q.set('roleId', params.roleId);
  }
  if (params.isActive !== undefined) {
    q.set('isActive', String(params.isActive));
  }
  const qs = q.toString();
  const path = qs ? `/api/admin/users?${qs}` : '/api/admin/users';
  const r = await apiFetch<AdminUserApi[]>(path, { method: 'GET' }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  if (!r.meta) {
    throw new Error('Respuesta de usuarios admin sin meta');
  }
  return { data: r.data.map(mapAdminUser), meta: r.meta };
}

export async function getAdminUserById(id: string, cookieHeader?: string): Promise<AdminUser> {
  const r = await apiFetch<AdminUserApi>(`/api/admin/users/${id}`, { method: 'GET' }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  return mapAdminUser(r.data);
}

export async function getRoles(cookieHeader?: string): Promise<UserRole[]> {
  const r = await apiFetch<{ id: string; name: string; description: string | null }[]>(
    '/api/admin/roles',
    { method: 'GET' },
    cookieHeader,
  );
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data.map((row) => mapUserRole(row));
}

export async function createUser(data: UserFormData): Promise<AdminUser> {
  const body: Record<string, unknown> = {
    email: data.email,
    fullName: data.fullName,
    roleId: data.roleId,
    password: data.password,
  };
  const r = await apiFetch<AdminUserApi>('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.success) {
    throw new Error(r.message);
  }
  return mapAdminUser(r.data);
}

export async function updateUser(id: string, data: Partial<UserFormData>): Promise<AdminUser> {
  const body: Record<string, unknown> = {};
  if (data.fullName !== undefined) {
    body.fullName = data.fullName;
  }
  if (data.roleId !== undefined) {
    body.roleId = data.roleId;
  }
  if (data.isActive !== undefined) {
    body.isActive = data.isActive;
  }
  const r = await apiFetch<AdminUserApi>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.success) {
    throw new Error(r.message);
  }
  return mapAdminUser(r.data);
}

export async function deleteUser(id: string): Promise<void> {
  const r = await apiFetch<null>(`/api/admin/users/${id}`, { method: 'DELETE' });
  if (!r.success) {
    throw new Error(r.message);
  }
}

export async function restoreUser(id: string): Promise<void> {
  const r = await apiFetch<unknown>(`/api/admin/users/${id}/restore`, { method: 'PATCH' });
  if (!r.success) {
    throw new Error(r.message);
  }
}

export async function unlockUser(id: string): Promise<void> {
  const r = await apiFetch<unknown>(`/api/admin/users/${id}/unlock`, { method: 'PATCH' });
  if (!r.success) {
    throw new Error(r.message);
  }
}
