import request from "supertest";

import { createApp } from "../src/app.js";

function createTestApp(overrides = {}) {
  return createApp({
    nodeEnv: "test",
    port: 3000,
    corsOrigins: ["http://allowed.example"],
    rateLimitWindowMs: 60_000,
    rateLimitMax: 100,
    bodyLimit: "100kb",
    apiKey: "",
    logLevel: "silent",
    ...overrides,
  });
}

describe("Security", () => {
  describe("Helmet", () => {
    it("adds security headers", async () => {
      const app = createTestApp();

      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    });
  });

  describe("CORS", () => {
    it("allows configured origin", async () => {
      const app = createTestApp({
        corsOrigins: ["http://allowed.example"],
      });

      const response = await request(app)
        .get("/api/health")
        .set("Origin", "http://allowed.example");

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://allowed.example",
      );
    });

    it("does not allow an unknown origin", async () => {
      const app = createTestApp({
        corsOrigins: ["http://allowed.example"],
      });

      const response = await request(app)
        .get("/api/health")
        .set("Origin", "http://evil.example");

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("allows an origin from the configured allowlist", async () => {
      const app = createTestApp({
        corsOrigins: [
          "http://allowed.example",
          "http://another-allowed.example",
        ],
      });

      const response = await request(app)
        .get("/api/health")
        .set("Origin", "http://another-allowed.example");

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://another-allowed.example",
      );
    });
  });

  describe("Rate limit", () => {
    it("returns 429 after the configured limit", async () => {
      const app = createTestApp({
        rateLimitWindowMs: 60_000,
        rateLimitMax: 2,
      });

      const firstResponse = await request(app).get("/api/health");
      const secondResponse = await request(app).get("/api/health");
      const thirdResponse = await request(app).get("/api/health");

      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      expect(thirdResponse.status).toBe(429);
    });

    it("returns rate limit headers", async () => {
      const app = createTestApp({
        rateLimitWindowMs: 60_000,
        rateLimitMax: 2,
      });

      const response = await request(app).get("/api/health");

      expect(response.headers["ratelimit"]).toBeDefined();
    });
  });

  describe("Body limit", () => {
    it("returns 413 when request body exceeds the configured limit", async () => {
      const app = createTestApp({
        bodyLimit: "100b",
      });

      const largePayload = {
        name: "a".repeat(500),
      };

      const response = await request(app)
        .post("/api/requests")
        .send(largePayload);

      expect(response.status).toBe(413);
    });
  });

  it("returns 400 for invalid JSON", async () => {
    const app = createTestApp();

    const response = await request(app)
      .post("/api/requests")
      .set("Content-Type", "application/json")
      .send('{"invalid":');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_JSON");
    expect(response.body.error.message).toBe(
      "Request body contains invalid JSON",
    );
    expect(response.body.error.requestId).toEqual(expect.any(String));
  });
});
