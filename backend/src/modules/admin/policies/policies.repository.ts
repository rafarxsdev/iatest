import type { DataSource } from 'typeorm';
import { IsNull } from 'typeorm';
import { Card } from '@database/entities/card.entity';
import { CardInteractionPolicy } from '@database/entities/card-interaction-policy.entity';
import { ResetPolicy } from '@database/entities/reset-policy.entity';
import { Role } from '@database/entities/role.entity';

export class PoliciesRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findCardById(cardId: string): Promise<Card | null> {
    return this.dataSource.getRepository(Card).findOne({
      where: { id: cardId, deletedAt: IsNull() },
    });
  }

  async findResetPolicyById(id: string): Promise<ResetPolicy | null> {
    return this.dataSource.getRepository(ResetPolicy).findOne({ where: { id } });
  }

  async findRoleById(id: string): Promise<Role | null> {
    return this.dataSource.getRepository(Role).findOne({ where: { id, isActive: true } });
  }

  async findByCardId(cardId: string): Promise<CardInteractionPolicy[]> {
    return this.dataSource.getRepository(CardInteractionPolicy).find({
      where: { card: { id: cardId } },
      relations: { role: true, resetPolicy: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findByCardAndRole(cardId: string, roleId: string | null): Promise<CardInteractionPolicy | null> {
    if (roleId === null) {
      return this.dataSource.getRepository(CardInteractionPolicy).findOne({
        where: { card: { id: cardId }, role: IsNull() },
        relations: { role: true, resetPolicy: true },
      });
    }
    return this.dataSource.getRepository(CardInteractionPolicy).findOne({
      where: { card: { id: cardId }, role: { id: roleId } },
      relations: { role: true, resetPolicy: true },
    });
  }

  async createPolicy(
    cardId: string,
    roleId: string | null,
    maxInteractions: number,
    resetPolicyId: string,
  ): Promise<CardInteractionPolicy> {
    const now = new Date();
    const row = this.dataSource.getRepository(CardInteractionPolicy).create({
      maxInteractions,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      card: { id: cardId },
      role: roleId === null ? null : { id: roleId },
      resetPolicy: { id: resetPolicyId },
    });
    return this.dataSource.getRepository(CardInteractionPolicy).save(row);
  }

  async updatePolicy(
    policy: CardInteractionPolicy,
    maxInteractions: number,
    resetPolicyId: string,
  ): Promise<CardInteractionPolicy> {
    policy.maxInteractions = maxInteractions;
    policy.resetPolicy = { id: resetPolicyId } as ResetPolicy;
    policy.updatedAt = new Date();
    return this.dataSource.getRepository(CardInteractionPolicy).save(policy);
  }
}
