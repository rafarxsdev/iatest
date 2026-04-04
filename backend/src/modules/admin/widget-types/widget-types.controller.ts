import type { Request, Response } from 'express';
import type { AdminWidgetTypesService } from './widget-types.service';

export class AdminWidgetTypesController {
  constructor(private readonly adminWidgetTypesService: AdminWidgetTypesService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.adminWidgetTypesService.listActive();
    res.status(200).json({ success: true, data });
  };
}
