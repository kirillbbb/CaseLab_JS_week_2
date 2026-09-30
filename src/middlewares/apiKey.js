import { AppError } from "../errors/AppError.js";
const MUTATING_METHODS = new Set(["POST", "PATCH", "DELETE"]);
export function apiKeyMiddleware(apiKey) {
  return (req, _res, next) => {
    if (!apiKey || !MUTATING_METHODS.has(req.method)) return next();
    if (req.get("X-API-Key") !== apiKey) return next(new AppError(401, "INVALID_API_KEY", "A valid X-API-Key header is required for mutating requests"));
    next();
  };
}