import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminFilter } from '@types/filter';
import type { FilterFormData } from '@types/filter';
import type { FilterType } from '@types/filter';
import {
  createFilter,
  deactivateFilter,
  getAdminFilters,
  restoreFilter,
  updateFilter,
} from '@lib/api';
import AdminFilterRow from './AdminFilterRow';
import FilterFormModal from './FilterFormModal';
import DeactivateConfirmModal from './DeactivateConfirmModal';

const PAGE_SIZE = 20;

export interface AdminFiltersManagerProps {
  initialFilters: AdminFilter[];
  initialTotal: number;
  filterTypes: FilterType[];
  allFilters: AdminFilter[];
}

export default function AdminFiltersManager({
  initialFilters,
  initialTotal,
  filterTypes,
  allFilters,
}: AdminFiltersManagerProps): JSX.Element {
  const [filters, setFilters] = useState<AdminFilter[]>(initialFilters);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFilter, setEditingFilter] = useState<AdminFilter | null>(null);
  const [deactivatingFilter, setDeactivatingFilter] = useState<AdminFilter | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const skipDebouncedFetch = useRef(true);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const fetchFilters = useCallback(async (p: number, s: string): Promise<void> => {
    setIsLoading(true);
    try {
      const r = await getAdminFilters({
        page: p,
        limit: PAGE_SIZE,
        search: s.length > 0 ? s : undefined,
      });
      setFilters(r.data);
      setTotal(r.meta.total);
      setPage(r.meta.page);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudieron cargar los filtros';
      setNotification({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipDebouncedFetch.current) {
      skipDebouncedFetch.current = false;
      return;
    }
    void fetchFilters(1, debouncedSearch);
  }, [debouncedSearch, fetchFilters]);

  useEffect(() => {
    if (!notification) {
      return;
    }
    const t = window.setTimeout(() => setNotification(null), 3000);
    return () => window.clearTimeout(t);
  }, [notification]);

  const handleCreate = async (data: FilterFormData): Promise<void> => {
    try {
      await createFilter(data);
      setShowModal(false);
      setEditingFilter(null);
      setNotification({ type: 'success', message: 'Filtro creado correctamente' });
      await fetchFilters(page, debouncedSearch);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo crear el filtro';
      setNotification({ type: 'error', message });
    }
  };

  const handleUpdate = async (id: string, data: FilterFormData): Promise<void> => {
    const payload: Partial<FilterFormData> = {
      label: data.label,
      value: data.value,
      filterTypeId: data.filterTypeId,
      parentFilterId: data.parentFilterId,
      configuration: data.configuration,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    };
    try {
      await updateFilter(id, payload);
      setShowModal(false);
      setEditingFilter(null);
      setNotification({ type: 'success', message: 'Filtro actualizado' });
      await fetchFilters(page, debouncedSearch);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo actualizar el filtro';
      setNotification({ type: 'error', message });
    }
  };

  const handleDeactivate = async (id: string): Promise<void> => {
    try {
      await deactivateFilter(id);
      setDeactivatingFilter(null);
      setNotification({ type: 'success', message: 'Filtro desactivado' });
      await fetchFilters(page, debouncedSearch);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo desactivar el filtro';
      setNotification({ type: 'error', message });
      setDeactivatingFilter(null);
    }
  };

  const handleRestore = async (id: string): Promise<void> => {
    try {
      await restoreFilter(id);
      setNotification({ type: 'success', message: 'Filtro restaurado' });
      await fetchFilters(page, debouncedSearch);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo restaurar el filtro';
      setNotification({ type: 'error', message });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-bold font-headline text-on-surface mb-6">Gestión de Categorías</h1>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-xl">
            search
          </span>
          <input
            type="search"
            placeholder="Buscar por etiqueta o valor…"
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border-none text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar filtros"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-2 rounded-xl font-semibold shadow-[0_8px_24px_rgba(24,28,32,0.04)] hover:shadow-[0_12px_32px_rgba(24,28,32,0.08)] transition-shadow shrink-0"
          onClick={() => {
            setEditingFilter(null);
            setShowModal(true);
          }}
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Nueva categoría
        </button>
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-outline mb-4 block">
        {total} filtros
      </span>

      {isLoading ? (
        <div className="space-y-3">
          <div className="animate-pulse bg-surface-container rounded-xl h-20" />
          <div className="animate-pulse bg-surface-container rounded-xl h-20" />
          <div className="animate-pulse bg-surface-container rounded-xl h-20" />
        </div>
      ) : filters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-outline">
          <span className="material-symbols-outlined text-6xl mb-4">filter_list</span>
          <p className="text-on-surface-variant text-center">No hay filtros que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((f) => (
            <AdminFilterRow
              key={f.id}
              filter={f}
              onEdit={(row) => {
                setEditingFilter(row);
                setShowModal(true);
              }}
              onDeactivate={(row) => setDeactivatingFilter(row)}
              onRestore={(row) => void handleRestore(row.id)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface-variant font-semibold text-sm disabled:opacity-40"
            disabled={page <= 1 || isLoading}
            onClick={() => void fetchFilters(page - 1, debouncedSearch)}
          >
            Anterior
          </button>
          <span className="text-sm text-on-surface-variant">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface-variant font-semibold text-sm disabled:opacity-40"
            disabled={page >= totalPages || isLoading}
            onClick={() => void fetchFilters(page + 1, debouncedSearch)}
          >
            Siguiente
          </button>
        </div>
      ) : null}

      {showModal ? (
        <FilterFormModal
          key={editingFilter?.id ?? 'new'}
          filter={editingFilter}
          filterTypes={filterTypes}
          allFilters={allFilters}
          onClose={() => {
            setShowModal(false);
            setEditingFilter(null);
          }}
          onSave={async (data) => {
            if (editingFilter) {
              await handleUpdate(editingFilter.id, data);
            } else {
              await handleCreate(data);
            }
          }}
        />
      ) : null}

      {deactivatingFilter ? (
        <DeactivateConfirmModal
          filter={deactivatingFilter}
          onCancel={() => setDeactivatingFilter(null)}
          onConfirm={async () => {
            await handleDeactivate(deactivatingFilter.id);
          }}
        />
      ) : null}

      {notification ? (
        <div
          className={`fixed top-24 right-4 z-[70] max-w-sm rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(24,28,32,0.12)] font-body text-sm ${
            notification.type === 'success' ? 'bg-primary text-white' : 'bg-error text-white'
          }`}
          role="status"
        >
          {notification.message}
        </div>
      ) : null}
    </div>
  );
}
