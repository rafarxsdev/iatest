import type { DataSource, EntityManager, QueryDeepPartialEntity } from 'typeorm';
import { IsNull } from 'typeorm';
import { Card } from '@database/entities/card.entity';
import { User } from '@database/entities/user.entity';
import { UserCardInteraction } from '@database/entities/user-card-interaction.entity';
import { ResetPolicy } from '@database/entities/reset-policy.entity';
import { InteractionLog } from '@database/entities/interaction-log.entity';
import { ActionType } from '@database/entities/action-type.entity';

export class InteractionsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findUserWithRole(userId: string): Promise<User | null> {
    return this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      relations: ['role'],
    });
  }

  /**
   * Card con políticas (rol + reset), tipo de widget.
   */
  async findCardForLimitResolution(cardId: string): Promise<Card | null> {
    return this.dataSource.getRepository(Card).findOne({
      where: { id: cardId, isActive: true, deletedAt: IsNull() },
      relations: [
        'widgetType',
        'cardInteractionPolicies',
        'cardInteractionPolicies.role',
        'cardInteractionPolicies.resetPolicy',
      ],
    });
  }

  findStatus(userId: string, cardId: string): Promise<UserCardInteraction | null> {
    return this.dataSource.getRepository(UserCardInteraction).findOne({
      where: { user: { id: userId }, card: { id: cardId } },
    });
  }

  async findResetPolicyByCode(code: string): Promise<ResetPolicy | null> {
    return this.dataSource.getRepository(ResetPolicy).findOne({ where: { code } });
  }

  /**
   * Crea el estado (user, card) si no existe; si ya existe, lo devuelve sin modificar.
   */
  async findOrCreate(
    userId: string,
    cardId: string,
    limitAtCreation: number,
    resetPolicyId: string,
  ): Promise<UserCardInteraction> {
    const repo = this.dataSource.getRepository(UserCardInteraction);
    const existing = await this.findStatus(userId, cardId);
    if (existing) {
      return existing;
    }

    const row = repo.create({
      user: { id: userId },
      card: { id: cardId },
      interactionCount: 0,
      limitAtCreation,
      resetPolicy: { id: resetPolicyId },
      lastResetAt: null,
      limitReachedAt: null,
      lastInteractionAt: new Date(0),
      createdAt: new Date(),
    });

    try {
      return await repo.save(row);
    } catch {
      const again = await this.findStatus(userId, cardId);
      if (again) {
        return again;
      }
      throw new Error('No se pudo crear ni recuperar user_card_interactions');
    }
  }

  /**
   * Actualiza contador y marcas en una transacción.
   */
  async increment(id: string, newCount: number, limitReachedAt?: Date | null): Promise<void> {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      const patch: QueryDeepPartialEntity<UserCardInteraction> = {
        interactionCount: newCount,
        lastInteractionAt: new Date(),
      };
      if (limitReachedAt !== undefined) {
        patch.limitReachedAt = limitReachedAt;
      }
      await manager.getRepository(UserCardInteraction).update({ id }, patch);
    });
  }

  async findActionTypeByCode(code: string): Promise<ActionType | null> {
    return this.dataSource.getRepository(ActionType).findOne({ where: { code } });
  }

  async insertInteractionLog(input: {
    userId: string;
    cardId: string;
    sessionId: string | null;
    actionTypeCode: string;
    resetPolicyId: string;
    interactionNumber: number;
    maxAtMoment: number;
    ipAddress: string | null;
    payload: Record<string, unknown> | null;
  }): Promise<void> {
    const actionType = await this.findActionTypeByCode(input.actionTypeCode);
    if (!actionType) {
      throw new Error(`action_type no encontrado: ${input.actionTypeCode}`);
    }
    const log = this.dataSource.getRepository(InteractionLog).create({
      user: { id: input.userId },
      card: { id: input.cardId },
      session: input.sessionId ? { id: input.sessionId } : null,
      actionType,
      resetPolicy: { id: input.resetPolicyId },
      interactionNumber: input.interactionNumber,
      maxAtMoment: input.maxAtMoment,
      ipAddress: input.ipAddress,
      payload: input.payload,
      createdAt: new Date(),
    });
    await this.dataSource.getRepository(InteractionLog).save(log);
  }
}
