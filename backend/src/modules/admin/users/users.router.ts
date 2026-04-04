import { Router } from 'express';
import { asyncHandler } from '@common/middleware/async-handler';
import { rolesGuard } from '@common/guards/roles.guard';
import { UsersController } from './users.controller';

export function createUsersRouter(usersController: UsersController): Router {
  const router = Router();
  router.get('/', rolesGuard('admin.users.view'), asyncHandler(usersController.list));
  router.post('/', rolesGuard('admin.users.manage'), asyncHandler(usersController.create));
  router.patch('/:id', rolesGuard('admin.users.manage'), asyncHandler(usersController.update));
  router.delete('/:id', rolesGuard('admin.users.manage'), asyncHandler(usersController.remove));
  return router;
}
