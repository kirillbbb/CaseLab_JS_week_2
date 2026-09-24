import { AppError } from "../errors/AppError.js";

export function errorHandler(error, req, res, next) {
  void next;

  const isAppError = error instanceof AppError;

  const statusCode = isAppError ? error.statusCode : 500;
  const code = isAppError ? error.code : "INTERNAL_SERVER_ERROR";
  const message = isAppError ? error.message : "Internal server error";
  const details = isAppError ? error.details : [];

  req.log?.error?.(
    {
      requestId: req.requestId,
      error,
    },
    "request failed",
  );

  res.status(statusCode).json({
    error: {
      code,
      message,
      details,
      requestId: req.requestId,
    },
  });
}
