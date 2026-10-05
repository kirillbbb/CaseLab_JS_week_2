import { AppError } from "../errors/AppError.js";
import { verifyAccessToken } from "../services/auth.service.js";

export function requireAuth() {
  return (req, _res, next) => {
    if (req.app.get("authDisabledForTests") && process.env.NODE_ENV === "test") return next();
    const header = req.get("Authorization");
    if (!header?.startsWith("Bearer ")) return next(new AppError(401, "AUTH_REQUIRED", "Authentication required"));
    try { req.user = verifyAccessToken(header.slice(7), req.app.get("config")); next(); }
    catch { next(new AppError(401, "INVALID_ACCESS_TOKEN", "Invalid or expired access token")); }
  };
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (req.app.get("authDisabledForTests") && process.env.NODE_ENV === "test") return next();
    if (!req.user) return next(new AppError(401, "AUTH_REQUIRED", "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new AppError(403, "FORBIDDEN", "You do not have permission to perform this action"));
    next();
  };
}
