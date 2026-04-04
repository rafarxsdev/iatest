# Modelo de Datos

Fuente de verdad SQL: `db/migrations/`
Base de datos: PostgreSQL 16
ORM: TypeORM 0.3.x

---

## Esquemas y tablas

### `security` — Autenticación y acceso

| Tabla | Descripción | Archivo |
|---|---|---|
| `permissions` | Catálogo de permisos (`dashboard.view`, `card.interact`...) | 01_security.sql |
| `roles` | Roles del sistema (`admin`, `operator`, `viewer`) | 01_security.sql |
| `role_permissions` | Pivot N:M roles ↔ permissions | 01_security.sql |
| `users` | Usuarios. Soft delete con `deleted_at` | 01_security.sql |
| `user_security_status` | Estado de seguridad 1:1 con users (intentos fallidos, bloqueo) | 01_security.sql |
| `sessions` | Sesiones JWT activas. Activa = `revoked_at IS NULL AND expires_at > NOW()` | 01_security.sql |

### `config` — Parametrización

| Tabla | Descripción | Archivo |
|---|---|---|
| `parameter_categories` | Categorías: `auth`, `interactions`, `ui`, `system` | 02_config.sql |
| `parameters` | Valores globales del sistema | 02_config.sql |
| `role_parameters` | Sobreescritura de parámetros por rol | 02_config.sql |
| `user_parameters` | Sobreescritura de parámetros por usuario (mayor prioridad) | 02_config.sql |

### `content` — Contenido del dashboard

| Tabla | Descripción | Archivo |
|---|---|---|
| `filter_types` | `single_select`, `multi_select`, `date_range`, `text_search` | 03_content.sql |
| `filters` | Opciones del desplegable. Soporta jerarquía con `parent_filter_id` | 03_content.sql |
| `widget_types` | `form`, `video`, `quiz`, `survey`, `embed` | 03_content.sql |
| `cards` | Cards con `html_content` sanitizado. Soft delete con `deleted_at` | 03_content.sql |

### `interactions` — Control de uso de widgets

| Tabla | Descripción | Archivo |
|---|---|---|
| `reset_policies` | `never`, `daily`, `weekly`, `monthly`, `manual` | 04_interactions.sql |
| `card_interaction_policies` | Límite por card + rol. `role_id = NULL` = política por defecto | 04_interactions.sql |
| `user_card_interactions` | Estado actual del contador por par (user_id, card_id) | 04_interactions.sql |

### `logs` — Trazabilidad (append-only)

| Tabla | Descripción | Archivo |
|---|---|---|
| `action_types` | Catálogo de acciones: `AUTH_LOGIN`, `WIDGET_INTERACTION`... | 05_logs.sql |
| `audit_logs` | Log general de todas las acciones. Asociación polimórfica en `entity_type`+`entity_id` | 05_logs.sql |
| `auth_logs` | Log específico de eventos de autenticación | 05_logs.sql |
| `interaction_logs` | Log específico de uso de widgets | 05_logs.sql |

---

## Relaciones clave para TypeORM

```
users ──→ roles                        (ManyToOne)
roles ──→ permissions                  (ManyToMany via role_permissions)
users ──→ user_security_status         (OneToOne)
users ──→ sessions                     (OneToMany)
cards ──→ filters                      (ManyToOne)
cards ──→ widget_types                 (ManyToOne)
card_interaction_policies ──→ cards    (ManyToOne)
card_interaction_policies ──→ roles    (ManyToOne, nullable)
card_interaction_policies ──→ reset_policies (ManyToOne)
user_card_interactions ──→ users       (ManyToOne)
user_card_interactions ──→ cards       (ManyToOne)
audit_logs ──→ users                   (ManyToOne, nullable)
audit_logs ──→ sessions                (ManyToOne, nullable)
audit_logs ──→ action_types            (ManyToOne)
interaction_logs ──→ reset_policies    (ManyToOne)
```

---

## Columnas especiales

| Columna | Tipo PG | Tipo TypeScript | Nota |
|---|---|---|---|
| `id` | UUID | string | PK, `gen_random_uuid()` |
| `email` | CITEXT | string | Case-insensitive nativo |
| `ip_address` | INET | string | IP nativa PostgreSQL |
| `payload` | JSONB | Record\<string, unknown\> | Datos flexibles en logs |
| `configuration` | JSONB | Record\<string, unknown\> | Config de filtros y widgets |
| `deleted_at` | TIMESTAMPTZ | Date \| null | Soft delete: NULL = activo |
| `revoked_at` | TIMESTAMPTZ | Date \| null | NULL = sesión activa |

---

## Parámetros del sistema (seed)

| key | value | category | Usado en |
|---|---|---|---|
| `default_max_interactions` | `5` | interactions | Fallback final de límite de widgets |
| `interaction_cooldown_seconds` | `0` | interactions | Segundos entre interacciones |
| `max_failed_login_attempts` | `5` | auth | Bloqueo de cuenta |
| `login_block_duration_minutes` | `15` | auth | Duración del bloqueo |
| `jwt_expiration_minutes` | `60` | auth | Vida del token |
| `session_timeout_minutes` | `30` | auth | Inactividad antes de cerrar sesión |
| `cards_per_page` | `12` | ui | Paginación del dashboard |
| `dashboard_title` | `Dashboard` | ui | Título del dashboard |
| `maintenance_mode` | `false` | system | Bloqueo global de acceso |
