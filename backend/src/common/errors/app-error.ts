export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly data?: unknown;

  constructor(message: string, statusCode = 400, isOperational = true, data?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.data = data;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
