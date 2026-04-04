-- =============================================================================
-- 01_security.sql
-- Esquema: security
-- Tablas: permissions, roles, role_permissions, users,
--         user_security_status, sessions
-- =============================================================================

-- -----------------------------------------------------------------------------
-- permissions
-- Catálogo de permisos disponibles en el sistema
-- -----------------------------------------------------------------------------
CREATE TABLE security.permissions (
  id           UUID        NOT NULL DEFAULT gen_random_uuid(),
  code         VARCHAR(100) NOT NULL,
  description  TEXT,
  module       VARCHAR(50)  NOT NULL,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_permissions        PRIMARY KEY (id),
  CONSTRAINT uq_permissions_code   UNIQUE (code),
  CONSTRAINT ck_permissions_module CHECK (module IN ('auth', 'dashboard', 'cards', 'admin', 'config'))
);

COMMENT ON TABLE  security.permissions            IS 'Catálogo de permisos del sistema';
COMMENT ON COLUMN security.permissions.code       IS 'Identificador único funcional: dashboard.view, card.interact, filter.apply...';
COMMENT ON COLUMN security.permissions.module     IS 'Módulo al que pertenece el permiso';

-- -----------------------------------------------------------------------------
-- roles
-- Catálogo de roles del sistema
-- -----------------------------------------------------------------------------
CREATE TABLE security.roles (
  id           UUID         NOT NULL DEFAULT gen_random_uuid(),
  name         VARCHAR(50)  NOT NULL,
  description  TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_roles      PRIMARY KEY (id),
  CONSTRAINT uq_roles_name UNIQUE (name)
);

COMMENT ON TABLE  security.roles             IS 'Roles disponibles para asignar a usuarios';
COMMENT ON COLUMN security.roles.name        IS 'Nombre único del rol: admin, operator, viewer';

CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON security.roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- role_permissions
-- Tabla pivot: asignación de permisos a roles
-- -----------------------------------------------------------------------------
CREATE TABLE security.role_permissions (
  id             UUID        NOT NULL DEFAULT gen_random_uuid(),
  role_id        UUID        NOT NULL,
  permission_id  UUID        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_role_permissions              PRIMARY KEY (id),
  CONSTRAINT uq_role_permissions_role_perm    UNIQUE (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role         FOREIGN KEY (role_id)
    REFERENCES security.roles (id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission   FOREIGN KEY (permission_id)
    REFERENCES security.permissions (id) ON DELETE CASCADE
);

COMMENT ON TABLE security.role_permissions IS 'Asignación N:M de permisos a roles';

-- -----------------------------------------------------------------------------
-- users
-- Usuarios del sistema
-- -----------------------------------------------------------------------------
CREATE TABLE security.users (
  id             UUID          NOT NULL DEFAULT gen_random_uuid(),
  email          CITEXT        NOT NULL,
  password_hash  VARCHAR(255)  NOT NULL,
  full_name      VARCHAR(150)  NOT NULL,
  role_id        UUID          NOT NULL,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,

  CONSTRAINT pk_users        PRIMARY KEY (id),
  CONSTRAINT uq_users_email  UNIQUE (email),
  CONSTRAINT fk_users_role   FOREIGN KEY (role_id)
    REFERENCES security.roles (id)
);

COMMENT ON TABLE  security.users               IS 'Usuarios registrados en el sistema';
COMMENT ON COLUMN security.users.email         IS 'Email case-insensitive (CITEXT)';
COMMENT ON COLUMN security.users.password_hash IS 'Hash bcrypt de la contraseña';
COMMENT ON COLUMN security.users.deleted_at    IS 'Soft delete: NULL = activo';

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON security.users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- user_security_status
-- Estado de seguridad del usuario (separado de users - 3NF)
-- Relación 1:1 con users
-- -----------------------------------------------------------------------------
CREATE TABLE security.user_security_status (
  id                       UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL,
  failed_login_attempts    INTEGER     NOT NULL DEFAULT 0,
  login_blocked_until      TIMESTAMPTZ,
  last_failed_attempt_at   TIMESTAMPTZ,
  password_changed_at      TIMESTAMPTZ,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_user_security_status         PRIMARY KEY (id),
  CONSTRAINT uq_user_security_status_user    UNIQUE (user_id),
  CONSTRAINT fk_user_security_status_user    FOREIGN KEY (user_id)
    REFERENCES security.users (id) ON DELETE CASCADE,
  CONSTRAINT ck_user_security_failed_attempts
    CHECK (failed_login_attempts >= 0)
);

COMMENT ON TABLE  security.user_security_status                     IS 'Estado de seguridad de autenticación por usuario (1:1 con users)';
COMMENT ON COLUMN security.user_security_status.login_blocked_until IS 'Timestamp hasta el que el usuario no puede autenticarse';
COMMENT ON COLUMN security.user_security_status.password_changed_at IS 'Permite implementar política de expiración de contraseña';

CREATE TRIGGER trg_user_security_status_updated_at
  BEFORE UPDATE ON security.user_security_status
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- sessions
-- Sesiones activas por usuario
-- is_active se deriva de: revoked_at IS NULL AND expires_at > NOW()
-- -----------------------------------------------------------------------------
CREATE TABLE security.sessions (
  id           UUID         NOT NULL DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL,
  token_jti    VARCHAR(255) NOT NULL,
  ip_address   INET,
  user_agent   TEXT,
  expires_at   TIMESTAMPTZ  NOT NULL,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_sessions             PRIMARY KEY (id),
  CONSTRAINT uq_sessions_token_jti   UNIQUE (token_jti),
  CONSTRAINT fk_sessions_user        FOREIGN KEY (user_id)
    REFERENCES security.users (id) ON DELETE CASCADE
);

COMMENT ON TABLE  security.sessions            IS 'Sesiones JWT activas o históricas por usuario';
COMMENT ON COLUMN security.sessions.token_jti  IS 'JWT ID (jti claim) para identificar y revocar tokens individuales';
COMMENT ON COLUMN security.sessions.revoked_at IS 'NULL = sesión válida; NOT NULL = sesión revocada manualmente';
