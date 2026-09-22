import { AppError } from "../errors/AppError.js";

import { validateRequestQuery } from "../validators/request.query.validator.js";

export function validateRequestQueryMiddleware(req, _res, next) {
  const details = validateRequestQuery(req.query);

  if (details.length > 0) {
    return next(
      new AppError(
        422,
        "VALIDATION_ERROR",
        "Invalid query parameters",
        details,
      ),
    );
  }

  next();
}
