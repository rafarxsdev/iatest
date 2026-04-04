import type { DataSource } from 'typeorm';
import { IsNull } from 'typeorm';
import { User } from '@database/entities/user.entity';
import { UserSecurityStatus } from '@database/entities/user-security-status.entity';
import { Role } from '@database/entities/role.entity';

export interface CreateUserRow {
  email: string;
  passwordHash: string;
  fullName: string;
  roleId: string;
}

export interface UpdateUserRow {
  fullName?: string;
  roleId?: string;
  isActive?: boolean;
}

export class UsersRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findRoleById(roleId: string): Promise<Role | null> {
    return this.dataSource.getRepository(Role).findOne({
      where: { id: roleId, isActive: true },
    });
  }

  async findByEmailActive(email: string): Promise<User | null> {
    return this.dataSource.getRepository(User).findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  async findByIdActive(id: string): Promise<User | null> {
    return this.dataSource.getRepository(User).findOne({
      where: { id, deletedAt: IsNull() },
      relations: { role: true },
    });
  }

  async findPaginated(
    page: number,
    limit: number,
    search: string | undefined,
  ): Promise<{ users: User[]; total: number }> {
    const qb = this.dataSource
      .getRepository(User)
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'role')
      .where('u.deleted_at IS NULL');

    if (search !== undefined && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      qb.andWhere('(u.email ILIKE :term OR u.full_name ILIKE :term)', { term });
    }

    qb.orderBy('u.created_at', 'DESC').skip((page - 1) * limit).take(limit);

    const [users, total] = await qb.getManyAndCount();
    return { users, total };
  }

  async createWithSecurity(row: CreateUserRow): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const ussRepo = manager.getRepository(UserSecurityStatus);

      const now = new Date();
      const user = userRepo.create({
        email: row.email,
        passwordHash: row.passwordHash,
        fullName: row.fullName,
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        role: { id: row.roleId },
      });
      const saved = await userRepo.save(user);

      const uss = ussRepo.create({
        user: { id: saved.id },
        failedLoginAttempts: 0,
        loginBlockedUntil: null,
        lastFailedAttemptAt: null,
        passwordChangedAt: now,
        updatedAt: now,
      });
      await ussRepo.save(uss);

      const withRole = await userRepo.findOne({
        where: { id: saved.id },
        relations: { role: true },
      });
      if (!withRole) {
        throw new Error('Usuario recién creado no encontrado');
      }
      return withRole;
    });
  }

  async update(id: string, row: UpdateUserRow): Promise<User | null> {
    const user = await this.findByIdActive(id);
    if (!user) {
      return null;
    }
    if (row.fullName !== undefined) {
      user.fullName = row.fullName;
    }
    if (row.roleId !== undefined) {
      user.role = { id: row.roleId } as Role;
    }
    if (row.isActive !== undefined) {
      user.isActive = row.isActive;
    }
    user.updatedAt = new Date();
    await this.dataSource.getRepository(User).save(user);
    return this.findByIdActive(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await this.dataSource.getRepository(User).update(
      { id, deletedAt: IsNull() },
      { deletedAt: new Date(), updatedAt: new Date() },
    );
    return (res.affected ?? 0) > 0;
  }
}
