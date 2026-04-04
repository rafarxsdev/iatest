import type { ErrorRequestHandler } from 'express';
import { AppError } from '@common/errors/app-error';
import type { ApiError } from '@common/types/api-response.type';
import { getEnvConfig } from '@config/env.config';

function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const env = getEnvConfig();
  const isDev = env.nodeEnv === 'development';

  if (isAppError(err)) {
    const body: ApiError = {
      success: false,
      message: err.message,
    };
    if (err.data !== undefined) {
      body.data = err.data;
    }
    if (isDev && err.message) {
      body.error = err.stack;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  const message = 'Error interno del servidor';
  const body: ApiError = {
    success: false,
    message,
  };
  if (isDev && err instanceof Error) {
    body.error = err.stack ?? err.message;
  }

  res.status(500).json(body);
};
