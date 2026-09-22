import request from "supertest";

import { app } from "./helpers/app.js";

describe("API", () => {
  describe("GET /api/health", () => {
    it("returns health status", async () => {
      const response = await request(app).get("/api/health");

      expect(response.statusCode).toBe(200);

      expect(response.body).toEqual({
        status: "ok",
      });
    });

    it("returns request id", async () => {
      const response = await request(app)
        .get("/api/health")
        .set("X-Request-ID", "test-request-123");

      expect(response.statusCode).toBe(200);
      expect(response.headers["x-request-id"]).toBe("test-request-123");
    });
  });

  describe("404 errors", () => {
    it("returns uniform error response for unknown route", async () => {
      const response = await request(app)
        .get("/api/unknown")
        .set("X-Request-ID", "test-404");

      expect(response.statusCode).toBe(404);

      expect(response.body).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Route GET /api/unknown not found",
          details: [],
          requestId: "test-404",
        },
      });
    });
  });
});
