import type { RequestHandler } from 'express';

/**
 * Envuelve handlers async para que los rechazos de Promise lleguen al error middleware.
 */
export function asyncHandler(
  fn: (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2]) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}
