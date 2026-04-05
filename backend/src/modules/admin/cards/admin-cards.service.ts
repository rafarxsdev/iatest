import type { AuthenticatedRequest } from '@common/types/request.type';
import { AppError } from '@common/errors/app-error';
import { AuthRepository } from '@modules/auth/auth.repository';
import { AdminCardsRepository } from './admin-cards.repository';
import type { Card } from '@database/entities/card.entity';
import type { CreateAdminCardDto } from './dto/create-admin-card.dto';
import type { UpdateAdminCardDto } from './dto/update-admin-card.dto';

function normalizeIconName(input: string | null | undefined): string | null {
  if (input === undefined || input === null) {
    return null;
  }
  const t = input.trim();
  return t.length === 0 ? null : t;
}

export interface AdminCardListItem {
  id: string;
  title: string;
  htmlContent: string;
  filter: { id: string; label: string };
  widgetType: { id: string; code: string; label: string };
  iconName: string | null;
  isActive: boolean;
  isDeleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * El HTML de la card lo define un administrador (widgets embebidos, scripts, etc.).
 * No aplicar sanitize-html al guardar: una política restrictiva elimina <script> y atributos como id en <div>.
 */
export class AdminCardsService {
  constructor(
    private readonly adminCardsRepository: AdminCardsRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  private mapCardToListItem(card: Card): AdminCardListItem {
    return {
      id: card.id,
      title: card.title,
      htmlContent: card.htmlContent,
      filter: { id: card.filter.id, label: card.filter.label },
      widgetType: {
        id: card.widgetType.id,
        code: card.widgetType.code,
        label: card.widgetType.label,
      },
      iconName: card.iconName,
      isActive: card.isActive,
      isDeleted: card.deletedAt !== null,
      sortOrder: card.sortOrder,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    };
  }

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

  async getAllCards(
    req: AuthenticatedRequest,
    page: number,
    limit: number,
    search: string | undefined,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<{ data: AdminCardListItem[]; meta: { total: number; page: number; limit: number } }> {
    const { cards, total } = await this.adminCardsRepository.findAllPaginated(page, limit, search);
    const data: AdminCardListItem[] = cards.map((card) => this.mapCardToListItem(card));

    await this.audit(req, 'ADMIN_CARDS_LISTED', null, { page, limit, search: search ?? null }, ipAddress, userAgent);

    return { data, meta: { total, page, limit } };
  }

  async create(
    req: AuthenticatedRequest,
    dto: CreateAdminCardDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<AdminCardListItem> {
    const filter = await this.adminCardsRepository.findFilterById(dto.filterId);
    if (!filter) {
      throw new AppError('Filtro no encontrado o inactivo', 404);
    }
    const widget = await this.adminCardsRepository.findWidgetTypeById(dto.widgetTypeId);
    if (!widget) {
      throw new AppError('Tipo de widget no encontrado o inactivo', 404);
    }

    const htmlContent = dto.htmlContent.trim();
    const widgetConfiguration = dto.widgetConfiguration ?? {};
    const iconName = normalizeIconName(dto.iconName);

    const card = await this.adminCardsRepository.create({
      title: dto.title.trim(),
      htmlContent,
      filterId: dto.filterId,
      widgetTypeId: dto.widgetTypeId,
      widgetConfiguration,
      iconName,
      sortOrder: dto.sortOrder ?? 0,
    });

    const full = await this.adminCardsRepository.findByIdWithRelations(card.id);
    if (!full) {
      throw new AppError('Card no encontrada tras crear', 500);
    }

    await this.audit(req, 'ADMIN_CARD_CREATED', card.id, { title: card.title, filterId: dto.filterId }, ipAddress, userAgent);

    return this.mapCardToListItem(full);
  }

  async update(
    req: AuthenticatedRequest,
    id: string,
    dto: UpdateAdminCardDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<AdminCardListItem> {
    if (dto.deletedAt === null) {
      const restored = await this.adminCardsRepository.restore(id);
      if (!restored) {
        throw new AppError('Card no encontrada o no está eliminada', 404);
      }
      const full = await this.adminCardsRepository.findByIdWithRelations(id);
      if (!full) {
        throw new AppError('Card no encontrada', 500);
      }
      await this.audit(req, 'ADMIN_CARD_UPDATED', id, { restored: true }, ipAddress, userAgent);
      return this.mapCardToListItem(full);
    }

    if (
      dto.title === undefined &&
      dto.htmlContent === undefined &&
      dto.filterId === undefined &&
      dto.widgetTypeId === undefined &&
      dto.widgetConfiguration === undefined &&
      dto.iconName === undefined &&
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

    if (dto.widgetTypeId !== undefined) {
      const widget = await this.adminCardsRepository.findWidgetTypeById(dto.widgetTypeId);
      if (!widget) {
        throw new AppError('Tipo de widget no encontrado o inactivo', 404);
      }
    }

    let htmlContent: string | undefined;
    if (dto.htmlContent !== undefined) {
      htmlContent = dto.htmlContent.trim();
    }

    const updated = await this.adminCardsRepository.update(id, {
      title: dto.title?.trim(),
      htmlContent,
      filterId: dto.filterId,
      widgetTypeId: dto.widgetTypeId,
      widgetConfiguration: dto.widgetConfiguration,
      iconName: dto.iconName !== undefined ? normalizeIconName(dto.iconName) : undefined,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    });
    if (!updated) {
      throw new AppError('Card no encontrada', 404);
    }

    const full = await this.adminCardsRepository.findByIdWithRelations(id);
    if (!full) {
      throw new AppError('Card no encontrada', 404);
    }

    await this.audit(req, 'ADMIN_CARD_UPDATED', id, { ...dto, htmlContent: htmlContent !== undefined ? '[actualizado]' : undefined }, ipAddress, userAgent);

    return this.mapCardToListItem(full);
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
