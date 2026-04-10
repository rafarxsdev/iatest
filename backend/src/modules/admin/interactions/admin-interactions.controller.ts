import type { Request, Response } from 'express';
import { isUuidString } from '@common/utils/uuid-string';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppError } from '@common/errors/app-error';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { AdminInteractionsService } from './admin-interactions.service';
import { ResetInteractionsDto } from './dto/reset-interactions.dto';

function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  const ipFromForwarded = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  return (ipFromForwarded ?? req.ip ?? req.socket.remoteAddress) ?? null;
}

function clientUserAgent(req: Request): string | null {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : null;
}

function parseSearch(req: Request): string | undefined {
  const raw = req.query.search;
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

export class AdminInteractionsController {
  constructor(private readonly adminInteractionsService: AdminInteractionsService) {}

  listUsers = async (req: Request, res: Response): Promise<void> => {
    const search = parseSearch(req);
    const data = await this.adminInteractionsService.getUsersWithInteractions(search);
    res.status(200).json({ success: true, data });
  };

  getUserInteractions = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    if (!userId || !isUuidString(userId)) {
      throw new AppError('userId debe ser un UUID válido', 400);
    }
    const data = await this.adminInteractionsService.getUserInteractions(userId);
    res.status(200).json({ success: true, data });
  };

  getHistory = async (req: Request, res: Response): Promise<void> => {
    const { userId, cardId } = req.params;
    if (!userId || !isUuidString(userId)) {
      throw new AppError('userId debe ser un UUID válido', 400);
    }
    if (!cardId || !isUuidString(cardId)) {
      throw new AppError('cardId debe ser un UUID válido', 400);
    }
    const data = await this.adminInteractionsService.getInteractionHistory(userId, cardId);
    res.status(200).json({ success: true, data });
  };

  resetSingle = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const { userId, cardId } = req.params;
    if (!userId || !isUuidString(userId)) {
      throw new AppError('userId debe ser un UUID válido', 400);
    }
    if (!cardId || !isUuidString(cardId)) {
      throw new AppError('cardId debe ser un UUID válido', 400);
    }
    const dto = plainToInstance(ResetInteractionsDto, req.body ?? {});
    const errors = await validate(dto);
    if (errors.length > 0) {
      const msg = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
      throw new AppError(msg || 'Datos inválidos', 400);
    }
    await this.adminInteractionsService.resetSingle(r, userId, cardId, dto.reason, clientIp(req), clientUserAgent(req));
    res.status(200).json({ success: true, data: null });
  };

  resetAll = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const { userId } = req.params;
    if (!userId || !isUuidString(userId)) {
      throw new AppError('userId debe ser un UUID válido', 400);
    }
    const dto = plainToInstance(ResetInteractionsDto, req.body ?? {});
    const errors = await validate(dto);
    if (errors.length > 0) {
      const msg = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
      throw new AppError(msg || 'Datos inválidos', 400);
    }
    const data = await this.adminInteractionsService.resetAll(r, userId, dto.reason, clientIp(req), clientUserAgent(req));
    res.status(200).json({ success: true, data });
  };
}
