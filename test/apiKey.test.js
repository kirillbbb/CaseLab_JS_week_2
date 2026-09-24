import request from "supertest";

import { createApp } from "../src/app.js";

function createTestApp() {
  return createApp({
    nodeEnv: "test",
    port: 3000,
    corsOrigins: ["http://allowed.example"],
    rateLimitWindowMs: 60_000,
    rateLimitMax: 100,
    bodyLimit: "100kb",
    apiKey: "test-secret",
    logLevel: "silent",
  });
}

describe("API key", () => {
  it("allows GET requests without an API key", async () => {
    const response = await request(createTestApp()).get("/api/health");

    expect(response.status).toBe(200);
  });

  it("rejects mutating requests without an API key", async () => {
    const response = await request(createTestApp())
      .post("/api/equipment")
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_API_KEY");
    expect(response.body.error.requestId).toEqual(expect.any(String));
  });

  it("rejects an invalid API key", async () => {
    const response = await request(createTestApp())
      .post("/api/equipment")
      .set("X-API-Key", "wrong")
      .send({});

    expect(response.status).toBe(401);
  });

  it("allows a valid API key to reach validation", async () => {
    const response = await request(createTestApp())
      .post("/api/equipment")
      .set("X-API-Key", "test-secret")
      .send({});

    expect(response.status).toBe(422);
  });
});
