-- =============================================================================
-- 06_indexes.sql
-- Índices de rendimiento para todos los esquemas
-- Separados de la creación de tablas para facilitar re-indexación
-- =============================================================================

-- =============================================================================
-- ESQUEMA: security
-- =============================================================================

-- users: búsqueda por email en login
CREATE INDEX idx_users_email
  ON security.users (email);

-- users: filtrar activos y no eliminados (query más frecuente)
CREATE INDEX idx_users_active_not_deleted
  ON security.users (is_active, deleted_at)
  WHERE deleted_at IS NULL;

-- users: joins con roles
CREATE INDEX idx_users_role_id
  ON security.users (role_id);

-- user_security_status: lookup por user_id (relación 1:1)
CREATE INDEX idx_user_security_status_user_id
  ON security.user_security_status (user_id);

-- user_security_status: encontrar usuarios bloqueados activos
CREATE INDEX idx_user_security_status_blocked
  ON security.user_security_status (login_blocked_until)
  WHERE login_blocked_until IS NOT NULL;

-- sessions: lookup por token_jti en cada request autenticado
CREATE UNIQUE INDEX idx_sessions_token_jti
  ON security.sessions (token_jti);

-- sessions: sesiones activas por usuario (sin revocar y no expiradas)
CREATE INDEX idx_sessions_user_active
  ON security.sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;

-- role_permissions: lookup bidireccional
CREATE INDEX idx_role_permissions_role_id
  ON security.role_permissions (role_id);

CREATE INDEX idx_role_permissions_permission_id
  ON security.role_permissions (permission_id);

-- =============================================================================
-- ESQUEMA: config
-- =============================================================================

-- parameters: lookup por key (más frecuente en resolución de parámetros)
CREATE UNIQUE INDEX idx_parameters_key
  ON config.parameters (key);

-- parameters: filtrar por categoría
CREATE INDEX idx_parameters_category_id
  ON config.parameters (category_id);

-- role_parameters: resolución de parámetros por rol
CREATE INDEX idx_role_parameters_role_param
  ON config.role_parameters (role_id, parameter_id);

-- user_parameters: resolución de parámetros por usuario
CREATE INDEX idx_user_parameters_user_param
  ON config.user_parameters (user_id, parameter_id);

-- =============================================================================
-- ESQUEMA: content
-- =============================================================================

-- filters: ordenamiento para el desplegable
CREATE INDEX idx_filters_active_order
  ON content.filters (is_active, sort_order)
  WHERE is_active = TRUE;

-- filters: joins por tipo
CREATE INDEX idx_filters_filter_type_id
  ON content.filters (filter_type_id);

-- filters: filtros dependientes (padre → hijos)
CREATE INDEX idx_filters_parent_filter_id
  ON content.filters (parent_filter_id)
  WHERE parent_filter_id IS NOT NULL;

-- cards: query principal del dashboard: cards activas por filtro
CREATE INDEX idx_cards_filter_active
  ON content.cards (filter_id, is_active, sort_order)
  WHERE is_active = TRUE AND deleted_at IS NULL;

-- cards: soft delete
CREATE INDEX idx_cards_not_deleted
  ON content.cards (deleted_at)
  WHERE deleted_at IS NULL;

-- cards: joins con widget_type
CREATE INDEX idx_cards_widget_type_id
  ON content.cards (widget_type_id);

-- widget_types: activos (catálogo generalmente pequeño)
CREATE INDEX idx_widget_types_active
  ON content.widget_types (is_active)
  WHERE is_active = TRUE;

-- =============================================================================
-- ESQUEMA: interactions
-- =============================================================================

-- card_interaction_policies: resolución de política por card y rol
CREATE INDEX idx_card_interaction_policies_card_role
  ON interactions.card_interaction_policies (card_id, role_id);

-- card_interaction_policies: políticas activas por card
CREATE INDEX idx_card_interaction_policies_active
  ON interactions.card_interaction_policies (card_id, is_active)
  WHERE is_active = TRUE;

-- user_card_interactions: lookup principal (validación en cada interacción)
CREATE UNIQUE INDEX idx_user_card_interactions_user_card
  ON interactions.user_card_interactions (user_id, card_id);

-- user_card_interactions: encontrar counters que necesitan reset
CREATE INDEX idx_user_card_interactions_reset
  ON interactions.user_card_interactions (reset_policy_id, last_reset_at);

-- user_card_interactions: encontrar límites alcanzados
CREATE INDEX idx_user_card_interactions_blocked
  ON interactions.user_card_interactions (limit_reached_at)
  WHERE limit_reached_at IS NOT NULL;

-- =============================================================================
-- ESQUEMA: logs
-- =============================================================================

-- audit_logs: historial por usuario con paginación por fecha
CREATE INDEX idx_audit_logs_user_created
  ON logs.audit_logs (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- audit_logs: filtrar por tipo de acción
CREATE INDEX idx_audit_logs_action_type_created
  ON logs.audit_logs (action_type_id, created_at DESC);

-- audit_logs: búsqueda por entidad afectada
CREATE INDEX idx_audit_logs_entity
  ON logs.audit_logs (entity_type, entity_id)
  WHERE entity_type IS NOT NULL;

-- audit_logs: BRIN para rangos de fecha (tabla append-only ordenada por tiempo)
CREATE INDEX idx_audit_logs_created_brin
  ON logs.audit_logs USING BRIN (created_at);

-- audit_logs: filtrar por status
CREATE INDEX idx_audit_logs_status_created
  ON logs.audit_logs (status, created_at DESC);

-- audit_logs: JSONB payload (búsquedas dentro del contexto)
CREATE INDEX idx_audit_logs_payload_gin
  ON logs.audit_logs USING GIN (payload)
  WHERE payload IS NOT NULL;

-- auth_logs: detectar fuerza bruta por IP
CREATE INDEX idx_auth_logs_ip_created
  ON logs.auth_logs (ip_address, created_at DESC)
  WHERE ip_address IS NOT NULL;

-- auth_logs: historial por email ingresado
CREATE INDEX idx_auth_logs_email_created
  ON logs.auth_logs (email_attempt, created_at DESC);

-- auth_logs: BRIN por fecha (append-only)
CREATE INDEX idx_auth_logs_created_brin
  ON logs.auth_logs USING BRIN (created_at);

-- interaction_logs: historial por usuario y card
CREATE INDEX idx_interaction_logs_user_card_created
  ON logs.interaction_logs (user_id, card_id, created_at DESC);

-- interaction_logs: historial por card (para reportes)
CREATE INDEX idx_interaction_logs_card_created
  ON logs.interaction_logs (card_id, created_at DESC);

-- interaction_logs: BRIN por fecha (append-only)
CREATE INDEX idx_interaction_logs_created_brin
  ON logs.interaction_logs USING BRIN (created_at);

-- interaction_logs: JSONB payload
CREATE INDEX idx_interaction_logs_payload_gin
  ON logs.interaction_logs USING GIN (payload)
  WHERE payload IS NOT NULL;
