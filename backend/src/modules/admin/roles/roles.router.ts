import { Router } from 'express';
import { asyncHandler } from '@common/middleware/async-handler';
import { rolesGuard } from '@common/guards/roles.guard';
import { RolesController } from './roles.controller';

export function createRolesRouter(rolesController: RolesController): Router {
  const router = Router();
  router.get('/', rolesGuard('admin.users.view'), asyncHandler(rolesController.list));
  return router;
}
