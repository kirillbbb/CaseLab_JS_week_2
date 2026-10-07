# CaseLab JS — Final

Production-oriented equipment maintenance service for the final CaseLab assignment.

## Stack
Node.js 20, Express 5, PostgreSQL 17, Sequelize, Nginx, Prometheus, Grafana, Jest/Supertest.

## Architecture
Client → Nginx → Node.js API → PostgreSQL
                         └→ /metrics → Prometheus → Grafana

Existing Case 2/3 domain entities are preserved: sites, equipment, passports, requests, technicians, assignments and status history.

## Quick start
Requirements: Docker Desktop.

1. Copy `.env.example` to `.env`.
2. Set a long random `JWT_SECRET`.
3. Run `docker compose up -d`.

The migrate container waits for PostgreSQL, applies Sequelize migrations and seeds demo data when the database is empty. The API starts only after migration succeeds and runs behind Nginx.

Endpoints:
- API: http://localhost
- Swagger UI: http://localhost/api/docs
- Readiness: http://localhost/api/health/ready
- Metrics: http://localhost/metrics
- Grafana: http://localhost:3001
- Prometheus: internal Docker service

PostgreSQL and the Node.js API are not published directly to the host.

## Demo accounts
| Role | Email | Password |
|---|---|---|
| admin | admin@example.com | Admin123! |
| technician | tech1@example.com | Tech123! |
| viewer | viewer@example.com | Viewer123! |

Change demo credentials before non-demo deployment.

## Authentication
POST /api/auth/register, POST /api/auth/login, POST /api/auth/refresh, POST /api/auth/logout, GET /api/auth/me.

Registration creates a viewer. Login returns a short-lived JWT access token. Refresh uses a rotated token stored as a hash in PostgreSQL and delivered through an HttpOnly, SameSite cookie; Secure is enabled in production.

Passwords are hashed with Node.js scrypt. Login has a dedicated rate limiter and unknown accounts/wrong passwords return the same 401 INVALID_CREDENTIALS response.

## Roles
- viewer: read-only access.
- technician: create requests, edit own requests, and change status only for requests assigned to the linked technician profile.
- admin: full equipment/request administration and team assignment.

Authorization is checked in middleware and, for technician-sensitive request operations, again in the service layer.

## Health
- /api/health/live checks process liveness.
- /api/health/ready checks PostgreSQL and returns 503 while it is unavailable.

The process can start before PostgreSQL is ready; Docker uses the readiness healthcheck.

## OpenAPI
Swagger UI is available at /api/docs. The source document is public/openapi.json and declares the Bearer JWT security scheme.

## Monitoring
The API exposes Prometheus-compatible /metrics.

Grafana is provisioned automatically with request rate, 5xx rate, total requests, total errors and average request duration panels.

Prometheus contains CaseLabHigh5xxRate: an alert when the 5xx ratio is above 5% for five minutes. First response: inspect Grafana, API logs, readiness and recent database/deployment changes.

## Tests
npm install
npm run lint
npm run format:check
npm test
npm run test:coverage

Existing equipment/request tests are preserved and authentication integration tests cover protected access, registration, bearer authentication and credential enumeration resistance.

## Database
Migrations are versioned in migrations/. Demo data is in seeders/.

Local commands: npm run db:migrate, npm run db:seed, npm run db:reset.

Production Compose uses scripts/init-db.cjs so migration/initial seeding is automatic.

## Security and operations
- Nginx is the only published application port.
- PostgreSQL and API ports are internal to Compose.
- Nginx forwards Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto and X-Request-ID.
- Express trusts the first proxy.
- Request body size, Nginx timeouts and request rate are limited.
- Helmet and API rate limiting are enabled.
- Production container runs as non-root node.
- Runtime image is multi-stage and contains production dependencies only.

## Troubleshooting
docker compose ps
docker compose logs postgres
docker compose logs migrate
docker compose logs api
docker compose logs nginx
docker compose logs grafana

If readiness is 503, check PostgreSQL first. Raw OpenAPI remains available at /openapi.json if the Swagger UI CDN cannot load.

## Postman
Use docs/postman/CaseLab-Final.postman_collection.json. Set accessToken to the token returned by login.

## Git
Final implementation branch: feat/case-4-final. Review and merge into main through a pull request.
