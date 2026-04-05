import type { UserInteractionDetail, UserWithInteractionSummary } from '@types/interaction';
import { getInitials } from '@lib/utils';
import WidgetInteractionRow from './WidgetInteractionRow';

export interface UserInteractionsPanelProps {
  user: UserWithInteractionSummary;
  interactions: UserInteractionDetail[];
  isLoading: boolean;
  resettingCardId: string | null;
  resettingAll: boolean;
  onResetSingle: (cardId: string) => void;
  onResetAll: () => void;
  onViewHistory: (cardId: string, cardTitle: string) => void;
}

export default function UserInteractionsPanel({
  user,
  interactions,
  isLoading,
  resettingCardId,
  resettingAll,
  onResetSingle,
  onResetAll,
  onViewHistory,
}: UserInteractionsPanelProps): JSX.Element {
  const blocked = interactions.filter((i) => i.isBlocked);
  const active = interactions.filter((i) => !i.isBlocked);
  const hasCountersToReset = interactions.filter((i) => i.interactionCount > 0).length > 0;

  const metric = (value: number, label: string, valueClass?: string) => (
    <div className="text-center">
      <p className={`text-xl font-bold font-headline ${valueClass ?? 'text-on-surface'}`}>{value}</p>
      <p className="text-xs text-outline uppercase tracking-widest">{label}</p>
    </div>
  );

  return (
    <div className="flex-1 bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_rgba(24,28,32,0.04)] flex flex-col min-w-0">
      <div className="px-6 py-4 bg-surface-container-low rounded-t-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold text-lg shrink-0">
            {getInitials(user.fullName)}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold font-headline text-on-surface truncate">{user.fullName}</h2>
            <p className="text-sm text-on-surface-variant truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {metric(user.totalWidgets, 'widgets')}
            {metric(user.totalInteractions, 'usos')}
            {metric(
              user.blockedWidgets,
              'bloqueados',
              user.blockedWidgets > 0 ? 'text-error' : 'text-on-surface',
            )}
          </div>
          <div className="w-px h-10 bg-outline/40 hidden sm:block" aria-hidden />

          <button
            type="button"
            disabled={resettingAll || !hasCountersToReset}
            title={!hasCountersToReset ? 'No hay contadores que restaurar' : undefined}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              resettingAll || !hasCountersToReset
                ? 'bg-surface-container-high text-outline cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
            onClick={() => {
              if (!resettingAll && hasCountersToReset) {
                onResetAll();
              }
            }}
          >
            {resettingAll ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                Restaurando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">restart_alt</span>
                Restaurar todos
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6 flex-1">
        {isLoading ? (
          <div>
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className="animate-pulse h-20 rounded-xl bg-surface-container mb-3" />
            ))}
          </div>
        ) : interactions.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-outline">widgets</span>
            <p className="text-on-surface-variant mt-2">Este usuario no ha interactuado con ningún widget</p>
          </div>
        ) : (
          <>
            {blocked.length > 0 ? (
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-error mb-3">
                  Bloqueados ({blocked.length})
                </p>
                <div className="space-y-3">
                  {blocked.map((i) => (
                    <WidgetInteractionRow
                      key={i.id}
                      interaction={i}
                      isResetting={resettingCardId === i.cardId}
                      onReset={onResetSingle}
                      onViewHistory={onViewHistory}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {active.length > 0 ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-outline mb-3">
                  Con actividad ({active.length})
                </p>
                <div className="space-y-3">
                  {active.map((i) => (
                    <WidgetInteractionRow
                      key={i.id}
                      interaction={i}
                      isResetting={resettingCardId === i.cardId}
                      onReset={onResetSingle}
                      onViewHistory={onViewHistory}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
