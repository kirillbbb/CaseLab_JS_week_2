import request from "supertest";
import { jest } from "@jest/globals";
import { createApp } from "../src/app.js";

function createTestLogger() {
  return {
    info: jest.fn(),
    error: jest.fn(),
  };
}

describe("Logging", () => {
  it("logs request method, path, status, duration and request id", async () => {
    const logger = createTestLogger();

    const app = createApp(
      {
        nodeEnv: "test",
        port: 3000,
        corsOrigin: "http://localhost:3000",
        rateLimitWindowMs: 60_000,
        rateLimitMax: 100,
        bodyLimit: "100kb",
        apiKey: "",
        logLevel: "silent",
      },
      {
        logger,
      },
    );

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);

    expect(logger.info).toHaveBeenCalledTimes(1);

    const [logData, message] = logger.info.mock.calls[0];

    expect(message).toBe("request completed");
    expect(logData).toEqual(
      expect.objectContaining({
        requestId: response.headers["x-request-id"],
        method: "GET",
        path: "/api/health",
        statusCode: 200,
        durationMs: expect.any(Number),
      }),
    );
  });

  it("uses provided request id", async () => {
    const logger = createTestLogger();

    const app = createApp(
      {
        nodeEnv: "test",
        port: 3000,
        corsOrigin: "http://localhost:3000",
        rateLimitWindowMs: 60_000,
        rateLimitMax: 100,
        bodyLimit: "100kb",
        apiKey: "",
        logLevel: "silent",
      },
      {
        logger,
      },
    );

    const requestId = "test-request-id";

    const response = await request(app)
      .get("/api/health")
      .set("X-Request-ID", requestId);

    expect(response.headers["x-request-id"]).toBe(requestId);

    const [logData] = logger.info.mock.calls[0];

    expect(logData.requestId).toBe(requestId);
  });

  it("returns request id in an error response", async () => {
    const logger = createTestLogger();

    const app = createApp(
      {
        nodeEnv: "test",
        port: 3000,
        corsOrigin: "http://localhost:3000",
        rateLimitWindowMs: 60_000,
        rateLimitMax: 100,
        bodyLimit: "100kb",
        apiKey: "",
        logLevel: "silent",
      },
      {
        logger,
      },
    );

    const requestId = "error-request-id";

    const response = await request(app)
      .get("/api/unknown")
      .set("X-Request-ID", requestId);

    expect(response.status).toBe(404);
    expect(response.body.error.requestId).toBe(requestId);
  });

  it("logs errors with request id", async () => {
    const logger = createTestLogger();

    const app = createApp(
      {
        nodeEnv: "test",
        port: 3000,
        corsOrigin: "http://localhost:3000",
        rateLimitWindowMs: 60_000,
        rateLimitMax: 100,
        bodyLimit: "100kb",
        apiKey: "",
        logLevel: "silent",
      },
      {
        logger,
      },
    );

    const requestId = "error-log-request-id";

    const response = await request(app)
      .get("/api/unknown")
      .set("X-Request-ID", requestId);

    expect(response.status).toBe(404);
    expect(logger.error).toHaveBeenCalledTimes(1);

    const [logData, message] = logger.error.mock.calls[0];

    expect(message).toBe("request failed");
    expect(logData.requestId).toBe(requestId);
  });
});
