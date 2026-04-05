export type ApiSuccess<T> = { success: true; data: T; meta?: { total: number; page: number; limit: number } };
export type ApiFailure = { success: false; message: string; data?: unknown };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * URL base del API.
 * - SSR / middleware: siempre BACKEND_URL (servidor Astro → Express directo).
 * - Navegador: PUBLIC_BACKEND_URL si está definida; si no, cadena vacía = rutas relativas `/api/...`
 *   (mismo origen que Astro; requiere proxy en Vite en desarrollo).
 */
export function backendBaseUrl(): string {
  if (typeof window === 'undefined') {
    const url =
      import.meta.env.BACKEND_URL ??
      import.meta.env.PUBLIC_BACKEND_URL ??
      'http://localhost:3000';
    return url.replace(/\/$/, '');
  }
  const pub = import.meta.env.PUBLIC_BACKEND_URL;
  if (pub !== undefined && String(pub).trim() !== '') {
    return String(pub).replace(/\/$/, '');
  }
  return '';
}

/** Construye URL absoluta para fetch en cliente (login, etc.). */
export function clientApiUrl(path: string): string {
  const base = backendBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base === '' ? p : `${base}${p}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  cookieHeader?: string,
): Promise<ApiResponse<T>> {
  const baseURL = backendBaseUrl();
  const url = `${baseURL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(options.headers);
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  if (!cookieHeader) {
    fetchOptions.credentials = 'include';
  }

  const res = await fetch(url, fetchOptions);

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    json = { success: false, message: 'Respuesta inválida del servidor' };
  }

  if (res.status === 401) {
    const msg = json.success === false ? json.message : 'No autorizado';
    if (typeof window !== 'undefined' && !url.includes('/api/auth/login')) {
      window.location.href = '/login';
    }
    throw new ApiHttpError(msg, 401);
  }

  return json;
}
