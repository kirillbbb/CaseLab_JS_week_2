import { ValidationError } from "../errors/ValidationError.js";

import { validateRequestQuery } from "../validators/request.query.validator.js";

export function validateRequestQueryMiddleware(req, _res, next) {
  const details = validateRequestQuery(req.query);

  if (details.length > 0) {
    return next(new ValidationError("Invalid query parameters", details));
  }

  next();
}
