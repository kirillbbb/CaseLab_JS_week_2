import "dotenv/config";

function getNumberEnv(name, defaultValue) {
  const value = process.env[name];

  if (value === undefined || value === "") {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsed;
}

export function loadConfig() {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: getNumberEnv("PORT", 3000),
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    rateLimitWindowMs: getNumberEnv("RATE_LIMIT_WINDOW_MS", 60_000),
    rateLimitMax: getNumberEnv("RATE_LIMIT_MAX", 100),
    bodyLimit: process.env.BODY_LIMIT ?? "100kb",
    apiKey: process.env.API_KEY ?? "",
    logLevel: process.env.LOG_LEVEL ?? "info",
  };
}
