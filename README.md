# Proyecto Dashboard — Express + Astro JS

## Estructura del workspace

```
/proyecto-raiz
├── .cursorrules                          ← Reglas globales del agente Cursor (NO editar)
├── .cursor/
│   └── prompts/
│       ├── backend/
│       │   └── prompts-backend.md        ← Prompts para Cursor Agent (Fase 1)
│       └── frontend/
│           └── prompts-frontend.md       ← Prompts para Cursor Agent (Fase 2)
├── docs/
│   ├── arquitectura.md                   ← Decisiones de diseño y flujos
│   ├── modelo-datos.md                   ← Tablas, relaciones y parámetros
│   └── endpoints.md                      ← Contrato completo de la API
├── db/
│   ├── install.sh                        ← Script maestro de instalación
│   ├── migrations/                       ← Scripts SQL ordenados (00 al 05)
│   ├── indexes/                          ← Índices de rendimiento (06)
│   └── seeds/                            ← Datos semilla (07)
├── backend/                              ← Express + TypeScript (por generar)
├── frontend/                             ← Astro JS + React (por generar)
└── README.md
```

---

## Cómo usar con Cursor Agent

### 1. Abrir el workspace completo en Cursor
```
cursor /ruta/a/proyecto-raiz
```

### 2. Instalar la base de datos
```bash
cd db
DB_PASSWORD=tu_password ./install.sh --seed
```

### 3. Ejecutar los prompts en orden

Abrir Cursor Agent con `Cmd+I` (Mac) o `Ctrl+I` (Windows/Linux).

**Fase 1 — Backend:** copiar y ejecutar cada tarea de `.cursor/prompts/backend/prompts-backend.md`
en orden del 1.1 al 1.8. Revisar el resultado de cada tarea antes de continuar.

**Fase 2 — Frontend:** copiar y ejecutar cada tarea de `.cursor/prompts/frontend/prompts-frontend.md`
en orden del 2.1 al 2.7. Ejecutar solo después de completar el backend.

---

## Inicio rápido con Docker

```bash
cp .env.example .env
# Editar .env con tus valores

docker-compose up --build
```

- Frontend: http://localhost:4321
- Backend:  http://localhost:3000
- Health:   http://localhost:3000/health

---

## Inicio en desarrollo (sin Docker)

Necesitas **PostgreSQL** con el esquema cargado (por ejemplo `cd db && DB_PASSWORD=... ./install.sh --seed`) y dos terminales.

### 1. Backend (puerto 3000)

```bash
cd backend
cp .env.example .env   # si aún no existe
# Completar JWT_SECRET, COOKIE_SECRET y DB_PASSWORD. Importante:
# FRONTEND_URL=http://localhost:4321
npm install
npm run dev
```

Comprueba `GET http://localhost:3000/health` (debe responder OK).

### 2. Frontend (puerto 4321)

```bash
cd frontend
cp .env.example .env   # si aún no existe
```

En `frontend/.env` debe existir **`BACKEND_URL=http://localhost:3000`** (lo usa el SSR/middleware para llamar al API).  
**No definas `PUBLIC_BACKEND_URL` apuntando al puerto 3000**: el navegador debe usar rutas relativas `/api/...` en el mismo origen que Astro (`:4321`); Vite reenvía `/api` al backend para que la cookie JWT quede en `localhost:4321` y el login y el middleware (`GET /api/auth/me`) funcionen.

```bash
npm install
npm run dev
```

Abre **http://localhost:4321/login** (no mezcles solo el puerto 3000 para la UI).

### Resumen del fallo típico “login OK pero no entra al dashboard”

1. **Cookie en el origen equivocado**: login contra `:3000` sin proxy → la cookie no se envía a `:4321`. Solución: proxy de Vite (`/api` → backend) y `PUBLIC_BACKEND_URL` vacío en el frontend.
2. **Faltaba `GET /api/auth/me` en el backend**: el middleware de Astro valida la sesión con esa ruta; sin ella siempre redirige a `/login`. Debe existir en el backend actual.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Astro JS 4.x (SSR) + React 18 (islas) |
| Backend | Express 4.x + TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | TypeORM 0.3.x |
| Auth | JWT en cookie httpOnly |
| Contenedor | Docker Compose |

---

## Documentación

| Documento | Contenido |
|---|---|
| `docs/arquitectura.md` | Flujos, decisiones de diseño, patrones |
| `docs/modelo-datos.md` | Tablas, columnas, relaciones y jerarquías |
| `docs/endpoints.md` | Contrato completo de la API con ejemplos |
| `.cursorrules` | Reglas del agente: stack, convenciones, seguridad |
