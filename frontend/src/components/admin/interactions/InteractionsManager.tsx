import { useCallback, useEffect, useRef, useState } from 'react';
import type { UserInteractionDetail, UserWithInteractionSummary } from '@types/interaction';
import {
  getUserInteractions,
  getUsersWithInteractions,
  resetAllInteractions,
  resetSingleInteraction,
} from '@lib/api';
import UserSelectorPanel from './UserSelectorPanel';
import UserInteractionsPanel from './UserInteractionsPanel';
import InteractionHistoryModal from './InteractionHistoryModal';
import ResetAllConfirmModal from './ResetAllConfirmModal';

export interface InteractionsManagerProps {
  initialUsers: UserWithInteractionSummary[];
}

export default function InteractionsManager({ initialUsers }: InteractionsManagerProps): JSX.Element {
  const [users, setUsers] = useState<UserWithInteractionSummary[]>(initialUsers);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithInteractionSummary | null>(null);
  const [interactions, setInteractions] = useState<UserInteractionDetail[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);
  const [resettingCardId, setResettingCardId] = useState<string | null>(null);
  const [resettingAll, setResettingAll] = useState(false);
  const [historyModal, setHistoryModal] = useState<{
    userId: string;
    cardId: string;
    cardTitle: string;
  } | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const skipSearchDebounce = useRef(true);

  const refreshUsersList = useCallback(async (searchQuery: string): Promise<void> => {
    setIsLoadingUsers(true);
    try {
      const q = searchQuery.trim();
      const list = await getUsersWithInteractions(q.length > 0 ? q : undefined);
      setUsers(list);
      setSelectedUser((prev) => {
        if (!prev) {
          return null;
        }
        const found = list.find((u) => u.id === prev.id);
        return found ?? null;
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudieron cargar los usuarios';
      setNotification({ type: 'error', message });
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (skipSearchDebounce.current) {
      skipSearchDebounce.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      void refreshUsersList(userSearch);
    }, 400);
    return () => window.clearTimeout(t);
  }, [userSearch, refreshUsersList]);

  useEffect(() => {
    if (!notification) {
      return;
    }
    const id = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(id);
  }, [notification]);

  const handleSelectUser = useCallback(async (user: UserWithInteractionSummary): Promise<void> => {
    setSelectedUser(user);
    setIsLoadingInteractions(true);
    try {
      const rows = await getUserInteractions(user.id);
      setInteractions(rows);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudieron cargar las interacciones';
      setNotification({ type: 'error', message });
      setInteractions([]);
    } finally {
      setIsLoadingInteractions(false);
    }
  }, []);

  const handleResetSingle = useCallback(
    async (cardId: string): Promise<void> => {
      if (!selectedUser) {
        return;
      }
      setResettingCardId(cardId);
      try {
        await resetSingleInteraction(selectedUser.id, cardId);
        const rows = await getUserInteractions(selectedUser.id);
        setInteractions(rows);
        await refreshUsersList(userSearch);
        setNotification({ type: 'success', message: 'Contador restaurado correctamente' });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'No se pudo restaurar el contador';
        setNotification({ type: 'error', message });
      } finally {
        setResettingCardId(null);
      }
    },
    [selectedUser, refreshUsersList, userSearch],
  );

  const handleConfirmResetAll = useCallback(async (): Promise<void> => {
    if (!selectedUser) {
      return;
    }
    setResettingAll(true);
    setConfirmResetAll(false);
    try {
      const { resetCount } = await resetAllInteractions(selectedUser.id);
      const rows = await getUserInteractions(selectedUser.id);
      setInteractions(rows);
      await refreshUsersList(userSearch);
      setNotification({
        type: 'success',
        message: `Se restauraron ${resetCount} contadores`,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudieron restaurar los contadores';
      setNotification({ type: 'error', message });
    } finally {
      setResettingAll(false);
    }
  }, [selectedUser, refreshUsersList, userSearch]);

  return (
    <div className="flex gap-6 min-h-[600px] flex-col lg:flex-row">
      <UserSelectorPanel
        users={users}
        searchValue={userSearch}
        selectedUserId={selectedUser?.id ?? null}
        isLoading={isLoadingUsers}
        onSearch={setUserSearch}
        onSelect={(u) => {
          void handleSelectUser(u);
        }}
      />

      <div className="flex-1 min-w-0">
        {selectedUser === null ? (
          <div className="bg-surface-container-lowest rounded-2xl flex flex-col items-center justify-center h-full min-h-[400px] shadow-[0_8px_24px_rgba(24,28,32,0.04)] px-6">
            <span className="material-symbols-outlined text-6xl text-outline mb-4">manage_history</span>
            <p className="text-on-surface-variant font-semibold text-center">
              Selecciona un usuario para ver sus widgets
            </p>
            <p className="text-sm text-outline mt-1 text-center max-w-sm">
              Solo aparecen usuarios que han interactuado con al menos un widget
            </p>
          </div>
        ) : (
          <UserInteractionsPanel
            user={selectedUser}
            interactions={interactions}
            isLoading={isLoadingInteractions}
            resettingCardId={resettingCardId}
            resettingAll={resettingAll}
            onResetSingle={(cardId) => void handleResetSingle(cardId)}
            onResetAll={() => setConfirmResetAll(true)}
            onViewHistory={(cardId, cardTitle) =>
              setHistoryModal({
                userId: selectedUser.id,
                cardId,
                cardTitle,
              })
            }
          />
        )}
      </div>

      {historyModal ? (
        <InteractionHistoryModal
          userId={historyModal.userId}
          cardId={historyModal.cardId}
          cardTitle={historyModal.cardTitle}
          onClose={() => setHistoryModal(null)}
        />
      ) : null}

      {confirmResetAll && selectedUser ? (
        <ResetAllConfirmModal
          user={selectedUser}
          interactions={interactions}
          onConfirm={() => void handleConfirmResetAll()}
          onCancel={() => setConfirmResetAll(false)}
        />
      ) : null}

      {notification ? (
        <div
          className={`fixed top-24 right-4 z-[120] max-w-sm rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(24,28,32,0.12)] font-body text-sm ${
            notification.type === 'success'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-error-container text-on-error-container'
          }`}
          role="status"
        >
          {notification.message}
        </div>
      ) : null}
    </div>
  );
}
