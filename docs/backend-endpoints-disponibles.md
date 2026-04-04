# Endpoints disponibles en el backend

Inventario generado a partir del registro de rutas en Express (`app.ts` y routers).  
Base típica en desarrollo: `http://localhost:3000`

Autenticación por cookie **`access_token`** (JWT httpOnly), salvo donde se indique lo contrario.

---

## Salud

| Método | Ruta | Auth | Notas |
|--------|------|------|--------|
| `GET` | `/health` | No | Comprueba inicialización de TypeORM y `SELECT 1` a PostgreSQL. `503` si falla. |

---

## Auth (`/api/auth`)

| Método | Ruta | Auth | Notas |
|--------|------|------|--------|
| `POST` | `/api/auth/login` | No | Body: email, password. Establece cookie `access_token`. |
| `GET` | `/api/auth/me` | JWT | Usuario actual (id, email, fullName, role). Usado por el SSR del frontend. |
| `POST` | `/api/auth/logout` | JWT | Revoca sesión y limpia cookie. |

---

## Filtros (`/api/filters`)

| Método | Ruta | Auth | Permiso (`rolesGuard`) |
|--------|------|------|-------------------------|
| `GET` | `/api/filters` | JWT | `filter.apply` |

---

## Cards — dashboard (`/api/cards`)

| Método | Ruta | Auth | Permiso |
|--------|------|------|---------|
| `GET` | `/api/cards` | JWT | `card.view` |

Query opcionales: `filterId`, `page`, `limit`.

---

## Interacciones (`/api/interactions`)

| Método | Ruta | Auth | Permiso |
|--------|------|------|---------|
| `GET` | `/api/interactions/:cardId` | JWT | `card.interact` |
| `POST` | `/api/interactions/:cardId` | JWT | `card.interact` |

`:cardId` = UUID de la card.

---

## Admin (`/api/admin`)

Todas las rutas bajo `/api/admin` usan **`jwtGuard`**; además aplica el permiso indicado.

### Usuarios (`/api/admin/users`)

| Método | Ruta | Permiso |
|--------|------|---------|
| `GET` | `/api/admin/users` | `admin.users.view` |
| `POST` | `/api/admin/users` | `admin.users.manage` |
| `PATCH` | `/api/admin/users/:id` | `admin.users.manage` |
| `DELETE` | `/api/admin/users/:id` | `admin.users.manage` |

Query en `GET`: `page`, `limit`, `search`.

### Cards — administración (`/api/admin/cards`)

| Método | Ruta | Permiso |
|--------|------|---------|
| `POST` | `/api/admin/cards` | `admin.cards.manage` |
| `PATCH` | `/api/admin/cards/:id` | `admin.cards.manage` |
| `DELETE` | `/api/admin/cards/:id` | `admin.cards.manage` |

### Políticas de interacción (`/api/admin/policies`)

| Método | Ruta | Permiso |
|--------|------|---------|
| `GET` | `/api/admin/policies/:cardId` | `config.policies.manage` |
| `PUT` | `/api/admin/policies/:cardId` | `config.policies.manage` |

### Parámetros del sistema (`/api/admin/parameters`)

| Método | Ruta | Permiso |
|--------|------|---------|
| `GET` | `/api/admin/parameters` | `config.parameters.view` |
| `PATCH` | `/api/admin/parameters/:id` | `config.parameters.manage` |

---

## Referencia de contrato

Para cuerpos de petición, respuestas y códigos HTTP detallados, ver **`docs/endpoints.md`**.
