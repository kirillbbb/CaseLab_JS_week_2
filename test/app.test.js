import request from "supertest";
import { createApp } from "../src/app.js";
import { issueAccessToken } from "../src/services/auth.service.js";

const config = {
  port: 3000,
  corsOrigins: ["http://localhost:3000"],
  rateLimitWindowMs: 60000,
  rateLimitMax: 100,
  bodyLimit: "100kb",
  apiKey: "",
  logLevel: "silent",
  weatherForecastBaseUrl: "https://example.test",
  weatherRequestTimeoutMs: 1000,
  weatherForecastDays: 3,
  weatherMaxPrecipitation: 0,
  weatherMaxWindSpeed: 30,
  temperatureUnit: "celsius",
  nodeEnv: "test",
  jwtSecret: "test-secret-please-change",
  db: { host: "localhost", port: 5432, database: "caselab", username: "caselab", password: "caselab", pool: { max: 2, min: 0, acquire: 1000, idle: 100 } },
};

describe("API bootstrap", () => {
  const app = createApp(config, {
    logger: { info() {}, error() {} },
    weatherController: { getEquipmentWeather(_req, res) { res.status(200).json({ data: {} }); } },
  });

  test("GET /api/health returns 200", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  test("unknown route returns standard 404 error", async () => {
    const response = await request(app).get("/api/unknown");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  test("report limit is bounded", async () => {
    const token = issueAccessToken({ id: "test-user", email: "test@example.com", role: "viewer" }, config);
    const response = await request(app)
      .get("/api/reports/equipment-load?limit=1000")
      .set("Authorization", "Bearer " + token);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("BAD_REQUEST");
  });
});
