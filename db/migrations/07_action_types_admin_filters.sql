-- Tipos de acción para gestión de filtros en administración.
-- Idempotente: ignora si el código ya existe.
INSERT INTO logs.action_types (code, module, description) VALUES
  ('ADMIN_FILTER_CREATED',      'admin', 'Filtro del dashboard creado'),
  ('ADMIN_FILTER_DEACTIVATED',  'admin', 'Filtro del dashboard desactivado'),
  ('ADMIN_FILTER_RESTORED',     'admin', 'Filtro del dashboard reactivado')
ON CONFLICT (code) DO NOTHING;
