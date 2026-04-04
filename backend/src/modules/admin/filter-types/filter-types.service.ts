import { AdminFilterTypesRepository } from './filter-types.repository';

export interface AdminFilterTypeItem {
  id: string;
  code: string;
  description: string | null;
}

export class AdminFilterTypesService {
  constructor(private readonly repository: AdminFilterTypesRepository) {}

  async listAll(): Promise<AdminFilterTypeItem[]> {
    const rows = await this.repository.findAll();
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      description: r.description,
    }));
  }
}
