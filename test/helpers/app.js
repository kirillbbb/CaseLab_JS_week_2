import { createApp } from "../../src/app.js";

export const app = createApp({
  nodeEnv: "test",
  port: 3000,
  corsOrigin: "http://localhost:3000",
  rateLimitWindowMs: 60_000,
  rateLimitMax: 100,
  bodyLimit: "100kb",
  apiKey: "",
  logLevel: "silent",
});
