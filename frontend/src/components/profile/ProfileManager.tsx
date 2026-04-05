import { useCallback, useEffect, useState } from 'react';
import type { AuthMeUser } from '@types/user';
import { formatDate, getInitials } from '@lib/utils';
import { getMe, updateProfile } from '@lib/api';
import ProfileInfoForm from './ProfileInfoForm';
import ProfileSecurityForm from './ProfileSecurityForm';

export interface ProfileManagerProps {
  userData: AuthMeUser;
}

function roleBadgeClass(roleName: string): string {
  if (roleName === 'admin') {
    return 'bg-primary-fixed text-on-primary-fixed-variant';
  }
  if (roleName === 'operator') {
    return 'bg-secondary-fixed text-on-secondary-fixed';
  }
  if (roleName === 'viewer') {
    return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
  }
  return 'bg-surface-container-high text-on-surface-variant';
}

export default function ProfileManager({ userData: initialUserData }: ProfileManagerProps): JSX.Element {
  const [userData, setUserData] = useState<AuthMeUser>(initialUserData);
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setUserData(initialUserData);
  }, [initialUserData]);

  useEffect(() => {
    if (!notification) {
      return;
    }
    const t = window.setTimeout(() => setNotification(null), 3000);
    return () => window.clearTimeout(t);
  }, [notification]);

  const refreshMe = useCallback(async (): Promise<void> => {
    const me = await getMe();
    setUserData(me);
  }, []);

  const handleUpdateInfo = async (data: { fullName: string }): Promise<void> => {
    setIsSubmitting(true);
    try {
      await updateProfile({ fullName: data.fullName });
      await refreshMe();
      setNotification({ type: 'success', message: 'Perfil actualizado correctamente' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo actualizar el perfil';
      setNotification({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    setIsSubmitting(true);
    try {
      await updateProfile({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setNotification({ type: 'success', message: 'Contraseña actualizada correctamente' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo actualizar la contraseña';
      setNotification({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <div className="bg-surface-container-lowest rounded-2xl p-6 mb-6 shadow-[0_8px_24px_rgba(24,28,32,0.04)] flex flex-wrap items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-white text-2xl font-bold font-headline shrink-0">
          {getInitials(userData.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold font-headline text-on-surface truncate">{userData.fullName}</h1>
          <p className="text-sm text-on-surface-variant truncate">{userData.email}</p>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest mt-1 ${roleBadgeClass(userData.role.name)}`}
          >
            {userData.role.name}
          </span>
        </div>
        <div className="ml-auto text-right w-full sm:w-auto">
          <p className="text-xs text-outline">Último acceso: {formatDate(userData.lastLoginAt)}</p>
          <p className="text-xs text-outline mt-1">Miembro desde: {formatDate(userData.createdAt)}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-surface-container rounded-xl p-1 mb-6">
        <button
          type="button"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
            activeTab === 'info'
              ? 'bg-surface-container-lowest shadow-sm text-on-surface font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          onClick={() => setActiveTab('info')}
        >
          <span className="material-symbols-outlined text-lg">person</span>
          Información personal
        </button>
        <button
          type="button"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
            activeTab === 'security'
              ? 'bg-surface-container-lowest shadow-sm text-on-surface font-semibold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          onClick={() => setActiveTab('security')}
        >
          <span className="material-symbols-outlined text-lg">lock</span>
          Seguridad
        </button>
      </div>

      {activeTab === 'info' ? (
        <ProfileInfoForm
          userData={{ fullName: userData.fullName, email: userData.email }}
          onSave={handleUpdateInfo}
          isSubmitting={isSubmitting}
        />
      ) : (
        <ProfileSecurityForm onSave={handleChangePassword} isSubmitting={isSubmitting} />
      )}

      {notification ? (
        <div
          className={`fixed top-24 right-4 z-[70] max-w-sm rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(24,28,32,0.12)] font-body text-sm ${
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
