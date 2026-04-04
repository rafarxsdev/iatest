-- Tipos de acción adicionales para auditoría de endpoints GET del panel admin.
-- Idempotente: ignora si el código ya existe.
INSERT INTO logs.action_types (code, module, description) VALUES
  ('ADMIN_USERS_LISTED',     'admin',  'Listado de usuarios consultado en administración'),
  ('CONFIG_POLICIES_LISTED', 'config', 'Políticas de interacción listadas para una card'),
  ('ADMIN_PARAMETERS_LISTED','admin',  'Parámetros del sistema listados')
ON CONFLICT (code) DO NOTHING;
