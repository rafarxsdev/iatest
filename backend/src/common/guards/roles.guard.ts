import type { RequestHandler } from 'express';
import { AppDataSource } from '@database/data-source';
import { asyncHandler } from '@common/middleware/async-handler';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { AuthRepository } from '@modules/auth/auth.repository';

const authRepository = new AuthRepository(AppDataSource);

/**
 * Middleware de permiso: el rol del JWT debe tener el permiso (`permissions.code`) en `role_permissions`.
 */
export function rolesGuard(requiredPermission: string): RequestHandler {
  return asyncHandler(async (req, res, next) => {
    const r = req as AuthenticatedRequest;
    const allowed = await authRepository.roleHasPermission(r.user.roleId, requiredPermission);
    if (!allowed) {
      res.status(403).json({ success: false, message: 'No tienes permiso para esta acción' });
      return;
    }
    next();
  });
}
