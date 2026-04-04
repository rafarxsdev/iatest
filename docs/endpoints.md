# Contrato de la API — Endpoints

Base URL backend: `http://localhost:3000`
Autenticación: cookie `access_token` (httpOnly JWT)
Formato de respuesta: ver `.cursorrules` → sección FORMATO ESTÁNDAR

---

## Auth

### POST /api/auth/login
**Descripción:** Autenticar usuario y abrir sesión

**Body:**
```json
{ "email": "string", "password": "string" }
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "string", "fullName": "string", "role": "string" }
  }
}
```
Set-Cookie: `access_token=<jwt>; HttpOnly; Secure; SameSite=Strict`

**Respuesta 401:** Credenciales incorrectas
**Respuesta 403:** Cuenta bloqueada temporalmente
```json
{
  "success": false,
  "message": "Cuenta bloqueada. Intenta de nuevo en 14 minutos.",
  "data": { "blockedUntil": "2024-01-01T12:14:00Z" }
}
```

---

### POST /api/auth/logout
**Descripción:** Revocar sesión activa
**Auth:** Requerida

**Respuesta 200:**
```json
{ "success": true, "data": null }
```
Set-Cookie: `access_token=; Max-Age=0`

---

## Filters

### GET /api/filters
**Descripción:** Obtener filtros activos del desplegable
**Auth:** Requerida | **Permiso:** `filter.apply`

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "label": "string",
      "value": "string",
      "filterType": { "code": "single_select" },
      "children": [],
      "sortOrder": 0
    }
  ]
}
```

---

## Cards

### GET /api/cards
**Descripción:** Obtener cards activas, opcionalmente filtradas
**Auth:** Requerida | **Permiso:** `card.view`

**Query params:**
- `filterId` (opcional): UUID del filtro seleccionado
- `page` (opcional, default 1)
- `limit` (opcional, default: parámetro `cards_per_page`)

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "htmlContent": "string (sanitizado)",
      "widgetType": { "code": "form", "label": "Formulario" },
      "interactionStatus": {
        "used": 2,
        "limit": 5,
        "remaining": 3,
        "isBlocked": false
      },
      "sortOrder": 0
    }
  ],
  "meta": { "total": 24, "page": 1, "limit": 12 }
}
```

---

## Interactions

### GET /api/interactions/:cardId
**Descripción:** Estado actual de interacciones del usuario para una card
**Auth:** Requerida | **Permiso:** `card.interact`

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "used": 2,
    "limit": 5,
    "remaining": 3,
    "isBlocked": false,
    "lastInteractionAt": "2024-01-01T10:00:00Z"
  }
}
```

---

### POST /api/interactions/:cardId
**Descripción:** Registrar una interacción con el widget de una card
**Auth:** Requerida | **Permiso:** `card.interact`

**Body (opcional):**
```json
{ "payload": {} }
```

**Respuesta 200 — Interacción exitosa:**
```json
{
  "success": true,
  "data": {
    "used": 3,
    "limit": 5,
    "remaining": 2,
    "isBlocked": false
  }
}
```

**Respuesta 403 — Límite alcanzado:**
```json
{
  "success": false,
  "message": "Has alcanzado el límite de usos para este widget.",
  "data": {
    "used": 5,
    "limit": 5,
    "remaining": 0,
    "isBlocked": true,
    "limitReachedAt": "2024-01-01T10:30:00Z"
  }
}
```

---

## Admin — Usuarios

### GET /api/admin/users
**Permiso:** `admin.users.view`
**Query:** `page`, `limit`, `search` (por nombre o email)

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid", "email": "string", "fullName": "string",
      "role": { "id": "uuid", "name": "string" },
      "isActive": true, "lastLoginAt": "string", "createdAt": "string"
    }
  ],
  "meta": { "total": 10, "page": 1, "limit": 20 }
}
```

### POST /api/admin/users
**Permiso:** `admin.users.manage`
**Body:** `{ email, password, fullName, roleId }`
**Respuesta 201**

### PATCH /api/admin/users/:id
**Permiso:** `admin.users.manage`
**Body (parcial):** `{ fullName?, roleId?, isActive? }`
**Respuesta 200**

### DELETE /api/admin/users/:id
**Permiso:** `admin.users.manage`
**Acción:** Soft delete (`deleted_at = NOW()`)
**Respuesta 200**

---

## Admin — Cards

### POST /api/admin/cards
**Permiso:** `admin.cards.manage`
**Body:** `{ title, htmlContent, filterId, widgetTypeId, widgetConfiguration?, sortOrder? }`
**Respuesta 201**

### PATCH /api/admin/cards/:id
**Permiso:** `admin.cards.manage`
**Body (parcial):** `{ title?, htmlContent?, filterId?, isActive?, sortOrder? }`
**Respuesta 200**

### DELETE /api/admin/cards/:id
**Permiso:** `admin.cards.manage`
**Acción:** Soft delete
**Respuesta 200**

---

## Admin — Políticas de interacción

### GET /api/admin/policies/:cardId
**Permiso:** `config.policies.manage`

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "role": { "id": "uuid", "name": "string" } ,
      "maxInteractions": 5,
      "resetPolicy": { "code": "daily" },
      "isActive": true
    }
  ]
}
```

### PUT /api/admin/policies/:cardId
**Permiso:** `config.policies.manage`
**Body:** `{ roleId: uuid | null, maxInteractions: number, resetPolicyId: uuid }`
**Acción:** Upsert por `(card_id, role_id)`
**Respuesta 200**

---

## Admin — Parámetros

### GET /api/admin/parameters
**Permiso:** `config.parameters.view`

**Respuesta 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid", "key": "string", "value": "string",
      "dataType": "number", "description": "string",
      "isEditable": true,
      "category": { "code": "auth" }
    }
  ]
}
```

### PATCH /api/admin/parameters/:id
**Permiso:** `config.parameters.manage`
**Body:** `{ value: string }`
**Validación:** `is_editable = true` (403 si no es editable)
**Respuesta 200**

---

## Health

### GET /health
**Auth:** No requerida

**Respuesta 200:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "database": "connected"
}
```

---

## Códigos de error comunes

| Código | Cuándo |
|---|---|
| 400 | Body inválido, campo requerido faltante |
| 401 | Cookie ausente, JWT expirado, sesión revocada |
| 403 | Sin permiso requerido, límite de interacciones alcanzado, parámetro no editable |
| 404 | Recurso no encontrado (card, usuario, filtro) |
| 409 | Email duplicado al crear usuario |
| 500 | Error interno no controlado |
