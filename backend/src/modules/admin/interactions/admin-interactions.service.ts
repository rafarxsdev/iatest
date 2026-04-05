import type { AuthenticatedRequest } from '@common/types/request.type';
import { AppError } from '@common/errors/app-error';
import { AuthRepository } from '@modules/auth/auth.repository';
import { AdminInteractionsRepository } from './admin-interactions.repository';
import type {
  InteractionLogEntry,
  UserInteractionDetail,
  UserWithInteractionSummary,
} from './admin-interactions.types';

export class AdminInteractionsService {
  constructor(
    private readonly adminInteractionsRepository: AdminInteractionsRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async getUsersWithInteractions(search?: string): Promise<UserWithInteractionSummary[]> {
    return this.adminInteractionsRepository.findUsersWithInteractions(search);
  }

  async getUserInteractions(userId: string): Promise<UserInteractionDetail[]> {
    return this.adminInteractionsRepository.findUserInteractions(userId);
  }

  async getInteractionHistory(userId: string, cardId: string): Promise<InteractionLogEntry[]> {
    return this.adminInteractionsRepository.findInteractionHistory(userId, cardId);
  }

  async resetSingle(
    req: AuthenticatedRequest,
    userId: string,
    cardId: string,
    reason: string | undefined,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<void> {
    const session = await this.authRepository.getActiveSession(req.user.jti);
    try {
      await this.adminInteractionsRepository.resetSingle(
        userId,
        cardId,
        req.user.sub,
        reason ?? null,
        ipAddress,
        userAgent,
        session?.id ?? null,
      );
    } catch (e) {
      if (e instanceof Error && e.message === 'UCI_NOT_FOUND') {
        throw new AppError('No hay registro de interacciones para este usuario y card', 404);
      }
      if (e instanceof Error && e.message === 'ACTION_TYPE_WIDGET_RESET_MISSING') {
        throw new AppError('Tipo de acción WIDGET_RESET no configurado en el sistema', 500);
      }
      throw e;
    }
  }

  async resetAll(
    req: AuthenticatedRequest,
    userId: string,
    reason: string | undefined,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<{ resetCount: number }> {
    const session = await this.authRepository.getActiveSession(req.user.jti);
    try {
      return await this.adminInteractionsRepository.resetAll(
        userId,
        req.user.sub,
        reason ?? null,
        ipAddress,
        userAgent,
        session?.id ?? null,
      );
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('ACTION_TYPE_')) {
        throw new AppError('Tipo de acción de auditoría no configurado en el sistema', 500);
      }
      throw e;
    }
  }
}
