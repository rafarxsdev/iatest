import { Router } from 'express';
import { asyncHandler } from '@common/middleware/async-handler';
import { rolesGuard } from '@common/guards/roles.guard';
import type { AdminFiltersController } from './filters.controller';

export function createAdminFiltersRouter(controller: AdminFiltersController): Router {
  const router = Router();
  router.get('/', rolesGuard('admin.filters.manage'), asyncHandler(controller.list));
  router.get('/:id', rolesGuard('admin.filters.manage'), asyncHandler(controller.getById));
  router.post('/', rolesGuard('admin.filters.manage'), asyncHandler(controller.create));
  router.patch('/:id/restore', rolesGuard('admin.filters.manage'), asyncHandler(controller.restore));
  router.patch('/:id', rolesGuard('admin.filters.manage'), asyncHandler(controller.update));
  router.delete('/:id', rolesGuard('admin.filters.manage'), asyncHandler(controller.deactivate));
  return router;
}
