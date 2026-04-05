import { useState } from 'react';
import type { AdminUser } from '@types/user';

export interface DeleteUserConfirmModalProps {
  user: AdminUser;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteUserConfirmModal({
  user,
  onConfirm,
  onCancel,
}: DeleteUserConfirmModalProps): JSX.Element {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-4"
      role="presentation"
      onClick={onCancel}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_rgba(24,28,32,0.12)] w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <span className="material-symbols-outlined text-5xl text-error">person_remove</span>
          <h2 id="delete-user-title" className="text-xl font-bold font-headline text-on-surface">
            ¿Eliminar este usuario?
          </h2>
          <p className="text-sm text-on-surface-variant">
            El usuario {user.fullName} ({user.email}) será eliminado. Sus sesiones activas serán revocadas. Podrás
            restaurarlo desde el listado.
          </p>
          {user.role.name === 'admin' ? (
            <div className="w-full bg-tertiary-fixed/40 rounded-xl p-3 text-xs text-on-tertiary-fixed mt-3 flex items-start gap-2 text-left">
              <span className="material-symbols-outlined shrink-0 text-lg">warning</span>
              <span>Estás eliminando un administrador. Asegúrate de que exista otro admin activo.</span>
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            className="px-6 py-2 bg-surface-container-high text-on-surface-variant rounded-xl font-semibold hover:bg-surface-container-highest transition-colors"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-6 py-2 bg-error text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}
