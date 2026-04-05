import type { DataSource, EntityManager } from 'typeorm';
import { UserCardInteraction } from '@database/entities/user-card-interaction.entity';
import { InteractionLog } from '@database/entities/interaction-log.entity';
import { AuditLog } from '@database/entities/audit-log.entity';
import { ActionType } from '@database/entities/action-type.entity';
import type {
  InteractionLogEntry,
  UserInteractionDetail,
  UserWithInteractionSummary,
} from './admin-interactions.types';

export class AdminInteractionsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findUserInteractions(userId: string): Promise<UserInteractionDetail[]> {
    const rows = await this.dataSource
      .getRepository(UserCardInteraction)
      .createQueryBuilder('uci')
      .innerJoinAndSelect('uci.card', 'c')
      .innerJoinAndSelect('c.widgetType', 'wt')
      .innerJoinAndSelect('uci.resetPolicy', 'rp')
      .innerJoinAndSelect('c.filter', 'f')
      .where('uci.user_id = :userId', { userId })
      .orderBy('uci.lastInteractionAt', 'DESC', 'NULLS LAST')
      .getMany();

    return rows.map((uci) => this.mapUserInteractionDetail(uci));
  }

  private mapUserInteractionDetail(uci: UserCardInteraction): UserInteractionDetail {
    const limit = uci.limitAtCreation;
    const used = uci.interactionCount;
    const isBlocked = uci.limitReachedAt !== null && used >= limit;
    const remaining = Math.max(0, limit - used);
    const usagePercent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

    return {
      id: uci.id,
      cardId: uci.card.id,
      cardTitle: uci.card.title,
      cardIsActive: uci.card.isActive,
      widgetCode: uci.card.widgetType.code,
      widgetLabel: uci.card.widgetType.label,
      filterLabel: uci.card.filter.label,
      interactionCount: used,
      limitAtCreation: limit,
      resetPolicyCode: uci.resetPolicy.code,
      lastResetAt: uci.lastResetAt,
      limitReachedAt: uci.limitReachedAt,
      lastInteractionAt: uci.lastInteractionAt,
      createdAt: uci.createdAt,
      isBlocked,
      remaining,
      usagePercent,
    };
  }

  async findInteractionHistory(userId: string, cardId: string): Promise<InteractionLogEntry[]> {
    const rows = await this.dataSource
      .getRepository(InteractionLog)
      .createQueryBuilder('il')
      .innerJoinAndSelect('il.actionType', 'at')
      .where('il.user_id = :userId', { userId })
      .andWhere('il.card_id = :cardId', { cardId })
      .orderBy('il.createdAt', 'DESC')
      .take(20)
      .getMany();

    return rows.map((il) => ({
      actionTypeCode: il.actionType.code,
      interactionNumber: il.interactionNumber,
      maxAtMoment: il.maxAtMoment,
      createdAt: il.createdAt,
      ipAddress: il.ipAddress,
    }));
  }

  async findUsersWithInteractions(search?: string): Promise<UserWithInteractionSummary[]> {
    const params: string[] = [];
    let searchClause = '';
    if (search !== undefined && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      searchClause = 'AND (u.full_name ILIKE $1 OR u.email ILIKE $1)';
    }

    const sql = `
      SELECT
        u.id,
        u.full_name AS "fullName",
        u.email,
        r.name AS "roleName",
        COUNT(uci.id)::int AS "totalWidgets",
        COALESCE(SUM(uci.interaction_count), 0)::int AS "totalInteractions",
        COUNT(CASE WHEN uci.limit_reached_at IS NOT NULL THEN 1 END)::int AS "blockedWidgets",
        MAX(uci.last_interaction_at) AS "lastActivity"
      FROM security.users u
      INNER JOIN security.roles r ON r.id = u.role_id
      LEFT JOIN interactions.user_card_interactions uci ON uci.user_id = u.id
      WHERE u.deleted_at IS NULL
      ${searchClause}
      GROUP BY u.id, u.full_name, u.email, r.name
      HAVING COUNT(uci.id) > 0
      ORDER BY MAX(uci.last_interaction_at) DESC NULLS LAST
    `;

    const raw = await this.dataSource.query<
      {
        id: string;
        fullName: string;
        email: string;
        roleName: string;
        totalWidgets: string | number;
        totalInteractions: string | number;
        blockedWidgets: string | number;
        lastActivity: Date | null;
      }[]
    >(sql, params);

    return raw.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      roleName: row.roleName,
      totalWidgets: Number(row.totalWidgets),
      totalInteractions: Number(row.totalInteractions),
      blockedWidgets: Number(row.blockedWidgets),
      lastActivity: row.lastActivity,
    }));
  }

  async resetSingle(
    userId: string,
    cardId: string,
    adminUserId: string,
    reason: string | null,
    ipAddress: string | null,
    userAgent: string | null,
    sessionId: string | null,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const uci = await manager.getRepository(UserCardInteraction).findOne({
        where: { user: { id: userId }, card: { id: cardId } },
        relations: ['resetPolicy', 'card'],
      });
      if (!uci) {
        throw new Error('UCI_NOT_FOUND');
      }

      const cardTitle = uci.card.title;

      await manager.getRepository(UserCardInteraction).update(
        { id: uci.id },
        {
          interactionCount: 0,
          limitReachedAt: null,
          lastResetAt: new Date(),
        },
      );

      await this.insertWidgetResetInteractionLog(manager, {
        userId,
        cardId,
        resetPolicyId: uci.resetPolicy.id,
        maxAtMoment: uci.limitAtCreation,
        ipAddress,
        payload: {
          resetBy: adminUserId,
          reason: reason ?? 'manual_admin_reset',
        },
      });

      await this.insertAuditLog(manager, {
        userId: adminUserId,
        sessionId,
        actionTypeCode: 'WIDGET_RESET',
        entityType: 'card',
        entityId: cardId,
        payload: { targetUserId: userId, cardTitle },
        ipAddress,
        userAgent,
        status: 'success',
        errorMessage: null,
        durationMs: null,
      });
    });
  }

  async resetAll(
    userId: string,
    adminUserId: string,
    reason: string | null,
    ipAddress: string | null,
    userAgent: string | null,
    sessionId: string | null,
  ): Promise<{ resetCount: number }> {
    return this.dataSource.transaction(async (manager) => {
      const ucis = await manager.getRepository(UserCardInteraction).find({
        where: { user: { id: userId } },
        relations: ['resetPolicy', 'card'],
      });

      if (ucis.length === 0) {
        return { resetCount: 0 };
      }

      const now = new Date();
      for (const uci of ucis) {
        await manager.getRepository(UserCardInteraction).update(
          { id: uci.id },
          {
            interactionCount: 0,
            limitReachedAt: null,
            lastResetAt: now,
          },
        );

        await this.insertWidgetResetInteractionLog(manager, {
          userId,
          cardId: uci.card.id,
          resetPolicyId: uci.resetPolicy.id,
          maxAtMoment: uci.limitAtCreation,
          ipAddress,
          payload: {
            resetBy: adminUserId,
            reason: reason ?? 'manual_admin_reset',
          },
        });
      }

      await this.insertAuditLog(manager, {
        userId: adminUserId,
        sessionId,
        actionTypeCode: 'WIDGET_RESET',
        entityType: 'user',
        entityId: userId,
        payload: { targetUserId: userId, resetCount: ucis.length },
        ipAddress,
        userAgent,
        status: 'success',
        errorMessage: null,
        durationMs: null,
      });

      return { resetCount: ucis.length };
    });
  }

  private async insertWidgetResetInteractionLog(
    manager: EntityManager,
    input: {
      userId: string;
      cardId: string;
      resetPolicyId: string;
      maxAtMoment: number;
      ipAddress: string | null;
      payload: Record<string, unknown>;
    },
  ): Promise<void> {
    const actionType = await manager.getRepository(ActionType).findOne({ where: { code: 'WIDGET_RESET' } });
    if (!actionType) {
      throw new Error('ACTION_TYPE_WIDGET_RESET_MISSING');
    }

    const log = manager.getRepository(InteractionLog).create({
      user: { id: input.userId },
      card: { id: input.cardId },
      session: null,
      actionType,
      resetPolicy: { id: input.resetPolicyId },
      interactionNumber: 0,
      maxAtMoment: input.maxAtMoment,
      ipAddress: input.ipAddress,
      payload: input.payload,
      createdAt: new Date(),
    });
    await manager.getRepository(InteractionLog).save(log);
  }

  private async insertAuditLog(
    manager: EntityManager,
    input: {
      userId: string;
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
    },
  ): Promise<void> {
    const actionType = await manager.getRepository(ActionType).findOne({ where: { code: input.actionTypeCode } });
    if (!actionType) {
      throw new Error(`ACTION_TYPE_${input.actionTypeCode}_MISSING`);
    }

    const log = manager.getRepository(AuditLog).create({
      user: { id: input.userId },
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
    await manager.getRepository(AuditLog).save(log);
  }
}
