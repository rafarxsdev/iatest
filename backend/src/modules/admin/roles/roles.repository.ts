import type { DataSource } from 'typeorm';
import { Role } from '@database/entities/role.entity';

export class RolesRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findAllActive(): Promise<Role[]> {
    return this.dataSource.getRepository(Role).find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }
}
