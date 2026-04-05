import type { AdminUser } from '@types/user';
import { formatDate, getInitials } from '@lib/utils';

export interface AdminUserRowProps {
  user: AdminUser;
  currentUserId: string;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onRestore: (user: AdminUser) => void;
  onUnlock: (user: AdminUser) => void;
}

function roleBadgeClass(roleName: string): string {
  if (roleName === 'admin') {
    return 'bg-primary-fixed text-on-primary-fixed-variant';
  }
  if (roleName === 'operator') {
    return 'bg-secondary-fixed text-on-secondary-fixed';
  }
  if (roleName === 'viewer') {
    return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
  }
  return 'bg-surface-container-high text-outline';
}

function isBlocked(uss: AdminUser['securityStatus']): boolean {
  const until = uss.loginBlockedUntil;
  if (!until) {
    return false;
  }
  return new Date(until) > new Date();
}

export default function AdminUserRow({
  user,
  currentUserId,
  onEdit,
  onDelete,
  onRestore,
  onUnlock,
}: AdminUserRowProps): JSX.Element {
  const baseClass =
    'bg-surface-container-lowest rounded-xl p-5 shadow-[0_8px_24px_rgba(24,28,32,0.04)] transition-all hover:shadow-[0_12px_32px_rgba(24,28,32,0.08)] flex items-center gap-4';
  const cardClass = user.isDeleted ? `${baseClass} opacity-50` : baseClass;
  const blocked = isBlocked(user.securityStatus);

  return (
    <div className={cardClass}>
      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white text-sm font-bold shrink-0">
        {getInitials(user.fullName)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-on-surface">{user.fullName}</span>
          <span
            className={`inline-flex rounded-full text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 ${roleBadgeClass(user.role.name)}`}
          >
            {user.role.name}
          </span>
          {user.isDeleted ? (
            <span className="inline-flex rounded-full text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-error-container text-on-error-container">
              ELIMINADO
            </span>
          ) : null}
          {!user.isActive && !user.isDeleted ? (
            <span className="inline-flex rounded-full text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-surface-container-high text-outline">
              INACTIVO
            </span>
          ) : null}
          {!user.isDeleted && blocked ? (
            <span className="inline-flex items-center gap-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-tertiary-container text-on-tertiary-container">
              <span className="material-symbols-outlined text-[12px]">lock</span>
              BLOQUEADO
            </span>
          ) : null}
        </div>
        <p className="text-sm text-on-surface-variant truncate">{user.email}</p>
        <p className="text-xs text-outline mt-0.5">
          Último acceso: {formatDate(user.lastLoginAt)} · Creado: {formatDate(user.createdAt)}
        </p>
      </div>

      <div className="shrink-0 flex gap-1">
        {user.isDeleted ? (
          <button
            type="button"
            className="p-2 rounded-full hover:bg-surface-container text-primary"
            title="Restaurar usuario"
            onClick={() => onRestore(user)}
          >
            <span className="material-symbols-outlined">settings_backup_restore</span>
          </button>
        ) : (
          <>
            {blocked ? (
              <button
                type="button"
                className="p-2 rounded-full hover:bg-surface-container text-tertiary"
                title="Desbloquear acceso"
                onClick={() => onUnlock(user)}
              >
                <span className="material-symbols-outlined">lock_open</span>
              </button>
            ) : null}
            <button
              type="button"
              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant"
              title="Editar usuario"
              onClick={() => onEdit(user)}
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button
              type="button"
              className={`p-2 rounded-full hover:bg-error-container text-error ${
                user.id === currentUserId ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              title={
                user.id === currentUserId ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'
              }
              disabled={user.id === currentUserId}
              onClick={() => {
                if (user.id !== currentUserId) {
                  onDelete(user);
                }
              }}
            >
              <span className="material-symbols-outlined">person_remove</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
