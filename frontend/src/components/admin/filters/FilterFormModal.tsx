import { useMemo, useState } from 'react';
import type { AdminFilter } from '@types/filter';
import type { FilterFormData } from '@types/filter';
import type { FilterType } from '@types/filter';

export interface FilterFormModalProps {
  filter: AdminFilter | null;
  filterTypes: FilterType[];
  allFilters: AdminFilter[];
  onSave: (data: FilterFormData) => Promise<void>;
  onClose: () => void;
}

function formatValueKebab(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function emptyForm(): FilterFormData {
  return {
    label: '',
    value: '',
    filterTypeId: '',
    parentFilterId: null,
    configuration: {},
    sortOrder: 0,
    isActive: true,
  };
}

function filterToForm(f: AdminFilter): FilterFormData {
  return {
    label: f.label,
    value: f.value,
    filterTypeId: f.filterType.id,
    parentFilterId: f.parent?.id ?? null,
    configuration: f.configuration,
    sortOrder: f.sortOrder,
    isActive: f.isActive,
  };
}

export default function FilterFormModal({ filter, filterTypes, allFilters, onSave, onClose }: FilterFormModalProps): JSX.Element {
  const initial = useMemo(() => (filter ? filterToForm(filter) : emptyForm()), [filter]);
  const [formData, setFormData] = useState<FilterFormData>(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FilterFormData, string>>>({});

  const validate = (): boolean => {
    const next: Partial<Record<keyof FilterFormData, string>> = {};
    if (!formData.label.trim()) {
      next.label = 'La etiqueta es obligatoria';
    } else if (formData.label.trim().length < 2) {
      next.label = 'Mínimo 2 caracteres';
    }
    if (!formData.value.trim()) {
      next.value = 'El valor es obligatorio';
    } else if (/\s/.test(formData.value)) {
      next.value = 'No puede contener espacios';
    } else if (formData.value.length > 100) {
      next.value = 'Máximo 100 caracteres';
    }
    if (!formData.filterTypeId) {
      next.filterTypeId = 'Selecciona un tipo de control';
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
      await onSave({
        ...formData,
        label: formData.label.trim(),
        value: formData.value.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-surface-container-low rounded-xl h-12 px-4 border-none focus:ring-2 focus:ring-primary/30 text-on-surface';

  const parentOptions = allFilters.filter((f) => f.id !== filter?.id && f.isActive);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-4 py-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-form-title"
        className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_rgba(24,28,32,0.12)] w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 p-6 pb-4 bg-surface-container-lowest rounded-t-2xl">
          <h2 id="filter-form-title" className="text-xl font-bold font-headline text-on-surface">
            {filter ? 'Editar Filtro' : 'Nueva Categoría'}
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
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="filter-label">
              Etiqueta visible
            </label>
            <input
              id="filter-label"
              type="text"
              className={inputClass}
              value={formData.label}
              onChange={(e) => setFormData((f) => ({ ...f, label: e.target.value }))}
            />
            <p className="text-xs text-outline mt-2">Texto que verá el usuario en el desplegable</p>
            {errors.label ? <p className="text-error text-sm mt-1">{errors.label}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="filter-value">
              Valor interno
            </label>
            <input
              id="filter-value"
              type="text"
              className={inputClass}
              value={formData.value}
              onChange={(e) => {
                const v = formatValueKebab(e.target.value);
                setFormData((f) => ({ ...f, value: v }));
              }}
            />
            <p className="text-xs text-outline mt-2">Identificador enviado al backend. Sin espacios. Ej: estrategia-2024</p>
            {errors.value ? <p className="text-error text-sm mt-1">{errors.value}</p> : null}
            {filter ? (
              <div className="mt-2 bg-tertiary-fixed/30 text-on-tertiary-fixed rounded-lg p-2 text-xs">
                ⚠️ Cambiar el valor puede afectar filtros activos en el dashboard
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="filter-type">
              Tipo de control
            </label>
            <select
              id="filter-type"
              className={inputClass}
              value={formData.filterTypeId}
              onChange={(e) => setFormData((f) => ({ ...f, filterTypeId: e.target.value }))}
            >
              <option value="">Seleccionar tipo...</option>
              {filterTypes.map((ft) => (
                <option key={ft.id} value={ft.id}>
                  {ft.code} — {ft.description ?? ''}
                </option>
              ))}
            </select>
            {errors.filterTypeId ? <p className="text-error text-sm mt-1">{errors.filterTypeId}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="filter-parent">
              Categoría padre (opcional)
            </label>
            <select
              id="filter-parent"
              className={inputClass}
              value={formData.parentFilterId ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                setFormData((f) => ({ ...f, parentFilterId: v === '' ? null : v }));
              }}
            >
              <option value="">Sin padre (nivel raíz)</option>
              {parentOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({f.value})
                </option>
              ))}
            </select>
            <p className="text-xs text-outline mt-2">Úsalo para crear categorías dependientes jerárquicamente</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="filter-order">
              Orden
            </label>
            <input
              id="filter-order"
              type="number"
              min={0}
              className={inputClass}
              value={formData.sortOrder}
              onChange={(e) => setFormData((f) => ({ ...f, sortOrder: Number.parseInt(e.target.value, 10) || 0 }))}
            />
            <p className="text-xs text-outline mt-2">Número menor aparece primero en el desplegable</p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-container-low/50 p-4">
            <div>
              <p className="text-sm font-semibold text-on-surface">Categoría activa</p>
              <p className="text-xs text-outline mt-0.5">Las categorías inactivas no aparecen en el dashboard</p>
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
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
