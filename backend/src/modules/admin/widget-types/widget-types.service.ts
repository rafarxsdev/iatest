import { AdminWidgetTypesRepository } from './widget-types.repository';

export interface WidgetTypeOptionDto {
  id: string;
  code: string;
  label: string;
  defaultMaxInteractions: number | null;
}

export class AdminWidgetTypesService {
  constructor(private readonly repository: AdminWidgetTypesRepository) {}

  async listActive(): Promise<WidgetTypeOptionDto[]> {
    const rows = await this.repository.findAllActive();
    return rows.map((w) => ({
      id: w.id,
      code: w.code,
      label: w.label,
      defaultMaxInteractions: w.defaultMaxInteractions,
    }));
  }
}
