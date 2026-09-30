# CaseLab JS — Кейс 3

Перенос сервиса учёта заявок с хранилища Кейса 2 на PostgreSQL + Sequelize.

## Архитектура

```text
HTTP
 ↓
routes
 ↓
controllers
 ↓
services        ← бизнес-правила и транзакции
 ↓
repositories    ← весь доступ к БД
 ↓
Sequelize
 ↓
PostgreSQL
```

Контроллеры не выполняют SQL, а repository-слой скрывает детали PostgreSQL.

## Схема БД

```text
sites 1 ───── N equipment 1 ───── 1 equipment_passports
                         │
                         └─────── N maintenance_requests
                                      │
                                      ├──── N request_status_history
                                      │
                                      └──── N:M technicians
                                               │
                                      request_assignees
```

### Таблицы

- `sites` — площадки и координаты.
- `equipment` — оборудование. `serial_number` уникален.
- `equipment_passports` — паспорт оборудования, `equipment_id` уникален.
- `maintenance_requests` — заявки.
- `request_status_history` — неизменяемый журнал переходов статусов.
- `technicians` — специалисты.
- `request_assignees` — связь заявок и специалистов с `role` и `hours`.

### Нормализация

Координаты, данные площадки, паспорта и специалисты не дублируются в заявках/оборудовании. Связь заявка–специалист вынесена в отдельную таблицу, потому что это N:M и у связи есть собственные атрибуты.

### Правила FK

- `sites → equipment`: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`.
- `equipment → equipment_passports`: `ON DELETE CASCADE`, `ON UPDATE CASCADE`.
- `equipment → maintenance_requests`: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`.
- `maintenance_requests → request_status_history`: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`.
- `maintenance_requests → request_assignees`: `ON DELETE CASCADE`.
- `technicians → request_assignees`: `ON DELETE RESTRICT`.

Заявки удаляются мягко (`paranoid`): DELETE скрывает заявку из обычных выборок, но физическая строка и история статусов сохраняются. Оборудование с существующими заявками физически удалить нельзя. Это сохраняет ссылочную целостность и аудит.

## Запуск

Требуется Node.js 20+ и Docker.

1. Создать `.env` на основе `.env.example`.
2. Запустить PostgreSQL:

```bash
docker compose up -d
```

3. Установить зависимости:

```bash
npm install
```

4. Применить миграции:

```bash
npm run db:migrate
```

5. Заполнить демонстрационные данные:

```bash
npm run db:seed
```

6. Запустить API:

```bash
npm start
```

Проверка:

```text
GET http://localhost:3000/api/health
```

## Откат

Откат последней миграции:

```bash
npm run db:migrate:undo
```

Полный откат:

```bash
npm run db:migrate:undo:all
```

Повторное создание схемы:

```bash
npm run db:migrate
npm run db:seed
```

Проверяется полный цикл:

```text
migrate → undo:all → migrate → seed
```

`sequelize.sync({ force: true })` в проекте не используется.

## API

Существующий API Кейса 2 сохранён:

```text
GET    /api/equipment
POST   /api/equipment
GET    /api/equipment/:id
PATCH  /api/equipment/:id
DELETE /api/equipment/:id

GET    /api/equipment/:equipmentId/requests
GET    /api/equipment/:id/weather

GET    /api/requests
POST   /api/requests
GET    /api/requests/:id
PATCH  /api/requests/:id
PATCH  /api/requests/:id/status
DELETE /api/requests/:id
```

Карточка оборудования дополнительно содержит `passport`, а карточка заявки — `assignees`.

Новые endpoint'ы:

```text
POST   /api/requests/:id/assignees
DELETE /api/requests/:id/assignees/:userId
GET    /api/requests/:id/history
GET    /api/sites/:id/summary
GET    /api/reports/equipment-load
```

### Назначение бригады

```json
{
  "assignees": [
    {
      "technicianId": "30000000-0000-4000-8000-000000000001",
      "role": "lead",
      "hours": 4
    },
    {
      "technicianId": "30000000-0000-4000-8000-000000000002",
      "role": "member",
      "hours": 2
    }
  ]
}
```

Должен быть ровно один `lead`. Повторное назначение одного специалиста запрещено БД и сервисом.

### Статусы

```text
new → in_progress → done
  └──────────────→ rejected

in_progress → rejected
```

`done` и `rejected` — конечные состояния.

`in_progress` невозможен без назначенных специалистов.

Смена статуса выполняет:

```text
lock request
→ validate transition
→ validate assignees
→ UPDATE maintenance_requests
→ INSERT request_status_history
→ COMMIT
```

При любой ошибке выполняется rollback.

## Отчёты

### Сводка площадки

```text
GET /api/sites/:id/summary
```

Возвращает:

- количество заявок;
- распределение по статусам;
- распределение по приоритетам;
- среднее время от `created_at` до первого перехода в `done`.

Для закрытия используется именно запись истории статуса, поэтому последующие изменения заявки не искажают время закрытия.

### Нагрузка на оборудование

```text
GET /api/reports/equipment-load
```

Параметры:

```text
dateFrom
dateTo
minRequests
limit
offset
sortBy
sortOrder
```

Результат:

- `requestCount`;
- `closedCount`;
- `plannedHours`;
- `lastMaintenanceAt`.

Запрос использует `JOIN`, агрегаты, `GROUP BY`, `HAVING` и параметризованные replacements. Для суммы трудозатрат используется предварительная агрегация по заявке, чтобы JOIN с историей не создавал мультипликацию строк.

Допустимые `sortBy`:

```text
requestCount
closedCount
plannedHours
lastMaintenanceAt
```

`limit <= 100`, `offset <= 10000`.

## Транзакции и конкурентность

Смена статуса и назначение бригады используют одну транзакцию на всю операцию.

Для изменения статуса применяется `SELECT ... FOR UPDATE`, поэтому два конкурентных перехода одной заявки не могут оба принять решение на основе одного старого состояния.

## SQL injection

Пользовательские значения передаются через Sequelize `replacements`.

Динамический `ORDER BY` не принимает произвольный текст: сначала применяется whitelist.

## Seed

Seed содержит:

- 2 площадки;
- 6 единиц оборудования;
- 6 паспортов, по одному на оборудование;
- 20 заявок в разных статусах;
- 5 специалистов;
- историю переходов;
- назначения специалистов.

Данные подобраны так, чтобы демонстрировать связи и оба отчёта.

В исходном Кейс 2 repository использовал in-memory коллекции; seed представляет их нормализованный перенос в PostgreSQL с расширенной предметной моделью Кейса 3.

## Проверка

```bash
npm run lint
npm run format:check
npm test
```

Для Postman используется:

```text
docs/postman/CaseLab-Week3.postman_collection.json
```

## Важные corner cases

- неизвестное оборудование при создании заявки → `404`;
- неизвестный специалист → `404`;
- duplicate serial number → `409`;
- duplicate (request, technician) → `409`;
- бригада без ровно одного `lead` → `422`;
- `in_progress` без исполнителей → `409`;
- недопустимый переход статуса → `409`;
- изменение конечного статуса → `409`;
- удаление оборудования с заявками → `409`;
- удаление заявки с историей → `204` (мягкое удаление, история сохраняется);
- invalid `limit/offset` отчёта → `400`;
- попытка передать произвольное поле сортировки → `422`.

## Почему нет отдельной users-таблицы

В предметной модели задания нет сущности пользователя. Поэтому `author` и `changed_by` хранят идентификатор автора как строковое значение, без искусственного добавления отдельного справочника.

## Git

Рабочая ветка для реализации:

```text
feat/case-3-postgresql
```

В этой передаваемой версии история Git не обязательна: архив предназначен сначала для локального тестирования. После проверки изменения можно разнести на атомарные коммиты и PR.