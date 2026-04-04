# Arquitectura del Proyecto

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Astro JS 4.x — SSR + React Islands |
| Backend | Express 4.x + TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | TypeORM 0.3.x |
| Autenticación | JWT en cookie httpOnly |
| Contenedor | Docker Compose |

---

## Decisiones de diseño

### Renderizado: Híbrido SSR + CSR

| Componente | Modo | Razón |
|---|---|---|
| `/login` | SSR puro | Seguridad: redirige antes de pintar si ya hay sesión |
| `/dashboard` carga inicial | SSR | HTML con datos llega listo; JWT validado en servidor |
| Filtros + recarga de cards | CSR (isla React) | UX fluida sin recargar la página completa |
| InteractionGuard | CSR (isla React) | Estado local del contador, actualización optimista |

### JWT en cookie httpOnly

El token **nunca** toca `localStorage`. La cookie `access_token` se configura con:
- `httpOnly: true` → JavaScript no puede leerla (protección XSS)
- `secure: true` → solo HTTPS en producción
- `sameSite: strict` → protección CSRF

La sesión se valida en dos pasos:
1. Firma del JWT (jsonwebtoken)
2. Existencia y vigencia en tabla `security.sessions` (no revocada, no expirada)

### HTML sanitizado

El campo `html_content` de las cards contiene HTML que se sanitiza con `sanitize-html` en el backend **antes de responder**, aunque ya venga sanitizado desde BD. El frontend usa `dangerouslySetInnerHTML` (React) sabiendo que recibe HTML limpio del servidor.

### Parámetros en cascada

Ningún valor de configuración está hardcodeado. Todo se resuelve desde la jerarquía:
```
user_parameters → role_parameters → parameters
```
El `ParameterService.resolve(key, userId)` es el único punto de acceso a parámetros.

---

## Flujo de autenticación

```
[Browser] POST /api/auth/login { email, password }
      ↓
[Express] Verifica user_security_status → ¿bloqueado?
      ↓ No bloqueado
[Express] Compara password_hash con bcrypt
      ↓ Credenciales válidas
[Express] Genera JWT con { sub: userId, role: roleId, jti: uuid }
[Express] Inserta en security.sessions
[Express] Registra en logs.auth_logs + logs.audit_logs
[Express] Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Strict
      ↓
[Browser] Redirige a /dashboard
      ↓
[Astro SSR] Lee cookie → llama backend GET /api/cards + GET /api/filters
[Astro SSR] Renderiza HTML completo con datos iniciales
      ↓
[Browser] Hidrata isla React Dashboard.tsx
```

---

## Flujo de interacción con widget

```
[Usuario] Click en widget de una card
      ↓
[InteractionGuard.tsx] Intercepta el evento
[InteractionGuard.tsx] POST /api/interactions/:cardId (con cookie automática)
      ↓
[Express JwtGuard] Valida JWT + verifica sesión en BD
[Express RolesGuard] Verifica permiso card.interact
      ↓
[InteractionsService] resolveLimit(cardId, userId) → límite vigente
[InteractionsService] Consulta user_card_interactions actual
      ↓
  ┌── ¿interaction_count >= limit?
  │       SÍ → 403, registra WIDGET_BLOCKED en logs
  │       NO → incrementa contador en transacción
  │             registra WIDGET_INTERACTION en logs
  └── Responde { used, limit, remaining, is_blocked }
      ↓
[InteractionGuard.tsx] Actualiza estado local → re-renderiza contador
```

---

## Puertos de desarrollo

| Servicio | Puerto |
|---|---|
| Frontend (Astro) | 4321 |
| Backend (Express) | 3000 |
| PostgreSQL | 5432 |

---

## CORS

El backend acepta requests desde `FRONTEND_URL` (variable de entorno).
En desarrollo: `http://localhost:4321`.
Credentials: `true` (necesario para que las cookies se envíen cross-origin).
