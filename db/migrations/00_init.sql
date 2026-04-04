-- =============================================================================
-- 00_init.sql
-- Inicialización: extensiones y configuración base de PostgreSQL
-- =============================================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";         -- email case-insensitive
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- búsquedas por similitud en logs
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- índices GIN para JSONB

-- Esquemas
CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS config;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS interactions;
CREATE SCHEMA IF NOT EXISTS logs;

-- Comentarios de esquemas
COMMENT ON SCHEMA security     IS 'Usuarios, roles, permisos y sesiones';
COMMENT ON SCHEMA config        IS 'Parámetros y configuración del sistema';
COMMENT ON SCHEMA content       IS 'Filtros, widgets y cards';
COMMENT ON SCHEMA interactions  IS 'Control de interacciones por usuario y card';
COMMENT ON SCHEMA logs          IS 'Trazabilidad y auditoría';

-- Función utilitaria: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_updated_at IS 'Trigger para actualizar updated_at en cada UPDATE';
