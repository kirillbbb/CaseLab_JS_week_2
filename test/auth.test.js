import request from "supertest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config/env.js";

const config = { ...loadConfig(), nodeEnv: "development", jwtSecret: "test-secret-please-change" };
const app = createApp(config);

describe("authentication", () => {
  const email = "auth-" + Date.now() + "@example.com";
  const password = "Password123!";
  let token;

  it("rejects protected requests without token", async () => {
    const r = await request(app).get("/api/equipment");
    expect(r.statusCode).toBe(401);
    expect(r.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("registers a viewer and returns access token", async () => {
    const r = await request(app).post("/api/auth/register").send({ email, password });
    expect(r.statusCode).toBe(201);
    expect(r.body.data.user.role).toBe("viewer");
    expect(r.body.data.accessToken).toBeTruthy();
    token = r.body.data.accessToken;
  });

  it("returns current user from bearer token", async () => {
    const r = await request(app).get("/api/auth/me").set("Authorization", "Bearer " + token);
    expect(r.statusCode).toBe(200);
    expect(r.body.data.email).toBe(email);
  });

  it("does not reveal whether an account exists", async () => {
    const a = await request(app).post("/api/auth/login").send({ email: "missing@example.com", password: "wrong" });
    const b = await request(app).post("/api/auth/login").send({ email, password: "wrong" });
    expect(a.statusCode).toBe(401);
    expect(b.statusCode).toBe(401);
    expect(a.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(b.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});
