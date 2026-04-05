-- =============================================================================
-- 03_content.sql
-- Esquema: content
-- Tablas: filter_types, filters, widget_types, cards
-- =============================================================================

-- -----------------------------------------------------------------------------
-- filter_types
-- Catálogo de tipos de control para filtros del dashboard
-- -----------------------------------------------------------------------------
CREATE TABLE content.filter_types (
  id           UUID        NOT NULL DEFAULT gen_random_uuid(),
  code         VARCHAR(50) NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_filter_types      PRIMARY KEY (id),
  CONSTRAINT uq_filter_types_code UNIQUE (code),
  CONSTRAINT ck_filter_types_code CHECK (
    code IN ('single_select', 'multi_select', 'date_range', 'text_search')
  )
);

COMMENT ON TABLE  content.filter_types      IS 'Catálogo de tipos de control disponibles para filtros del dashboard';
COMMENT ON COLUMN content.filter_types.code IS 'single_select, multi_select, date_range, text_search';

-- -----------------------------------------------------------------------------
-- filters
-- Filtros disponibles en el desplegable del dashboard
-- Soporta dependencia jerárquica entre filtros (parent_filter_id)
-- -----------------------------------------------------------------------------
CREATE TABLE content.filters (
  id               UUID         NOT NULL DEFAULT gen_random_uuid(),
  label            VARCHAR(100) NOT NULL,
  value            VARCHAR(100) NOT NULL,
  filter_type_id   UUID         NOT NULL,
  parent_filter_id UUID,
  configuration    JSONB        NOT NULL DEFAULT '{}',
  sort_order       INTEGER      NOT NULL DEFAULT 0,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_filters             PRIMARY KEY (id),
  CONSTRAINT uq_filters_value       UNIQUE (value),
  CONSTRAINT fk_filters_type        FOREIGN KEY (filter_type_id)
    REFERENCES content.filter_types (id),
  CONSTRAINT fk_filters_parent      FOREIGN KEY (parent_filter_id)
    REFERENCES content.filters (id) ON DELETE SET NULL,
  CONSTRAINT ck_filters_no_self_ref CHECK (id <> parent_filter_id)
);

COMMENT ON TABLE  content.filters                  IS 'Opciones del desplegable del dashboard';
COMMENT ON COLUMN content.filters.value            IS 'Valor enviado al backend en la query: ?filter=valor';
COMMENT ON COLUMN content.filters.parent_filter_id IS 'Referencia al filtro padre para filtros dependientes jerárquicamente';
COMMENT ON COLUMN content.filters.configuration    IS 'Configuración adicional específica del tipo (ej: rango de fechas, opciones múltiples)';

CREATE TRIGGER trg_filters_updated_at
  BEFORE UPDATE ON content.filters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- widget_types
-- Catálogo de tipos de widget que pueden estar embebidos en las cards
-- -----------------------------------------------------------------------------
CREATE TABLE content.widget_types (
  id                       UUID         NOT NULL DEFAULT gen_random_uuid(),
  code                     VARCHAR(50)  NOT NULL,
  label                    VARCHAR(100) NOT NULL,
  default_max_interactions INTEGER,
  configuration_schema     JSONB        NOT NULL DEFAULT '{}',
  is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_widget_types      PRIMARY KEY (id),
  CONSTRAINT uq_widget_types_code UNIQUE (code),
  CONSTRAINT ck_widget_types_max_interactions
    CHECK (default_max_interactions IS NULL OR default_max_interactions > 0)
);

COMMENT ON TABLE  content.widget_types                          IS 'Catálogo de tipos de widget disponibles para embeber en cards';
COMMENT ON COLUMN content.widget_types.code                    IS 'Identificador funcional: form, video, quiz, survey, embed';
COMMENT ON COLUMN content.widget_types.default_max_interactions IS 'Límite por defecto de este tipo. NULL = sin límite propio, consultar parameters';
COMMENT ON COLUMN content.widget_types.configuration_schema    IS 'JSON Schema para validar widget_configuration en cards';

CREATE TRIGGER trg_widget_types_updated_at
  BEFORE UPDATE ON content.widget_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- cards
-- Contenido del dashboard: cards con HTML sanitizado y widget embebido
-- max_interactions eliminado de esta tabla (ver 04_interactions.sql)
-- La jerarquía de límites vive en card_interaction_policies
-- -----------------------------------------------------------------------------
CREATE TABLE content.cards (
  id                   UUID         NOT NULL DEFAULT gen_random_uuid(),
  title                VARCHAR(200) NOT NULL,
  html_content         TEXT         NOT NULL,
  filter_id            UUID         NOT NULL,
  widget_type_id       UUID         NOT NULL,
  widget_configuration JSONB        NOT NULL DEFAULT '{}',
  icon_name            VARCHAR(100) NULL,
  sort_order           INTEGER      NOT NULL DEFAULT 0,
  is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,

  CONSTRAINT pk_cards                PRIMARY KEY (id),
  CONSTRAINT fk_cards_filter         FOREIGN KEY (filter_id)
    REFERENCES content.filters (id),
  CONSTRAINT fk_cards_widget_type    FOREIGN KEY (widget_type_id)
    REFERENCES content.widget_types (id)
);

COMMENT ON TABLE  content.cards                    IS 'Cards del dashboard con HTML sanitizado y widget embebido';
COMMENT ON COLUMN content.cards.html_content       IS 'HTML sanitizado en el backend (sanitize-html) antes de persistir';
COMMENT ON COLUMN content.cards.widget_configuration IS 'Configuración específica del widget de esta card. Validada contra widget_types.configuration_schema';
COMMENT ON COLUMN content.cards.icon_name          IS 'Nombre del glifo Material Symbols Outlined (ej. settings_suggest); NULL = fallback en cliente';
COMMENT ON COLUMN content.cards.deleted_at         IS 'Soft delete: NULL = activa';

CREATE TRIGGER trg_cards_updated_at
  BEFORE UPDATE ON content.cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
