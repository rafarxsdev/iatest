import { Router } from 'express';
import { asyncHandler } from '@common/middleware/async-handler';
import { rolesGuard } from '@common/guards/roles.guard';
import { ParametersController } from './parameters.controller';

export function createParametersRouter(parametersController: ParametersController): Router {
  const router = Router();
  router.get('/', rolesGuard('config.parameters.view'), asyncHandler(parametersController.list));
  router.patch('/:id', rolesGuard('config.parameters.manage'), asyncHandler(parametersController.patch));
  return router;
}
