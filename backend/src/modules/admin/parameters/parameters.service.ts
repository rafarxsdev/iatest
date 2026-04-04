import type { AuthenticatedRequest } from '@common/types/request.type';
import { AppError } from '@common/errors/app-error';
import { AuthRepository } from '@modules/auth/auth.repository';
import type { Parameter } from '@database/entities/parameter.entity';
import { ParametersRepository } from './parameters.repository';
import type { PatchParameterDto } from './dto/patch-parameter.dto';

export interface ParameterResponse {
  id: string;
  key: string;
  value: string;
  dataType: string;
  description: string | null;
  isEditable: boolean;
  category: { code: string };
}

export class ParametersService {
  constructor(
    private readonly parametersRepository: ParametersRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  private map(p: Parameter): ParameterResponse {
    return {
      id: p.id,
      key: p.key,
      value: p.value,
      dataType: p.dataType,
      description: p.description,
      isEditable: p.isEditable,
      category: { code: p.category.code },
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
      entityType: 'parameter',
      entityId,
      payload,
      ipAddress,
      userAgent,
      status: 'success',
      errorMessage: null,
      durationMs: null,
    });
  }

  async list(
    req: AuthenticatedRequest,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<ParameterResponse[]> {
    const rows = await this.parametersRepository.findAllOrdered();
    const data = rows.map((p) => this.map(p));

    await this.audit(req, 'ADMIN_PARAMETERS_LISTED', null, null, ipAddress, userAgent);

    return data;
  }

  async patch(
    req: AuthenticatedRequest,
    id: string,
    dto: PatchParameterDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<ParameterResponse> {
    const param = await this.parametersRepository.findById(id);
    if (!param) {
      throw new AppError('Parámetro no encontrado', 404);
    }
    if (!param.isEditable) {
      throw new AppError('Este parámetro no es editable', 403);
    }

    const updated = await this.parametersRepository.updateValue(id, dto.value.trim(), req.user.sub);
    if (!updated) {
      throw new AppError('Parámetro no encontrado', 404);
    }

    await this.audit(
      req,
      'CONFIG_PARAMETER_UPDATED',
      id,
      { key: param.key, previousValue: param.value },
      ipAddress,
      userAgent,
    );

    return this.map(updated);
  }
}
