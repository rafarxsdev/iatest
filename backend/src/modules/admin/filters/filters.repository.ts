import type { DataSource } from 'typeorm';
import { IsNull } from 'typeorm';
import { Filter } from '@database/entities/filter.entity';
import { FilterType } from '@database/entities/filter-type.entity';
import { Card } from '@database/entities/card.entity';
import type { CreateFilterDto } from './dto/create-filter.dto';
import type { UpdateFilterDto } from './dto/update-filter.dto';

export class AdminFiltersRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findFilterTypeById(id: string): Promise<FilterType | null> {
    return this.dataSource.getRepository(FilterType).findOne({ where: { id } });
  }

  async valueExists(value: string, excludeId?: string): Promise<boolean> {
    const qb = this.dataSource.getRepository(Filter).createQueryBuilder('f').where('f.value = :value', { value });
    if (excludeId !== undefined) {
      qb.andWhere('f.id != :excludeId', { excludeId });
    }
    return (await qb.getCount()) > 0;
  }

  async findByIdWithParentOnly(id: string): Promise<Filter | null> {
    return this.dataSource.getRepository(Filter).findOne({
      where: { id },
      relations: { parent: true },
    });
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ filters: (Filter & { cardsCount: number })[]; total: number }> {
    const qb = this.dataSource
      .getRepository(Filter)
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.filterType', 'ft')
      .leftJoinAndSelect('f.parent', 'parent')
      .loadRelationCountAndMap(
        'f.cardsCount',
        'f.cards',
        'card',
        (sub) => sub.where('card.deletedAt IS NULL').andWhere('card.isActive = :active', { active: true }),
      );

    if (search !== undefined && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      qb.andWhere('(f.label ILIKE :term OR f.value ILIKE :term)', { term });
    }

    qb.orderBy('f.sortOrder', 'ASC').addOrderBy('f.createdAt', 'DESC');

    const [filters, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    const withCount = filters.map((row) => {
      const count = (row as Filter & { cardsCount?: number }).cardsCount ?? 0;
      return Object.assign(row, { cardsCount: count }) as Filter & { cardsCount: number };
    });

    return { filters: withCount, total };
  }

  async findById(id: string): Promise<Filter | null> {
    return this.dataSource.getRepository(Filter).findOne({
      where: { id },
      relations: {
        filterType: true,
        parent: true,
        children: true,
      },
    });
  }

  async create(data: CreateFilterDto): Promise<Filter> {
    const now = new Date();
    const filter = this.dataSource.getRepository(Filter).create({
      label: data.label.trim(),
      value: data.value.trim(),
      configuration: data.configuration ?? {},
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      filterType: { id: data.filterTypeId },
      parent: data.parentFilterId ? { id: data.parentFilterId } : null,
    });
    return this.dataSource.getRepository(Filter).save(filter);
  }

  async update(id: string, data: UpdateFilterDto): Promise<Filter | null> {
    const filter = await this.dataSource.getRepository(Filter).findOne({
      where: { id },
      relations: { filterType: true, parent: true },
    });
    if (!filter) {
      return null;
    }
    if (data.label !== undefined) {
      filter.label = data.label.trim();
    }
    if (data.value !== undefined) {
      filter.value = data.value.trim();
    }
    if (data.configuration !== undefined) {
      filter.configuration = data.configuration;
    }
    if (data.sortOrder !== undefined) {
      filter.sortOrder = data.sortOrder;
    }
    if (data.isActive !== undefined) {
      filter.isActive = data.isActive;
    }
    if (data.filterTypeId !== undefined) {
      filter.filterType = { id: data.filterTypeId } as FilterType;
    }
    if (data.parentFilterId !== undefined) {
      filter.parent = data.parentFilterId === null ? null : ({ id: data.parentFilterId } as Filter);
    }
    filter.updatedAt = new Date();
    return this.dataSource.getRepository(Filter).save(filter);
  }

  async countActiveCardsForFilter(filterId: string): Promise<number> {
    return this.dataSource.getRepository(Card).count({
      where: {
        filter: { id: filterId },
        deletedAt: IsNull(),
        isActive: true,
      },
    });
  }

  async softDelete(id: string): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'has_active_cards'; activeCards?: number }> {
    const filter = await this.dataSource.getRepository(Filter).findOne({ where: { id } });
    if (!filter) {
      return { ok: false, reason: 'not_found' };
    }
    const activeCards = await this.countActiveCardsForFilter(id);
    if (activeCards > 0) {
      return { ok: false, reason: 'has_active_cards', activeCards };
    }
    filter.isActive = false;
    filter.updatedAt = new Date();
    await this.dataSource.getRepository(Filter).save(filter);
    return { ok: true };
  }

  async restore(id: string): Promise<Filter | null> {
    const filter = await this.dataSource.getRepository(Filter).findOne({ where: { id } });
    if (!filter) {
      return null;
    }
    filter.isActive = true;
    filter.updatedAt = new Date();
    return this.dataSource.getRepository(Filter).save(filter);
  }
}
