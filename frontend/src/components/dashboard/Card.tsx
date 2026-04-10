import type { Card as CardType } from '@types/card';
import InteractionGuard from './InteractionGuard';

const BADGE_STYLES: Record<string, string> = {
  form: 'bg-secondary-fixed text-on-secondary-fixed',
  video: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  quiz: 'bg-primary-fixed text-on-primary-fixed-variant',
  survey: 'bg-secondary-fixed text-on-secondary-fixed',
  embed: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  default: 'bg-secondary-fixed text-on-secondary-fixed',
};

export interface CardProps {
  card: CardType;
  onOpenAgent: (card: CardType) => void;
  isSelected?: boolean;
}

export default function Card({ card, onOpenAgent, isSelected = false }: CardProps) {
  const iconName = card.iconName ?? 'widgets';
  const badgeStyle = BADGE_STYLES[card.widgetType.code] ?? BADGE_STYLES.default;

  return (
    <div
      className={`flex h-full min-h-0 min-w-0 w-full flex-col rounded-xl p-4 shadow-[0_8px_24px_rgba(24,28,32,0.04)] transition-all ${
        isSelected
          ? 'bg-primary-container/40 ring-2 ring-primary/30'
          : 'bg-surface-container-lowest hover:shadow-[0_12px_32px_rgba(24,28,32,0.08)]'
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden
            >
              {iconName}
            </span>
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div
              className={`mb-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${badgeStyle}`}
            >
              {card.widgetType.label}
            </div>
            <h3 className="font-headline text-base font-bold text-on-surface leading-snug">{card.title}</h3>
          </div>
        </div>

        <InteractionGuard cardId={card.id} initialStatus={card.interactionStatus}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => {
              onOpenAgent(card);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white bg-primary shadow-[0_8px_24px_rgba(24,28,32,0.04)] hover:shadow-[0_12px_32px_rgba(24,28,32,0.08)] transition-shadow [&_.material-symbols-outlined]:text-white"
          >
            <span className="material-symbols-outlined text-lg text-white" aria-hidden>
              smart_toy
            </span>
            Abrir Agente
          </button>
        </InteractionGuard>
      </div>
    </div>
  );
}
