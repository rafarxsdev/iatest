import type { AdminCard, CardFormData } from '@types/card';
import type { AdminFilter, Filter, FilterFormData, FilterType, WidgetTypeOption } from '@types/filter';
import type {
  InteractionLogEntry,
  InteractionStatus,
  UserInteractionDetail,
  UserWithInteractionSummary,
} from '@types/interaction';
import type {
  AdminUser,
  AuthMeUser,
  ProfileFormData,
  User,
  UserFormData,
  UserRole,
  UserSecurityStatus,
} from '@types/user';

import { apiFetch } from './api-base';

export type { ApiSuccess, ApiFailure, ApiResponse } from './api-base';
export { ApiHttpError, clientApiUrl, apiFetch } from './api-base';

export { getCards } from './api-cards-client';
export { postInteractionHandled, type PostInteractionHandledResult } from './post-interaction-client';

export async function getFilters(cookieHeader?: string): Promise<Filter[]> {
  const r = await apiFetch<Filter[]>('/api/filters', { method: 'GET' }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
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
    iconName: data.iconName,
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

export async function getUsersWithInteractions(
  search?: string,
  cookieHeader?: string,
): Promise<UserWithInteractionSummary[]> {
  const q = new URLSearchParams();
  if (search !== undefined && search.length > 0) {
    q.set('search', search);
  }
  const path = q.toString() ? `/api/admin/interactions/users?${q.toString()}` : '/api/admin/interactions/users';
  const r = await apiFetch<UserWithInteractionSummary[]>(path, { method: 'GET' }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

export async function getUserInteractions(
  userId: string,
  cookieHeader?: string,
): Promise<UserInteractionDetail[]> {
  const r = await apiFetch<UserInteractionDetail[]>(`/api/admin/interactions/users/${userId}`, {
    method: 'GET',
  }, cookieHeader);
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

export async function getInteractionHistory(
  userId: string,
  cardId: string,
  cookieHeader?: string,
): Promise<InteractionLogEntry[]> {
  const r = await apiFetch<InteractionLogEntry[]>(
    `/api/admin/interactions/users/${userId}/cards/${cardId}/history`,
    { method: 'GET' },
    cookieHeader,
  );
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}

export async function resetSingleInteraction(userId: string, cardId: string): Promise<void> {
  const r = await apiFetch<null>(`/api/admin/interactions/users/${userId}/cards/${cardId}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!r.success) {
    throw new Error(r.message);
  }
}

export async function resetAllInteractions(userId: string): Promise<{ resetCount: number }> {
  const r = await apiFetch<{ resetCount: number }>(
    `/api/admin/interactions/users/${userId}/reset-all`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
  );
  if (!r.success) {
    throw new Error(r.message);
  }
  return r.data;
}
