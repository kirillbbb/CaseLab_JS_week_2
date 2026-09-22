import { AppError } from '../errors/AppError.js';

export function notFoundHandler(req, _res, next) {
  next(
    new AppError(
      404,
      'NOT_FOUND',
      `Route ${req.method} ${req.originalUrl} not found`,
    ),
  );
}