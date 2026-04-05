import { RolesRepository } from './roles.repository';

export interface RoleListItem {
  id: string;
  name: string;
  description: string | null;
}

export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async list(): Promise<RoleListItem[]> {
    const rows = await this.rolesRepository.findAllActive();
    return rows.map((r) => ({ id: r.id, name: r.name, description: r.description }));
  }
}
