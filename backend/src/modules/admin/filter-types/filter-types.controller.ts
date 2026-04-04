import type { Request, Response } from 'express';
import type { AdminFilterTypesService } from './filter-types.service';

export class AdminFilterTypesController {
  constructor(private readonly adminFilterTypesService: AdminFilterTypesService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.adminFilterTypesService.listAll();
    res.status(200).json({ success: true, data });
  };
}
