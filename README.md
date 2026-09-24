# CaseLab JS Week 2 — Maintenance API

REST API на Express для управления оборудованием и заявками на техническое обслуживание.

## Возможности

- CRUD оборудования и заявок;
- фильтрация, сортировка и пагинация заявок;
- управление статусами заявок;
- заявки конкретного оборудования;
- прогноз погоды для оборудования;
- валидация и единый формат ошибок;
- CORS, Helmet, rate limit и ограничение body;
- структурированное логирование и `X-Request-ID`.

## Запуск

Требуется Node.js 20+.

```bash
npm install
npm start
```

Для разработки:

```bash
npm run dev
```

Создайте `.env` на основе `.env.example`.

Проверка:

```bash
curl http://localhost:3000/api/health
```

## Environment

Основные переменные:

```env
PORT=3000
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
BODY_LIMIT=100kb
LOG_LEVEL=info
WEATHER_REQUEST_TIMEOUT_MS=5000
WEATHER_FORECAST_DAYS=3
WEATHER_MAX_PRECIPITATION=0
WEATHER_MAX_WIND_SPEED=30
TEMPERATURE_UNIT=celsius
```

Полный список — в `.env.example`.

## API

| Method | Endpoint                      | Назначение          |
| ------ | ----------------------------- | ------------------- |
| GET    | `/api/health`                 | Health check        |
| GET    | `/api/equipment`              | Список оборудования |
| POST   | `/api/equipment`              | Создание            |
| GET    | `/api/equipment/:id`          | Получение           |
| PATCH  | `/api/equipment/:id`          | Обновление          |
| DELETE | `/api/equipment/:id`          | Удаление            |
| GET    | `/api/equipment/:id/requests` | Заявки оборудования |
| GET    | `/api/equipment/:id/weather`  | Погода              |
| GET    | `/api/requests`               | Список заявок       |
| POST   | `/api/requests`               | Создание            |
| GET    | `/api/requests/:id`           | Получение           |
| PATCH  | `/api/requests/:id`           | Обновление          |
| PATCH  | `/api/requests/:id/status`    | Изменение статуса   |
| DELETE | `/api/requests/:id`           | Удаление            |

Создание ресурса → `201` + `Location`.

Удаление → `204`.

## Заявки

Статусы:

```text
new → in_progress → done
 │          │
 └────────→ rejected
            ↑
       in_progress
```

Из `done` и `rejected` переходы запрещены → `409`.

Поддерживаются фильтры, сортировка и пагинация:

```text
status, type, priority, equipmentId, date range,
page, limit, sortBy, sortOrder
```

Ответ списка:

```json
{
  "data": [],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

## Бизнес-правила

- заявка для несуществующего оборудования → `404`;
- дублирующий `serialNumber` → `409`;
- удаление оборудования с открытыми заявками → `409`;
- недопустимый переход статуса → `409`;
- `id`, `createdAt`, `updatedAt` контролируются сервером;
- неизвестные поля игнорируются.

## Ошибки

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [],
    "requestId": "..."
  }
}
```

Используются `400`, `404`, `409`, `413`, `422`, `429`, `503`.

## Weather

`GET /api/equipment/:id/weather`

Координаты оборудования используются для запроса прогноза Open-Meteo.

Пригодность для наружных работ:

```text
precipitation <= WEATHER_MAX_PRECIPITATION
AND
windSpeedMax < WEATHER_MAX_WIND_SPEED
```

Недоступность внешнего API не приводит к падению приложения.

## Безопасность и логирование

- CORS allowlist из `CORS_ORIGINS`;
- Helmet;
- rate limit;
- ограничение размера body;
- секреты хранятся в `.env`;
- для запросов логируются method, path, status и duration;
- `X-Request-ID` возвращается клиенту и попадает в логи.

## Архитектура

```text
routes → controllers → services → repositories
                         ↓
                    weather client
```

```text
src/
├── clients/
├── config/
├── controllers/
├── errors/
├── logger/
├── middlewares/
├── repositories/
├── routes/
├── services/
└── validators/
```

## Тестирование

```bash
npm test
npm run check
```

Postman collection: `docs/postman/`.
