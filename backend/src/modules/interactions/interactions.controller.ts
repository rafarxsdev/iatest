import type { Request, Response } from 'express';
import { isUuidString } from '@common/utils/uuid-string';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { AppError } from '@common/errors/app-error';
import { InteractionsService } from './interactions.service';

function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  const ipFromForwarded = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  return (ipFromForwarded ?? req.ip ?? req.socket.remoteAddress) ?? null;
}

function clientUserAgent(req: Request): string | null {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : null;
}

export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  getByCardId = async (req: Request, res: Response): Promise<void> => {
    const { cardId } = req.params;
    if (!cardId || !isUuidString(cardId)) {
      throw new AppError('cardId debe ser un UUID válido', 400);
    }
    const r = req as AuthenticatedRequest;
    const st = await this.interactionsService.getStatus(cardId, r.user.sub);
    res.status(200).json({
      success: true,
      data: {
        used: st.used,
        limit: st.limit,
        remaining: st.remaining,
        isBlocked: st.isBlocked,
        lastInteractionAt: st.lastInteractionAt ? st.lastInteractionAt.toISOString() : null,
      },
    });
  };

  interact = async (req: Request, res: Response): Promise<void> => {
    const { cardId } = req.params;
    if (!cardId || !isUuidString(cardId)) {
      throw new AppError('cardId debe ser un UUID válido', 400);
    }

    const rawPayload = req.body?.payload;
    if (rawPayload !== undefined && (rawPayload === null || typeof rawPayload !== 'object' || Array.isArray(rawPayload))) {
      throw new AppError('payload debe ser un objeto JSON', 400);
    }

    const r = req as AuthenticatedRequest;
    const payload = rawPayload as Record<string, unknown> | undefined;

    try {
      const full = await this.interactionsService.interact(
        cardId,
        r.user.sub,
        r.user.jti,
        clientIp(req),
        payload,
        clientUserAgent(req),
      );
      res.status(200).json({
        success: true,
        data: {
          used: full.used,
          limit: full.limit,
          remaining: full.remaining,
          isBlocked: full.isBlocked,
        },
      });
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 403) {
        res.status(403).json({
          success: false,
          message: err.message,
          data: err.data,
        });
        return;
      }
      throw err;
    }
  };
}
