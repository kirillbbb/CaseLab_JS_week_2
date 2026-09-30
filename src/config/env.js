import "dotenv/config";

function getNumberEnv(name, defaultValue) {
  const value = process.env[name];
  if (value === undefined || value === "") return defaultValue;
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
    corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
      .split(",").map((origin) => origin.trim()).filter(Boolean),
    rateLimitWindowMs: getNumberEnv("RATE_LIMIT_WINDOW_MS", 60000),
    rateLimitMax: getNumberEnv("RATE_LIMIT_MAX", 100),
    bodyLimit: process.env.BODY_LIMIT ?? "100kb",
    apiKey: process.env.API_KEY ?? "",
    logLevel: process.env.LOG_LEVEL ?? "info",
    db: {
      host: process.env.DB_HOST ?? "localhost",
      port: getNumberEnv("DB_PORT", 5432),
      database: process.env.DB_NAME ?? "caselab",
      username: process.env.DB_USER ?? "caselab",
      password: process.env.DB_PASSWORD ?? "caselab",
      pool: {
        max: getNumberEnv("DB_POOL_MAX", 10),
        min: getNumberEnv("DB_POOL_MIN", 0),
        acquire: getNumberEnv("DB_POOL_ACQUIRE", 30000),
        idle: getNumberEnv("DB_POOL_IDLE", 10000),
      },
    },
    weatherForecastBaseUrl:
      process.env.WEATHER_FORECAST_BASE_URL ?? "https://api.open-meteo.com/v1/forecast",
    weatherRequestTimeoutMs: getNumberEnv("WEATHER_REQUEST_TIMEOUT_MS", 5000),
    weatherForecastDays: getNumberEnv("WEATHER_FORECAST_DAYS", 3),
    weatherMaxPrecipitation: getNumberEnv("WEATHER_MAX_PRECIPITATION", 0),
    weatherMaxWindSpeed: getNumberEnv("WEATHER_MAX_WIND_SPEED", 30),
    temperatureUnit: process.env.TEMPERATURE_UNIT ?? "celsius",
  };
}