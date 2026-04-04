import { Router } from 'express';
import { asyncHandler } from '@common/middleware/async-handler';
import { rolesGuard } from '@common/guards/roles.guard';
import type { AdminWidgetTypesController } from './widget-types.controller';

export function createAdminWidgetTypesRouter(controller: AdminWidgetTypesController): Router {
  const router = Router();
  router.get('/', rolesGuard('admin.cards.view'), asyncHandler(controller.list));
  return router;
}
