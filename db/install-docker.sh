#!/usr/bin/env bash
# =============================================================================
# install-docker.sh
# Ejecuta install.sh dentro de Docker, conectando al servicio "postgres" por la
# red interna de docker compose. Útil en AWS / servidores donde psql en el host
# falla (firewall, sudo sin DB_PASSWORD, etc.).
#
# Uso (desde la raíz del proyecto, con contenedores ya arriba):
#   chmod +x db/install-docker.sh
#   ./db/install-docker.sh --seed
# (No hace falta sudo si tu usuario puede usar docker; si usas sudo, la ruta
#  al .env debe seguir siendo legible.)
#
# Variables: lee .env en la raíz (o ENV_FILE=/ruta/.env.aws).
# Requiere: DB_PASSWORD o POSTGRES_PASSWORD coincidente con el contenedor postgres.
# =============================================================================
set -euo pipefail

# Carga .env sin "source": evita que bash ejecute comentarios mal puestos, líneas
# sueltas o "KEY= valor" (intentaría ejecutar "valor" como comando → p. ej. "va").
load_dotenv() {
  local file="$1"
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      export "${BASH_REMATCH[1]}=${BASH_REMATCH[2]}"
    fi
  done < "$file"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
if [ -f "$ENV_FILE" ]; then
  load_dotenv "$ENV_FILE"
else
  echo "No se encontró $ENV_FILE — crea .env o usa ENV_FILE=/ruta/al/archivo ./db/install-docker.sh ..." >&2
  exit 1
fi

DB_PASSWORD="${DB_PASSWORD:-${POSTGRES_PASSWORD:-}}"
if [ -z "$DB_PASSWORD" ]; then
  echo "Define DB_PASSWORD o POSTGRES_PASSWORD en $ENV_FILE" >&2
  exit 1
fi

# Dentro de la red Docker, el hostname del servicio es "postgres" (ver docker-compose.yml)
DB_HOST="${DB_HOST_DOCKER:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-app_db}"
DB_USER="${DB_USER:-postgres}"

CID=$(docker ps -q -f "label=com.docker.compose.service=postgres" 2>/dev/null | head -n1)
if [ -z "${CID:-}" ]; then
  CID=$(docker ps -qf "name=postgres" 2>/dev/null | head -n1)
fi
if [ -z "${CID:-}" ]; then
  echo "No hay contenedor postgres en ejecución. Ejecuta: docker compose up -d" >&2
  exit 1
fi

NETWORK=$(docker inspect "$CID" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' | tr ' ' '\n' | grep -E '_default$' | head -n1)
if [ -z "${NETWORK:-}" ]; then
  NETWORK=$(docker inspect "$CID" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' | awk '{print $1}')
fi

echo "Red Docker: $NETWORK"
echo "PostgreSQL: ${DB_HOST}:${DB_PORT} (usuario ${DB_USER}, bd ${DB_NAME})"
echo ""

exec docker run --rm \
  --network "$NETWORK" \
  -v "$SCRIPT_DIR:/db" \
  -w /db \
  -e DB_HOST="$DB_HOST" \
  -e DB_PORT="$DB_PORT" \
  -e DB_NAME="$DB_NAME" \
  -e DB_USER="$DB_USER" \
  -e DB_PASSWORD="$DB_PASSWORD" \
  postgres:16-alpine \
  sh -c '
    apk add --no-cache bash >/dev/null
    chmod +x /db/install.sh
    exec bash /db/install.sh "$@"
  ' sh "$@"
