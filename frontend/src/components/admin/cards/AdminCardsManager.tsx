import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminCard } from '@types/card';
import type { CardFormData } from '@types/card';
import type { Filter, WidgetTypeOption } from '@types/filter';
import {
  createCard,
  deleteCard,
  getAdminCards,
  restoreCard,
  updateCard,
} from '@lib/api';
import { AdminCardRow } from './AdminCardRow';
import { CardFormModal } from './CardFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

const PAGE_SIZE = 20;

export interface AdminCardsManagerProps {
  initialCards: AdminCard[];
  initialTotal: number;
  filters: Filter[];
  widgetTypes: WidgetTypeOption[];
}

export function AdminCardsManager({
  initialCards,
  initialTotal,
  filters,
  widgetTypes,
}: AdminCardsManagerProps): JSX.Element {
  const [cards, setCards] = useState<AdminCard[]>(initialCards);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<AdminCard | null>(null);
  const [deletingCard, setDeletingCard] = useState<AdminCard | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const skipDebouncedFetch = useRef(true);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const fetchCards = useCallback(async (p: number, s: string): Promise<void> => {
    setIsLoading(true);
    try {
      const r = await getAdminCards({
        page: p,
        limit: PAGE_SIZE,
        search: s.length > 0 ? s : undefined,
      });
      setCards(r.data);
      setTotal(r.meta.total);
      setPage(r.meta.page);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudieron cargar las cards';
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
    void fetchCards(1, debouncedSearch);
  }, [debouncedSearch, fetchCards]);

  useEffect(() => {
    if (!notification) {
      return;
    }
    const t = window.setTimeout(() => setNotification(null), 3000);
    return () => window.clearTimeout(t);
  }, [notification]);

  const handleCreate = async (data: CardFormData): Promise<void> => {
    try {
      await createCard(data);
      setShowModal(false);
      setEditingCard(null);
      setNotification({ type: 'success', message: 'Card creada correctamente' });
      await fetchCards(page, debouncedSearch);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo crear la card';
      setNotification({ type: 'error', message });
    }
  };

  const handleUpdate = async (id: string, data: CardFormData): Promise<void> => {
    const { widgetConfiguration, ...rest } = data;
    const payload: Partial<CardFormData> = { ...rest };
    if (Object.keys(widgetConfiguration).length > 0) {
      payload.widgetConfiguration = widgetConfiguration;
    }
    try {
      await updateCard(id, payload);
      setShowModal(false);
      setEditingCard(null);
      setNotification({ type: 'success', message: 'Card actualizada' });
      await fetchCards(page, debouncedSearch);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo actualizar la card';
      setNotification({ type: 'error', message });
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteCard(id);
      setDeletingCard(null);
      setNotification({ type: 'success', message: 'Card eliminada' });
      await fetchCards(page, debouncedSearch);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo eliminar la card';
      setNotification({ type: 'error', message });
    }
  };

  const handleRestore = async (id: string): Promise<void> => {
    try {
      await restoreCard(id);
      setNotification({ type: 'success', message: 'Card restaurada' });
      await fetchCards(page, debouncedSearch);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo restaurar la card';
      setNotification({ type: 'error', message });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-bold font-headline text-on-surface mb-6">Gestión de Agentes</h1>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-xl">
            search
          </span>
          <input
            type="search"
            placeholder="Buscar por título…"
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border-none text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar cards"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-2 rounded-xl font-semibold shadow-[0_8px_24px_rgba(24,28,32,0.04)] hover:shadow-[0_12px_32px_rgba(24,28,32,0.08)] transition-shadow shrink-0"
          onClick={() => {
            setEditingCard(null);
            setShowModal(true);
          }}
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Nuevo Agente
        </button>
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-outline mb-4 block">
        {total} cards
      </span>

      {isLoading ? (
        <div className="space-y-3">
          <div className="animate-pulse bg-surface-container rounded-xl h-24" />
          <div className="animate-pulse bg-surface-container rounded-xl h-24" />
          <div className="animate-pulse bg-surface-container rounded-xl h-24" />
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-outline">
          <span className="material-symbols-outlined text-6xl mb-4">inbox</span>
          <p className="text-on-surface-variant text-center">No hay cards que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((c) => (
            <AdminCardRow
              key={c.id}
              card={c}
              onEdit={(card) => {
                setEditingCard(card);
                setShowModal(true);
              }}
              onDelete={(card) => setDeletingCard(card)}
              onRestore={(card) => void handleRestore(card.id)}
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
            onClick={() => void fetchCards(page - 1, debouncedSearch)}
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
            onClick={() => void fetchCards(page + 1, debouncedSearch)}
          >
            Siguiente
          </button>
        </div>
      ) : null}

      {showModal ? (
        <CardFormModal
          key={editingCard?.id ?? 'new'}
          card={editingCard}
          filters={filters}
          widgetTypes={widgetTypes}
          onClose={() => {
            setShowModal(false);
            setEditingCard(null);
          }}
          onSave={async (data) => {
            if (editingCard) {
              await handleUpdate(editingCard.id, data);
            } else {
              await handleCreate(data);
            }
          }}
        />
      ) : null}

      {deletingCard ? (
        <DeleteConfirmModal
          card={deletingCard}
          onCancel={() => setDeletingCard(null)}
          onConfirm={async () => {
            await handleDelete(deletingCard.id);
          }}
        />
      ) : null}

      {notification ? (
        <div
          className={`fixed top-24 right-4 z-[70] max-w-sm rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(24,28,32,0.12)] font-body text-sm ${
            notification.type === 'success'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-error-container text-on-error-container'
          }`}
          role="status"
        >
          {notification.message}
        </div>
      ) : null}
    </div>
  );
}
