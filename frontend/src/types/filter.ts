export interface FilterType {
  code: string;
}

export interface Filter {
  id: string;
  label: string;
  value: string;
  filterType: FilterType;
  children: Filter[];
  sortOrder: number;
}

export interface WidgetTypeOption {
  id: string;
  code: string;
  label: string;
  defaultMaxInteractions: number | null;
}
