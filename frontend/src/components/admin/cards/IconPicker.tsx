import { useEffect, useMemo, useState } from 'react';
import {
  getCategoryLabel,
  getIconsByCategory,
  loadIconsBundle,
  searchIcons,
  type IconsBundle,
} from '@lib/icons';

export interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps): JSX.Element {
  const [bundle, setBundle] = useState<IconsBundle | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(64);

  useEffect(() => {
    let cancelled = false;
    void loadIconsBundle().then((b) => {
      if (!cancelled) {
        setBundle(b);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const iconsToShow = useMemo(() => {
    if (!bundle) {
      return [];
    }
    if (searchQuery.trim()) {
      return searchIcons(bundle.catalog, searchQuery, 120);
    }
    if (activeCategory) {
      return getIconsByCategory(bundle.catalog, activeCategory);
    }
    return bundle.featured;
  }, [bundle, searchQuery, activeCategory]);

  const rendered = iconsToShow.slice(0, visibleCount);
  const hasMore = iconsToShow.length > visibleCount;
  const remaining = iconsToShow.length - visibleCount;
  const nextBatch = Math.min(remaining, 64);

  const selectedMeta = bundle?.catalog.find((i) => i.name === value);

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-surface-container-low">
        <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary border border-outline-variant/30">
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {value}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{value}</p>
          <p className="text-xs text-outline">
            {selectedMeta?.category
              ? getCategoryLabel(selectedMeta.category)
              : 'Material Symbols'}
            {bundle ? (
              <>
                {' '}
                · {bundle.catalog.length.toLocaleString()} íconos disponibles
              </>
            ) : (
              <> · Cargando catálogo…</>
            )}
          </p>
        </div>
        {!isOpen ? (
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-full bg-primary text-white inline-flex items-center gap-1 shrink-0"
            onClick={() => {
              setIsOpen(true);
              setVisibleCount(64);
            }}
          >
            <span className="material-symbols-outlined text-[14px]">tune</span>
            Elegir ícono
          </button>
        ) : (
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant/40 inline-flex items-center gap-1 shrink-0"
            onClick={() => setIsOpen(false)}
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
            Cerrar
          </button>
        )}
      </div>

      {isOpen ? (
        <div className="border-t border-outline-variant/30">
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">
                search
              </span>
              <input
                type="search"
                className="w-full h-9 pl-9 pr-9 text-sm rounded-full bg-surface-container-low border border-outline-variant/40 focus:ring-1 focus:ring-primary/30 text-on-surface"
                placeholder={
                  bundle
                    ? `Buscar entre ${bundle.catalog.length.toLocaleString()} íconos...`
                    : 'Cargando catálogo de íconos...'
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveCategory(null);
                  setVisibleCount(64);
                }}
                disabled={!bundle}
                autoComplete="off"
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-0.5"
                  aria-label="Limpiar búsqueda"
                  onClick={() => {
                    setSearchQuery('');
                    setVisibleCount(64);
                  }}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              ) : null}
            </div>
          </div>

          {!searchQuery.trim() && bundle ? (
            <div className="px-3 pb-2">
              <label htmlFor="icon-picker-category" className="block text-[11px] font-semibold text-on-surface-variant mb-1.5">
                Categoría
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  expand_more
                </span>
                <select
                  id="icon-picker-category"
                  className="w-full h-9 pl-3 pr-10 text-sm rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-1 focus:ring-primary/30 text-on-surface appearance-none cursor-pointer"
                  value={activeCategory ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setActiveCategory(v === '' ? null : v);
                    setSearchQuery('');
                    setVisibleCount(64);
                  }}
                >
                  <option value="">Destacados</option>
                  {bundle.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <div className="px-3 pb-1 flex items-center justify-between min-h-[1.25rem]">
            {searchQuery.trim() ? (
              <p className="text-[10px] text-outline uppercase tracking-widest">
                {iconsToShow.length} resultado{iconsToShow.length !== 1 ? 's' : ''} para &quot;{searchQuery}&quot;
              </p>
            ) : null}
            {!searchQuery.trim() && activeCategory ? (
              <p className="text-[10px] text-outline uppercase tracking-widest">
                {iconsToShow.length} íconos · {getCategoryLabel(activeCategory)}
              </p>
            ) : null}
            {!searchQuery.trim() && !activeCategory && bundle ? (
              <p className="text-[10px] text-outline uppercase tracking-widest">
                Destacados · {iconsToShow.length} íconos
              </p>
            ) : null}
          </div>

          <div className="overflow-y-auto px-3 pb-2" style={{ maxHeight: '220px' }}>
            {!bundle ? (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-3xl text-outline animate-pulse">hourglass_empty</span>
                <p className="text-sm text-on-surface-variant mt-2">Cargando íconos…</p>
              </div>
            ) : iconsToShow.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
                <p className="text-sm text-on-surface-variant mt-2">Sin resultados para &quot;{searchQuery}&quot;</p>
                <p className="text-xs text-outline mt-1">
                  Prueba con términos en inglés: &quot;settings&quot;, &quot;cloud&quot;, &quot;person&quot;
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-8 gap-0.5">
                  {rendered.map((icon) => (
                    <button
                      key={icon.name}
                      type="button"
                      title={`${icon.label} · ${icon.name}`}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-100 ${
                        icon.name === value
                          ? 'bg-primary/10 ring-1 ring-primary/60'
                          : 'hover:bg-surface-container-high'
                      }`}
                      onClick={() => {
                        onChange(icon.name);
                        setIsOpen(false);
                        setSearchQuery('');
                        setActiveCategory(null);
                      }}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          icon.name === value ? 'text-primary' : 'text-on-surface-variant'
                        }`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {icon.name}
                      </span>
                    </button>
                  ))}
                </div>
                {hasMore ? (
                  <div className="pt-2 pb-1 text-center col-span-8">
                    <button
                      type="button"
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mx-auto"
                      onClick={() => setVisibleCount((v) => v + 64)}
                    >
                      <span className="material-symbols-outlined text-[14px]">expand_more</span>
                      Ver {nextBatch} más de {remaining} restantes
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
