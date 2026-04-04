import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { FiltersService } from './filters.service';

function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  const ipFromForwarded = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  return (ipFromForwarded ?? req.ip ?? req.socket.remoteAddress) ?? null;
}

function clientUserAgent(req: Request): string | null {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : null;
}

export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  getFilters = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const data = await this.filtersService.getFilters(r, clientIp(req), clientUserAgent(req));
    res.status(200).json({ success: true, data });
  };
}
