import type { DataSource } from 'typeorm';
import { Parameter } from '@database/entities/parameter.entity';
import { UserParameter } from '@database/entities/user-parameter.entity';
import { RoleParameter } from '@database/entities/role-parameter.entity';
import { User } from '@database/entities/user.entity';

export class ParameterRepository {
  constructor(private readonly dataSource: DataSource) {}

  /** Parámetro global por `key` (tabla `config.parameters`). */
  async findParameterByKey(key: string): Promise<Parameter | null> {
    return this.dataSource.getRepository(Parameter).findOne({ where: { key } });
  }

  /**
   * Sobrescritura en `user_parameters` para `(user_id, parameter.key)`.
   * Devuelve el valor si existe fila; si no hay fila, `null`.
   */
  async findUserParameterValueByUserAndKey(userId: string, key: string): Promise<string | null> {
    const row = await this.dataSource
      .getRepository(UserParameter)
      .createQueryBuilder('up')
      .innerJoin('up.user', 'u')
      .innerJoin('up.parameter', 'p')
      .where('u.id = :userId', { userId })
      .andWhere('p.key = :key', { key })
      .getOne();
    return row?.value ?? null;
  }

  /**
   * Sobrescritura en `role_parameters` para `(role_id, parameter.key)`.
   */
  async findRoleParameterValueByRoleAndKey(roleId: string, key: string): Promise<string | null> {
    const row = await this.dataSource
      .getRepository(RoleParameter)
      .createQueryBuilder('rp')
      .innerJoin('rp.role', 'r')
      .innerJoin('rp.parameter', 'p')
      .where('r.id = :roleId', { roleId })
      .andWhere('p.key = :key', { key })
      .getOne();
    return row?.value ?? null;
  }

  async findUserWithRole(userId: string): Promise<User | null> {
    return this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      relations: ['role'],
    });
  }
}
