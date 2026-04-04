import type { AuthenticatedRequest } from '@common/types/request.type';
import { AuthRepository } from '@modules/auth/auth.repository';
import type { Filter } from '@database/entities/filter.entity';
import { FiltersRepository } from './filters.repository';

export interface FilterTreeNode {
  id: string;
  label: string;
  value: string;
  filterType: { code: string };
  sortOrder: number;
  children: FilterTreeNode[];
}

export class FiltersService {
  constructor(
    private readonly filtersRepository: FiltersRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async getFilters(req: AuthenticatedRequest, ipAddress: string | null, userAgent: string | null): Promise<FilterTreeNode[]> {
    const flat = await this.filtersRepository.findAllActive();
    const tree = this.buildTree(flat);

    const session = await this.authRepository.getActiveSession(req.user.jti);

    await this.authRepository.createAuditLog({
      userId: req.user.sub,
      sessionId: session?.id ?? null,
      actionTypeCode: 'FILTER_APPLIED',
      entityType: 'filter',
      entityId: null,
      payload: { rootCount: tree.length },
      ipAddress,
      userAgent,
      status: 'success',
      errorMessage: null,
      durationMs: null,
    });

    return tree;
  }

  private buildTree(filters: Filter[]): FilterTreeNode[] {
    const byId = new Map<string, FilterTreeNode>();

    for (const f of filters) {
      byId.set(f.id, {
        id: f.id,
        label: f.label,
        value: f.value,
        filterType: { code: f.filterType.code },
        sortOrder: f.sortOrder,
        children: [],
      });
    }

    const roots: FilterTreeNode[] = [];

    for (const f of filters) {
      const node = byId.get(f.id);
      if (!node) {
        continue;
      }
      const parentId = f.parent?.id ?? null;
      if (parentId === null) {
        roots.push(node);
        continue;
      }
      const parentNode = byId.get(parentId);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }

    this.sortTreeRecursive(roots);
    return roots;
  }

  private sortTreeRecursive(nodes: FilterTreeNode[]): void {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const n of nodes) {
      this.sortTreeRecursive(n.children);
    }
  }
}
