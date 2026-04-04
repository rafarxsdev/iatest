import type { DataSource } from 'typeorm';
import { IsNull, MoreThan } from 'typeorm';
import { getEnvConfig } from '@config/env.config';
import { User } from '@database/entities/user.entity';
import { UserSecurityStatus } from '@database/entities/user-security-status.entity';
import { Session } from '@database/entities/session.entity';
import { AuthLog } from '@database/entities/auth-log.entity';
import { AuditLog } from '@database/entities/audit-log.entity';
import { ActionType } from '@database/entities/action-type.entity';
import { RolePermission } from '@database/entities/role-permission.entity';

export interface CreateSessionInput {
  userId: string;
  tokenJti: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
}

export interface CreateAuthLogInput {
  userId: string | null;
  actionTypeCode: string;
  sessionId: string | null;
  emailAttempt: string;
  ipAddress: string | null;
  userAgent: string | null;
  failedAttemptsAtMoment: number;
  loginBlockedUntil: Date | null;
}

export interface CreateAuditLogInput {
  userId: string | null;
  sessionId: string | null;
  actionTypeCode: string;
  entityType: string | null;
  entityId: string | null;
  payload: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: 'success' | 'failed' | 'blocked';
  errorMessage: string | null;
  durationMs: number | null;
}

export class AuthRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.dataSource.getRepository(User).findOne({
      where: { email, deletedAt: IsNull() },
      relations: {
        role: {
          rolePermissions: {
            permission: true,
          },
        },
        userSecurityStatus: true,
      },
    });
  }

  /** Usuario activo para GET /api/auth/me (sin password_hash). */
  async findActiveUserById(userId: string): Promise<User | null> {
    return this.dataSource.getRepository(User).findOne({
      where: { id: userId, isActive: true, deletedAt: IsNull() },
      relations: {
        role: {
          rolePermissions: {
            permission: true,
          },
        },
      },
    });
  }

  async createSession(input: CreateSessionInput): Promise<Session> {
    const session = this.dataSource.getRepository(Session).create({
      user: { id: input.userId },
      tokenJti: input.tokenJti,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      expiresAt: input.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    });
    return this.dataSource.getRepository(Session).save(session);
  }

  async revokeSession(jti: string): Promise<void> {
    await this.dataSource.getRepository(Session).update({ tokenJti: jti }, { revokedAt: new Date() });
  }

  async getActiveSession(jti: string): Promise<Session | null> {
    return this.dataSource.getRepository(Session).findOne({
      where: {
        tokenJti: jti,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });
  }

  async findSessionByJti(jti: string): Promise<Session | null> {
    return this.dataSource.getRepository(Session).findOne({
      where: { tokenJti: jti },
      relations: ['user'],
    });
  }

  async incrementFailedAttempts(userId: string): Promise<UserSecurityStatus> {
    const repo = this.dataSource.getRepository(UserSecurityStatus);
    const uss = await repo.findOne({ where: { user: { id: userId } } });
    if (!uss) {
      throw new Error(`user_security_status no encontrado para usuario ${userId}`);
    }
    uss.failedLoginAttempts += 1;
    uss.lastFailedAttemptAt = new Date();
    return repo.save(uss);
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    const repo = this.dataSource.getRepository(UserSecurityStatus);
    const uss = await repo.findOne({ where: { user: { id: userId } } });
    if (!uss) {
      throw new Error(`user_security_status no encontrado para usuario ${userId}`);
    }
    uss.failedLoginAttempts = 0;
    uss.lastFailedAttemptAt = null;
    uss.loginBlockedUntil = null;
    await repo.save(uss);
  }

  async setBlockedUntil(userId: string, until: Date): Promise<void> {
    const repo = this.dataSource.getRepository(UserSecurityStatus);
    const uss = await repo.findOne({ where: { user: { id: userId } } });
    if (!uss) {
      throw new Error(`user_security_status no encontrado para usuario ${userId}`);
    }
    uss.loginBlockedUntil = until;
    await repo.save(uss);
  }

  async findActionTypeByCode(code: string): Promise<ActionType | null> {
    return this.dataSource.getRepository(ActionType).findOne({ where: { code } });
  }

  async createAuthLog(input: CreateAuthLogInput): Promise<void> {
    const actionType = await this.findActionTypeByCode(input.actionTypeCode);
    if (!actionType) {
      throw new Error(`action_type no encontrado: ${input.actionTypeCode}`);
    }
    const log = this.dataSource.getRepository(AuthLog).create({
      user: input.userId ? { id: input.userId } : null,
      actionType,
      session: input.sessionId ? { id: input.sessionId } : null,
      emailAttempt: input.emailAttempt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      failedAttemptsAtMoment: input.failedAttemptsAtMoment,
      loginBlockedUntil: input.loginBlockedUntil,
      createdAt: new Date(),
    });
    await this.dataSource.getRepository(AuthLog).save(log);
  }

  async createAuditLog(input: CreateAuditLogInput): Promise<void> {
    const actionType = await this.findActionTypeByCode(input.actionTypeCode);
    if (!actionType) {
      /** Sin fila en `logs.action_types` (p. ej. migración 06 no aplicada): no romper la petición. */
      if (getEnvConfig().nodeEnv === 'development') {
        console.warn(`[audit] action_type no encontrado, registro omitido: ${input.actionTypeCode}`);
      }
      return;
    }
    const log = this.dataSource.getRepository(AuditLog).create({
      user: input.userId ? { id: input.userId } : null,
      session: input.sessionId ? { id: input.sessionId } : null,
      actionType,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      status: input.status,
      errorMessage: input.errorMessage,
      durationMs: input.durationMs,
      createdAt: new Date(),
    });
    await this.dataSource.getRepository(AuditLog).save(log);
  }

  async roleHasPermission(roleId: string, permissionCode: string): Promise<boolean> {
    const count = await this.dataSource
      .getRepository(RolePermission)
      .createQueryBuilder('rp')
      .innerJoin('rp.role', 'role')
      .innerJoin('rp.permission', 'perm')
      .where('role.id = :roleId', { roleId })
      .andWhere('perm.code = :code', { code: permissionCode })
      .andWhere('perm.isActive = :active', { active: true })
      .getCount();
    return count > 0;
  }
}
