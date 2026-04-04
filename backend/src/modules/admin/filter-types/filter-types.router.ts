import { Router } from 'express';
import { asyncHandler } from '@common/middleware/async-handler';
import { rolesGuard } from '@common/guards/roles.guard';
import type { AdminFilterTypesController } from './filter-types.controller';

export function createAdminFilterTypesRouter(controller: AdminFilterTypesController): Router {
  const router = Router();
  router.get('/', rolesGuard('admin.filters.manage'), asyncHandler(controller.list));
  return router;
}
