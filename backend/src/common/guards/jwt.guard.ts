import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';
import { AppError } from '@common/errors/app-error';
import { AppDataSource } from '@database/data-source';
import { getEnvConfig } from '@config/env.config';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { AuthRepository } from '@modules/auth/auth.repository';
import { asyncHandler } from '@common/middleware/async-handler';

const authRepository = new AuthRepository(AppDataSource);

interface AccessTokenPayload {
  sub: string;
  role: string;
  jti: string;
}

export const jwtGuard: RequestHandler = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.access_token as string | undefined;
  if (!token) {
    throw new AppError('No autenticado', 401);
  }

  const env = getEnvConfig();
  let payload: AccessTokenPayload;
  try {
    payload = jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError || e instanceof jwt.TokenExpiredError) {
      throw new AppError('Token inválido o expirado', 401);
    }
    throw e;
  }

  const session = await authRepository.getActiveSession(payload.jti);
  if (!session || session.user.id !== payload.sub) {
    throw new AppError('Sesión inválida o revocada', 401);
  }

  (req as AuthenticatedRequest).user = {
    sub: payload.sub,
    roleId: payload.role,
    jti: payload.jti,
  };
  next();
});
