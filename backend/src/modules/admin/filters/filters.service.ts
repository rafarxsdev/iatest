import type { AuthenticatedRequest } from '@common/types/request.type';
import { AppError } from '@common/errors/app-error';
import { AuthRepository } from '@modules/auth/auth.repository';
import type { Filter } from '@database/entities/filter.entity';
import { AdminFiltersRepository } from './filters.repository';
import type { CreateFilterDto } from './dto/create-filter.dto';
import type { UpdateFilterDto } from './dto/update-filter.dto';

export interface AdminFilterTypeNested {
  id: string;
  code: string;
  description: string | null;
}

export interface AdminFilterParentNested {
  id: string;
  label: string;
}

export interface AdminFilterResponse {
  id: string;
  label: string;
  value: string;
  filterType: AdminFilterTypeNested;
  parent: AdminFilterParentNested | null;
  configuration: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  cardsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFilterDetailResponse extends AdminFilterResponse {
  children: Array<{ id: string; label: string; value: string; sortOrder: number }>;
}

function mapFilterBase(
  f: Filter,
  cardsCount: number,
): Omit<AdminFilterResponse, never> {
  return {
    id: f.id,
    label: f.label,
    value: f.value,
    filterType: {
      id: f.filterType.id,
      code: f.filterType.code,
      description: f.filterType.description,
    },
    parent: f.parent
      ? {
          id: f.parent.id,
          label: f.parent.label,
        }
      : null,
    configuration: f.configuration,
    sortOrder: f.sortOrder,
    isActive: f.isActive,
    cardsCount,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

export class AdminFiltersService {
  constructor(
    private readonly adminFiltersRepository: AdminFiltersRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  private async audit(
    req: AuthenticatedRequest,
    actionTypeCode: string,
    entityId: string | null,
    entityType: string | null,
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

  /** Si newParentId es ancestro de filterId (siguiendo parent hacia arriba), habría ciclo al asignar filterId.parent = newParentId */
  private async wouldCreateCycle(filterId: string, newParentId: string): Promise<boolean> {
    let current: string | null = newParentId;
    const seen = new Set<string>();
    while (current !== null) {
      if (current === filterId) {
        return true;
      }
      if (seen.has(current)) {
        break;
      }
      seen.add(current);
      const row = await this.adminFiltersRepository.findByIdWithParentOnly(current);
      current = row?.parent?.id ?? null;
    }
    return false;
  }

  private mapToListItem(f: Filter & { cardsCount?: number }): AdminFilterResponse {
    return mapFilterBase(f, f.cardsCount ?? 0);
  }

  private mapToDetail(f: Filter, cardsCount: number): AdminFilterDetailResponse {
    const children = (f.children ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({
        id: c.id,
        label: c.label,
        value: c.value,
        sortOrder: c.sortOrder,
      }));
    return {
      ...mapFilterBase(f, cardsCount),
      children,
    };
  }

  async getAllFilters(
    page: number,
    limit: number,
    search: string | undefined,
  ): Promise<{ data: AdminFilterResponse[]; meta: { total: number; page: number; limit: number } }> {
    const { filters, total } = await this.adminFiltersRepository.findAllPaginated(page, limit, search);
    const data = filters.map((f) => this.mapToListItem(f));
    return { data, meta: { total, page, limit } };
  }

  async getFilterById(id: string): Promise<AdminFilterDetailResponse> {
    const filter = await this.adminFiltersRepository.findById(id);
    if (!filter) {
      throw new AppError('Filtro no encontrado', 404);
    }
    const cardsCount = await this.adminFiltersRepository.countActiveCardsForFilter(id);
    return this.mapToDetail(filter, cardsCount);
  }

  async createFilter(
    req: AuthenticatedRequest,
    dto: CreateFilterDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<AdminFilterDetailResponse> {
    const type = await this.adminFiltersRepository.findFilterTypeById(dto.filterTypeId);
    if (!type) {
      throw new AppError('Tipo de filtro no encontrado', 404);
    }
    if (await this.adminFiltersRepository.valueExists(dto.value)) {
      throw new AppError('Ya existe un filtro con ese value', 409);
    }
    if (dto.parentFilterId !== undefined) {
      const parent = await this.adminFiltersRepository.findByIdWithParentOnly(dto.parentFilterId);
      if (!parent) {
        throw new AppError('Filtro padre no encontrado', 404);
      }
    }

    const created = await this.adminFiltersRepository.create(dto);
    const full = await this.adminFiltersRepository.findById(created.id);
    if (!full) {
      throw new AppError('Filtro no encontrado tras crear', 500);
    }

    await this.audit(req, 'ADMIN_FILTER_CREATED', full.id, 'filter', { value: full.value, label: full.label }, ipAddress, userAgent);

    const cardsCount = await this.adminFiltersRepository.countActiveCardsForFilter(full.id);
    return this.mapToDetail(full, cardsCount);
  }

  async updateFilter(
    req: AuthenticatedRequest,
    id: string,
    dto: UpdateFilterDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<AdminFilterDetailResponse> {
    const existing = await this.adminFiltersRepository.findById(id);
    if (!existing) {
      throw new AppError('Filtro no encontrado', 404);
    }

    if (dto.filterTypeId !== undefined) {
      const type = await this.adminFiltersRepository.findFilterTypeById(dto.filterTypeId);
      if (!type) {
        throw new AppError('Tipo de filtro no encontrado', 404);
      }
    }

    if (dto.value !== undefined && dto.value !== existing.value) {
      if (await this.adminFiltersRepository.valueExists(dto.value, id)) {
        throw new AppError('Ya existe un filtro con ese value', 409);
      }
    }

    if (dto.parentFilterId !== undefined) {
      if (dto.parentFilterId === null) {
        // ok
      } else {
        if (dto.parentFilterId === id) {
          throw new AppError('El filtro no puede ser padre de sí mismo', 400);
        }
        const parent = await this.adminFiltersRepository.findByIdWithParentOnly(dto.parentFilterId);
        if (!parent) {
          throw new AppError('Filtro padre no encontrado', 404);
        }
        if (await this.wouldCreateCycle(id, dto.parentFilterId)) {
          throw new AppError('No se puede asignar ese padre: se produciría una referencia circular', 400);
        }
      }
    }

    const updated = await this.adminFiltersRepository.update(id, dto);
    if (!updated) {
      throw new AppError('Filtro no encontrado', 404);
    }

    const full = await this.adminFiltersRepository.findById(id);
    if (!full) {
      throw new AppError('Filtro no encontrado', 404);
    }

    await this.audit(
      req,
      'CONFIG_PARAMETER_UPDATED',
      id,
      'filter',
      {
        changes: dto,
      },
      ipAddress,
      userAgent,
    );

    const cardsCount = await this.adminFiltersRepository.countActiveCardsForFilter(id);
    return this.mapToDetail(full, cardsCount);
  }

  async deactivateFilter(
    req: AuthenticatedRequest,
    id: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<AdminFilterResponse> {
    const existing = await this.adminFiltersRepository.findById(id);
    if (!existing) {
      throw new AppError('Filtro no encontrado', 404);
    }

    const result = await this.adminFiltersRepository.softDelete(id);
    if (!result.ok) {
      if (result.reason === 'not_found') {
        throw new AppError('Filtro no encontrado', 404);
      }
      throw new AppError(
        `No se puede eliminar: el filtro tiene ${String(result.activeCards ?? 0)} cards activas asociadas`,
        409,
      );
    }

    const after = await this.adminFiltersRepository.findById(id);
    if (!after) {
      throw new AppError('Filtro no encontrado', 404);
    }

    await this.audit(req, 'ADMIN_FILTER_DEACTIVATED', id, 'filter', { label: existing.label }, ipAddress, userAgent);

    return mapFilterBase(after, 0);
  }

  async restoreFilter(
    req: AuthenticatedRequest,
    id: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<AdminFilterResponse> {
    const existing = await this.adminFiltersRepository.findById(id);
    if (!existing) {
      throw new AppError('Filtro no encontrado', 404);
    }

    const restored = await this.adminFiltersRepository.restore(id);
    if (!restored) {
      throw new AppError('Filtro no encontrado', 404);
    }

    await this.audit(req, 'ADMIN_FILTER_RESTORED', id, 'filter', { label: restored.label }, ipAddress, userAgent);

    const count = await this.adminFiltersRepository.countActiveCardsForFilter(id);
    return mapFilterBase(restored, count);
  }
}
