import type { DataSource } from 'typeorm';
import { WidgetType } from '@database/entities/widget-type.entity';

export class AdminWidgetTypesRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findAllActive(): Promise<WidgetType[]> {
    return this.dataSource.getRepository(WidgetType).find({
      where: { isActive: true },
      order: { label: 'ASC' },
    });
  }
}
