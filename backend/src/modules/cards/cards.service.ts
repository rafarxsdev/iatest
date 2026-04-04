import sanitizeHtml from 'sanitize-html';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { AppError } from '@common/errors/app-error';
import { ParameterService } from '@modules/config';
import { AuthRepository } from '@modules/auth/auth.repository';
import { InteractionsService } from '@modules/interactions/interactions.service';
import { CardsRepository } from './cards.repository';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'ul', 'ol', 'li', 'a', 'img', 'b', 'strong', 'i', 'em', 'br'],
  allowedAttributes: {
    a: ['href'],
    img: ['src', 'alt'],
  },
};

export interface CardResponseDto {
  id: string;
  title: string;
  htmlContent: string;
  widgetType: { code: string; label: string };
  interactionStatus: {
    used: number;
    limit: number;
    remaining: number;
    isBlocked: boolean;
    lastInteractionAt: string | null;
  };
  sortOrder: number;
}

export class CardsService {
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly interactionsService: InteractionsService,
    private readonly authRepository: AuthRepository,
    private readonly parameterService: ParameterService,
  ) {}

  async getCards(
    req: AuthenticatedRequest,
    filterId: string | undefined,
    page: number,
    limitInput: number | undefined,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<{ data: CardResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const userId = req.user.sub;

    let pageSize: number;
    if (limitInput !== undefined) {
      pageSize = limitInput;
    } else {
      const raw = await this.parameterService.resolve('cards_per_page', userId);
      const n = Number.parseInt(raw, 10);
      if (Number.isNaN(n) || n < 1) {
        throw new AppError('Parámetro cards_per_page inválido', 500);
      }
      pageSize = n;
    }

    const { cards, total } = await this.cardsRepository.findByFilter(filterId, page, pageSize);

    const session = await this.authRepository.getActiveSession(req.user.jti);

    const data: CardResponseDto[] = [];

    for (const card of cards) {
      const interactionStatus = await this.interactionsService.getStatus(card.id, userId);

      data.push({
        id: card.id,
        title: card.title,
        htmlContent: sanitizeHtml(card.htmlContent, SANITIZE_OPTIONS),
        widgetType: {
          code: card.widgetType.code,
          label: card.widgetType.label,
        },
        interactionStatus: {
          used: interactionStatus.used,
          limit: interactionStatus.limit,
          remaining: interactionStatus.remaining,
          isBlocked: interactionStatus.isBlocked,
          lastInteractionAt: interactionStatus.lastInteractionAt
            ? interactionStatus.lastInteractionAt.toISOString()
            : null,
        },
        sortOrder: card.sortOrder,
      });

      await this.authRepository.createAuditLog({
        userId,
        sessionId: session?.id ?? null,
        actionTypeCode: 'CARD_VIEW',
        entityType: 'card',
        entityId: card.id,
        payload: null,
        ipAddress,
        userAgent,
        status: 'success',
        errorMessage: null,
        durationMs: null,
      });
    }

    return {
      data,
      meta: {
        total,
        page,
        limit: pageSize,
      },
    };
  }
}
