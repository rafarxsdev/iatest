import type { AdminFilter } from '@types/filter';

export interface AdminFilterRowProps {
  filter: AdminFilter;
  onEdit: (filter: AdminFilter) => void;
  onDeactivate: (filter: AdminFilter) => void;
  onRestore: (filter: AdminFilter) => void;
}

export default function AdminFilterRow({ filter, onEdit, onDeactivate, onRestore }: AdminFilterRowProps): JSX.Element {
  const base =
    'bg-surface-container-lowest rounded-xl p-5 shadow-[0_8px_24px_rgba(24,28,32,0.04)] transition-all hover:shadow-[0_12px_32px_rgba(24,28,32,0.08)] flex items-start justify-between gap-4';
  const rowClass = filter.isActive ? base : `${base} opacity-60`;

  const desc = filter.filterType.description ?? '';

  return (
    <div className={rowClass}>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5">
            {filter.filterType.code}
          </span>
          {filter.parent ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-extrabold uppercase px-2 py-0.5">
              <span className="material-symbols-outlined text-[12px] leading-none">subdirectory_arrow_right</span>
              {filter.parent.label}
            </span>
          ) : null}
          {!filter.isActive ? (
            <span className="rounded-full bg-surface-container-highest text-outline text-[10px] font-extrabold uppercase px-2 py-0.5">
              INACTIVO
            </span>
          ) : null}
        </div>
        <h3 className="text-base font-bold text-on-surface mt-2 mb-0.5 truncate">{filter.label}</h3>
        <p className="text-xs font-mono text-outline mb-1">valor: {filter.value}</p>
        <p className="text-xs text-outline">
          Orden: {filter.sortOrder}
          {' · '}
          {filter.cardsCount} card{filter.cardsCount !== 1 ? 's' : ''} asociada{filter.cardsCount !== 1 ? 's' : ''}
          {desc ? (
            <>
              {' · '}
              {desc}
            </>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!filter.isActive ? (
          <button
            type="button"
            className="p-2 rounded-full hover:bg-surface-container text-primary transition-colors"
            title="Restaurar filtro"
            aria-label="Restaurar filtro"
            onClick={() => onRestore(filter)}
          >
            <span className="material-symbols-outlined text-xl">restore</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              title="Editar filtro"
              aria-label="Editar filtro"
              onClick={() => onEdit(filter)}
            >
              <span className="material-symbols-outlined text-xl">edit</span>
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-error-container text-error transition-colors"
              title={
                filter.cardsCount > 0
                  ? 'Tiene cards asociadas — se verificará antes de desactivar'
                  : 'Desactivar filtro'
              }
              aria-label="Desactivar filtro"
              onClick={() => onDeactivate(filter)}
            >
              <span className="material-symbols-outlined text-xl">hide_source</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
