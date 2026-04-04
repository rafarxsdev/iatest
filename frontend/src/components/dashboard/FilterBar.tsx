import type { Filter } from '@types/filter';

export interface FilterBarProps {
  filters: Filter[];
  total: number;
  selectedFilterId: string | null;
  onFilterChange: (filterId: string | null) => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
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
          placeholder="Search resources..."
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <select
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full text-sm font-semibold text-on-surface-variant border-none appearance-none cursor-pointer hover:bg-surface-container-highest transition-all"
            value={selectedFilterId ?? ''}
            onChange={(e) => onFilterChange(e.target.value || null)}
            disabled={disabled}
            aria-label="Filtrar por tema"
          >
            <option value="">All Topics</option>
            {flat.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-highest"
          >
            <span>Newest</span>
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-outline">
          {total} Results
        </span>
      </div>
    </div>
  );
}
