import type { Card } from '@types/card';
import CardComponent from './Card';

export interface CardGridProps {
  cards: Card[];
  isLoading?: boolean;
  selectedCardId?: string | null;
  onOpenAgent: (card: Card) => void;
}

function SkeletonCard() {
  return (
    <div className="min-w-0 w-full bg-surface-container-lowest rounded-xl p-4">
      <div className="flex flex-row items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full animate-pulse bg-surface-container-high" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-16 rounded-full animate-pulse bg-surface-container-high" />
          <div className="h-5 w-full max-w-[12rem] rounded-md animate-pulse bg-surface-container-high" />
        </div>
      </div>
      <div className="mt-4 h-11 w-full rounded-xl animate-pulse bg-surface-container-high" />
    </div>
  );
}

export default function CardGrid({ cards, isLoading, selectedCardId, onOpenAgent }: CardGridProps) {
  if (isLoading) {
    return (
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="material-symbols-outlined text-5xl text-outline">inbox</span>
        <p className="mt-2 text-sm text-on-surface-variant">No hay contenido disponible</p>
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <CardComponent
          key={card.id}
          card={card}
          onOpenAgent={onOpenAgent}
          isSelected={selectedCardId === card.id}
        />
      ))}
    </div>
  );
}
