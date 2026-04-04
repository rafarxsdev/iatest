import sanitizeHtml from 'sanitize-html';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { AppError } from '@common/errors/app-error';
import { AuthRepository } from '@modules/auth/auth.repository';
import { AdminCardsRepository } from './admin-cards.repository';
import type { CreateAdminCardDto } from './dto/create-admin-card.dto';
import type { UpdateAdminCardDto } from './dto/update-admin-card.dto';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'ul', 'ol', 'li', 'a', 'img', 'b', 'strong', 'i', 'em', 'br'],
  allowedAttributes: {
    a: ['href'],
    img: ['src', 'alt'],
  },
};

export class AdminCardsService {
  constructor(
    private readonly adminCardsRepository: AdminCardsRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  private async audit(
    req: AuthenticatedRequest,
    actionTypeCode: string,
    entityId: string | null,
    payload: Record<string, unknown> | null,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<void> {
    const session = await this.authRepository.getActiveSession(req.user.jti);
    await this.authRepository.createAuditLog({
      userId: req.user.sub,
      sessionId: session?.id ?? null,
      actionTypeCode,
      entityType: 'card',
      entityId,
      payload,
      ipAddress,
      userAgent,
      status: 'success',
      errorMessage: null,
      durationMs: null,
    });
  }

  async create(
    req: AuthenticatedRequest,
    dto: CreateAdminCardDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<{ id: string }> {
    const filter = await this.adminCardsRepository.findFilterById(dto.filterId);
    if (!filter) {
      throw new AppError('Filtro no encontrado o inactivo', 404);
    }
    const widget = await this.adminCardsRepository.findWidgetTypeById(dto.widgetTypeId);
    if (!widget) {
      throw new AppError('Tipo de widget no encontrado o inactivo', 404);
    }

    const htmlContent = sanitizeHtml(dto.htmlContent, SANITIZE_OPTIONS);
    const widgetConfiguration = dto.widgetConfiguration ?? {};

    const card = await this.adminCardsRepository.create({
      title: dto.title.trim(),
      htmlContent,
      filterId: dto.filterId,
      widgetTypeId: dto.widgetTypeId,
      widgetConfiguration,
      sortOrder: dto.sortOrder ?? 0,
    });

    await this.audit(req, 'ADMIN_CARD_CREATED', card.id, { title: card.title, filterId: dto.filterId }, ipAddress, userAgent);

    return { id: card.id };
  }

  async update(
    req: AuthenticatedRequest,
    id: string,
    dto: UpdateAdminCardDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<{ id: string }> {
    if (
      dto.title === undefined &&
      dto.htmlContent === undefined &&
      dto.filterId === undefined &&
      dto.isActive === undefined &&
      dto.sortOrder === undefined
    ) {
      throw new AppError('Debes enviar al menos un campo a actualizar', 400);
    }

    if (dto.filterId !== undefined) {
      const filter = await this.adminCardsRepository.findFilterById(dto.filterId);
      if (!filter) {
        throw new AppError('Filtro no encontrado o inactivo', 404);
      }
    }

    let htmlContent: string | undefined;
    if (dto.htmlContent !== undefined) {
      htmlContent = sanitizeHtml(dto.htmlContent, SANITIZE_OPTIONS);
    }

    const updated = await this.adminCardsRepository.update(id, {
      title: dto.title?.trim(),
      htmlContent,
      filterId: dto.filterId,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    });
    if (!updated) {
      throw new AppError('Card no encontrada', 404);
    }

    await this.audit(req, 'ADMIN_CARD_UPDATED', id, { ...dto, htmlContent: htmlContent !== undefined ? '[sanitized]' : undefined }, ipAddress, userAgent);

    return { id: updated.id };
  }

  async remove(req: AuthenticatedRequest, id: string, ipAddress: string | null, userAgent: string | null): Promise<void> {
    const card = await this.adminCardsRepository.findByIdActive(id);
    if (!card) {
      throw new AppError('Card no encontrada', 404);
    }

    const ok = await this.adminCardsRepository.softDelete(id);
    if (!ok) {
      throw new AppError('Card no encontrada', 404);
    }

    await this.audit(req, 'ADMIN_CARD_DELETED', id, { title: card.title }, ipAddress, userAgent);
  }
}
