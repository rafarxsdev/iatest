import { Router } from 'express';
import { asyncHandler } from '@common/middleware/async-handler';
import { rolesGuard } from '@common/guards/roles.guard';
import { PoliciesController } from './policies.controller';

export function createPoliciesRouter(policiesController: PoliciesController): Router {
  const router = Router();
  router.get('/:cardId', rolesGuard('config.policies.manage'), asyncHandler(policiesController.list));
  router.put('/:cardId', rolesGuard('config.policies.manage'), asyncHandler(policiesController.put));
  return router;
}
