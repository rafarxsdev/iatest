-- =============================================================================
-- 04_interactions.sql
-- Esquema: interactions
-- Tablas: reset_policies, card_interaction_policies, user_card_interactions
--
-- Jerarquía de resolución del límite de interacciones:
--   1. card_interaction_policies (card_id + role_id específico)
--   2. card_interaction_policies (card_id + role_id = NULL)
--   3. widget_types.default_max_interactions
--   4. parameters['default_max_interactions']  ← valor global
-- =============================================================================

-- -----------------------------------------------------------------------------
-- reset_policies
-- Catálogo de políticas de reinicio del contador de interacciones
-- -----------------------------------------------------------------------------
CREATE TABLE interactions.reset_policies (
  id           UUID        NOT NULL DEFAULT gen_random_uuid(),
  code         VARCHAR(50) NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_reset_policies      PRIMARY KEY (id),
  CONSTRAINT uq_reset_policies_code UNIQUE (code),
  CONSTRAINT ck_reset_policies_code CHECK (
    code IN ('never', 'daily', 'weekly', 'monthly', 'manual')
  )
);

COMMENT ON TABLE  interactions.reset_policies      IS 'Catálogo de políticas de reinicio del contador de interacciones';
COMMENT ON COLUMN interactions.reset_policies.code IS 'never: nunca se reinicia | daily/weekly/monthly: reinicio automático | manual: solo por administrador';

-- -----------------------------------------------------------------------------
-- card_interaction_policies
-- Define el límite de interacciones por combinación card + rol
-- role_id = NULL significa que aplica a todos los roles no especificados
-- -----------------------------------------------------------------------------
CREATE TABLE interactions.card_interaction_policies (
  id                UUID        NOT NULL DEFAULT gen_random_uuid(),
  card_id           UUID        NOT NULL,
  role_id           UUID,
  max_interactions  INTEGER     NOT NULL,
  reset_policy_id   UUID        NOT NULL,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_card_interaction_policies          PRIMARY KEY (id),
  CONSTRAINT uq_card_interaction_policies_card_role UNIQUE (card_id, role_id),
  CONSTRAINT fk_card_interaction_policies_card      FOREIGN KEY (card_id)
    REFERENCES content.cards (id) ON DELETE CASCADE,
  CONSTRAINT fk_card_interaction_policies_role      FOREIGN KEY (role_id)
    REFERENCES security.roles (id) ON DELETE CASCADE,
  CONSTRAINT fk_card_interaction_policies_policy    FOREIGN KEY (reset_policy_id)
    REFERENCES interactions.reset_policies (id),
  CONSTRAINT ck_card_interaction_policies_max
    CHECK (max_interactions > 0)
);

COMMENT ON TABLE  interactions.card_interaction_policies             IS 'Límite de interacciones por card y por rol. role_id NULL = política por defecto para esa card';
COMMENT ON COLUMN interactions.card_interaction_policies.role_id     IS 'NULL = aplica a cualquier rol que no tenga política específica para esta card';
COMMENT ON COLUMN interactions.card_interaction_policies.max_interactions IS 'Número máximo de interacciones permitidas según reset_policy_id';

CREATE TRIGGER trg_card_interaction_policies_updated_at
  BEFORE UPDATE ON interactions.card_interaction_policies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- user_card_interactions
-- Estado actual del contador de interacciones por usuario/card
-- Un registro por par (user_id, card_id)
-- Se actualiza en cada interacción; el historial detallado vive en logs
-- -----------------------------------------------------------------------------
CREATE TABLE interactions.user_card_interactions (
  id                    UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL,
  card_id               UUID        NOT NULL,
  interaction_count     INTEGER     NOT NULL DEFAULT 0,
  limit_at_creation     INTEGER     NOT NULL,
  reset_policy_id       UUID        NOT NULL,
  last_reset_at         TIMESTAMPTZ,
  limit_reached_at      TIMESTAMPTZ,
  last_interaction_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_user_card_interactions              PRIMARY KEY (id),
  CONSTRAINT uq_user_card_interactions_user_card    UNIQUE (user_id, card_id),
  CONSTRAINT fk_user_card_interactions_user         FOREIGN KEY (user_id)
    REFERENCES security.users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_card_interactions_card         FOREIGN KEY (card_id)
    REFERENCES content.cards (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_card_interactions_reset_policy FOREIGN KEY (reset_policy_id)
    REFERENCES interactions.reset_policies (id),
  CONSTRAINT ck_user_card_interactions_count
    CHECK (interaction_count >= 0),
  CONSTRAINT ck_user_card_interactions_limit
    CHECK (limit_at_creation > 0)
);

COMMENT ON TABLE  interactions.user_card_interactions                   IS 'Estado actual del contador de interacciones por par usuario-card';
COMMENT ON COLUMN interactions.user_card_interactions.interaction_count IS 'Contador acumulado del período actual (se resetea según reset_policy)';
COMMENT ON COLUMN interactions.user_card_interactions.limit_at_creation IS 'Límite vigente al momento en que se creó el registro (snapshot para no perder contexto si la política cambia)';
COMMENT ON COLUMN interactions.user_card_interactions.reset_policy_id   IS 'Política activa al momento de crear el registro';
COMMENT ON COLUMN interactions.user_card_interactions.last_reset_at     IS 'Última vez que el contador fue reiniciado';
COMMENT ON COLUMN interactions.user_card_interactions.limit_reached_at  IS 'Momento en que interaction_count alcanzó limit_at_creation';
