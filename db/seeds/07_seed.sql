-- =============================================================================
-- 07_seed.sql
-- Datos semilla: catálogos, roles, permisos y parámetros base del sistema
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
  ('form',   'Formulario',        3,    '{"required": ["action_url"], "properties": {"action_url": {"type": "string"}}}'),
  ('video',  'Video embebido',    NULL, '{"required": ["video_url"], "properties": {"video_url": {"type": "string"}, "autoplay": {"type": "boolean"}}}'),
  ('quiz',   'Quiz interactivo',  1,    '{"required": ["questions"], "properties": {"questions": {"type": "array"}}}'),
  ('survey', 'Encuesta',          1,    '{"required": ["survey_id"], "properties": {"survey_id": {"type": "string"}}}'),
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

-- =============================================================================
-- logs.action_types
-- =============================================================================
INSERT INTO logs.action_types (code, module, description) VALUES
  -- Auth
  ('AUTH_LOGIN',             'auth',      'Inicio de sesión exitoso'),
  ('AUTH_LOGOUT',            'auth',      'Cierre de sesión'),
  ('AUTH_LOGIN_FAILED',      'auth',      'Intento de login fallido por credenciales incorrectas'),
  ('AUTH_ACCOUNT_BLOCKED',   'auth',      'Cuenta bloqueada por superar el límite de intentos fallidos'),
  ('AUTH_TOKEN_REVOKED',     'auth',      'Token JWT revocado manualmente'),
  -- Dashboard
  ('DASHBOARD_VIEW',         'dashboard', 'Usuario accedió al dashboard'),
  ('FILTER_APPLIED',         'dashboard', 'Usuario aplicó un filtro en el dashboard'),
  -- Cards
  ('CARD_VIEW',              'cards',     'Card visualizada por el usuario'),
  ('WIDGET_INTERACTION',     'cards',     'Usuario interactuó exitosamente con un widget'),
  ('WIDGET_BLOCKED',         'cards',     'Interacción bloqueada por haber alcanzado el límite'),
  ('WIDGET_RESET',           'cards',     'Contador de interacciones reiniciado para un usuario/card'),
  -- Admin
  ('ADMIN_USER_CREATED',     'admin',     'Nuevo usuario creado'),
  ('ADMIN_USER_UPDATED',     'admin',     'Usuario modificado'),
  ('ADMIN_USER_DEACTIVATED', 'admin',     'Usuario desactivado'),
  ('ADMIN_CARD_CREATED',     'admin',     'Nueva card creada'),
  ('ADMIN_CARD_UPDATED',     'admin',     'Card modificada'),
  ('ADMIN_CARD_DELETED',     'admin',     'Card eliminada (soft delete)'),
  ('ADMIN_CARDS_LISTED',     'admin',     'Listado de cards consultado en administración'),
  -- Config
  ('CONFIG_PARAMETER_UPDATED','config',   'Parámetro del sistema modificado'),
  ('CONFIG_POLICY_UPDATED',  'config',    'Política de interacción modificada'),
  ('ADMIN_USERS_LISTED',     'admin',     'Listado de usuarios consultado en administración'),
  ('CONFIG_POLICIES_LISTED', 'config',    'Políticas de interacción listadas para una card'),
  ('ADMIN_PARAMETERS_LISTED','admin',     'Parámetros del sistema listados');

COMMIT;
