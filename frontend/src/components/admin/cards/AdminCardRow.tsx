import type { AdminCard } from '@types/card';

export interface AdminCardRowProps {
  card: AdminCard;
  onEdit: (card: AdminCard) => void;
  onDelete: (card: AdminCard) => void;
  onRestore: (card: AdminCard) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function AdminCardRow({ card, onEdit, onDelete, onRestore }: AdminCardRowProps): JSX.Element {
  const baseCard =
    'bg-surface-container-lowest rounded-xl p-5 shadow-[0_8px_24px_rgba(24,28,32,0.04)] flex items-start justify-between gap-4';
  const cardClass = card.isDeleted ? `${baseCard} opacity-50` : baseCard;

  return (
    <div className={cardClass}>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5">
            {card.filter.label}
          </span>
          <span className="rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5">
            {card.widgetType.label}
          </span>
          {card.isDeleted ? (
            <span className="rounded-full bg-error-container text-on-error-container text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5">
              ELIMINADA
            </span>
          ) : null}
          {!card.isActive && !card.isDeleted ? (
            <span className="rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5">
              INACTIVA
            </span>
          ) : null}
        </div>
        <h3 className="text-base font-bold text-on-surface mt-2 mb-1 truncate">{card.title}</h3>
        <p className="text-xs text-outline">
          Orden: {card.sortOrder} · Creada: {formatDate(card.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {card.isDeleted ? (
          <button
            type="button"
            className="p-2 rounded-full hover:bg-surface-container text-primary transition-colors"
            aria-label="Restaurar"
            onClick={() => onRestore(card)}
          >
            <span className="material-symbols-outlined text-xl">restore</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              aria-label="Editar"
              onClick={() => onEdit(card)}
            >
              <span className="material-symbols-outlined text-xl">edit</span>
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-error-container text-error transition-colors"
              aria-label="Eliminar"
              onClick={() => onDelete(card)}
            >
              <span className="material-symbols-outlined text-xl">delete</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
