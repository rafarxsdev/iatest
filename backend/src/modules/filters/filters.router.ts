import { Router } from 'express';
import { AppDataSource } from '@database/data-source';
import { asyncHandler } from '@common/middleware/async-handler';
import { jwtGuard } from '@common/guards/jwt.guard';
import { rolesGuard } from '@common/guards/roles.guard';
import { AuthRepository } from '@modules/auth/auth.repository';
import { FiltersRepository } from './filters.repository';
import { FiltersService } from './filters.service';
import { FiltersController } from './filters.controller';

const filtersRepository = new FiltersRepository(AppDataSource);
const authRepository = new AuthRepository(AppDataSource);
const filtersService = new FiltersService(filtersRepository, authRepository);
const filtersController = new FiltersController(filtersService);

export const filtersRouter = Router();

filtersRouter.get('/', jwtGuard, rolesGuard('filter.apply'), asyncHandler(filtersController.getFilters));
