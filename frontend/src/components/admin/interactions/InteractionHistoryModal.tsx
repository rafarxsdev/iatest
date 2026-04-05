import { useEffect, useState } from 'react';
import type { InteractionLogEntry } from '@types/interaction';
import { getInteractionHistory } from '@lib/api';
import { formatDate } from '@lib/utils';

export interface InteractionHistoryModalProps {
  userId: string;
  cardId: string;
  cardTitle: string;
  onClose: () => void;
}

function badgeForAction(code: string): { className: string; label: string } {
  if (code === 'WIDGET_INTERACTION') {
    return {
      className: 'bg-primary-fixed text-on-primary-fixed-variant',
      label: 'Uso registrado',
    };
  }
  if (code === 'WIDGET_BLOCKED') {
    return { className: 'bg-error-container text-on-error-container', label: 'Bloqueado' };
  }
  if (code === 'WIDGET_RESET') {
    return { className: 'bg-surface-container-high text-outline', label: 'Contador restaurado' };
  }
  return { className: 'bg-surface-container-high text-outline', label: code };
}

function iconForAction(code: string): { icon: string; wrap: string } {
  if (code === 'WIDGET_INTERACTION') {
    return { icon: 'touch_app', wrap: 'bg-primary/10 text-primary' };
  }
  if (code === 'WIDGET_BLOCKED') {
    return { icon: 'block', wrap: 'bg-error-container text-error' };
  }
  if (code === 'WIDGET_RESET') {
    return { icon: 'restart_alt', wrap: 'bg-surface-container-high text-on-surface-variant' };
  }
  return { icon: 'circle', wrap: 'bg-surface-container-high text-outline' };
}

export default function InteractionHistoryModal({
  userId,
  cardId,
  cardTitle,
  onClose,
}: InteractionHistoryModalProps): JSX.Element {
  const [history, setHistory] = useState<InteractionLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const rows = await getInteractionHistory(userId, cardId);
        if (!cancelled) {
          setHistory(rows);
        }
      } catch {
        if (!cancelled) {
          setHistory([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, cardId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-4 py-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
        className="bg-surface-container-lowest rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-[0_8px_24px_rgba(24,28,32,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-surface-container-low rounded-t-2xl flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 id="history-modal-title" className="text-lg font-bold font-headline text-on-surface">
              Historial de interacciones
            </h2>
            <p className="text-sm text-on-surface-variant truncate">{cardTitle}</p>
          </div>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant shrink-0"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {isLoading ? (
            <div>
              {[0, 1, 2, 3, 4].map((k) => (
                <div key={k} className="animate-pulse h-12 rounded-xl bg-surface-container mb-2" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-outline">history</span>
              <p className="text-sm text-outline mt-2">Sin historial registrado</p>
            </div>
          ) : (
            <div className="relative pl-2">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-outline/40" aria-hidden />

              {history.map((entry) => {
                const badge = badgeForAction(entry.actionTypeCode);
                const ic = iconForAction(entry.actionTypeCode);
                return (
                  <div key={`${entry.createdAt}-${entry.interactionNumber}`} className="flex gap-4 pb-4 relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${ic.wrap}`}
                    >
                      <span className="material-symbols-outlined text-lg">{ic.icon}</span>
                    </div>
                    <div className="bg-surface-container rounded-xl px-4 py-3 flex-1 min-w-0">
                      <span
                        className={`inline-flex rounded-full text-[10px] font-extrabold uppercase px-2 py-0.5 ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <p className="text-xs text-outline mt-1">
                        Uso #{entry.interactionNumber} de {entry.maxAtMoment} · {formatDate(entry.createdAt)}
                        {entry.ipAddress ? ` · ${entry.ipAddress}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
