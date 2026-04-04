import type { DataSource } from 'typeorm';
import { Filter } from '@database/entities/filter.entity';

export class FiltersRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Filtros activos con tipo, ordenados por `sort_order`.
   * Incluye `parent` para armar el árbol en el servicio.
   */
  async findAllActive(): Promise<Filter[]> {
    return this.dataSource.getRepository(Filter).find({
      where: { isActive: true },
      relations: ['filterType', 'parent'],
      order: { sortOrder: 'ASC' },
    });
  }
}
