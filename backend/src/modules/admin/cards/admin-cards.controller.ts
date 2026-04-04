import type { Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppError } from '@common/errors/app-error';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { AdminCardsService } from './admin-cards.service';
import { CreateAdminCardDto } from './dto/create-admin-card.dto';
import { UpdateAdminCardDto } from './dto/update-admin-card.dto';

function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  const ipFromForwarded = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  return (ipFromForwarded ?? req.ip ?? req.socket.remoteAddress) ?? null;
}

function clientUserAgent(req: Request): string | null {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : null;
}

export class AdminCardsController {
  constructor(private readonly adminCardsService: AdminCardsService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const pageRaw = req.query.page;
    const pageParsed =
      pageRaw === undefined ? 1 : Number.parseInt(typeof pageRaw === 'string' ? pageRaw : String(pageRaw), 10);
    if (Number.isNaN(pageParsed) || pageParsed < 1) {
      throw new AppError('page debe ser un entero >= 1', 400);
    }
    const limitRaw = req.query.limit;
    const limitParsed =
      limitRaw === undefined ? 20 : Number.parseInt(typeof limitRaw === 'string' ? limitRaw : String(limitRaw), 10);
    if (Number.isNaN(limitParsed) || limitParsed < 1 || limitParsed > 100) {
      throw new AppError('limit debe ser un entero entre 1 y 100', 400);
    }
    const searchRaw = req.query.search;
    const search = typeof searchRaw === 'string' && searchRaw.length > 0 ? searchRaw : undefined;

    const result = await this.adminCardsService.getAllCards(r, pageParsed, limitParsed, search, clientIp(req), clientUserAgent(req));
    res.status(200).json({ success: true, data: result.data, meta: result.meta });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const dto = plainToInstance(CreateAdminCardDto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      const msg = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
      throw new AppError(msg || 'Datos inválidos', 400);
    }
    const data = await this.adminCardsService.create(r, dto, clientIp(req), clientUserAgent(req));
    res.status(201).json({ success: true, data });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const id = req.params.id;
    if (!id) {
      throw new AppError('id requerido', 400);
    }
    const dto = plainToInstance(UpdateAdminCardDto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      const msg = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
      throw new AppError(msg || 'Datos inválidos', 400);
    }
    const data = await this.adminCardsService.update(r, id, dto, clientIp(req), clientUserAgent(req));
    res.status(200).json({ success: true, data });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const id = req.params.id;
    if (!id) {
      throw new AppError('id requerido', 400);
    }
    await this.adminCardsService.remove(r, id, clientIp(req), clientUserAgent(req));
    res.status(200).json({ success: true, data: null });
  };
}
