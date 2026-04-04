export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  data?: unknown;
}
