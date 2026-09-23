import { ValidationError } from "../errors/ValidationError.js";

import {
  validateBody,
  validateStatus,
} from "../validators/request.validator.js";

export function validateCreate(req, _res, next) {
  const details = validateBody(req.body);

  if (details.length > 0) {
    throw new ValidationError("Invalid request body", details);
  }

  next();
}

export function validateUpdate(req, _res, next) {
  const details = validateBody(req.body, {
    partial: true,
  });

  if (details.length > 0) {
    throw new ValidationError("Invalid request body", details);
  }

  next();
}

export function validateStatusBody(req, _res, next) {
  const details = validateStatus(req.body?.status);

  if (details.length > 0) {
    throw new ValidationError("Invalid status", details);
  }

  next();
}
