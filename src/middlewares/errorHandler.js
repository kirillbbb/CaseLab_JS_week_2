import { AppError } from "../errors/AppError.js";

export function errorHandler(error, req, res, next) {
  void next;

  const isPayloadTooLarge = error?.type === "entity.too.large";
  const isAppError = error instanceof AppError;

  const statusCode = isPayloadTooLarge
    ? 413
    : isAppError
      ? error.statusCode
      : 500;

  const code = isPayloadTooLarge
    ? "PAYLOAD_TOO_LARGE"
    : isAppError
      ? error.code
      : "INTERNAL_SERVER_ERROR";

  const message = isPayloadTooLarge
    ? "Request body is too large"
    : isAppError
      ? error.message
      : "Internal server error";

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
