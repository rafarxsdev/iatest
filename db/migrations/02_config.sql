-- =============================================================================
-- 02_config.sql
-- Esquema: config
-- Tablas: parameter_categories, parameters, role_parameters, user_parameters
-- =============================================================================

-- -----------------------------------------------------------------------------
-- parameter_categories
-- Catálogo de categorías que agrupan parámetros
-- -----------------------------------------------------------------------------
CREATE TABLE config.parameter_categories (
  id           UUID         NOT NULL DEFAULT gen_random_uuid(),
  code         VARCHAR(50)  NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_parameter_categories      PRIMARY KEY (id),
  CONSTRAINT uq_parameter_categories_code UNIQUE (code)
);

COMMENT ON TABLE  config.parameter_categories      IS 'Categorías que agrupan parámetros del sistema';
COMMENT ON COLUMN config.parameter_categories.code IS 'Identificador funcional: auth, interactions, ui, system';

-- -----------------------------------------------------------------------------
-- parameters
-- Parámetros globales del sistema
-- Jerarquía de resolución:
--   user_parameters → role_parameters → parameters (este, valor global)
-- -----------------------------------------------------------------------------
CREATE TABLE config.parameters (
  id                  UUID         NOT NULL DEFAULT gen_random_uuid(),
  category_id         UUID         NOT NULL,
  key                 VARCHAR(100) NOT NULL,
  value               TEXT         NOT NULL,
  data_type           VARCHAR(20)  NOT NULL,
  description         TEXT,
  is_editable         BOOLEAN      NOT NULL DEFAULT TRUE,
  updated_by_user_id  UUID,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_parameters           PRIMARY KEY (id),
  CONSTRAINT uq_parameters_key       UNIQUE (key),
  CONSTRAINT fk_parameters_category  FOREIGN KEY (category_id)
    REFERENCES config.parameter_categories (id),
  CONSTRAINT fk_parameters_updated_by FOREIGN KEY (updated_by_user_id)
    REFERENCES security.users (id) ON DELETE SET NULL,
  CONSTRAINT ck_parameters_data_type
    CHECK (data_type IN ('string', 'number', 'boolean', 'json'))
);

COMMENT ON TABLE  config.parameters                    IS 'Parámetros globales del sistema. Valor base de la jerarquía de resolución';
COMMENT ON COLUMN config.parameters.value              IS 'Valor almacenado como TEXT. Interpretar según data_type';
COMMENT ON COLUMN config.parameters.is_editable        IS 'FALSE = parámetro de solo lectura, no modificable desde la UI';
COMMENT ON COLUMN config.parameters.updated_by_user_id IS 'Último usuario que modificó el parámetro';

CREATE TRIGGER trg_parameters_updated_at
  BEFORE UPDATE ON config.parameters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- role_parameters
-- Sobreescritura de parámetros por rol
-- Tiene precedencia sobre parameters (valor global)
-- -----------------------------------------------------------------------------
CREATE TABLE config.role_parameters (
  id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
  role_id             UUID        NOT NULL,
  parameter_id        UUID        NOT NULL,
  value               TEXT        NOT NULL,
  updated_by_user_id  UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_role_parameters                 PRIMARY KEY (id),
  CONSTRAINT uq_role_parameters_role_param      UNIQUE (role_id, parameter_id),
  CONSTRAINT fk_role_parameters_role            FOREIGN KEY (role_id)
    REFERENCES security.roles (id) ON DELETE CASCADE,
  CONSTRAINT fk_role_parameters_parameter       FOREIGN KEY (parameter_id)
    REFERENCES config.parameters (id) ON DELETE CASCADE,
  CONSTRAINT fk_role_parameters_updated_by      FOREIGN KEY (updated_by_user_id)
    REFERENCES security.users (id) ON DELETE SET NULL
);

COMMENT ON TABLE config.role_parameters IS 'Sobreescritura de parámetros globales para un rol específico';

CREATE TRIGGER trg_role_parameters_updated_at
  BEFORE UPDATE ON config.role_parameters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- user_parameters
-- Sobreescritura de parámetros por usuario individual
-- Tiene la mayor precedencia en la jerarquía de resolución
-- -----------------------------------------------------------------------------
CREATE TABLE config.user_parameters (
  id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL,
  parameter_id        UUID        NOT NULL,
  value               TEXT        NOT NULL,
  updated_by_user_id  UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_user_parameters                 PRIMARY KEY (id),
  CONSTRAINT uq_user_parameters_user_param      UNIQUE (user_id, parameter_id),
  CONSTRAINT fk_user_parameters_user            FOREIGN KEY (user_id)
    REFERENCES security.users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_parameters_parameter       FOREIGN KEY (parameter_id)
    REFERENCES config.parameters (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_parameters_updated_by      FOREIGN KEY (updated_by_user_id)
    REFERENCES security.users (id) ON DELETE SET NULL
);

COMMENT ON TABLE config.user_parameters IS 'Sobreescritura de parámetros para un usuario individual. Máxima precedencia en la jerarquía';

CREATE TRIGGER trg_user_parameters_updated_at
  BEFORE UPDATE ON config.user_parameters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
