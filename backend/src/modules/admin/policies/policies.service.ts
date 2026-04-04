import type { AuthenticatedRequest } from '@common/types/request.type';
import { AppError } from '@common/errors/app-error';
import { AuthRepository } from '@modules/auth/auth.repository';
import type { CardInteractionPolicy } from '@database/entities/card-interaction-policy.entity';
import { PoliciesRepository } from './policies.repository';
import type { PutPolicyDto } from './dto/put-policy.dto';

export interface PolicyResponse {
  id: string;
  role: { id: string; name: string } | null;
  maxInteractions: number;
  resetPolicy: { code: string };
  isActive: boolean;
}

export class PoliciesService {
  constructor(
    private readonly policiesRepository: PoliciesRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  private mapPolicy(p: CardInteractionPolicy): PolicyResponse {
    return {
      id: p.id,
      role: p.role ? { id: p.role.id, name: p.role.name } : null,
      maxInteractions: p.maxInteractions,
      resetPolicy: { code: p.resetPolicy.code },
      isActive: p.isActive,
    };
  }

  private async audit(
    req: AuthenticatedRequest,
    actionTypeCode: string,
    entityId: string | null,
    payload: Record<string, unknown> | null,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<void> {
    const session = await this.authRepository.getActiveSession(req.user.jti);
    await this.authRepository.createAuditLog({
      userId: req.user.sub,
      sessionId: session?.id ?? null,
      actionTypeCode,
      entityType: 'card',
      entityId,
      payload,
      ipAddress,
      userAgent,
      status: 'success',
      errorMessage: null,
      durationMs: null,
    });
  }

  async listByCard(
    req: AuthenticatedRequest,
    cardId: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<PolicyResponse[]> {
    const card = await this.policiesRepository.findCardById(cardId);
    if (!card) {
      throw new AppError('Card no encontrada', 404);
    }

    const rows = await this.policiesRepository.findByCardId(cardId);
    const data = rows.map((p) => this.mapPolicy(p));

    await this.audit(req, 'CONFIG_POLICIES_LISTED', cardId, null, ipAddress, userAgent);

    return data;
  }

  async upsert(
    req: AuthenticatedRequest,
    cardId: string,
    dto: PutPolicyDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<PolicyResponse> {
    const card = await this.policiesRepository.findCardById(cardId);
    if (!card) {
      throw new AppError('Card no encontrada', 404);
    }

    const roleId = dto.roleId === undefined || dto.roleId === null ? null : dto.roleId;
    if (roleId !== null) {
      const role = await this.policiesRepository.findRoleById(roleId);
      if (!role) {
        throw new AppError('Rol no encontrado o inactivo', 404);
      }
    }

    const resetPolicy = await this.policiesRepository.findResetPolicyById(dto.resetPolicyId);
    if (!resetPolicy) {
      throw new AppError('Política de reinicio no encontrada', 404);
    }

    const existing = await this.policiesRepository.findByCardAndRole(cardId, roleId);
    let saved: CardInteractionPolicy;
    if (existing) {
      saved = await this.policiesRepository.updatePolicy(existing, dto.maxInteractions, dto.resetPolicyId);
    } else {
      saved = await this.policiesRepository.createPolicy(cardId, roleId, dto.maxInteractions, dto.resetPolicyId);
    }

    await this.audit(
      req,
      'CONFIG_POLICY_UPDATED',
      cardId,
      {
        policyId: saved.id,
        roleId,
        maxInteractions: dto.maxInteractions,
        resetPolicyId: dto.resetPolicyId,
      },
      ipAddress,
      userAgent,
    );

    const withRelations = await this.policiesRepository.findByCardAndRole(cardId, roleId);
    if (!withRelations) {
      throw new AppError('No se pudo cargar la política guardada', 500);
    }
    return this.mapPolicy(withRelations);
  }
}
