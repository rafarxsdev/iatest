import { Router } from 'express';
import { AppDataSource } from '@database/data-source';
import { asyncHandler } from '@common/middleware/async-handler';
import { jwtGuard } from '@common/guards/jwt.guard';
import { rolesGuard } from '@common/guards/roles.guard';
import { ParameterRepository, ParameterService } from '@modules/config';
import { AuthRepository } from '@modules/auth/auth.repository';
import { InteractionsRepository } from '@modules/interactions/interactions.repository';
import { InteractionsService } from '@modules/interactions/interactions.service';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';

const parameterRepository = new ParameterRepository(AppDataSource);
const parameterService = new ParameterService(parameterRepository);
const authRepository = new AuthRepository(AppDataSource);
const interactionsRepository = new InteractionsRepository(AppDataSource);
const interactionsService = new InteractionsService(interactionsRepository, parameterService, authRepository);
const cardsRepository = new CardsRepository(AppDataSource);
const cardsService = new CardsService(cardsRepository, interactionsService, authRepository, parameterService);
const cardsController = new CardsController(cardsService);

export const cardsRouter = Router();

cardsRouter.get('/', jwtGuard, rolesGuard('card.view'), asyncHandler(cardsController.getCards));
