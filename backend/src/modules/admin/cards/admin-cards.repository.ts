import type { DataSource } from 'typeorm';
import { IsNull, Not } from 'typeorm';
import { Card } from '@database/entities/card.entity';
import { Filter } from '@database/entities/filter.entity';
import { WidgetType } from '@database/entities/widget-type.entity';

export interface CreateAdminCardRow {
  title: string;
  htmlContent: string;
  filterId: string;
  widgetTypeId: string;
  widgetConfiguration: Record<string, unknown>;
  iconName: string | null;
  sortOrder: number;
}

export interface UpdateAdminCardRow {
  title?: string;
  htmlContent?: string;
  filterId?: string;
  widgetTypeId?: string;
  widgetConfiguration?: Record<string, unknown>;
  iconName?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export class AdminCardsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findFilterById(id: string): Promise<Filter | null> {
    return this.dataSource.getRepository(Filter).findOne({
      where: { id, isActive: true },
    });
  }

  async findWidgetTypeById(id: string): Promise<WidgetType | null> {
    return this.dataSource.getRepository(WidgetType).findOne({
      where: { id, isActive: true },
    });
  }

  async findByIdActive(id: string): Promise<Card | null> {
    return this.dataSource.getRepository(Card).findOne({
      where: { id, deletedAt: IsNull() },
      relations: { filter: { filterType: true }, widgetType: true },
    });
  }

  /** Incluye eliminadas; relaciones para respuesta admin. */
  async findByIdWithRelations(id: string): Promise<Card | null> {
    return this.dataSource.getRepository(Card).findOne({
      where: { id },
      relations: { filter: { filterType: true }, widgetType: true },
    });
  }

  async findByIdSoftDeleted(id: string): Promise<Card | null> {
    return this.dataSource.getRepository(Card).findOne({
      where: { id, deletedAt: Not(IsNull()) },
      relations: { filter: { filterType: true }, widgetType: true },
    });
  }

  async restore(id: string): Promise<Card | null> {
    const card = await this.findByIdSoftDeleted(id);
    if (!card) {
      return null;
    }
    card.deletedAt = null;
    card.updatedAt = new Date();
    return this.dataSource.getRepository(Card).save(card);
  }

  async create(row: CreateAdminCardRow): Promise<Card> {
    const now = new Date();
    const card = this.dataSource.getRepository(Card).create({
      title: row.title,
      htmlContent: row.htmlContent,
      widgetConfiguration: row.widgetConfiguration,
      iconName: row.iconName,
      sortOrder: row.sortOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      filter: { id: row.filterId },
      widgetType: { id: row.widgetTypeId },
    });
    return this.dataSource.getRepository(Card).save(card);
  }

  async update(id: string, row: UpdateAdminCardRow): Promise<Card | null> {
    const card = await this.findByIdActive(id);
    if (!card) {
      return null;
    }
    if (row.title !== undefined) {
      card.title = row.title;
    }
    if (row.htmlContent !== undefined) {
      card.htmlContent = row.htmlContent;
    }
    if (row.filterId !== undefined) {
      card.filter = { id: row.filterId } as Filter;
    }
    if (row.widgetTypeId !== undefined) {
      card.widgetType = { id: row.widgetTypeId } as WidgetType;
    }
    if (row.widgetConfiguration !== undefined) {
      card.widgetConfiguration = row.widgetConfiguration;
    }
    if (row.iconName !== undefined) {
      card.iconName = row.iconName;
    }
    if (row.isActive !== undefined) {
      card.isActive = row.isActive;
    }
    if (row.sortOrder !== undefined) {
      card.sortOrder = row.sortOrder;
    }
    card.updatedAt = new Date();
    return this.dataSource.getRepository(Card).save(card);
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await this.dataSource.getRepository(Card).update(
      { id, deletedAt: IsNull() },
      { deletedAt: new Date(), updatedAt: new Date() },
    );
    return (res.affected ?? 0) > 0;
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ cards: Card[]; total: number }> {
    const qb = this.dataSource
      .getRepository(Card)
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.filter', 'f')
      .leftJoinAndSelect('f.filterType', 'ft')
      .leftJoinAndSelect('c.widgetType', 'wt');

    if (search !== undefined && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      qb.andWhere('c.title ILIKE :term', { term });
    }

    qb.orderBy('c.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [cards, total] = await qb.getManyAndCount();
    return { cards, total };
  }
}
