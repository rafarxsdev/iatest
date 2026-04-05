import { useMemo, useState } from 'react';
import type { AdminUser } from '@types/user';
import type { UserFormData } from '@types/user';

export interface UserFormModalProps {
  user: AdminUser | null;
  roles: { id: string; name: string; description: string }[];
  onSave: (data: UserFormData) => Promise<void>;
  onClose: () => void;
}

function emptyForm(): UserFormData {
  return {
    email: '',
    fullName: '',
    roleId: '',
    password: '',
    isActive: true,
  };
}

function userToForm(u: AdminUser): UserFormData {
  return {
    email: u.email,
    fullName: u.fullName,
    roleId: u.role.id,
    password: '',
    isActive: u.isActive,
  };
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrorKey = keyof UserFormData | 'confirmPassword';

export default function UserFormModal({ user, roles, onSave, onClose }: UserFormModalProps): JSX.Element {
  const initial = useMemo(() => (user ? userToForm(user) : emptyForm()), [user]);
  const [formData, setFormData] = useState<UserFormData>(initial);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FormErrorKey, string>>>({});
  const [showPassword, setShowPassword] = useState(false);

  const isEdit = user !== null;
  const inputClass =
    'w-full bg-surface-container-low rounded-xl h-12 px-4 border-none focus:ring-2 focus:ring-primary/30 text-on-surface';

  const validate = (): boolean => {
    const next: Partial<Record<FormErrorKey, string>> = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      next.fullName = 'Mínimo 2 caracteres';
    }
    if (!isEdit) {
      if (!formData.email.trim()) {
        next.email = 'El correo es obligatorio';
      } else if (!emailRe.test(formData.email.trim())) {
        next.email = 'Formato de correo inválido';
      }
    }
    if (!formData.roleId) {
      next.roleId = 'Selecciona un rol';
    }
    if (!isEdit) {
      if (!formData.password || formData.password.length < 8) {
        next.password = 'La contraseña debe tener al menos 8 caracteres';
      } else if (formData.password !== confirmPassword) {
        next.confirmPassword = 'Las contraseñas no coinciden';
      }
    } else if (formData.password && formData.password.length > 0 && formData.password.length < 8) {
      next.password = 'Mínimo 8 caracteres si indicas contraseña';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: UserFormData = {
        email: formData.email.trim().toLowerCase(),
        fullName: formData.fullName.trim(),
        roleId: formData.roleId,
        isActive: formData.isActive,
        password: formData.password && formData.password.length > 0 ? formData.password : undefined,
      };
      await onSave(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-4 py-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_rgba(24,28,32,0.12)] w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 p-6 pb-4 bg-surface-container-lowest rounded-t-2xl">
          <h2 id="user-form-title" className="text-xl font-bold font-headline text-on-surface">
            {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant shrink-0"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 pt-2 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="user-fullname">
              Nombre completo
            </label>
            <input
              id="user-fullname"
              type="text"
              className={inputClass}
              value={formData.fullName}
              onChange={(e) => setFormData((f) => ({ ...f, fullName: e.target.value }))}
            />
            {errors.fullName ? <p className="text-error text-sm mt-1">{errors.fullName}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="user-email">
              Correo electrónico
            </label>
            <input
              id="user-email"
              type="email"
              className={isEdit ? `${inputClass} bg-surface-container cursor-not-allowed` : inputClass}
              value={formData.email}
              onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
              disabled={isEdit}
            />
            {isEdit ? (
              <p className="text-xs text-outline mt-1">El correo no puede modificarse</p>
            ) : null}
            {errors.email ? <p className="text-error text-sm mt-1">{errors.email}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="user-role">
              Rol
            </label>
            <select
              id="user-role"
              className={inputClass}
              value={formData.roleId}
              onChange={(e) => setFormData((f) => ({ ...f, roleId: e.target.value }))}
            >
              <option value="">Seleccionar rol...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.roleId ? <p className="text-error text-sm mt-1">{errors.roleId}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="user-password">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="user-password"
                type={showPassword ? 'text' : 'password'}
                className={`${inputClass} pr-12`}
                value={formData.password ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData((f) => ({ ...f, password: v }));
                  setErrors((prev) => {
                    if (!prev.password && !prev.confirmPassword) {
                      return prev;
                    }
                    const { password: _p, confirmPassword: _c, ...rest } = prev;
                    return rest;
                  });
                }}
                autoComplete={isEdit ? 'new-password' : 'new-password'}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant p-1"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {isEdit ? (
              <div className="bg-surface-container rounded-lg p-2 text-xs text-on-surface-variant mt-2">
                Dejar vacío para mantener la contraseña actual
              </div>
            ) : null}
            {errors.password ? <p className="text-error text-sm mt-1">{errors.password}</p> : null}
          </div>

          {!isEdit ? (
            <div>
              <label
                className="block text-sm font-semibold text-on-surface mb-2"
                htmlFor="user-password-confirm"
              >
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="user-password-confirm"
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClass} pr-12`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((prev) => {
                      if (!prev.confirmPassword) {
                        return prev;
                      }
                      const { confirmPassword: _c, ...rest } = prev;
                      return rest;
                    });
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant p-1"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="text-error text-sm mt-1">{errors.confirmPassword}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-container-low/50 p-4">
            <div>
              <p className="text-sm font-semibold text-on-surface">Usuario activo</p>
              <p className="text-xs text-outline mt-0.5">Los usuarios inactivos no pueden iniciar sesión</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.isActive}
              className={`relative w-11 h-6 shrink-0 rounded-full cursor-pointer transition-colors duration-200 ${
                formData.isActive ? 'bg-primary' : 'bg-surface-container-high'
              }`}
              onClick={() => setFormData((f) => ({ ...f, isActive: !f.isActive }))}
            >
              <span
                className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  formData.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 pt-2">
          <button
            type="button"
            className="px-6 py-2 bg-surface-container-high text-on-surface-variant rounded-xl font-semibold hover:bg-surface-container-highest transition-colors"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-6 py-2 bg-primary text-white rounded-xl font-semibold disabled:opacity-60"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (isEdit ? 'Guardando...' : 'Creando...') : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
