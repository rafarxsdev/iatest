import { useEffect, useState } from 'react';

export interface ProfileInfoFormProps {
  userData: { fullName: string; email: string };
  onSave: (data: { fullName: string }) => Promise<void>;
  isSubmitting: boolean;
}

export default function ProfileInfoForm({ userData, onSave, isSubmitting }: ProfileInfoFormProps): JSX.Element {
  const [fullName, setFullName] = useState(userData.fullName);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFullName(userData.fullName);
    setIsDirty(false);
  }, [userData.fullName]);

  const inputClass =
    'w-full bg-surface-container-low rounded-xl h-12 px-4 border-none focus:ring-2 focus:ring-primary/30 text-on-surface';

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_24px_rgba(24,28,32,0.04)]">
      <h2 className="text-lg font-bold font-headline text-on-surface mb-5">Información personal</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="profile-fullname">
            Nombre completo
          </label>
          <input
            id="profile-fullname"
            type="text"
            className={inputClass}
            value={fullName}
            onChange={(e) => {
              const v = e.target.value;
              setFullName(v);
              setIsDirty(v !== userData.fullName);
            }}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <span className="block text-sm font-semibold text-on-surface mb-2">Correo electrónico</span>
          <div className="bg-surface-container rounded-xl h-12 px-4 flex items-center text-on-surface-variant">
            {userData.email}
          </div>
          <p className="text-xs text-outline mt-1">
            El correo no puede modificarse. Contacta al administrador si necesitas cambiarlo.
          </p>
        </div>
      </div>

      {isDirty ? (
        <div className="mt-6">
          <button
            type="button"
            className="bg-primary text-white px-6 py-2 rounded-xl font-semibold disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => void onSave({ fullName })}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
