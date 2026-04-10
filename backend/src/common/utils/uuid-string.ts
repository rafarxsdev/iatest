/**
 * Formato UUID 8-4-4-4-12 aceptado por PostgreSQL.
 * `uuid.validate()` exige RFC 4122 (versión/variante); los seeds usan IDs fijos legibles
 * (p. ej. 20000000-0000-0000-0000-000000000001) que validate() rechaza.
 */
export function isUuidString(value: string): boolean {
  const v = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
