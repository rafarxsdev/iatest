import { useCallback, useMemo, useState } from 'react';
import type { Card } from '@types/card';
import type { Filter } from '@types/filter';
import type { User } from '@types/user';
import { getCards } from '@lib/api';
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

  const displayTotal = searchQuery.trim() ? filteredCards.length : total;

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
      <CardGrid cards={sortedCards} isLoading={isLoading} />
    </div>
  );
}
