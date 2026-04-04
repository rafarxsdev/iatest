import { Router } from 'express';
import { asyncHandler } from '@common/middleware/async-handler';
import { rolesGuard } from '@common/guards/roles.guard';
import { AdminCardsController } from './admin-cards.controller';

export function createAdminCardsRouter(adminCardsController: AdminCardsController): Router {
  const router = Router();
  router.post('/', rolesGuard('admin.cards.manage'), asyncHandler(adminCardsController.create));
  router.patch('/:id', rolesGuard('admin.cards.manage'), asyncHandler(adminCardsController.update));
  router.delete('/:id', rolesGuard('admin.cards.manage'), asyncHandler(adminCardsController.remove));
  return router;
}
