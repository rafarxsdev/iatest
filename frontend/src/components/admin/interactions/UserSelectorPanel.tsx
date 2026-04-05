import type { UserWithInteractionSummary } from '@types/interaction';
import { getInitials } from '@lib/utils';

export interface UserSelectorPanelProps {
  users: UserWithInteractionSummary[];
  searchValue: string;
  selectedUserId: string | null;
  isLoading: boolean;
  onSearch: (query: string) => void;
  onSelect: (user: UserWithInteractionSummary) => void;
}

export default function UserSelectorPanel({
  users,
  searchValue,
  selectedUserId,
  isLoading,
  onSearch,
  onSelect,
}: UserSelectorPanelProps): JSX.Element {
  return (
    <div className="w-80 shrink-0 bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_rgba(24,28,32,0.04)] flex flex-col overflow-hidden">
      <div className="bg-surface-container-low px-4 py-3">
        <h2 className="text-sm font-bold font-headline text-on-surface uppercase tracking-widest">Usuarios</h2>
        <p className="text-xs text-outline mt-0.5">{users.length} con actividad</p>
      </div>

      <div className="px-3 py-2 bg-surface-container-low">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[16px]">
            search
          </span>
          <input
            type="search"
            placeholder="Buscar usuario..."
            value={searchValue}
            className="w-full h-9 pl-8 pr-3 text-sm bg-surface-container rounded-lg border-none text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/30"
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Buscar usuario"
          />
        </div>
      </div>

      <div className="overflow-y-auto flex-1 max-h-[600px]">
        {isLoading ? (
          <div className="px-3 py-2 space-y-1">
            <div className="animate-pulse h-16 mx-0 my-1 bg-surface-container rounded-xl" />
            <div className="animate-pulse h-16 mx-0 my-1 bg-surface-container rounded-xl" />
            <div className="animate-pulse h-16 mx-0 my-1 bg-surface-container rounded-xl" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8">
            <p className="text-sm text-outline text-center">No se encontraron usuarios con actividad</p>
          </div>
        ) : (
          users.map((user) => {
            const selected = user.id === selectedUserId;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelect(user)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 border-l-2 ${
                  selected
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-surface-container-low border-transparent'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                    selected ? 'bg-primary text-white' : 'bg-primary-container text-primary'
                  }`}
                >
                  {getInitials(user.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{user.fullName}</p>
                  <p className="text-xs text-outline truncate">{user.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  {user.blockedWidgets > 0 ? (
                    <p className="text-xs font-bold text-error">
                      {user.blockedWidgets} bloqueado{user.blockedWidgets > 1 ? 's' : ''}
                    </p>
                  ) : null}
                  <p className="text-xs text-outline">
                    {user.totalWidgets} widget{user.totalWidgets !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
