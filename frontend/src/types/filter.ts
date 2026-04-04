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
