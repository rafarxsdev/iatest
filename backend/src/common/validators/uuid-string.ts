/**
 * Formato UUID 8-4-4-4-12 (PostgreSQL / gen_random_uuid y seeds fijos).
 * No usar `isUUID()` de validator: rechaza IDs como 00000000-0000-0000-0000-000000000001.
 */
export const UUID_STRING_REGEX =
  /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
