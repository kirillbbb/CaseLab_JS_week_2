import { AppError } from "../errors/AppError.js";

const MUTATING_METHODS = new Set(["POST", "PATCH", "DELETE"]);

export function apiKeyMiddleware(apiKey) {
  return (req, _res, next) => {
    if (!apiKey || !MUTATING_METHODS.has(req.method)) {
      next();
      return;
    }

    if (req.get("X-API-Key") !== apiKey) {
      next(
        new AppError(
          401,
          "INVALID_API_KEY",
          "A valid X-API-Key header is required for mutating requests",
        ),
      );
      return;
    }

    next();
  };
}
