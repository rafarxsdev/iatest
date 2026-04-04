export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  /** Códigos de permiso del rol (GET /api/auth/me). */
  permissions?: string[];
}
