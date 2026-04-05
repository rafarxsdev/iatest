import type { UserInteractionDetail } from '@types/interaction';
import { formatDate } from '@lib/utils';

const WIDGET_ICONS: Record<string, string> = {
  form: 'edit_note',
  video: 'play_circle',
  quiz: 'quiz',
  survey: 'assignment',
  embed: 'web_asset',
};

export interface WidgetInteractionRowProps {
  interaction: UserInteractionDetail;
  isResetting: boolean;
  onReset: (cardId: string) => void;
  onViewHistory: (cardId: string, cardTitle: string) => void;
}

export default function WidgetInteractionRow({
  interaction,
  isResetting,
  onReset,
  onViewHistory,
}: WidgetInteractionRowProps): JSX.Element {
  const { isBlocked, usagePercent } = interaction;
  const icon = WIDGET_ICONS[interaction.widgetCode] ?? 'widgets';

  const rowClass =
    isBlocked
      ? 'ring-1 ring-error/20 bg-error-container/10'
      : !isBlocked && usagePercent >= 60
        ? 'ring-1 ring-tertiary/20'
        : '';

  const iconTone = isBlocked ? 'text-error' : usagePercent >= 60 ? 'text-tertiary' : 'text-primary';

  const barClass = isBlocked ? 'bg-error' : usagePercent >= 60 ? 'bg-tertiary' : 'bg-primary';

  return (
    <div className={`bg-surface-container rounded-xl p-4 flex items-center gap-4 ${rowClass}`}>
      <div
        className={`w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 ${iconTone}`}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-on-surface">{interaction.cardTitle}</p>
          <span className="inline-flex rounded-full bg-surface-container-highest text-outline text-[10px] px-2 py-0.5 uppercase tracking-widest">
            {interaction.filterLabel}
          </span>
        </div>

        <div className="mt-2 mb-1">
          <div className="flex justify-between text-xs text-outline mb-1">
            <span>
              {interaction.interactionCount} de {interaction.limitAtCreation} usos
            </span>
            <span className={isBlocked ? 'text-error font-semibold' : ''}>
              {isBlocked ? 'Bloqueado' : `${interaction.remaining} restantes`}
            </span>
          </div>
          <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barClass}`}
              style={{ width: `${Math.min(interaction.usagePercent, 100)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-outline mt-1">
          Política: {interaction.resetPolicyCode}
          {interaction.lastResetAt ? ` · Último reset: ${formatDate(interaction.lastResetAt)}` : ''}
          {interaction.lastInteractionAt
            ? ` · Última actividad: ${formatDate(interaction.lastInteractionAt)}`
            : ''}
        </p>
      </div>

      <div className="shrink-0 flex gap-1">
        <button
          type="button"
          className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
          title="Ver historial de interacciones"
          onClick={() => onViewHistory(interaction.cardId, interaction.cardTitle)}
        >
          <span className="material-symbols-outlined">history</span>
        </button>

        {isResetting ? (
          <span className="p-2 rounded-full bg-surface-container-high text-outline cursor-not-allowed inline-flex">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          </span>
        ) : interaction.interactionCount === 0 && !isBlocked ? (
          <span
            className="p-2 rounded-full text-outline cursor-not-allowed opacity-40 inline-flex"
            title="El contador ya está en cero"
          >
            <span className="material-symbols-outlined">restart_alt</span>
          </span>
        ) : (
          <button
            type="button"
            className={`p-2 rounded-full inline-flex ${
              isBlocked
                ? 'hover:bg-error-container text-error'
                : 'hover:bg-surface-container text-primary'
            }`}
            title="Restaurar contador de este widget"
            onClick={() => onReset(interaction.cardId)}
          >
            <span className="material-symbols-outlined">restart_alt</span>
          </button>
        )}
      </div>
    </div>
  );
}
