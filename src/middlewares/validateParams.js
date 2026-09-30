import { ValidationError } from "../errors/ValidationError.js";
export function validateParams(...fields) {
  return (req, _res, next) => {
    const details = fields.filter((field) => !req.params[field]?.trim()).map((field) => ({ field, reason: "must be a non-empty string" }));
    if (details.length) throw new ValidationError("Invalid path parameters", details);
    next();
  };
}