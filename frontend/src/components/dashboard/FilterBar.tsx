import type { Filter } from '@types/filter';
import type { CardSortMode } from './sort-cards';
import { CARD_SORT_OPTIONS } from './sort-cards';

export interface FilterBarProps {
  filters: Filter[];
  total: number;
  selectedFilterId: string | null;
  onFilterChange: (filterId: string | null) => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  sortMode: CardSortMode;
  onSortChange: (mode: CardSortMode) => void;
  disabled?: boolean;
}

function flattenFilters(items: Filter[]): Filter[] {
  const out: Filter[] = [];
  for (const f of items) {
    out.push(f);
    if (f.children?.length) {
      out.push(...flattenFilters(f.children));
    }
  }
  return out;
}

export default function FilterBar({
  filters,
  total,
  selectedFilterId,
  onFilterChange,
  onSearchChange,
  searchQuery,
  sortMode,
  onSortChange,
  disabled,
}: FilterBarProps) {
  const flat = flattenFilters(filters);

  return (
    <div className="flex flex-col gap-4 mb-10">
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>
        <input
          className="w-full h-12 pl-12 pr-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-outline transition-all"
          placeholder="buscar demos de agentes ia"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-nowrap items-center gap-2 min-w-0 overflow-x-auto pb-0.5 sm:pb-0 [scrollbar-width:thin]">
          <select
            className="shrink-0 min-w-[16rem] max-w-[26rem] px-4 py-2 bg-surface-container-high rounded-full text-sm font-semibold text-on-surface-variant border-none appearance-none cursor-pointer hover:bg-surface-container-highest transition-all"
            value={selectedFilterId ?? ''}
            onChange={(e) => onFilterChange(e.target.value || null)}
            disabled={disabled}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {flat.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            className="shrink-0 min-w-[13rem] max-w-[18rem] pl-4 pr-8 py-2 bg-surface-container-high rounded-full text-sm font-semibold text-on-surface-variant border-none cursor-pointer hover:bg-surface-container-highest transition-all"
            value={sortMode}
            onChange={(e) => onSortChange(e.target.value as CardSortMode)}
            disabled={disabled}
            aria-label="Ordenar resultados"
          >
            {CARD_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-outline shrink-0 sm:ml-2">
          {total} Resultados
        </span>
      </div>
    </div>
  );
}
