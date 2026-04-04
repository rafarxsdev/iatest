import { Router } from 'express';
import { AppDataSource } from '@database/data-source';
import { jwtGuard } from '@common/guards/jwt.guard';
import { ParameterRepository, ParameterService } from '@modules/config';
import { AuthRepository } from '@modules/auth/auth.repository';
import { createUsersRouter } from './users/users.router';
import { UsersRepository } from './users/users.repository';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { createAdminCardsRouter } from './cards/admin-cards.router';
import { AdminCardsRepository } from './cards/admin-cards.repository';
import { AdminCardsService } from './cards/admin-cards.service';
import { AdminCardsController } from './cards/admin-cards.controller';
import { createPoliciesRouter } from './policies/policies.router';
import { PoliciesRepository } from './policies/policies.repository';
import { PoliciesService } from './policies/policies.service';
import { PoliciesController } from './policies/policies.controller';
import { createParametersRouter } from './parameters/parameters.router';
import { ParametersRepository } from './parameters/parameters.repository';
import { ParametersService } from './parameters/parameters.service';
import { ParametersController } from './parameters/parameters.controller';

const authRepository = new AuthRepository(AppDataSource);
const parameterRepository = new ParameterRepository(AppDataSource);
const parameterService = new ParameterService(parameterRepository);

const usersRepository = new UsersRepository(AppDataSource);
const usersService = new UsersService(usersRepository, authRepository, parameterService);
const usersController = new UsersController(usersService);

const adminCardsRepository = new AdminCardsRepository(AppDataSource);
const adminCardsService = new AdminCardsService(adminCardsRepository, authRepository);
const adminCardsController = new AdminCardsController(adminCardsService);

const policiesRepository = new PoliciesRepository(AppDataSource);
const policiesService = new PoliciesService(policiesRepository, authRepository);
const policiesController = new PoliciesController(policiesService);

const parametersRepository = new ParametersRepository(AppDataSource);
const parametersService = new ParametersService(parametersRepository, authRepository);
const parametersController = new ParametersController(parametersService);

export const adminRouter = Router();

adminRouter.use(jwtGuard);
adminRouter.use('/users', createUsersRouter(usersController));
adminRouter.use('/cards', createAdminCardsRouter(adminCardsController));
adminRouter.use('/policies', createPoliciesRouter(policiesController));
adminRouter.use('/parameters', createParametersRouter(parametersController));
