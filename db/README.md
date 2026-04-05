# Base de Datos — Instalación y Estructura

## Estructura de archivos

```
db/
├── install.sh                     ← Script maestro de instalación
├── migrations/
│   ├── 00_init.sql                ← Extensiones y esquemas
│   ├── 01_security.sql            ← Usuarios, roles, permisos, sesiones
│   ├── 02_config.sql              ← Parámetros del sistema (jerarquía 3 niveles)
│   ├── 03_content.sql             ← Filtros, widgets y cards (incl. icon_name)
│   ├── 04_interactions.sql        ← Políticas y contadores de interacción
│   ├── 05_logs.sql                ← Auditoría, auth logs, interaction logs + catálogo action_types
│   ├── 09_operator_cards_filters_permissions.sql  ← Parche datos: permisos operator (idempotente)
│   └── 10_card_icon_name.sql      ← Parche esquema legacy: columna icon_name (idempotente)
├── indexes/
│   └── 06_indexes.sql             ← Índices de rendimiento
└── seeds/
    └── 07_seed.sql                ← Roles, permisos, parámetros, catálogos, usuario admin inicial
```

`install.sh` ejecuta en orden: **00 → 05**, **06_indexes**, **10** (no-op si la columna ya existe), y si usas **`--seed`**: **07_seed** y **09** (no-op si los permisos del operator ya están).

Los catálogos `logs.action_types` se cargan en **05_logs.sql** para que una instalación **sin** `--seed` tenga igualmente los tipos de acción necesarios para auditoría.

---

## Requisitos

- PostgreSQL 14 o superior
- Usuario con permisos de `CREATEDB`

---

## Instalación

### Variables de entorno disponibles

```bash
DB_HOST      # default: localhost
DB_PORT      # default: 5432
DB_NAME      # default: app_db
DB_USER      # default: postgres
DB_PASSWORD  # default: (vacío)
```

### Comandos

```bash
# Esquema + índices + parche 10 (sin datos de negocio ni usuario)
./install.sh

# Recomendado para desarrollo: semilla con roles, permisos, admin inicial y catálogos
./install.sh --seed

# Reinstalación completa desde cero (destructivo — pide confirmación)
./install.sh --reset --seed

# Con variables de entorno personalizadas
DB_HOST=db.servidor.com DB_NAME=produccion_db DB_USER=app_user DB_PASSWORD=secret ./install.sh --seed
```

### Usuario administrador por defecto (solo con `--seed`)

| Campo        | Valor                    |
|-------------|---------------------------|
| Email       | `admin@localhost`       |
| Contraseña  | `ChangeMe123!`          |
| Rol         | `admin`                 |

Cambia la contraseña inmediatamente en entornos expuestos.

---

## Esquemas PostgreSQL

| Esquema        | Contenido                                     |
|----------------|-----------------------------------------------|
| `security`     | users, roles, permissions, sessions           |
| `config`       | parameters con jerarquía global → rol → user  |
| `content`      | filters, widget_types, cards                  |
| `interactions` | reset_policies, card_interaction_policies, user_card_interactions |
| `logs`         | audit_logs, auth_logs, interaction_logs       |

---

## Jerarquías de resolución

### Parámetros del sistema

```
user_parameters      → máxima prioridad (por usuario individual)
        ↓ si no existe
role_parameters      → prioridad media (por rol del usuario)
        ↓ si no existe
parameters           → valor global por defecto
```

### Límite de interacciones por card

```
card_interaction_policies (card + rol específico)
        ↓ si no existe
card_interaction_policies (card + role_id = NULL)
        ↓ si no existe
widget_types.default_max_interactions
        ↓ si NULL
parameters['default_max_interactions']
```

---

## Tablas — resumen completo

| # | Tabla | Esquema | Descripción |
|---|-------|---------|-------------|
| 1 | `permissions` | security | Catálogo de permisos funcionales |
| 2 | `roles` | security | Roles del sistema |
| 3 | `role_permissions` | security | Asignación N:M permisos ↔ roles |
| 4 | `users` | security | Usuarios registrados |
| 5 | `user_security_status` | security | Estado de seguridad (1:1 con users) |
| 6 | `sessions` | security | Sesiones JWT activas e históricas |
| 7 | `parameter_categories` | config | Categorías de parámetros |
| 8 | `parameters` | config | Valores globales del sistema |
| 9 | `role_parameters` | config | Sobreescritura por rol |
| 10 | `user_parameters` | config | Sobreescritura por usuario |
| 11 | `filter_types` | content | Tipos de control de filtro |
| 12 | `filters` | content | Opciones del desplegable |
| 13 | `widget_types` | content | Tipos de widget disponibles |
| 14 | `cards` | content | Cards con HTML sanitizado |
| 15 | `reset_policies` | interactions | Políticas de reinicio de contadores |
| 16 | `card_interaction_policies` | interactions | Límites por card y por rol |
| 17 | `user_card_interactions` | interactions | Estado del contador por usuario/card |
| 18 | `action_types` | logs | Catálogo de acciones auditables |
| 19 | `audit_logs` | logs | Log general (append-only) |
| 20 | `auth_logs` | logs | Log de autenticación (append-only) |
| 21 | `interaction_logs` | logs | Log de widgets (append-only) |

---

## Notas de diseño

- **UUID** como PK en todas las tablas vía `gen_random_uuid()`
- **CITEXT** para emails (case-insensitive sin función)
- **INET** nativo para IPs (permite queries de red como `<<`, `>>=`)
- **JSONB** documentado como excepción intencional en configuración de widgets y filtros
- **Soft delete** con `deleted_at` en `users` y `cards`
- **Append-only** en las 3 tablas de logs mediante `RULE` de PostgreSQL
- **BRIN indexes** en tablas de logs (escritura secuencial por tiempo)
- **Triggers automáticos** para `updated_at` en todas las tablas que lo requieren
