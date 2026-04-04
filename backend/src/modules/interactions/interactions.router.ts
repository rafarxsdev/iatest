import { Router } from 'express';
import { AppDataSource } from '@database/data-source';
import { asyncHandler } from '@common/middleware/async-handler';
import { jwtGuard } from '@common/guards/jwt.guard';
import { rolesGuard } from '@common/guards/roles.guard';
import { ParameterRepository, ParameterService } from '@modules/config';
import { AuthRepository } from '@modules/auth/auth.repository';
import { InteractionsRepository } from './interactions.repository';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';

const parameterRepository = new ParameterRepository(AppDataSource);
const parameterService = new ParameterService(parameterRepository);
const authRepository = new AuthRepository(AppDataSource);
const interactionsRepository = new InteractionsRepository(AppDataSource);
const interactionsService = new InteractionsService(interactionsRepository, parameterService, authRepository);
const interactionsController = new InteractionsController(interactionsService);

export const interactionsRouter = Router();

interactionsRouter.get(
  '/:cardId',
  jwtGuard,
  rolesGuard('card.interact'),
  asyncHandler(interactionsController.getByCardId),
);
interactionsRouter.post(
  '/:cardId',
  jwtGuard,
  rolesGuard('card.interact'),
  asyncHandler(interactionsController.interact),
);
