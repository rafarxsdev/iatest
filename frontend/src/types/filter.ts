export interface FilterType {
  id: string;
  code: string;
  description: string;
}

export interface Filter {
  id: string;
  label: string;
  value: string;
  filterType: { code: string };
  children: Filter[];
  sortOrder: number;
}

export interface AdminFilter {
  id: string;
  label: string;
  value: string;
  filterType: FilterType;
  parent: { id: string; label: string } | null;
  configuration: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  cardsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FilterFormData {
  label: string;
  value: string;
  filterTypeId: string;
  parentFilterId: string | null;
  configuration: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

export interface WidgetTypeOption {
  id: string;
  code: string;
  label: string;
  defaultMaxInteractions: number | null;
}
