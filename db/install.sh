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
#   ./install.sh --reset --yes           → mismo reset sin preguntar (CI / Docker / AWS)
# Env: INSTALL_RESET_CONFIRM=yes        → equivalente a --yes para --reset
#
# Si la BD ya tiene el esquema base (p. ej. security.permissions) y no usas --reset,
# el script sale con un mensaje claro en lugar de fallar en CREATE TABLE.
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuración por defecto (sobreescribir con variables de entorno)
# =============================================================================
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-app_db}"
# Evita \r o espacios (p. ej. .env en Windows) que rompen la comparación con pg_database.datname
DB_NAME="${DB_NAME//$'\r'/}"
DB_NAME="${DB_NAME#"${DB_NAME%%[![:space:]]*}"}"
DB_NAME="${DB_NAME%"${DB_NAME##*[![:space:]]}"}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/install.log"
INCLUDE_SEED=false
RESET_DB=false
RESET_YES=false

# =============================================================================
# Parsear argumentos
# =============================================================================
for arg in "$@"; do
  case $arg in
    --seed)  INCLUDE_SEED=true ;;
    --reset) RESET_DB=true ;;
    --yes|-y) RESET_YES=true ;;
    *)
      echo "❌ Argumento desconocido: $arg"
      echo "   Uso: ./install.sh [--seed] [--reset] [--yes]"
      exit 1
      ;;
  esac
done

if [ "$RESET_YES" = true ] && [ "$RESET_DB" != true ]; then
  echo "❌ --yes solo tiene efecto junto con --reset" >&2
  exit 1
fi

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
  local out
  # count(*) es más robusto que EXISTS + t/f según cliente/locale de psql
  out="$(PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="postgres" \
    -t -A \
    --command="SELECT count(*)::text FROM pg_database WHERE datname = '$DB_NAME';" \
    2>/dev/null)" || return 1
  out="$(printf '%s' "$out" | tr -d '[:space:]')"
  [[ "$out" == "1" ]]
}

# Mensajes típicos: EN "already exists", ES "ya existe", SQLSTATE 42P04 (duplicate_database)
is_duplicate_database_error() {
  local msg="$1"
  case "$(printf '%s' "$msg" | tr '[:upper:]' '[:lower:]')" in
    *already*exists*) return 0 ;;
    *ya*existe*) return 0 ;;
    *42p04*) return 0 ;;
    *duplicate*database*) return 0 ;;
    *) return 1 ;;
  esac
}

# Si Postgres ya tiene la BD (p. ej. POSTGRES_DB en Docker), conectar y listo: no ejecutar CREATE DATABASE.
app_database_ready() {
  set +e
  PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --command="SELECT 1;" \
    >> "$LOG_FILE" 2>&1
  local st=$?
  set -e
  if [[ "$st" -eq 0 ]]; then
    return 0
  fi
  return 1
}

ensure_database() {
  log "INFO" "Comprobando base de datos '$DB_NAME' (conexión directa; típico en Docker con POSTGRES_DB)..."
  if app_database_ready; then
    log "OK  " "✅ Base '$DB_NAME' accesible — se omiten CREATE y el error «already exists»"
    return 0
  fi
  log "INFO" "La base aún no es accesible o no existe; comprobando catálogo / creando..."
  if db_exists; then
    log "INFO" "La base de datos '$DB_NAME' ya existe en el catálogo; continuando..."
    return 0
  fi
  create_db
}

create_db() {
  local out st
  log "INFO" "Creando base de datos: $DB_NAME"
  # Con set -e, fallo de psql dentro de $(...) puede abortar el script antes de los elif;
  # capturamos código de salida sin salir.
  set +e
  out="$(
    PGPASSWORD="$DB_PASSWORD" psql \
      --host="$DB_HOST" \
      --port="$DB_PORT" \
      --username="$DB_USER" \
      --dbname="postgres" \
      --command="CREATE DATABASE \"$DB_NAME\" ENCODING 'UTF8';" \
      2>&1
  )"
  st=$?
  set -e
  printf '%s\n' "$out" >> "$LOG_FILE"

  if [[ "$st" -eq 0 ]]; then
    log "OK  " "✅ Base de datos creada: $DB_NAME"
    return 0
  fi
  if is_duplicate_database_error "$out"; then
    log "INFO" "La base de datos '$DB_NAME' ya existía; continuando..."
    return 0
  fi
  if db_exists; then
    log "INFO" "La base de datos '$DB_NAME' ya existía (comprobación SQL); continuando..."
    return 0
  fi
  log "ERR " "❌ No se pudo crear la base de datos — revisa $LOG_FILE"
  exit 1
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

# Comprueba si el esquema base de seguridad ya está aplicado (re-ejecutar migraciones falla en CREATE TABLE).
base_schema_already_installed() {
  local out
  out="$(PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    -t -A \
    --command="SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'security' AND table_name = 'permissions');" \
    2>/dev/null)" || return 1
  out="$(printf '%s' "$out" | tr -d '[:space:]')"
  [[ "$out" == "t" ]]
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
echo "  Yes  : $RESET_YES"
echo "=============================================="
echo ""

# Limpiar log anterior
> "$LOG_FILE"

# Verificar conexión
check_connection

# Reset si se solicita
if [ "$RESET_DB" = true ]; then
  echo ""
  if [ "$RESET_YES" = true ] || [ "${INSTALL_RESET_CONFIRM:-}" = "yes" ]; then
    log "WARN" "⚠️  Reset confirmado (--yes o INSTALL_RESET_CONFIRM=yes); se elimina '$DB_NAME'"
  else
    read -r -p "⚠️  ¿Confirmas que deseas ELIMINAR y recrear '$DB_NAME'? [s/N]: " confirm
    if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
      log "INFO" "Operación cancelada por el usuario"
      exit 0
    fi
  fi
  drop_db
fi

# Crear BD solo si hace falta (Docker suele crearla ya con POSTGRES_DB)
ensure_database

if [ "$RESET_DB" != true ] && base_schema_already_installed; then
  log "ERR " "❌ La base '$DB_NAME' ya tiene el esquema instalado (tabla security.permissions)."
  log "ERR " "   No se puede volver a ejecutar las migraciones desde cero sin borrar datos."
  log "ERR " "   Opciones: (1) ./install.sh --reset --yes [--seed] para recrear la BD"
  log "ERR " "   (2) INSTALL_RESET_CONFIRM=yes ./install.sh --reset [--seed]"
  log "ERR " "   En Docker: ./db/install-docker.sh --reset --yes [--seed]"
  exit 1
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
