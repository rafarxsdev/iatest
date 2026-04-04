import type { Card } from '@types/card';
import CardComponent from './Card';

export interface CardGridProps {
  cards: Card[];
  isLoading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 flex items-start justify-between gap-4">
      <div className="flex-1 space-y-3">
        <div className="h-4 w-20 rounded-full animate-pulse bg-surface-container-high" />
        <div className="h-5 w-3/4 max-w-xs rounded-md animate-pulse bg-surface-container-high" />
        <div className="h-3 w-full rounded-md animate-pulse bg-surface-container-high" />
        <div className="h-3 w-5/6 rounded-md animate-pulse bg-surface-container-high" />
      </div>
      <div className="w-12 h-12 shrink-0 rounded-full animate-pulse bg-surface-container-high" />
    </div>
  );
}

export default function CardGrid({ cards, isLoading }: CardGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-4">
      {cards.map((card) => (
        <CardComponent key={card.id} card={card} />
      ))}
    </div>
  );
}
