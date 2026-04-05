import { useState } from 'react';
import type { AdminFilter } from '@types/filter';

export interface DeactivateConfirmModalProps {
  filter: AdminFilter;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeactivateConfirmModal({ filter, onConfirm, onCancel }: DeactivateConfirmModalProps): JSX.Element {
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleConfirm = async (): Promise<void> => {
    setIsDeactivating(true);
    try {
      await onConfirm();
    } finally {
      setIsDeactivating(false);
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
        aria-labelledby="deactivate-filter-title"
        className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_rgba(24,28,32,0.12)] w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <span className="material-symbols-outlined text-5xl text-error">hide_source</span>
          <h2 id="deactivate-filter-title" className="text-xl font-bold font-headline text-on-surface">
            ¿Desactivar este filtro?
          </h2>
          {filter.cardsCount > 0 ? (
            <p className="text-sm text-on-surface-variant">
              El filtro &quot;{filter.label}&quot; tiene {filter.cardsCount} card(s) asociada(s). Solo se puede desactivar si
              ninguna está activa. Si el servidor rechaza la operación, verás un mensaje de error.
            </p>
          ) : (
            <p className="text-sm text-on-surface-variant">
              El filtro &quot;{filter.label}&quot; será desactivado. No aparecerá en el dashboard hasta que lo restaures.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            className="px-6 py-2 bg-surface-container-high text-on-surface-variant rounded-xl font-semibold hover:bg-surface-container-highest transition-colors"
            onClick={onCancel}
            disabled={isDeactivating}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-6 py-2 bg-error text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            onClick={() => void handleConfirm()}
            disabled={isDeactivating}
          >
            {isDeactivating ? 'Desactivando...' : 'Desactivar'}
          </button>
        </div>
      </div>
    </div>
  );
}
