import { AppError } from '@common/errors/app-error';
import type { ResetPolicy } from '@database/entities/reset-policy.entity';
import { ParameterService } from '@modules/config';
import { AuthRepository } from '@modules/auth/auth.repository';
import { InteractionsRepository } from './interactions.repository';

export interface InteractionStatus {
  used: number;
  limit: number;
  remaining: number;
  isBlocked: boolean;
  lastInteractionAt: Date | null;
}

export interface ResolvedLimit {
  limit: number;
  resetPolicy: ResetPolicy;
}

/**
 * Jerarquía (.cursorrules): política card+rol → política card (rol null) →
 * widget_types.default_max_interactions → parameters.default_max_interactions
 */
export class InteractionsService {
  constructor(
    private readonly interactionsRepository: InteractionsRepository,
    private readonly parameterService: ParameterService,
    private readonly authRepository: AuthRepository,
  ) {}

  async resolveLimit(cardId: string, userId: string): Promise<ResolvedLimit> {
    const user = await this.interactionsRepository.findUserWithRole(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const card = await this.interactionsRepository.findCardForLimitResolution(cardId);
    if (!card) {
      throw new AppError('Card no encontrada', 404);
    }

    const defaultReset = await this.interactionsRepository.findResetPolicyByCode('never');
    if (!defaultReset) {
      throw new AppError('Política de reinicio por defecto (never) no configurada', 500);
    }

    const policies = (card.cardInteractionPolicies ?? []).filter((p) => p.isActive);
    const forRole = policies.find((p) => p.role !== null && p.role.id === user.role.id);
    const forAll = policies.find((p) => p.role === null);
    const chosen = forRole ?? forAll;

    if (chosen) {
      return { limit: chosen.maxInteractions, resetPolicy: chosen.resetPolicy };
    }

    const widgetDefault = card.widgetType.defaultMaxInteractions;
    if (widgetDefault !== null && widgetDefault !== undefined) {
      return { limit: widgetDefault, resetPolicy: defaultReset };
    }

    const raw = await this.parameterService.resolve('default_max_interactions', userId);
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n) || n < 1) {
      throw new AppError('Parámetro default_max_interactions inválido', 500);
    }
    return { limit: n, resetPolicy: defaultReset };
  }

  async getStatus(cardId: string, userId: string): Promise<InteractionStatus> {
    const { limit } = await this.resolveLimit(cardId, userId);
    const uci = await this.interactionsRepository.findStatus(userId, cardId);
    const used = uci?.interactionCount ?? 0;
    const remaining = Math.max(0, limit - used);
    const isBlocked = limit > 0 && used >= limit;
    return {
      used,
      limit,
      remaining,
      isBlocked,
      lastInteractionAt: uci?.lastInteractionAt ?? null,
    };
  }

  async interact(
    cardId: string,
    userId: string,
    jti: string,
    ipAddress: string | null,
    payload: Record<string, unknown> | undefined,
    userAgent: string | null,
  ): Promise<InteractionStatus> {
    const { limit, resetPolicy } = await this.resolveLimit(cardId, userId);

    const uci = await this.interactionsRepository.findOrCreate(userId, cardId, limit, resetPolicy.id);

    const used = uci.interactionCount;
    if (limit > 0 && used >= limit) {
      await this.logWidgetBlocked(userId, cardId, jti, limit, used, resetPolicy.id, ipAddress, payload, userAgent);
      throw new AppError('Has alcanzado el límite de usos para este widget.', 403, true, {
        used,
        limit,
        remaining: 0,
        isBlocked: true,
        limitReachedAt: (uci.limitReachedAt ?? new Date()).toISOString(),
      });
    }

    const cooldownRaw = await this.parameterService.resolve('interaction_cooldown_seconds', userId);
    const cooldownSec = Number.parseInt(cooldownRaw, 10);
    if (Number.isNaN(cooldownSec) || cooldownSec < 0) {
      throw new AppError('Parámetro interaction_cooldown_seconds inválido', 500);
    }

    if (uci.interactionCount > 0 && cooldownSec > 0) {
      const elapsed = Date.now() - uci.lastInteractionAt.getTime();
      if (elapsed < cooldownSec * 1000) {
        throw new AppError('Debes esperar antes de volver a interactuar.', 429, true, {
          cooldownSeconds: cooldownSec,
        });
      }
    }

    const newCount = used + 1;
    const limitReachedPatch =
      newCount >= limit && limit > 0 ? new Date() : undefined;

    await this.interactionsRepository.increment(uci.id, newCount, limitReachedPatch);

    await this.logWidgetInteraction(
      userId,
      cardId,
      jti,
      newCount,
      limit,
      resetPolicy.id,
      ipAddress,
      payload,
      userAgent,
    );

    return this.getStatus(cardId, userId);
  }

  private async logWidgetBlocked(
    userId: string,
    cardId: string,
    jti: string,
    limit: number,
    used: number,
    resetPolicyId: string,
    ipAddress: string | null,
    payload: Record<string, unknown> | undefined,
    userAgent: string | null,
  ): Promise<void> {
    const session = await this.authRepository.getActiveSession(jti);
    await this.interactionsRepository.insertInteractionLog({
      userId,
      cardId,
      sessionId: session?.id ?? null,
      actionTypeCode: 'WIDGET_BLOCKED',
      resetPolicyId,
      interactionNumber: used,
      maxAtMoment: limit,
      ipAddress,
      payload: payload ?? null,
    });
    await this.authRepository.createAuditLog({
      userId,
      sessionId: session?.id ?? null,
      actionTypeCode: 'WIDGET_BLOCKED',
      entityType: 'card',
      entityId: cardId,
      payload: payload ?? null,
      ipAddress,
      userAgent,
      status: 'blocked',
      errorMessage: 'Límite de interacciones alcanzado',
      durationMs: null,
    });
  }

  private async logWidgetInteraction(
    userId: string,
    cardId: string,
    jti: string,
    interactionNumber: number,
    maxAtMoment: number,
    resetPolicyId: string,
    ipAddress: string | null,
    payload: Record<string, unknown> | undefined,
    userAgent: string | null,
  ): Promise<void> {
    const session = await this.authRepository.getActiveSession(jti);
    await this.interactionsRepository.insertInteractionLog({
      userId,
      cardId,
      sessionId: session?.id ?? null,
      actionTypeCode: 'WIDGET_INTERACTION',
      resetPolicyId,
      interactionNumber,
      maxAtMoment,
      ipAddress,
      payload: payload ?? null,
    });
    await this.authRepository.createAuditLog({
      userId,
      sessionId: session?.id ?? null,
      actionTypeCode: 'WIDGET_INTERACTION',
      entityType: 'card',
      entityId: cardId,
      payload: payload ?? null,
      ipAddress,
      userAgent,
      status: 'success',
      errorMessage: null,
      durationMs: null,
    });
  }
}
