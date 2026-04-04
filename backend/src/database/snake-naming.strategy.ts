import { DefaultNamingStrategy } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

/**
 * Mapea propiedades camelCase → columnas snake_case en PostgreSQL.
 */
export class SnakeNamingStrategy extends DefaultNamingStrategy {
  override columnName(propertyName: string, customName: string | undefined, embeddedPrefixes: string[]): string {
    const resolved = customName ?? propertyName;
    if (embeddedPrefixes.length > 0) {
      return super.columnName(propertyName, resolved, embeddedPrefixes);
    }
    return snakeCase(resolved);
  }
}
