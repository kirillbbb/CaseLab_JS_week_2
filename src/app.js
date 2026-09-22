import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';

import { loadConfig } from './config/env.js';
import { createLogger } from './logger/index.js';
import { notFoundHandler } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp(config = loadConfig()) {
  const app = express();
  const logger = createLogger(config);

  app.disable('x-powered-by');

  app.use((req, res, next) => {
    const requestId = req.get('X-Request-ID') || crypto.randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
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
        'request completed',
      );
    });

    next();
  });

  app.use(helmet());

  app.use(
    cors({
      origin: config.corsOrigin,
    }),
  );

  app.use(
    express.json({
      limit: config.bodyLimit,
    }),
  );

  app.use(
    rateLimit({
      windowMs: config.rateLimitWindowMs,
      limit: config.rateLimitMax,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}