import type { Request, Response } from 'express';
import { isUuidString } from '@common/utils/uuid-string';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppError } from '@common/errors/app-error';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { PoliciesService } from './policies.service';
import { PutPolicyDto } from './dto/put-policy.dto';

function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  const ipFromForwarded = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  return (ipFromForwarded ?? req.ip ?? req.socket.remoteAddress) ?? null;
}

function clientUserAgent(req: Request): string | null {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : null;
}

export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const cardId = req.params.cardId;
    if (!cardId || !isUuidString(cardId)) {
      throw new AppError('cardId debe ser un UUID válido', 400);
    }
    const data = await this.policiesService.listByCard(r, cardId, clientIp(req), clientUserAgent(req));
    res.status(200).json({ success: true, data });
  };

  put = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const cardId = req.params.cardId;
    if (!cardId || !isUuidString(cardId)) {
      throw new AppError('cardId debe ser un UUID válido', 400);
    }
    const dto = plainToInstance(PutPolicyDto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      const msg = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
      throw new AppError(msg || 'Datos inválidos', 400);
    }
    const data = await this.policiesService.upsert(r, cardId, dto, clientIp(req), clientUserAgent(req));
    res.status(200).json({ success: true, data });
  };
}
