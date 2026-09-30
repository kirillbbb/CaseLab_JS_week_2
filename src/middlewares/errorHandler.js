import { AppError } from "../errors/AppError.js";
import { UniqueConstraintError, ForeignKeyConstraintError, ValidationError as SequelizeValidationError } from "sequelize";

export function errorHandler(error, req, res, next) {
  void next;
  const isPayloadTooLarge = error?.type === "entity.too.large";
  const isInvalidJson = error?.type === "entity.parse.failed";
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Internal server error";
  let details = [];

  if (isPayloadTooLarge) {
    statusCode = 413; code = "PAYLOAD_TOO_LARGE"; message = "Request body is too large";
  } else if (isInvalidJson) {
    statusCode = 400; code = "INVALID_JSON"; message = "Request body contains invalid JSON";
  } else if (error instanceof AppError) {
    statusCode = error.statusCode; code = error.code; message = error.message; details = error.details;
  } else if (error instanceof UniqueConstraintError) {
    statusCode = 409; code = "UNIQUE_CONSTRAINT_VIOLATION"; message = "A resource with the same unique value already exists";
    details = error.errors?.map((item) => ({ field: item.path, reason: "must be unique" })) ?? [];
  } else if (error instanceof ForeignKeyConstraintError) {
    statusCode = 404; code = "RELATED_RESOURCE_NOT_FOUND"; message = "A related resource was not found";
  } else if (error instanceof SequelizeValidationError) {
    statusCode = 422; code = "DATABASE_VALIDATION_ERROR"; message = "Database validation failed";
  }

  req.log?.error?.({ requestId: req.requestId, error }, "request failed");
  res.status(statusCode).json({ error: { code, message, details, requestId: req.requestId } });
}