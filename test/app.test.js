import request from 'supertest';
import { createApp } from '../src/app.js';

describe('API', () => {
  const app = createApp({
    nodeEnv: 'test',
    port: 3000,
    corsOrigin: 'http://localhost:3000',
    rateLimitWindowMs: 60_000,
    rateLimitMax: 100,
    bodyLimit: '100kb',
    apiKey: '',
    logLevel: 'silent',
  });

  describe('GET /api/health', () => {
    it('returns health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
      });
    });

    it('returns request id', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-Request-ID', 'test-request-123');

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-request-id']).toBe('test-request-123');
    });
  });

  describe('404 errors', () => {
    it('returns uniform error response for unknown route', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .set('X-Request-ID', 'test-404');

      expect(response.statusCode).toBe(404);

      expect(response.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /api/unknown not found',
          details: [],
          requestId: 'test-404',
        },
      });
    });
  });
});