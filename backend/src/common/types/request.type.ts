import type { Request } from 'express';

/** Payload mínimo del JWT de acceso (claim `role` en el token = UUID del rol). */
export interface JwtPayload {
  sub: string;
  roleId: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
