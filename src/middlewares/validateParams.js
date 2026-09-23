import { ValidationError } from "../errors/ValidationError.js";

export function validateParams(...fields) {
  return (req, _res, next) => {
    const details = [];

    for (const field of fields) {
      const value = req.params[field];

      if (typeof value !== "string" || value.trim() === "") {
        details.push({
          field,
          reason: "must be a non-empty string",
        });
      }
    }

    if (details.length > 0) {
      throw new ValidationError("Invalid path parameters", details);
    }

    next();
  };
}
