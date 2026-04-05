import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminUser } from '@types/user';
import type { UserFormData } from '@types/user';
import type { UserRole } from '@types/user';
import {
  createUser,
  deleteUser,
  getAdminUsers,
  restoreUser,
  unlockUser,
  updateUser,
} from '@lib/api';
import AdminUserRow from './AdminUserRow';
import UserFormModal from './UserFormModal';
import DeleteUserConfirmModal from './DeleteUserConfirmModal';

const PAGE_SIZE = 20;

export interface AdminUsersManagerProps {
  initialUsers: AdminUser[];
  initialTotal: number;
  roles: UserRole[];
  currentUserId: string;
}

export default function AdminUsersManager({
  initialUsers,
  initialTotal,
  roles,
  currentUserId,
}: AdminUsersManagerProps): JSX.Element {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRoleId, setFilterRoleId] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const skipInitialSync = useRef(true);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(
    async (
      p: number,
      s: string,
      roleId: string | null,
      active: 'all' | 'active' | 'inactive',
    ): Promise<void> => {
      setIsLoading(true);
      try {
        const isActive = active === 'all' ? undefined : active === 'active';
        const r = await getAdminUsers({
          page: p,
          limit: PAGE_SIZE,
          search: s.length > 0 ? s : undefined,
          roleId: roleId ?? undefined,
          isActive,
        });
        setUsers(r.data);
        setTotal(r.meta.total);
        setPage(r.meta.page);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'No se pudieron cargar los usuarios';
        setNotification({ type: 'error', message });
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (skipInitialSync.current) {
      skipInitialSync.current = false;
      return;
    }
    void fetchUsers(1, debouncedSearch, filterRoleId, filterActive);
  }, [debouncedSearch, filterRoleId, filterActive, fetchUsers]);

  useEffect(() => {
    if (!notification) {
      return;
    }
    const t = window.setTimeout(() => setNotification(null), 3000);
    return () => window.clearTimeout(t);
  }, [notification]);

  const handleCreate = async (data: UserFormData): Promise<void> => {
    try {
      await createUser({
        email: data.email,
        fullName: data.fullName,
        roleId: data.roleId,
        password: data.password ?? '',
        isActive: data.isActive,
      });
      setShowModal(false);
      setEditingUser(null);
      setNotification({ type: 'success', message: 'Usuario creado correctamente' });
      await fetchUsers(page, debouncedSearch, filterRoleId, filterActive);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo crear el usuario';
      setNotification({ type: 'error', message });
    }
  };

  const handleUpdate = async (id: string, data: UserFormData): Promise<void> => {
    try {
      await updateUser(id, {
        fullName: data.fullName,
        roleId: data.roleId,
        isActive: data.isActive,
      });
      setShowModal(false);
      setEditingUser(null);
      setNotification({ type: 'success', message: 'Usuario actualizado' });
      await fetchUsers(page, debouncedSearch, filterRoleId, filterActive);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo actualizar el usuario';
      setNotification({ type: 'error', message });
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteUser(id);
      setDeletingUser(null);
      setNotification({ type: 'success', message: 'Usuario eliminado' });
      await fetchUsers(page, debouncedSearch, filterRoleId, filterActive);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo eliminar el usuario';
      setNotification({ type: 'error', message });
      setDeletingUser(null);
    }
  };

  const handleRestore = async (id: string): Promise<void> => {
    try {
      await restoreUser(id);
      setNotification({ type: 'success', message: 'Usuario restaurado' });
      await fetchUsers(page, debouncedSearch, filterRoleId, filterActive);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo restaurar el usuario';
      setNotification({ type: 'error', message });
    }
  };

  const handleUnlock = async (id: string): Promise<void> => {
    try {
      await unlockUser(id);
      setNotification({ type: 'success', message: 'Usuario desbloqueado' });
      await fetchUsers(page, debouncedSearch, filterRoleId, filterActive);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo desbloquear el usuario';
      setNotification({ type: 'error', message });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pillClass = (active: boolean) =>
    active
      ? 'bg-primary text-white rounded-full px-4 py-2 text-sm font-semibold'
      : 'bg-surface-container-high text-on-surface-variant rounded-full px-4 py-2 text-sm';

  return (
    <div>
      <h1 className="text-2xl font-bold font-headline text-on-surface mb-6">Gestión de Usuarios</h1>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-xl">
            search
          </span>
          <input
            type="search"
            placeholder="Buscar por nombre o email..."
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border-none text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar usuarios"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-2 rounded-xl font-semibold shadow-[0_8px_24px_rgba(24,28,32,0.04)] hover:shadow-[0_12px_32px_rgba(24,28,32,0.08)] transition-shadow shrink-0"
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          Nuevo Usuario
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          className="bg-surface-container-high rounded-full px-4 py-2 text-sm border-none appearance-none cursor-pointer text-on-surface focus:ring-2 focus:ring-primary/30"
          value={filterRoleId ?? ''}
          onChange={(e) => setFilterRoleId(e.target.value === '' ? null : e.target.value)}
          aria-label="Filtrar por rol"
        >
          <option value="">Todos los roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={pillClass(filterActive === 'all')} onClick={() => setFilterActive('all')}>
            Todos
          </button>
          <button
            type="button"
            className={pillClass(filterActive === 'active')}
            onClick={() => setFilterActive('active')}
          >
            Activos
          </button>
          <button
            type="button"
            className={pillClass(filterActive === 'inactive')}
            onClick={() => setFilterActive('inactive')}
          >
            Inactivos
          </button>
        </div>
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-outline mb-4 block">{total} usuarios</span>

      {isLoading ? (
        <div className="space-y-3">
          <div className="animate-pulse bg-surface-container rounded-xl h-20" />
          <div className="animate-pulse bg-surface-container rounded-xl h-20" />
          <div className="animate-pulse bg-surface-container rounded-xl h-20" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-outline">
          <span className="material-symbols-outlined text-6xl mb-4">group</span>
          <p className="text-on-surface-variant text-center">No hay usuarios que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <AdminUserRow
              key={u.id}
              user={u}
              currentUserId={currentUserId}
              onEdit={(row) => {
                setEditingUser(row);
                setShowModal(true);
              }}
              onDelete={(row) => setDeletingUser(row)}
              onRestore={(row) => void handleRestore(row.id)}
              onUnlock={(row) => void handleUnlock(row.id)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface-variant font-semibold text-sm disabled:opacity-40"
            disabled={page <= 1 || isLoading}
            onClick={() => void fetchUsers(page - 1, debouncedSearch, filterRoleId, filterActive)}
          >
            Anterior
          </button>
          <span className="text-sm text-on-surface-variant">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface-variant font-semibold text-sm disabled:opacity-40"
            disabled={page >= totalPages || isLoading}
            onClick={() => void fetchUsers(page + 1, debouncedSearch, filterRoleId, filterActive)}
          >
            Siguiente
          </button>
        </div>
      ) : null}

      {showModal ? (
        <UserFormModal
          key={editingUser?.id ?? 'new'}
          user={editingUser}
          roles={roles}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={async (data) => {
            if (editingUser) {
              await handleUpdate(editingUser.id, data);
            } else {
              await handleCreate(data);
            }
          }}
        />
      ) : null}

      {deletingUser ? (
        <DeleteUserConfirmModal
          user={deletingUser}
          onCancel={() => setDeletingUser(null)}
          onConfirm={async () => {
            await handleDelete(deletingUser.id);
          }}
        />
      ) : null}

      {notification ? (
        <div
          className={`fixed top-24 right-4 z-[70] max-w-sm rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(24,28,32,0.12)] font-body text-sm ${
            notification.type === 'success'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-error-container text-on-error-container'
          }`}
          role="status"
        >
          {notification.message}
        </div>
      ) : null}
    </div>
  );
}
