-- =============================================================================
-- 05_logs.sql
-- Esquema: logs
-- Tablas: action_types, audit_logs, auth_logs, interaction_logs
-- Nota: las tablas de logs son append-only (sin UPDATE, sin DELETE)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- action_types
-- Catálogo parametrizado de tipos de acción registrables en el sistema
-- -----------------------------------------------------------------------------
CREATE TABLE logs.action_types (
  id           UUID         NOT NULL DEFAULT gen_random_uuid(),
  code         VARCHAR(100) NOT NULL,
  module       VARCHAR(50)  NOT NULL,
  description  TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_action_types      PRIMARY KEY (id),
  CONSTRAINT uq_action_types_code UNIQUE (code),
  CONSTRAINT ck_action_types_module CHECK (
    module IN ('auth', 'dashboard', 'cards', 'admin', 'config')
  )
);

COMMENT ON TABLE  logs.action_types        IS 'Catálogo parametrizado de acciones auditables del sistema';
COMMENT ON COLUMN logs.action_types.code   IS 'AUTH_LOGIN, AUTH_LOGOUT, AUTH_FAILED, DASHBOARD_VIEW, FILTER_APPLIED, CARD_VIEW, WIDGET_INTERACTION, WIDGET_BLOCKED';
COMMENT ON COLUMN logs.action_types.module IS 'Módulo funcional al que pertenece la acción';

-- -----------------------------------------------------------------------------
-- audit_logs
-- Log general de todas las acciones del sistema
-- Append-only: nunca se actualiza ni elimina
-- Asociación polimórfica en entity_type + entity_id (excepción documentada)
-- -----------------------------------------------------------------------------
CREATE TABLE logs.audit_logs (
  id               UUID         NOT NULL DEFAULT gen_random_uuid(),
  user_id          UUID,
  session_id       UUID,
  action_type_id   UUID         NOT NULL,
  entity_type      VARCHAR(50),
  entity_id        UUID,
  payload          JSONB,
  ip_address       INET,
  user_agent       TEXT,
  status           VARCHAR(20)  NOT NULL,
  error_message    TEXT,
  duration_ms      INTEGER,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_audit_logs               PRIMARY KEY (id),
  CONSTRAINT fk_audit_logs_user          FOREIGN KEY (user_id)
    REFERENCES security.users (id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_logs_session       FOREIGN KEY (session_id)
    REFERENCES security.sessions (id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_logs_action_type   FOREIGN KEY (action_type_id)
    REFERENCES logs.action_types (id),
  CONSTRAINT ck_audit_logs_status        CHECK (status IN ('success', 'failed', 'blocked')),
  CONSTRAINT ck_audit_logs_entity_type   CHECK (
    entity_type IN ('card', 'filter', 'user', 'role', 'parameter', 'session', 'auth')
    OR entity_type IS NULL
  ),
  CONSTRAINT ck_audit_logs_duration      CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

COMMENT ON TABLE  logs.audit_logs             IS 'Log general de auditoría. Append-only. Asociación polimórfica en entity_type/entity_id';
COMMENT ON COLUMN logs.audit_logs.user_id     IS 'NULL si la acción es anónima (ej: intento de login sin usuario válido)';
COMMENT ON COLUMN logs.audit_logs.session_id  IS 'NULL si la acción ocurre fuera de sesión';
COMMENT ON COLUMN logs.audit_logs.entity_type IS 'Asociación polimórfica: tipo de entidad afectada por la acción';
COMMENT ON COLUMN logs.audit_logs.entity_id   IS 'ID de la entidad afectada. Interpretar según entity_type';
COMMENT ON COLUMN logs.audit_logs.payload     IS 'Contexto adicional de la acción: filtros aplicados, valores cambiados, etc.';

-- Regla para evitar UPDATE en audit_logs
CREATE RULE no_update_audit_logs AS
  ON UPDATE TO logs.audit_logs DO INSTEAD NOTHING;

CREATE RULE no_delete_audit_logs AS
  ON DELETE TO logs.audit_logs DO INSTEAD NOTHING;

-- -----------------------------------------------------------------------------
-- auth_logs
-- Trazabilidad específica de eventos de autenticación
-- Append-only: nunca se actualiza ni elimina
-- -----------------------------------------------------------------------------
CREATE TABLE logs.auth_logs (
  id                          UUID         NOT NULL DEFAULT gen_random_uuid(),
  user_id                     UUID,
  action_type_id              UUID         NOT NULL,
  session_id                  UUID,
  email_attempt               CITEXT       NOT NULL,
  ip_address                  INET,
  user_agent                  TEXT,
  failed_attempts_at_moment   INTEGER      NOT NULL DEFAULT 0,
  login_blocked_until         TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_auth_logs                PRIMARY KEY (id),
  CONSTRAINT fk_auth_logs_user           FOREIGN KEY (user_id)
    REFERENCES security.users (id) ON DELETE SET NULL,
  CONSTRAINT fk_auth_logs_action_type    FOREIGN KEY (action_type_id)
    REFERENCES logs.action_types (id),
  CONSTRAINT fk_auth_logs_session        FOREIGN KEY (session_id)
    REFERENCES security.sessions (id) ON DELETE SET NULL,
  CONSTRAINT ck_auth_logs_failed_attempts
    CHECK (failed_attempts_at_moment >= 0)
);

COMMENT ON TABLE  logs.auth_logs                              IS 'Trazabilidad de eventos de autenticación. Append-only';
COMMENT ON COLUMN logs.auth_logs.user_id                     IS 'NULL si el email ingresado no corresponde a ningún usuario';
COMMENT ON COLUMN logs.auth_logs.email_attempt               IS 'Email exacto ingresado en el formulario (para detectar fuerza bruta)';
COMMENT ON COLUMN logs.auth_logs.failed_attempts_at_moment   IS 'Contador de intentos fallidos acumulados antes de este evento';
COMMENT ON COLUMN logs.auth_logs.login_blocked_until         IS 'Si este evento generó bloqueo, hasta cuándo';

CREATE RULE no_update_auth_logs AS
  ON UPDATE TO logs.auth_logs DO INSTEAD NOTHING;

CREATE RULE no_delete_auth_logs AS
  ON DELETE TO logs.auth_logs DO INSTEAD NOTHING;

-- -----------------------------------------------------------------------------
-- interaction_logs
-- Trazabilidad específica de uso de widgets en cards
-- Append-only: nunca se actualiza ni elimina
-- -----------------------------------------------------------------------------
CREATE TABLE logs.interaction_logs (
  id                   UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL,
  card_id              UUID        NOT NULL,
  session_id           UUID,
  action_type_id       UUID        NOT NULL,
  interaction_number   INTEGER     NOT NULL,
  max_at_moment        INTEGER     NOT NULL,
  reset_policy_id      UUID        NOT NULL,
  ip_address           INET,
  payload              JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_interaction_logs                PRIMARY KEY (id),
  CONSTRAINT fk_interaction_logs_user           FOREIGN KEY (user_id)
    REFERENCES security.users (id) ON DELETE CASCADE,
  CONSTRAINT fk_interaction_logs_card           FOREIGN KEY (card_id)
    REFERENCES content.cards (id) ON DELETE CASCADE,
  CONSTRAINT fk_interaction_logs_session        FOREIGN KEY (session_id)
    REFERENCES security.sessions (id) ON DELETE SET NULL,
  CONSTRAINT fk_interaction_logs_action_type    FOREIGN KEY (action_type_id)
    REFERENCES logs.action_types (id),
  CONSTRAINT fk_interaction_logs_reset_policy   FOREIGN KEY (reset_policy_id)
    REFERENCES interactions.reset_policies (id),
  CONSTRAINT ck_interaction_logs_number         CHECK (interaction_number >= 0),
  CONSTRAINT ck_interaction_logs_max            CHECK (max_at_moment > 0)
);

COMMENT ON TABLE  logs.interaction_logs                    IS 'Historial detallado de cada interacción con widgets. Append-only';
COMMENT ON COLUMN logs.interaction_logs.interaction_number IS 'Número de uso en el momento del evento (snapshot)';
COMMENT ON COLUMN logs.interaction_logs.max_at_moment      IS 'Límite vigente en el momento del evento (snapshot)';
COMMENT ON COLUMN logs.interaction_logs.reset_policy_id    IS 'Política activa en el momento del evento (FK normalizada)';
COMMENT ON COLUMN logs.interaction_logs.payload            IS 'Datos adicionales del widget al momento de la interacción';

CREATE RULE no_update_interaction_logs AS
  ON UPDATE TO logs.interaction_logs DO INSTEAD NOTHING;

CREATE RULE no_delete_interaction_logs AS
  ON DELETE TO logs.interaction_logs DO INSTEAD NOTHING;

-- -----------------------------------------------------------------------------
-- Catálogo inicial de action_types (instalaciones con o sin seed semántico)
-- Idempotente: bases existentes o re-ejecución no duplican códigos
-- -----------------------------------------------------------------------------
INSERT INTO logs.action_types (code, module, description) VALUES
  ('AUTH_LOGIN',             'auth',      'Inicio de sesión exitoso'),
  ('AUTH_LOGOUT',            'auth',      'Cierre de sesión'),
  ('AUTH_LOGIN_FAILED',      'auth',      'Intento de login fallido por credenciales incorrectas'),
  ('AUTH_ACCOUNT_BLOCKED',   'auth',      'Cuenta bloqueada por superar el límite de intentos fallidos'),
  ('AUTH_TOKEN_REVOKED',     'auth',      'Token JWT revocado manualmente'),
  ('AUTH_PROFILE_UPDATED',   'auth',      'Perfil de usuario actualizado (nombre o contraseña)'),
  ('DASHBOARD_VIEW',         'dashboard', 'Usuario accedió al dashboard'),
  ('FILTER_APPLIED',         'dashboard', 'Usuario aplicó un filtro en el dashboard'),
  ('CARD_VIEW',              'cards',     'Card visualizada por el usuario'),
  ('WIDGET_INTERACTION',     'cards',     'Usuario interactuó exitosamente con un widget'),
  ('WIDGET_BLOCKED',         'cards',     'Interacción bloqueada por haber alcanzado el límite'),
  ('WIDGET_RESET',           'cards',     'Contador de interacciones reiniciado para un usuario/card'),
  ('ADMIN_USER_CREATED',     'admin',     'Nuevo usuario creado'),
  ('ADMIN_USER_UPDATED',     'admin',     'Usuario modificado'),
  ('ADMIN_USER_DEACTIVATED', 'admin',     'Usuario desactivado'),
  ('ADMIN_CARD_CREATED',     'admin',     'Nueva card creada'),
  ('ADMIN_CARD_UPDATED',     'admin',     'Card modificada'),
  ('ADMIN_CARD_DELETED',     'admin',     'Card eliminada (soft delete)'),
  ('ADMIN_CARDS_LISTED',     'admin',     'Listado de cards consultado en administración'),
  ('ADMIN_FILTER_CREATED',   'admin',     'Filtro del dashboard creado'),
  ('ADMIN_FILTER_DEACTIVATED','admin',    'Filtro del dashboard desactivado'),
  ('ADMIN_FILTER_RESTORED',  'admin',     'Filtro del dashboard reactivado'),
  ('CONFIG_PARAMETER_UPDATED','config',   'Parámetro del sistema modificado'),
  ('CONFIG_POLICY_UPDATED',  'config',    'Política de interacción modificada'),
  ('ADMIN_USERS_LISTED',     'admin',     'Listado de usuarios consultado en administración'),
  ('CONFIG_POLICIES_LISTED', 'config',    'Políticas de interacción listadas para una card'),
  ('ADMIN_PARAMETERS_LISTED','admin',     'Parámetros del sistema listados')
ON CONFLICT (code) DO NOTHING;
