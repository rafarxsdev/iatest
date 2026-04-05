-- =============================================================================
-- Permisos de gestión de cards y filtros para el rol operator
-- Idempotente: no duplica filas en role_permissions
-- =============================================================================

INSERT INTO security.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002'::uuid, p.id
FROM security.permissions p
WHERE p.code IN (
  'admin.cards.view',
  'admin.cards.manage',
  'admin.filters.manage',
  'admin.widgets.manage'
)
ON CONFLICT ON CONSTRAINT uq_role_permissions_role_perm DO NOTHING;
