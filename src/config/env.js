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

    corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),

    rateLimitWindowMs: getNumberEnv("RATE_LIMIT_WINDOW_MS", 60_000),
    rateLimitMax: getNumberEnv("RATE_LIMIT_MAX", 100),

    bodyLimit: process.env.BODY_LIMIT ?? "100kb",

    apiKey: process.env.API_KEY ?? "",

    logLevel: process.env.LOG_LEVEL ?? "info",

    weatherForecastBaseUrl:
      process.env.WEATHER_FORECAST_BASE_URL ??
      "https://api.open-meteo.com/v1/forecast",

    weatherRequestTimeoutMs: getNumberEnv("WEATHER_REQUEST_TIMEOUT_MS", 5000),

    weatherForecastDays: getNumberEnv("WEATHER_FORECAST_DAYS", 3),

    weatherMaxPrecipitation: getNumberEnv("WEATHER_MAX_PRECIPITATION", 0),

    weatherMaxWindSpeed: getNumberEnv("WEATHER_MAX_WIND_SPEED", 30),

    temperatureUnit: process.env.TEMPERATURE_UNIT ?? "celsius",
  };
}
