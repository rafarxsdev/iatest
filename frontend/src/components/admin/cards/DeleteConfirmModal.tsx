import { useState } from 'react';
import type { AdminCard } from '@types/card';

export interface DeleteConfirmModalProps {
  card: AdminCard;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmModal({ card, onConfirm, onCancel }: DeleteConfirmModalProps): JSX.Element {
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
        aria-labelledby="delete-card-title"
        className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_rgba(24,28,32,0.12)] w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <span className="material-symbols-outlined text-5xl text-error">delete</span>
          <h2 id="delete-card-title" className="text-xl font-bold font-headline text-on-surface">
            ¿Eliminar esta card?
          </h2>
          <p className="text-on-surface-variant text-sm">
            La card &quot;{card.title}&quot; será desactivada. Podrás restaurarla desde el listado.
          </p>
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
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
