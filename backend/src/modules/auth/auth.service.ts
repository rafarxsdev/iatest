import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '@common/errors/app-error';
import type { EnvConfig } from '@config/env.config';
import type { User } from '@database/entities/user.entity';
import { ParameterService } from '../config';
import { AuthRepository } from './auth.repository';
import type { LoginDto } from './dto/login.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';

export interface LoginSuccessUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
}

/** Respuesta de GET /api/auth/me y PATCH /api/auth/profile (sin password_hash). */
export interface MeUser {
  id: string;
  email: string;
  fullName: string;
  role: { id: string; name: string };
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginResult {
  user: LoginSuccessUser;
  token: string;
}

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly parameterService: ParameterService,
    private readonly env: EnvConfig,
  ) {}

  async login(dto: LoginDto, ipAddress: string | null, userAgent: string | null): Promise<LoginResult> {
    const emailNormalized = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(emailNormalized);

    if (!user) {
      await this.logFailedLoginUnknownEmail(dto.email.trim(), ipAddress, userAgent);
      throw new AppError('Credenciales incorrectas', 401);
    }

    if (!user.isActive) {
      throw new AppError('Cuenta desactivada', 403);
    }

    const security = user.userSecurityStatus;
    if (!security) {
      throw new AppError('Estado de seguridad no disponible', 500);
    }

    const blockedUntil = security.loginBlockedUntil;
    if (blockedUntil !== null && blockedUntil > new Date()) {
      const minutesLeft = Math.max(1, Math.ceil((blockedUntil.getTime() - Date.now()) / 60_000));
      throw new AppError(
        `Cuenta bloqueada. Intenta de nuevo en ${minutesLeft} minutos.`,
        403,
        true,
        { blockedUntil: blockedUntil.toISOString() },
      );
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordOk) {
      await this.handleFailedPassword(user, dto.email.trim(), ipAddress, userAgent);
      throw new AppError('Credenciales incorrectas', 401);
    }

    await this.authRepository.resetFailedAttempts(user.id);

    const jti = uuidv4();
    const token = jwt.sign({ sub: user.id, role: user.role.id, jti }, this.env.jwtSecret, {
      expiresIn: this.env.jwtExpiresIn,
    } as SignOptions);

    const decoded = jwt.decode(token);
    const expSec =
      typeof decoded === 'object' && decoded !== null && 'exp' in decoded
        ? (decoded as { exp: number }).exp
        : undefined;
    if (expSec === undefined) {
      throw new AppError('No se pudo determinar la expiración del token', 500);
    }
    const expiresAt = new Date(expSec * 1000);

    const session = await this.authRepository.createSession({
      userId: user.id,
      tokenJti: jti,
      ipAddress,
      userAgent,
      expiresAt,
    });

    await this.authRepository.createAuthLog({
      userId: user.id,
      actionTypeCode: 'AUTH_LOGIN',
      sessionId: session.id,
      emailAttempt: user.email,
      ipAddress,
      userAgent,
      failedAttemptsAtMoment: 0,
      loginBlockedUntil: null,
    });

    await this.authRepository.createAuditLog({
      userId: user.id,
      sessionId: session.id,
      actionTypeCode: 'AUTH_LOGIN',
      entityType: 'auth',
      entityId: user.id,
      payload: null,
      ipAddress,
      userAgent,
      status: 'success',
      errorMessage: null,
      durationMs: null,
    });

    return {
      user: this.mapLoginUser(user),
      token,
    };
  }

  private mapLoginUser(user: User): LoginSuccessUser {
    const permissions =
      user.role.rolePermissions?.map((rp) => rp.permission.code).filter((c): c is string => typeof c === 'string') ?? [];
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      permissions,
    };
  }

  private async logFailedLoginUnknownEmail(
    emailAttempt: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<void> {
    await this.authRepository.createAuthLog({
      userId: null,
      actionTypeCode: 'AUTH_LOGIN_FAILED',
      sessionId: null,
      emailAttempt,
      ipAddress,
      userAgent,
      failedAttemptsAtMoment: 0,
      loginBlockedUntil: null,
    });

    await this.authRepository.createAuditLog({
      userId: null,
      sessionId: null,
      actionTypeCode: 'AUTH_LOGIN_FAILED',
      entityType: 'auth',
      entityId: null,
      payload: { email: emailAttempt },
      ipAddress,
      userAgent,
      status: 'failed',
      errorMessage: 'Usuario no encontrado',
      durationMs: null,
    });
  }

  private async handleFailedPassword(
    user: User,
    emailAttempt: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<void> {
    const uss = await this.authRepository.incrementFailedAttempts(user.id);

    const maxAttemptsRaw = await this.parameterService.resolve('max_failed_login_attempts', user.id);
    const maxAttempts = Number.parseInt(maxAttemptsRaw, 10);
    if (Number.isNaN(maxAttempts) || maxAttempts < 1) {
      throw new AppError('Parámetro max_failed_login_attempts inválido', 500);
    }

    if (uss.failedLoginAttempts >= maxAttempts) {
      const minutesRaw = await this.parameterService.resolve('login_block_duration_minutes', user.id);
      const blockMinutes = Number.parseInt(minutesRaw, 10);
      if (Number.isNaN(blockMinutes) || blockMinutes < 1) {
        throw new AppError('Parámetro login_block_duration_minutes inválido', 500);
      }
      const until = new Date(Date.now() + blockMinutes * 60_000);
      await this.authRepository.setBlockedUntil(user.id, until);

      await this.authRepository.createAuthLog({
        userId: user.id,
        actionTypeCode: 'AUTH_ACCOUNT_BLOCKED',
        sessionId: null,
        emailAttempt,
        ipAddress,
        userAgent,
        failedAttemptsAtMoment: uss.failedLoginAttempts,
        loginBlockedUntil: until,
      });

      await this.authRepository.createAuditLog({
        userId: user.id,
        sessionId: null,
        actionTypeCode: 'AUTH_ACCOUNT_BLOCKED',
        entityType: 'user',
        entityId: user.id,
        payload: { failedAttempts: uss.failedLoginAttempts, blockedUntil: until.toISOString() },
        ipAddress,
        userAgent,
        status: 'blocked',
        errorMessage: 'Límite de intentos fallidos',
        durationMs: null,
      });
    } else {
      await this.authRepository.createAuthLog({
        userId: user.id,
        actionTypeCode: 'AUTH_LOGIN_FAILED',
        sessionId: null,
        emailAttempt,
        ipAddress,
        userAgent,
        failedAttemptsAtMoment: uss.failedLoginAttempts,
        loginBlockedUntil: null,
      });

      await this.authRepository.createAuditLog({
        userId: user.id,
        sessionId: null,
        actionTypeCode: 'AUTH_LOGIN_FAILED',
        entityType: 'auth',
        entityId: user.id,
        payload: { failedAttempts: uss.failedLoginAttempts },
        ipAddress,
        userAgent,
        status: 'failed',
        errorMessage: 'Contraseña incorrecta',
        durationMs: null,
      });
    }
  }

  private mapMeUser(user: User): MeUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: { id: user.role.id, name: user.role.name },
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async getMe(userId: string): Promise<MeUser> {
    const user = await this.authRepository.findActiveUserById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return this.mapMeUser(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    jti: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<MeUser> {
    const hasName = dto.fullName !== undefined && dto.fullName.trim().length > 0;
    const hasPasswordChange = dto.newPassword !== undefined && dto.newPassword.length > 0;

    if (!hasName && !hasPasswordChange) {
      throw new AppError('Debes enviar nombre o cambio de contraseña', 400);
    }

    if (hasPasswordChange) {
      if (!dto.currentPassword || dto.currentPassword.length === 0) {
        throw new AppError('Si indicas nueva contraseña, debes enviar la contraseña actual', 400);
      }
    }

    const user = await this.authRepository.findActiveUserForProfile(userId);
    if (!user || !user.userSecurityStatus) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (hasPasswordChange) {
      const ok = await bcrypt.compare(dto.currentPassword!, user.passwordHash);
      if (!ok) {
        throw new AppError('Contraseña actual incorrecta', 400);
      }
      const passwordHash = await bcrypt.hash(dto.newPassword!, this.env.bcryptRounds);
      await this.authRepository.updateUserPasswordAndChangedAt(userId, passwordHash);
    }

    if (hasName) {
      await this.authRepository.updateUserFullName(userId, dto.fullName!.trim());
    }

    const updated = await this.authRepository.findActiveUserForProfile(userId);
    if (!updated) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const session = await this.authRepository.getActiveSession(jti);
    await this.authRepository.createAuditLog({
      userId,
      sessionId: session?.id ?? null,
      actionTypeCode: 'AUTH_PROFILE_UPDATED',
      entityType: 'user',
      entityId: userId,
      payload: {
        changedPassword: hasPasswordChange,
        changedName: hasName,
      },
      ipAddress,
      userAgent,
      status: 'success',
      errorMessage: null,
      durationMs: null,
    });

    return this.mapMeUser(updated);
  }

  async logout(jti: string, userId: string, ipAddress: string | null, userAgent: string | null): Promise<void> {
    const session = await this.authRepository.findSessionByJti(jti);
    if (!session || session.user.id !== userId) {
      throw new AppError('Sesión inválida', 401);
    }

    await this.authRepository.revokeSession(jti);

    await this.authRepository.createAuditLog({
      userId,
      sessionId: session.id,
      actionTypeCode: 'AUTH_LOGOUT',
      entityType: 'session',
      entityId: session.id,
      payload: null,
      ipAddress,
      userAgent,
      status: 'success',
      errorMessage: null,
      durationMs: null,
    });
  }
}
