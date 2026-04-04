import { validate as isUuid } from 'uuid';
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { AppError } from '@common/errors/app-error';
import { CardsService } from './cards.service';

function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  const ipFromForwarded = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  return (ipFromForwarded ?? req.ip ?? req.socket.remoteAddress) ?? null;
}

function clientUserAgent(req: Request): string | null {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : null;
}

export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  getCards = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;

    const filterRaw = req.query.filterId;
    let filterId: string | undefined;
    if (typeof filterRaw === 'string' && filterRaw.length > 0) {
      if (!isUuid(filterRaw)) {
        throw new AppError('filterId debe ser un UUID válido', 400);
      }
      filterId = filterRaw;
    } else if (filterRaw !== undefined) {
      throw new AppError('filterId inválido', 400);
    }

    const pageRaw = req.query.page;
    const pageParsed =
      pageRaw === undefined ? 1 : Number.parseInt(typeof pageRaw === 'string' ? pageRaw : String(pageRaw), 10);
    if (Number.isNaN(pageParsed) || pageParsed < 1) {
      throw new AppError('page debe ser un entero >= 1', 400);
    }
    const page = pageParsed;

    const limitRaw = req.query.limit;
    let limit: number | undefined;
    if (limitRaw !== undefined) {
      const l = Number.parseInt(typeof limitRaw === 'string' ? limitRaw : String(limitRaw), 10);
      if (Number.isNaN(l) || l < 1 || l > 100) {
        throw new AppError('limit debe ser un entero entre 1 y 100', 400);
      }
      limit = l;
    }

    const result = await this.cardsService.getCards(r, filterId, page, limit, clientIp(req), clientUserAgent(req));

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  };
}
