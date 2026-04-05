import { Router } from 'express';
import { asyncHandler } from '@common/middleware/async-handler';
import { rolesGuard } from '@common/guards/roles.guard';
import { AdminInteractionsController } from './admin-interactions.controller';

export function createAdminInteractionsRouter(
  adminInteractionsController: AdminInteractionsController,
): Router {
  const router = Router();
  const guard = rolesGuard('config.policies.manage');

  router.get('/users', guard, asyncHandler(adminInteractionsController.listUsers));
  router.get('/users/:userId/cards/:cardId/history', guard, asyncHandler(adminInteractionsController.getHistory));
  router.post('/users/:userId/cards/:cardId/reset', guard, asyncHandler(adminInteractionsController.resetSingle));
  router.post('/users/:userId/reset-all', guard, asyncHandler(adminInteractionsController.resetAll));
  router.get('/users/:userId', guard, asyncHandler(adminInteractionsController.getUserInteractions));

  return router;
}
