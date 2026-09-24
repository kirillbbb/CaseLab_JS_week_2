import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";

import { loadConfig } from "./config/env.js";
import { createLogger } from "./logger/index.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { apiKeyMiddleware } from "./middlewares/apiKey.js";

import { createEquipmentRouter } from "./routes/equipment.routes.js";
import requestRouter from "./routes/request.routes.js";

import { createOpenMeteoClient } from "./clients/weather/openMeteo.client.js";
import { createWeatherService } from "./services/weather.service.js";
import { createWeatherController } from "./controllers/weather.controller.js";

export function createApp(config = loadConfig(), dependencies = {}) {
  const app = express();
  const logger = dependencies.logger ?? createLogger(config);

  const weatherClient =
    dependencies.weatherClient ??
    createOpenMeteoClient(config, {
      fetchImpl: dependencies.fetchImpl,
    });

  const weatherService =
    dependencies.weatherService ??
    createWeatherService({
      weatherClient,
      config,
    });

  const weatherController =
    dependencies.weatherController ?? createWeatherController(weatherService);

  const equipmentRouter = createEquipmentRouter({
    weatherController,
  });

  app.disable("x-powered-by");

  app.use((req, res, next) => {
    const requestId = req.get("X-Request-ID") || crypto.randomUUID();

    req.requestId = requestId;
    req.log = logger;
    res.setHeader("X-Request-ID", requestId);

    const startedAt = process.hrtime.bigint();

    res.on("finish", () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      logger.info(
        {
          requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Number(durationMs.toFixed(2)),
        },
        "request completed",
      );
    });

    next();
  });

  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  app.use(
    express.json({
      limit: config.bodyLimit,
    }),
  );

  app.use(apiKeyMiddleware(config.apiKey));

  app.use(express.static("public"));

  app.use(
    rateLimit({
      windowMs: config.rateLimitWindowMs,
      limit: config.rateLimitMax,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

  app.use("/api/equipment", equipmentRouter);
  app.use("/api/requests", requestRouter);

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
