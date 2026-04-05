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
import { createAdminWidgetTypesRouter } from './widget-types/widget-types.router';
import { AdminWidgetTypesRepository } from './widget-types/widget-types.repository';
import { AdminWidgetTypesService } from './widget-types/widget-types.service';
import { AdminWidgetTypesController } from './widget-types/widget-types.controller';
import { createAdminFilterTypesRouter } from './filter-types/filter-types.router';
import { AdminFilterTypesRepository } from './filter-types/filter-types.repository';
import { AdminFilterTypesService } from './filter-types/filter-types.service';
import { AdminFilterTypesController } from './filter-types/filter-types.controller';
import { createAdminFiltersRouter } from './filters/filters.router';
import { AdminFiltersRepository } from './filters/filters.repository';
import { AdminFiltersService } from './filters/filters.service';
import { AdminFiltersController } from './filters/filters.controller';
import { createRolesRouter } from './roles/roles.router';
import { RolesRepository } from './roles/roles.repository';
import { RolesService } from './roles/roles.service';
import { RolesController } from './roles/roles.controller';
import { createAdminInteractionsRouter } from './interactions/admin-interactions.router';
import { AdminInteractionsRepository } from './interactions/admin-interactions.repository';
import { AdminInteractionsService } from './interactions/admin-interactions.service';
import { AdminInteractionsController } from './interactions/admin-interactions.controller';

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

const adminWidgetTypesRepository = new AdminWidgetTypesRepository(AppDataSource);
const adminWidgetTypesService = new AdminWidgetTypesService(adminWidgetTypesRepository);
const adminWidgetTypesController = new AdminWidgetTypesController(adminWidgetTypesService);

const adminFilterTypesRepository = new AdminFilterTypesRepository(AppDataSource);
const adminFilterTypesService = new AdminFilterTypesService(adminFilterTypesRepository);
const adminFilterTypesController = new AdminFilterTypesController(adminFilterTypesService);

const adminFiltersRepository = new AdminFiltersRepository(AppDataSource);
const adminFiltersService = new AdminFiltersService(adminFiltersRepository, authRepository);
const adminFiltersController = new AdminFiltersController(adminFiltersService);

const rolesRepository = new RolesRepository(AppDataSource);
const rolesService = new RolesService(rolesRepository);
const rolesController = new RolesController(rolesService);

const adminInteractionsRepository = new AdminInteractionsRepository(AppDataSource);
const adminInteractionsService = new AdminInteractionsService(adminInteractionsRepository, authRepository);
const adminInteractionsController = new AdminInteractionsController(adminInteractionsService);

export const adminRouter = Router();

adminRouter.use(jwtGuard);
adminRouter.use('/roles', createRolesRouter(rolesController));
adminRouter.use('/users', createUsersRouter(usersController));
adminRouter.use('/cards', createAdminCardsRouter(adminCardsController));
adminRouter.use('/policies', createPoliciesRouter(policiesController));
adminRouter.use('/parameters', createParametersRouter(parametersController));
adminRouter.use('/widget-types', createAdminWidgetTypesRouter(adminWidgetTypesController));
adminRouter.use('/filter-types', createAdminFilterTypesRouter(adminFilterTypesController));
adminRouter.use('/filters', createAdminFiltersRouter(adminFiltersController));
adminRouter.use('/interactions', createAdminInteractionsRouter(adminInteractionsController));
