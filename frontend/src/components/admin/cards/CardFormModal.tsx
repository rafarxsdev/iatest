import { useMemo, useState } from 'react';
import type { AdminCard, CardFormData } from '@types/card';
import type { Filter, WidgetTypeOption } from '@types/filter';

export interface CardFormModalProps {
  card: AdminCard | null;
  filters: Filter[];
  widgetTypes: WidgetTypeOption[];
  onSave: (data: CardFormData) => Promise<void>;
  onClose: () => void;
}

function emptyForm(): CardFormData {
  return {
    title: '',
    htmlContent: '',
    filterId: '',
    widgetTypeId: '',
    widgetConfiguration: {},
    sortOrder: 0,
    isActive: true,
  };
}

function cardToForm(c: AdminCard): CardFormData {
  return {
    title: c.title,
    htmlContent: c.htmlContent,
    filterId: c.filter.id,
    widgetTypeId: c.widgetType.id,
    widgetConfiguration: {},
    sortOrder: c.sortOrder,
    isActive: c.isActive,
  };
}

export function CardFormModal({ card, filters, widgetTypes, onSave, onClose }: CardFormModalProps): JSX.Element {
  const initial = useMemo(() => (card ? cardToForm(card) : emptyForm()), [card]);
  const [formData, setFormData] = useState<CardFormData>(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CardFormData, string>>>({});
  const [previewMode, setPreviewMode] = useState(false);

  const validate = (): boolean => {
    const next: Partial<Record<keyof CardFormData, string>> = {};
    if (!formData.title.trim()) {
      next.title = 'El título es obligatorio';
    } else if (formData.title.trim().length < 3) {
      next.title = 'Mínimo 3 caracteres';
    }
    if (!formData.filterId) {
      next.filterId = 'Selecciona una categoría';
    }
    if (!formData.widgetTypeId) {
      next.widgetTypeId = 'Selecciona un tipo de widget';
    }
    if (!formData.htmlContent.trim()) {
      next.htmlContent = 'El HTML es obligatorio';
    } else if (formData.htmlContent.trim().length < 10) {
      next.htmlContent = 'Mínimo 10 caracteres';
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
        title: formData.title.trim(),
        htmlContent: formData.htmlContent.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-surface-container-low rounded-xl h-12 px-4 border-none focus:ring-2 focus:ring-primary/30 text-on-surface';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-4 py-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-form-title"
        className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_rgba(24,28,32,0.12)] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 p-6 pb-4 bg-surface-container-lowest rounded-t-2xl border-b border-transparent">
          <h2 id="card-form-title" className="text-xl font-bold font-headline text-on-surface">
            {card ? 'Editar Card' : 'Nueva Card'}
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

        <div className="p-6 pt-4 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="card-title">
              Título
            </label>
            <input
              id="card-title"
              type="text"
              className={inputClass}
              value={formData.title}
              onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
            />
            {errors.title ? <p className="text-error text-sm mt-1">{errors.title}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="card-filter">
              Categoría
            </label>
            <select
              id="card-filter"
              className={inputClass}
              value={formData.filterId}
              onChange={(e) => setFormData((f) => ({ ...f, filterId: e.target.value }))}
            >
              <option value="">Seleccionar…</option>
              {filters.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            {errors.filterId ? <p className="text-error text-sm mt-1">{errors.filterId}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="card-widget">
              Tipo de widget
            </label>
            <select
              id="card-widget"
              className={inputClass}
              value={formData.widgetTypeId}
              onChange={(e) => setFormData((f) => ({ ...f, widgetTypeId: e.target.value }))}
            >
              <option value="">Seleccionar…</option>
              {widgetTypes.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
            {errors.widgetTypeId ? <p className="text-error text-sm mt-1">{errors.widgetTypeId}</p> : null}
          </div>

          <div>
            <span className="block text-sm font-semibold text-on-surface mb-2">Contenido HTML</span>
            <div className="inline-flex rounded-lg overflow-hidden mb-2">
              <button
                type="button"
                className={
                  !previewMode
                    ? 'bg-primary text-white px-4 py-1 text-sm font-medium'
                    : 'bg-surface-container-high text-on-surface-variant px-4 py-1 text-sm font-medium'
                }
                onClick={() => setPreviewMode(false)}
              >
                Editar
              </button>
              <button
                type="button"
                className={
                  previewMode
                    ? 'bg-primary text-white px-4 py-1 text-sm font-medium'
                    : 'bg-surface-container-high text-on-surface-variant px-4 py-1 text-sm font-medium'
                }
                onClick={() => setPreviewMode(true)}
              >
                Vista previa
              </button>
            </div>
            {!previewMode ? (
              <>
                <textarea
                  id="card-html"
                  rows={10}
                  className="w-full bg-surface-container-low rounded-xl p-4 font-mono text-sm border-none focus:ring-2 focus:ring-primary/30 resize-none text-on-surface"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData((f) => ({ ...f, htmlContent: e.target.value }))}
                />
                <p className="text-xs text-outline mt-2">Ingresa el HTML del widget.</p>
              </>
            ) : (
              <>
                <div
                  className="bg-surface-container-low rounded-xl p-4 min-h-[200px] text-on-surface text-sm"
                  dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
                />
                <p className="text-xs text-outline mt-2">
                  Vista previa del HTML. El resultado final puede variar tras la sanitización.
                </p>
              </>
            )}
            {errors.htmlContent ? <p className="text-error text-sm mt-1">{errors.htmlContent}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="card-order">
              Orden
            </label>
            <input
              id="card-order"
              type="number"
              min={0}
              className={inputClass}
              value={formData.sortOrder}
              onChange={(e) => setFormData((f) => ({ ...f, sortOrder: Number.parseInt(e.target.value, 10) || 0 }))}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
              <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((f) => ({ ...f, isActive: e.target.checked }))}
                />
                <span className="h-6 w-11 rounded-full bg-surface-container-high transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30" />
                <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </span>
              <span className="text-sm font-medium text-on-surface">Activa</span>
            </label>
            {card ? (
              <p className="text-sm text-on-surface-variant">
                Estado:{' '}
                {card.isDeleted ? (
                  <span className="font-semibold text-error">Eliminada (restaura desde el listado)</span>
                ) : formData.isActive ? (
                  <span className="font-semibold text-on-surface">Activa en formulario</span>
                ) : (
                  <span className="font-semibold text-outline">Inactiva</span>
                )}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 pt-2 border-t border-transparent">
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
            {isSubmitting ? (card ? 'Guardando...' : 'Creando...') : card ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}
