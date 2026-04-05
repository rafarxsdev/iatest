#!/usr/bin/env bash
# =============================================================================
# install.sh
# Script maestro de instalación de la base de datos
# Ejecuta todos los scripts en orden con validación y rollback
#
# Uso:
#   ./install.sh                         → instala con variables de entorno
#   DB_NAME=mydb ./install.sh            → sobreescribe nombre de BD
#   ./install.sh --seed                  → incluye datos semilla
#   ./install.sh --reset                 → elimina y recrea la BD (¡destructivo!)
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuración por defecto (sobreescribir con variables de entorno)
# =============================================================================
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-app_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/install.log"
INCLUDE_SEED=false
RESET_DB=false

# =============================================================================
# Parsear argumentos
# =============================================================================
for arg in "$@"; do
  case $arg in
    --seed)  INCLUDE_SEED=true ;;
    --reset) RESET_DB=true ;;
    *)
      echo "❌ Argumento desconocido: $arg"
      echo "   Uso: ./install.sh [--seed] [--reset]"
      exit 1
      ;;
  esac
done

# =============================================================================
# Utilidades
# =============================================================================
log() {
  local level="$1"
  local msg="$2"
  local ts
  ts=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$ts] [$level] $msg" | tee -a "$LOG_FILE"
}

run_sql() {
  local file="$1"
  local label="$2"

  log "INFO" "Ejecutando: $label"

  if PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --file="$file" \
    --set ON_ERROR_STOP=1 \
    >> "$LOG_FILE" 2>&1; then
    log "OK  " "✅ $label"
  else
    log "ERR " "❌ $label — revisa $LOG_FILE para el detalle"
    exit 1
  fi
}

check_connection() {
  log "INFO" "Verificando conexión a PostgreSQL en $DB_HOST:$DB_PORT..."
  if ! PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="postgres" \
    --command="SELECT 1;" \
    >> "$LOG_FILE" 2>&1; then
    log "ERR " "❌ No se pudo conectar. Verifica DB_HOST, DB_PORT, DB_USER y DB_PASSWORD"
    exit 1
  fi
  log "OK  " "✅ Conexión exitosa"
}

db_exists() {
  PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="postgres" \
    --tuples-only \
    --command="SELECT 1 FROM pg_database WHERE datname = '$DB_NAME';" \
    2>/dev/null | grep -q 1
}

create_db() {
  log "INFO" "Creando base de datos: $DB_NAME"
  PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="postgres" \
    --command="CREATE DATABASE \"$DB_NAME\" ENCODING 'UTF8';" \
    >> "$LOG_FILE" 2>&1
  log "OK  " "✅ Base de datos creada: $DB_NAME"
}

drop_db() {
  log "WARN" "⚠️  Eliminando base de datos: $DB_NAME"
  PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="postgres" \
    --command="DROP DATABASE IF EXISTS \"$DB_NAME\";" \
    >> "$LOG_FILE" 2>&1
  log "WARN" "Base de datos eliminada: $DB_NAME"
}

# =============================================================================
# Main
# =============================================================================
echo ""
echo "=============================================="
echo "  Instalación de base de datos"
echo "  Host : $DB_HOST:$DB_PORT"
echo "  BD   : $DB_NAME"
echo "  User : $DB_USER"
echo "  Seed : $INCLUDE_SEED"
echo "  Reset: $RESET_DB"
echo "=============================================="
echo ""

# Limpiar log anterior
> "$LOG_FILE"

# Verificar conexión
check_connection

# Reset si se solicita
if [ "$RESET_DB" = true ]; then
  echo ""
  read -r -p "⚠️  ¿Confirmas que deseas ELIMINAR y recrear '$DB_NAME'? [s/N]: " confirm
  if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
    log "INFO" "Operación cancelada por el usuario"
    exit 0
  fi
  drop_db
fi

# Crear BD si no existe
if db_exists; then
  log "INFO" "La base de datos '$DB_NAME' ya existe, continuando..."
else
  create_db
fi

# =============================================================================
# Ejecución de scripts en orden
# =============================================================================
echo ""
log "INFO" "--- Iniciando migraciones ---"

run_sql "$SCRIPT_DIR/migrations/00_init.sql"       "00 · Extensiones y esquemas"
run_sql "$SCRIPT_DIR/migrations/01_security.sql"   "01 · Seguridad (users, roles, sessions)"
run_sql "$SCRIPT_DIR/migrations/02_config.sql"     "02 · Configuración (parameters)"
run_sql "$SCRIPT_DIR/migrations/03_content.sql"    "03 · Contenido (filters, widgets, cards)"
run_sql "$SCRIPT_DIR/migrations/04_interactions.sql" "04 · Interacciones (policies, counters)"
run_sql "$SCRIPT_DIR/migrations/05_logs.sql"       "05 · Trazabilidad (audit, auth, interaction logs)"

log "INFO" "--- Migraciones completadas ---"
echo ""

log "INFO" "--- Creando índices ---"
run_sql "$SCRIPT_DIR/indexes/06_indexes.sql"       "06 · Índices de rendimiento"
log "INFO" "--- Índices creados ---"
echo ""

# Compatibilidad: columnas añadidas tras el esquema base (no-op si ya existen)
run_sql "$SCRIPT_DIR/migrations/10_card_icon_name.sql" "10 · Columna icon_name en cards (legacy / idempotente)"

# Seed opcional (roles, permisos, admin inicial, catálogos de contenido)
if [ "$INCLUDE_SEED" = true ]; then
  log "INFO" "--- Cargando datos semilla ---"
  run_sql "$SCRIPT_DIR/seeds/07_seed.sql"          "07 · Datos semilla (catálogos, roles, usuario admin)"
  # Parche datos: permisos operator en BDs antiguas (idempotente; seed ya los define en instalaciones nuevas)
  run_sql "$SCRIPT_DIR/migrations/09_operator_cards_filters_permissions.sql" "09 · Permisos operator cards/filters (idempotente)"
  log "INFO" "--- Datos semilla cargados ---"
  echo ""
fi

# =============================================================================
# Resumen final
# =============================================================================
echo ""
echo "=============================================="
log "OK  " "✅ Instalación completada exitosamente"
echo "  Log detallado: $LOG_FILE"
echo "=============================================="
echo ""
