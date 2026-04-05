-- =============================================================================
-- 07_seed.sql
-- Datos semilla: catálogos, roles, permisos, usuario admin inicial y parámetros
-- logs.action_types: ver migración 05_logs.sql (catálogo en esquema base)
-- =============================================================================

BEGIN;

-- =============================================================================
-- security.permissions
-- =============================================================================
INSERT INTO security.permissions (code, description, module) VALUES
  -- Auth
  ('auth.login',              'Iniciar sesión en el sistema',                          'auth'),
  -- Dashboard
  ('dashboard.view',          'Ver el dashboard principal',                            'dashboard'),
  -- Cards
  ('card.view',               'Ver las cards del dashboard',                           'cards'),
  ('card.interact',           'Interactuar con el widget de una card',                 'cards'),
  -- Filters
  ('filter.apply',            'Aplicar filtros en el dashboard',                       'dashboard'),
  -- Admin
  ('admin.users.view',        'Ver listado de usuarios',                               'admin'),
  ('admin.users.manage',      'Crear, editar y desactivar usuarios',                   'admin'),
  ('admin.roles.view',        'Ver roles y permisos',                                  'admin'),
  ('admin.roles.manage',      'Gestionar roles y asignación de permisos',              'admin'),
  ('admin.cards.view',        'Ver cards en panel administrativo',                     'admin'),
  ('admin.cards.manage',      'Crear, editar y desactivar cards',                      'admin'),
  ('admin.filters.manage',    'Gestionar filtros del dashboard',                       'admin'),
  ('admin.widgets.manage',    'Gestionar tipos de widgets',                            'admin'),
  -- Config
  ('config.parameters.view',  'Ver parámetros del sistema',                            'config'),
  ('config.parameters.manage','Editar parámetros del sistema',                         'config'),
  ('config.policies.manage',  'Gestionar políticas de interacción por card',           'config');

-- =============================================================================
-- security.roles
-- =============================================================================
INSERT INTO security.roles (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin',    'Acceso total al sistema y configuración'),
  ('00000000-0000-0000-0000-000000000002', 'operator', 'Gestión de contenido sin acceso a configuración del sistema'),
  ('00000000-0000-0000-0000-000000000003', 'viewer',   'Solo lectura e interacción con cards del dashboard');

-- =============================================================================
-- security.role_permissions
-- =============================================================================

-- admin: todos los permisos
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT
  '00000000-0000-0000-0000-000000000001',
  id
FROM security.permissions;

-- operator: dashboard + gestión de cards y filtros
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT
  '00000000-0000-0000-0000-000000000002',
  id
FROM security.permissions
WHERE code IN (
  'auth.login',
  'dashboard.view',
  'card.view',
  'card.interact',
  'filter.apply',
  'admin.cards.view',
  'admin.cards.manage',
  'admin.filters.manage',
  'admin.widgets.manage'
);

-- viewer: solo dashboard
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT
  '00000000-0000-0000-0000-000000000003',
  id
FROM security.permissions
WHERE code IN (
  'auth.login',
  'dashboard.view',
  'card.view',
  'card.interact',
  'filter.apply'
);

-- =============================================================================
-- security.users — administrador inicial (solo entornos de desarrollo / primera instalación)
-- Contraseña por defecto: ChangeMe123! — cambiar en producción
-- Hash bcrypt cost 12, generado con el mismo criterio que BCRYPT_ROUNDS del backend
-- =============================================================================
INSERT INTO security.users (
  id,
  email,
  password_hash,
  full_name,
  role_id,
  is_active
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  'admin@localhost',
  '$2b$12$sljNmbWZG1qzAono9A7Lre3EY7l9/WgjUHFDb6TcepzQpVZAVlA1.',
  'Administrador',
  '00000000-0000-0000-0000-000000000001',
  TRUE
);

INSERT INTO security.user_security_status (user_id, failed_login_attempts, updated_at)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  0,
  NOW()
);

-- =============================================================================
-- config.parameter_categories
-- =============================================================================
INSERT INTO config.parameter_categories (id, code, description) VALUES
  ('10000000-0000-0000-0000-000000000001', 'auth',         'Parámetros de autenticación y seguridad'),
  ('10000000-0000-0000-0000-000000000002', 'interactions', 'Parámetros de control de interacciones con widgets'),
  ('10000000-0000-0000-0000-000000000003', 'ui',           'Parámetros de experiencia de usuario'),
  ('10000000-0000-0000-0000-000000000004', 'system',       'Parámetros internos del sistema');

-- =============================================================================
-- config.parameters
-- =============================================================================
INSERT INTO config.parameters (category_id, key, value, data_type, description, is_editable) VALUES
  -- Auth
  ('10000000-0000-0000-0000-000000000001', 'jwt_expiration_minutes',       '60',   'number',  'Minutos de validez del JWT antes de expirar',                     TRUE),
  ('10000000-0000-0000-0000-000000000001', 'refresh_token_expiration_days','7',    'number',  'Días de validez del refresh token',                               TRUE),
  ('10000000-0000-0000-0000-000000000001', 'max_failed_login_attempts',    '5',    'number',  'Intentos fallidos antes de bloquear temporalmente el usuario',    TRUE),
  ('10000000-0000-0000-0000-000000000001', 'login_block_duration_minutes', '15',   'number',  'Minutos de bloqueo tras superar max_failed_login_attempts',       TRUE),
  ('10000000-0000-0000-0000-000000000001', 'password_min_length',          '8',    'number',  'Longitud mínima de contraseña',                                   TRUE),
  ('10000000-0000-0000-0000-000000000001', 'session_timeout_minutes',      '30',   'number',  'Minutos de inactividad antes de cerrar sesión automáticamente',   TRUE),
  -- Interactions
  ('10000000-0000-0000-0000-000000000002', 'default_max_interactions',     '5',    'number',  'Límite global de interacciones si no hay política más específica', TRUE),
  ('10000000-0000-0000-0000-000000000002', 'interaction_cooldown_seconds', '0',    'number',  'Segundos mínimos entre interacciones consecutivas en una card',   TRUE),
  -- UI
  ('10000000-0000-0000-0000-000000000003', 'cards_per_page',               '12',   'number',  'Número de cards por página en el dashboard',                      TRUE),
  ('10000000-0000-0000-0000-000000000003', 'dashboard_title',              'Dashboard', 'string', 'Título visible en el dashboard',                             TRUE),
  -- System
  ('10000000-0000-0000-0000-000000000004', 'app_version',                  '1.0.0','string',  'Versión actual de la aplicación',                                 FALSE),
  ('10000000-0000-0000-0000-000000000004', 'maintenance_mode',             'false','boolean', 'Activa el modo mantenimiento bloqueando el acceso',               TRUE);

-- =============================================================================
-- content.filter_types
-- =============================================================================
INSERT INTO content.filter_types (code, description) VALUES
  ('single_select', 'Desplegable de selección única'),
  ('multi_select',  'Desplegable de selección múltiple'),
  ('date_range',    'Selector de rango de fechas'),
  ('text_search',   'Campo de búsqueda por texto libre');

-- =============================================================================
-- content.widget_types
-- =============================================================================
INSERT INTO content.widget_types (code, label, default_max_interactions, configuration_schema) VALUES
  ('embed',  'Contenido externo', 5,    '{"required": ["embed_url"], "properties": {"embed_url": {"type": "string"}, "height": {"type": "number"}}}');

-- =============================================================================
-- interactions.reset_policies
-- =============================================================================
INSERT INTO interactions.reset_policies (code, description) VALUES
  ('never',   'El contador nunca se reinicia. El límite es permanente'),
  ('daily',   'El contador se reinicia cada día a medianoche'),
  ('weekly',  'El contador se reinicia cada lunes a medianoche'),
  ('monthly', 'El contador se reinicia el primer día de cada mes'),
  ('manual',  'El contador solo se reinicia manualmente por un administrador');

COMMIT;
