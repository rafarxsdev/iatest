import type { DataSource } from 'typeorm';
import { FilterType } from '@database/entities/filter-type.entity';

export class AdminFilterTypesRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(): Promise<FilterType[]> {
    return this.dataSource.getRepository(FilterType).find({
      order: { code: 'ASC' },
    });
  }
}
