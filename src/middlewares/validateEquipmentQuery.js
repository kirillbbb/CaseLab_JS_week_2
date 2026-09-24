import { AppError } from "../errors/AppError.js";

const allowedSortFields = new Set([
  "name",
  "type",
  "status",
  "location",
  "createdAt",
  "updatedAt",
]);

export function validateEquipmentQuery(req, _res, next) {
  const { page, limit, sortBy, sortOrder } = req.query;
  const details = [];

  if (page !== undefined) {
    const parsedPage = Number(page);

    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      details.push({
        field: "page",
        reason: "must be a positive integer",
      });
    }
  }

  if (limit !== undefined) {
    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      details.push({
        field: "limit",
        reason: "must be an integer between 1 and 100",
      });
    }
  }

  if (sortBy !== undefined && !allowedSortFields.has(sortBy)) {
    details.push({
      field: "sortBy",
      reason: `must be one of: ${[...allowedSortFields].join(", ")}`,
    });
  }

  if (sortOrder !== undefined && sortOrder !== "asc" && sortOrder !== "desc") {
    details.push({
      field: "sortOrder",
      reason: "must be either asc or desc",
    });
  }

  if (details.length > 0) {
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Invalid query parameters",
      details,
    );
  }

  next();
}
