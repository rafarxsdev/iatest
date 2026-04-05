import type { UserInteractionDetail, UserWithInteractionSummary } from '@types/interaction';
import { getInitials } from '@lib/utils';

export interface ResetAllConfirmModalProps {
  user: UserWithInteractionSummary;
  interactions: UserInteractionDetail[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ResetAllConfirmModal({
  user,
  interactions,
  onConfirm,
  onCancel,
}: ResetAllConfirmModalProps): JSX.Element {
  const widgetsToRestore = interactions.filter((i) => i.interactionCount > 0).length;
  const totalUses = interactions.reduce((s, i) => s + i.interactionCount, 0);
  const blockedCount = interactions.filter((i) => i.isBlocked).length;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-all-title"
        className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_rgba(24,28,32,0.12)] w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <span className="material-symbols-outlined text-5xl text-primary">restart_alt</span>
          <h2 id="reset-all-title" className="text-xl font-bold font-headline text-on-surface">
            ¿Restaurar todos los contadores?
          </h2>
        </div>

        <div className="bg-surface-container rounded-xl p-4 my-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary text-sm font-bold shrink-0">
              {getInitials(user.fullName)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">{user.fullName}</p>
              <p className="text-xs text-outline truncate">{user.email}</p>
            </div>
          </div>
          <div className="h-px bg-outline/40 my-3" />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold font-headline text-on-surface">{widgetsToRestore}</p>
              <p className="text-[10px] text-outline uppercase tracking-wider">widgets a restaurar</p>
            </div>
            <div>
              <p className="text-lg font-bold font-headline text-on-surface">{totalUses}</p>
              <p className="text-[10px] text-outline uppercase tracking-wider">usos totales</p>
            </div>
            <div>
              <p className="text-lg font-bold font-headline text-error">{blockedCount}</p>
              <p className="text-[10px] text-outline uppercase tracking-wider">bloqueados</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-on-surface-variant text-center mb-6">
          Los contadores volverán a cero. Esta acción queda registrada en los logs de auditoría.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-6 py-2 bg-surface-container-high text-on-surface-variant rounded-xl font-semibold hover:bg-surface-container-highest transition-colors"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            onClick={onConfirm}
          >
            Restaurar todos
          </button>
        </div>
      </div>
    </div>
  );
}
