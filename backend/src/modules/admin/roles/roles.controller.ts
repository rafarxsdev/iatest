import type { Request, Response } from 'express';
import { RolesService } from './roles.service';

export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.rolesService.list();
    res.status(200).json({ success: true, data });
  };
}
