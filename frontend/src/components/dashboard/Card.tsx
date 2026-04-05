import type { Card as CardType } from '@types/card';
import InteractionGuard from './InteractionGuard';

const WIDGET_ICONS: Record<string, string> = {
  form: 'edit_note',
  video: 'play_circle',
  quiz: 'quiz',
  survey: 'assignment',
  embed: 'web_asset',
};

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
}

export default function Card({ card }: CardProps) {
  const icon = WIDGET_ICONS[card.widgetType.code] ?? 'widgets';
  const badgeStyle = BADGE_STYLES[card.widgetType.code] ?? BADGE_STYLES.default;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_8px_24px_rgba(24,28,32,0.04)] transition-all hover:shadow-[0_12px_32px_rgba(24,28,32,0.08)] flex flex-col gap-4">
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-2 ${badgeStyle}`}
          >
            {card.widgetType.label}
          </div>
          <h3 className="text-lg font-bold text-on-surface leading-tight">{card.title}</h3>
        </div>
        <div className="w-12 h-12 shrink-0 rounded-full bg-surface-container flex items-center justify-center text-primary">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
      </div>
      <InteractionGuard cardId={card.id} initialStatus={card.interactionStatus}>
        <div
          className="text-sm text-on-surface-variant"
          dangerouslySetInnerHTML={{ __html: card.htmlContent }}
        />
      </InteractionGuard>
    </div>
  );
}
