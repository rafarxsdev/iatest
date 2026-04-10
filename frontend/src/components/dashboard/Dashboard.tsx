import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Card } from '@types/card';
import type { Filter } from '@types/filter';
import type { User } from '@types/user';
import { getCards } from '@lib/api-cards-client';
import {
  buildEmbedSandboxDocument,
  MODAL_IFRAME_HEIGHT_PX,
  MODAL_IFRAME_WIDTH_PX,
  tryParseFullPageEmbedUrl,
} from './embed-sandbox-html';
import CardGrid from './CardGrid';
import FilterBar from './FilterBar';
import { DEFAULT_CARD_SORT_MODE, sortCards, type CardSortMode } from './sort-cards';

export interface DashboardProps {
  filters: Filter[];
  initialCards: Card[];
  initialTotal: number;
  user: User;
}

export default function Dashboard({ filters, initialCards, initialTotal, user }: DashboardProps) {
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<CardSortMode>(DEFAULT_CARD_SORT_MODE);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const handleFilterChange = useCallback(async (id: string | null) => {
    setSelectedFilterId(id);
    setIsLoading(true);
    try {
      const { data, meta } = await getCards({ filterId: id ?? undefined });
      setCards(data);
      setTotal(meta.total);
    } catch {
      /* 401 lo gestiona apiFetch en el cliente */
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return cards;
    }
    return cards.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.htmlContent.toLowerCase().includes(q),
    );
  }, [cards, searchQuery]);

  const sortedCards = useMemo(() => sortCards(filteredCards, sortMode), [filteredCards, sortMode]);

  useEffect(() => {
    if (sortedCards.length === 0) {
      setSelectedCardId(null);
      return;
    }
    if (selectedCardId && !sortedCards.some((c) => c.id === selectedCardId)) {
      setSelectedCardId(null);
    }
  }, [sortedCards, selectedCardId]);

  const selectedCard = useMemo(
    () => sortedCards.find((c) => c.id === selectedCardId) ?? null,
    [sortedCards, selectedCardId],
  );

  const selectedEmbed = useMemo(() => {
    if (!selectedCard) {
      return { mode: 'none' as const };
    }
    const remoteUrl = tryParseFullPageEmbedUrl(selectedCard.htmlContent);
    if (remoteUrl) {
      return { mode: 'remote' as const, url: remoteUrl };
    }
    return {
      mode: 'srcdoc' as const,
      srcDoc: buildEmbedSandboxDocument(
        selectedCard.htmlContent,
        MODAL_IFRAME_WIDTH_PX,
        MODAL_IFRAME_HEIGHT_PX,
      ),
    };
  }, [selectedCard]);

  const displayTotal = searchQuery.trim() ? filteredCards.length : total;

  const handleOpenAgent = useCallback((card: Card) => {
    setSelectedCardId(card.id);
  }, []);

  return (
    <div className="w-full">
      <p className="font-body text-[0.9375rem] text-on-surface-variant mb-4">
        Hola, <strong className="text-on-surface">{user.fullName}</strong>
      </p>
      <FilterBar
        filters={filters}
        total={displayTotal}
        selectedFilterId={selectedFilterId}
        onFilterChange={handleFilterChange}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        sortMode={sortMode}
        onSortChange={setSortMode}
        disabled={isLoading}
      />
      <div className="grid grid-cols-1 items-start gap-6 md:pr-[25.5rem]">
        <section className="min-w-0">
          <CardGrid
            cards={sortedCards}
            isLoading={isLoading}
            selectedCardId={selectedCardId}
            onOpenAgent={handleOpenAgent}
          />
        </section>

        <aside className="md:fixed md:right-4 md:top-2 md:z-[60] md:flex md:w-[24.5rem] md:flex-col">
          <div className="flex h-[calc(100dvh-1rem)] min-h-0 flex-col overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-[0_8px_24px_rgba(24,28,32,0.04)]">
            <div className="shrink-0">
              <h2 className="font-headline text-base font-bold text-on-surface">Agente seleccionado</h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                Selecciona un Agente de las opciones disponibles en el panel izquierdo para que pueda probarlo en vivo
              </p>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl bg-surface-container-low leading-[0]">
              {selectedCard ? (
                <iframe
                  key={`${selectedCard.id}-${selectedEmbed.mode === 'remote' ? selectedEmbed.url : 'srcdoc'}`}
                  title={`Agente: ${selectedCard.title}`}
                  src={selectedEmbed.mode === 'remote' ? selectedEmbed.url : undefined}
                  srcDoc={selectedEmbed.mode === 'srcdoc' ? selectedEmbed.srcDoc : undefined}
                  width={MODAL_IFRAME_WIDTH_PX}
                  height={MODAL_IFRAME_HEIGHT_PX}
                  className="m-0 block max-w-full origin-top-left scale-[0.85] border-0 p-0"
                  style={{ width: MODAL_IFRAME_WIDTH_PX, height: MODAL_IFRAME_HEIGHT_PX, verticalAlign: 'top' }}
                  tabIndex={-1}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                />
              ) : (
                <div
                  className="flex min-h-[12rem] items-center justify-center text-sm text-on-surface-variant"
                  style={{ width: MODAL_IFRAME_WIDTH_PX, maxWidth: '100%' }}
                >
                  No hay un Agente seleccionado.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
