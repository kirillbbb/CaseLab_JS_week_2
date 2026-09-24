import { ValidationError } from "../errors/ValidationError.js";
import { validateEquipmentBody } from "../validators/equipment.validator.js";

export function validateCreateEquipmentBody(req, _res, next) {
  const details = validateEquipmentBody(req.body);

  if (details.length > 0) {
    throw new ValidationError("Invalid request body", details);
  }

  next();
}

export function validateUpdateEquipmentBody(req, _res, next) {
  const details = validateEquipmentBody(req.body, {
    partial: true,
  });

  if (details.length > 0) {
    throw new ValidationError("Invalid request body", details);
  }

  next();
}
