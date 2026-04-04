import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { AppDataSource } from '@database/data-source';
import { getEnvConfig } from '@config/env.config';
import { asyncHandler } from '@common/middleware/async-handler';
import { errorHandler } from '@common/middleware/error-handler';
import type { ApiError, ApiSuccess } from '@common/types/api-response.type';
import { authRouter } from '@modules/auth/auth.router';
import { filtersRouter } from '@modules/filters/filters.router';
import { cardsRouter } from '@modules/cards/cards.router';
import { interactionsRouter } from '@modules/interactions/interactions.router';
import { adminRouter } from '@modules/admin/admin.router';

export function createApp(): express.Application {
  const env = getEnvConfig();
  const app = express();

  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );
  app.use(morgan('combined'));
  app.use(express.json());
  app.use(cookieParser(env.cookieSecret));

  app.use('/api/auth', authRouter);
  app.use('/api/filters', filtersRouter);
  app.use('/api/cards', cardsRouter);
  app.use('/api/interactions', interactionsRouter);
  app.use('/api/admin', adminRouter);

  app.get(
    '/health',
    asyncHandler(async (_req, res) => {
      if (!AppDataSource.isInitialized) {
        const body: ApiError = {
          success: false,
          message: 'Base de datos no inicializada',
        };
        res.status(503).json(body);
        return;
      }
      try {
        await AppDataSource.query('SELECT 1');
        const body: ApiSuccess<{ status: string; database: boolean }> = {
          success: true,
          data: { status: 'ok', database: true },
        };
        res.status(200).json(body);
      } catch {
        const body: ApiError = {
          success: false,
          message: 'No se pudo conectar a la base de datos',
        };
        res.status(503).json(body);
      }
    }),
  );

  app.use(errorHandler);

  return app;
}
