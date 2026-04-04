import bcrypt from 'bcrypt';
import { AppError } from '@common/errors/app-error';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { getEnvConfig } from '@config/env.config';
import { AuthRepository } from '@modules/auth/auth.repository';
import { ParameterService } from '@modules/config';
import { UsersRepository } from './users.repository';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

export interface AdminUserResponse {
  id: string;
  email: string;
  fullName: string;
  role: { id: string; name: string };
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authRepository: AuthRepository,
    private readonly parameterService: ParameterService,
  ) {}

  private async audit(
    req: AuthenticatedRequest,
    actionTypeCode: string,
    entityType: string | null,
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
      entityType,
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
    page: number,
    limit: number,
    search: string | undefined,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<{ data: AdminUserResponse[]; meta: { total: number; page: number; limit: number } }> {
    const { users, total } = await this.usersRepository.findPaginated(page, limit, search);
    const data: AdminUserResponse[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: { id: u.role.id, name: u.role.name },
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
    }));

    await this.audit(req, 'ADMIN_USERS_LISTED', 'user', null, { page, limit, search: search ?? null }, ipAddress, userAgent);

    return { data, meta: { total, page, limit } };
  }

  async create(
    req: AuthenticatedRequest,
    dto: CreateUserDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<AdminUserResponse> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersRepository.findByEmailActive(email);
    if (existing) {
      throw new AppError('Ya existe un usuario con ese email', 409);
    }

    const role = await this.usersRepository.findRoleById(dto.roleId);
    if (!role) {
      throw new AppError('Rol no encontrado o inactivo', 404);
    }

    const minLenRaw = await this.parameterService.resolve('password_min_length', req.user.sub);
    const minLen = Number.parseInt(minLenRaw, 10);
    if (!Number.isNaN(minLen) && minLen > 0 && dto.password.length < minLen) {
      throw new AppError(`La contraseña debe tener al menos ${minLen} caracteres`, 400);
    }

    const env = getEnvConfig();
    const passwordHash = await bcrypt.hash(dto.password, env.bcryptRounds);

    const user = await this.usersRepository.createWithSecurity({
      email,
      passwordHash,
      fullName: dto.fullName.trim(),
      roleId: dto.roleId,
    });

    await this.audit(
      req,
      'ADMIN_USER_CREATED',
      'user',
      user.id,
      { email: user.email, roleId: dto.roleId },
      ipAddress,
      userAgent,
    );

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: { id: user.role.id, name: user.role.name },
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async update(
    req: AuthenticatedRequest,
    id: string,
    dto: UpdateUserDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<AdminUserResponse> {
    if (dto.fullName === undefined && dto.roleId === undefined && dto.isActive === undefined) {
      throw new AppError('Debes enviar al menos un campo a actualizar', 400);
    }

    if (dto.roleId !== undefined) {
      const role = await this.usersRepository.findRoleById(dto.roleId);
      if (!role) {
        throw new AppError('Rol no encontrado o inactivo', 404);
      }
    }

    const updated = await this.usersRepository.update(id, {
      fullName: dto.fullName?.trim(),
      roleId: dto.roleId,
      isActive: dto.isActive,
    });
    if (!updated) {
      throw new AppError('Usuario no encontrado', 404);
    }

    await this.audit(
      req,
      'ADMIN_USER_UPDATED',
      'user',
      id,
      {
        fullName: dto.fullName,
        roleId: dto.roleId,
        isActive: dto.isActive,
      },
      ipAddress,
      userAgent,
    );

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: { id: updated.role.id, name: updated.role.name },
      isActive: updated.isActive,
      lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async remove(req: AuthenticatedRequest, id: string, ipAddress: string | null, userAgent: string | null): Promise<void> {
    const user = await this.usersRepository.findByIdActive(id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const ok = await this.usersRepository.softDelete(id);
    if (!ok) {
      throw new AppError('Usuario no encontrado', 404);
    }

    await this.audit(req, 'ADMIN_USER_DEACTIVATED', 'user', id, { email: user.email }, ipAddress, userAgent);
  }
}
