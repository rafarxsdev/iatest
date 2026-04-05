import { useState } from 'react';

export interface ProfileSecurityFormProps {
  onSave: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  isSubmitting: boolean;
}

type Strength = 'none' | 'weak' | 'moderate' | 'strong';

function computeStrength(password: string): { level: Strength; label: string; barClass: string; width: string } {
  if (password.length === 0) {
    return { level: 'none', label: '', barClass: '', width: 'w-0' };
  }
  if (password.length < 8) {
    return { level: 'weak', label: 'Muy corta', barClass: 'bg-error', width: 'w-1/4' };
  }
  const hasDigit = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const strong = password.length >= 12 || (hasDigit && hasLetter && hasSymbol);
  if (strong) {
    return { level: 'strong', label: 'Fuerte', barClass: 'bg-primary', width: 'w-full' };
  }
  if (password.length < 12 && !hasDigit) {
    return { level: 'moderate', label: 'Moderada', barClass: 'bg-tertiary', width: 'w-2/4' };
  }
  return { level: 'moderate', label: 'Moderada', barClass: 'bg-tertiary', width: 'w-2/4' };
}

export default function ProfileSecurityForm({ onSave, isSubmitting }: ProfileSecurityFormProps): JSX.Element {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const strength = computeStrength(newPassword);
  const mismatch =
    confirmPassword.length > 0 && confirmPassword !== newPassword ? 'Las contraseñas no coinciden' : undefined;

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!currentPassword.trim()) {
      next.currentPassword = 'La contraseña actual es obligatoria';
    }
    if (!newPassword.trim()) {
      next.newPassword = 'La nueva contraseña es obligatoria';
    } else if (newPassword.length < 8) {
      next.newPassword = 'Mínimo 8 caracteres';
    }
    if (confirmPassword !== newPassword) {
      next.confirmPassword = 'Las contraseñas no coinciden';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (): void => {
    if (!validate()) {
      return;
    }
    void onSave({ currentPassword, newPassword });
  };

  const inputWrap = 'relative';
  const inputClass =
    'w-full bg-surface-container-low rounded-xl h-12 px-4 pr-12 border-none focus:ring-2 focus:ring-primary/30 text-on-surface';

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_24px_rgba(24,28,32,0.04)]">
      <h2 className="text-lg font-bold font-headline text-on-surface mb-5">Cambiar contraseña</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="pwd-current">
            Contraseña actual
          </label>
          <div className={inputWrap}>
            <input
              id="pwd-current"
              type={showCurrent ? 'text' : 'password'}
              className={inputClass}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setErrors((prev) => ({ ...prev, currentPassword: undefined }));
              }}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant p-1"
              onClick={() => setShowCurrent((s) => !s)}
              aria-label={showCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <span className="material-symbols-outlined text-xl">
                {showCurrent ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {errors.currentPassword ? (
            <p className="text-xs text-error mt-1">{errors.currentPassword}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="pwd-new">
            Nueva contraseña
          </label>
          <div className={inputWrap}>
            <input
              id="pwd-new"
              type={showNew ? 'text' : 'password'}
              className={inputClass}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((prev) => ({ ...prev, newPassword: undefined }));
              }}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant p-1"
              onClick={() => setShowNew((s) => !s)}
              aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <span className="material-symbols-outlined text-xl">{showNew ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          {newPassword.length > 0 && strength.level !== 'none' ? (
            <div className="mt-2">
              <div className="h-1 w-full rounded-full bg-surface-container-high overflow-hidden">
                <div className={`h-1 rounded-full transition-all ${strength.barClass} ${strength.width}`} />
              </div>
              <p className="text-xs text-outline mt-1">{strength.label}</p>
            </div>
          ) : null}
          {errors.newPassword ? <p className="text-xs text-error mt-1">{errors.newPassword}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="pwd-confirm">
            Confirmar nueva contraseña
          </label>
          <div className={inputWrap}>
            <input
              id="pwd-confirm"
              type={showConfirm ? 'text' : 'password'}
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant p-1"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <span className="material-symbols-outlined text-xl">
                {showConfirm ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {mismatch ? <p className="text-xs text-error mt-1">{mismatch}</p> : null}
          {errors.confirmPassword ? (
            <p className="text-xs text-error mt-1">{errors.confirmPassword}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          className="bg-primary text-white px-6 py-2 rounded-xl font-semibold disabled:opacity-60"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </div>
    </div>
  );
}
