import type { DataSource } from 'typeorm';
import { IsNull } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';
import { Card } from '@database/entities/card.entity';

export class CardsRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Cards activas, no borradas; opcionalmente por `filter_id`. Paginación y total.
   */
  async findByFilter(
    filterId: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ cards: Card[]; total: number }> {
    const where: FindOptionsWhere<Card> = {
      isActive: true,
      deletedAt: IsNull(),
    };
    if (filterId !== undefined) {
      where.filter = { id: filterId };
    }

    const [cards, total] = await this.dataSource.getRepository(Card).findAndCount({
      where,
      relations: ['widgetType'],
      order: { sortOrder: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { cards, total };
  }
}
