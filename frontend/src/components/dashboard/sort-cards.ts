import type { Card } from '@types/card';

/** Criterios de ordenación de cards en el dashboard (solo cliente). */
export type CardSortMode =
  | 'sortOrder-asc'
  | 'sortOrder-desc'
  | 'title-asc'
  | 'title-desc'
  | 'activity-desc'
  | 'activity-asc';

export const DEFAULT_CARD_SORT_MODE: CardSortMode = 'sortOrder-asc';

function activityTime(c: Card): number {
  const raw = c.interactionStatus.lastInteractionAt;
  if (!raw) {
    return -1;
  }
  return new Date(raw).getTime();
}

/**
 * Ordena una copia del array de cards según el modo (no muta el original).
 */
export function sortCards(cards: Card[], mode: CardSortMode): Card[] {
  const copy = [...cards];

  switch (mode) {
    case 'sortOrder-asc':
      return copy.sort((a, b) => a.sortOrder - b.sortOrder);
    case 'sortOrder-desc':
      return copy.sort((a, b) => b.sortOrder - a.sortOrder);
    case 'title-asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));
    case 'title-desc':
      return copy.sort((a, b) => b.title.localeCompare(a.title, 'es', { sensitivity: 'base' }));
    case 'activity-desc': {
      return copy.sort((a, b) => {
        const ta = activityTime(a);
        const tb = activityTime(b);
        if (ta === -1 && tb === -1) {
          return a.sortOrder - b.sortOrder;
        }
        if (ta === -1) {
          return 1;
        }
        if (tb === -1) {
          return -1;
        }
        return tb - ta;
      });
    }
    case 'activity-asc': {
      return copy.sort((a, b) => {
        const ta = activityTime(a);
        const tb = activityTime(b);
        if (ta === -1 && tb === -1) {
          return a.sortOrder - b.sortOrder;
        }
        if (ta === -1) {
          return -1;
        }
        if (tb === -1) {
          return 1;
        }
        return ta - tb;
      });
    }
    default:
      return copy;
  }
}

export const CARD_SORT_OPTIONS: { value: CardSortMode; label: string }[] = [
  { value: 'sortOrder-asc', label: 'Orden del tablero' },
  { value: 'sortOrder-desc', label: 'Orden del tablero (inverso)' },
  { value: 'activity-desc', label: 'Última actividad (más reciente)' },
  { value: 'activity-asc', label: 'Última actividad (más antigua)' },
  { value: 'title-asc', label: 'Título (A → Z)' },
  { value: 'title-desc', label: 'Título (Z → A)' },
];
