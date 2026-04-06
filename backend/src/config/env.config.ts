import { config as loadEnv } from 'dotenv';

loadEnv();

function requireNonEmpty(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    throw new Error(`Variable de entorno obligatoria faltante o vacía: ${name}`);
  }
  return value;
}

function optionalWithDefault(name: string, value: string | undefined, defaultValue: string): string {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }
  return value;
}

function parsePort(name: string, raw: string | undefined, defaultValue: number): number {
  const str = raw === undefined || raw.trim() === '' ? String(defaultValue) : raw;
  const n = Number.parseInt(str, 10);
  if (Number.isNaN(n) || n < 1 || n > 65535) {
    throw new Error(`Variable de entorno inválida: ${name} (puerto 1-65535)`);
  }
  return n;
}

function parseBcryptRounds(raw: string | undefined, defaultValue: number): number {
  const str = raw === undefined || raw.trim() === '' ? String(defaultValue) : raw;
  const n = Number.parseInt(str, 10);
  if (Number.isNaN(n) || n < 4 || n > 31) {
    throw new Error('BCRYPT_ROUNDS debe ser un entero entre 4 y 31');
  }
  return n;
}

/**
 * Flag Secure de la cookie JWT: en HTTP el navegador rechaza Secure=true.
 * Por defecto: true si FRONTEND_URL es https://; si no, false.
 * Override: COOKIE_SECURE=true|false
 */
function parseCookieSecure(frontendUrl: string, raw: string | undefined): boolean {
  if (raw !== undefined && raw.trim() !== '') {
    const v = raw.trim().toLowerCase();
    if (v === 'true' || v === '1') {
      return true;
    }
    if (v === 'false' || v === '0') {
      return false;
    }
  }
  return frontendUrl.trim().toLowerCase().startsWith('https:');
}

/**
 * Configuración validada al arranque. Todas las variables obligatorias de .cursorrules.
 */
export class EnvConfig {
  readonly nodeEnv: string;
  readonly port: number;
  readonly frontendUrl: string;
  readonly dbHost: string;
  readonly dbPort: number;
  readonly dbName: string;
  readonly dbUser: string;
  /** Puede ser cadena vacía si Postgres no usa contraseña en local */
  readonly dbPassword: string;
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
  readonly cookieSecret: string;
  readonly bcryptRounds: number;
  /** Cookie access_token: Secure solo con HTTPS (o COOKIE_SECURE explícito). */
  readonly cookieSecure: boolean;

  constructor() {
    this.nodeEnv = optionalWithDefault('NODE_ENV', process.env.NODE_ENV, 'development');
    this.port = parsePort('PORT', process.env.PORT, 3000);
    this.frontendUrl = requireNonEmpty('FRONTEND_URL', process.env.FRONTEND_URL);
    this.cookieSecure = parseCookieSecure(this.frontendUrl, process.env.COOKIE_SECURE);

    this.dbHost = requireNonEmpty('DB_HOST', process.env.DB_HOST);
    this.dbPort = parsePort('DB_PORT', process.env.DB_PORT, 5432);
    this.dbName = requireNonEmpty('DB_NAME', process.env.DB_NAME);
    this.dbUser = requireNonEmpty('DB_USER', process.env.DB_USER);
    this.dbPassword = process.env.DB_PASSWORD ?? '';

    this.jwtSecret = requireNonEmpty('JWT_SECRET', process.env.JWT_SECRET);
    this.jwtExpiresIn = optionalWithDefault('JWT_EXPIRES_IN', process.env.JWT_EXPIRES_IN, '60m');
    this.cookieSecret = requireNonEmpty('COOKIE_SECRET', process.env.COOKIE_SECRET);
    this.bcryptRounds = parseBcryptRounds(process.env.BCRYPT_ROUNDS, 12);
  }
}

let cached: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!cached) {
    cached = new EnvConfig();
  }
  return cached;
}
