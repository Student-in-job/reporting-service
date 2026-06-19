# BRD: Report Service — Backend API

**Проект:** Report Service  
**Тип:** BI / Reporting System (backend-only)  
**Стек:** Python 3.12+ / FastAPI + PostgreSQL (конфиг) + внешние PostgreSQL (данные)  
**Дата:** 2026-04-27  
**Версия:** 1.0 (MVP)

---

## 1. Назначение

Backend-сервис отчётности. Выполняет SQL-запросы к внешним БД через read-only подключения, возвращает унифицированный JSON с данными и метаописанием столбцов.

---

## 2. Роли

| Роль | Описание |
|------|----------|
| `admin` | Управление отчётами, просмотр данных |
| `viewer` | Просмотр отчётов, применение фильтров |

Пользователь `admin` создаётся при первом запуске (seed из `.env`).

---

## 3. Источники данных

- Внешние PostgreSQL через **read-only** учётку
- Хранятся в таблице `datasources` собственной БД
- Управление через admin API (CRUD)
- Пароли хранятся в зашифрованном виде, **никогда** не возвращаются в ответе API
- При создании/обновлении источника пул подключений пересоздаётся

---

## 4. Собственная БД

PostgreSQL для хранения:
- Реестр отчётов (`reports`)
- Источники данных (`datasources`)
- Пользователь admin (seed)

---

## 5. API

### 5.1. Аутентификация

---

#### `POST /api/v1/auth/login`

Логин, получение JWT.

**Request:**
```json
{
  "username": "admin",
  "password": "secret"
}
```

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "admin"
  }
}
```

**Ошибки:** `401` — неверные credentials.

---

#### `GET /api/v1/auth/me`

Текущий пользователь по токену. Header: `Authorization: Bearer <token>`.

**Response 200:**
```json
{
  "id": "uuid",
  "username": "admin",
  "role": "admin"
}
```

---

### 5.2. Отчёты (публичные)

Доступны ролям: `admin`, `viewer`.

---

#### `GET /api/v1/reports`

Список активных отчётов (для построения меню).

**Query params:**
| Параметр | Тип | Обязательный | Описание |
|----------|-----|:---:|----------|
| `group` | string | нет | Фильтр по группе |

**Response 200:**
```json
{
  "reports": [
    {
      "id": "uuid",
      "slug": "dashboard-stats",
      "name": "Дашборд: скоринг/лимит/займы",
      "description": "Метрики за период с разбивкой по дням",
      "group": "dashboard",
      "type": "bar_chart",
      "filters": [
        {"name": "date_from", "label": "Дата с", "type": "date", "required": true},
        {"name": "date_to", "label": "Дата по", "type": "date", "required": true}
      ]
    }
  ]
}
```

---

#### `POST /api/v1/reports/{report_id}/data`

Выполнение отчёта. **Основной метод сервиса.**

`report_id` — UUID или slug.

**Request:**
```json
{
  "date_from": "2026-04-01",
  "date_to": "2026-04-27",
  "filters": {}
}
```

**Response 200:**
```json
{
  "report_id": "uuid",
  "slug": "dashboard-stats",
  "title": "Дашборд: скоринг/лимит/займы",
  "type": "bar_chart",
  "columns": [
    {"key": "date", "label": "Дата", "type": "date"},
    {"key": "scored_users", "label": "Прошли скоринг", "type": "number"},
    {"key": "new_limit_users", "label": "Получили лимит", "type": "number"},
    {"key": "loans_active", "label": "Активные займы", "type": "number"}
  ],
  "data": [
    {"date": "2026-04-01", "scored_users": 15, "new_limit_users": 10, "loans_active": 5},
    {"date": "2026-04-02", "scored_users": 22, "new_limit_users": 18, "loans_active": 8}
  ],
  "totals": {
    "scored_users": 320,
    "new_limit_users": 215,
    "loans_active": 123
  },
  "meta": {
    "generated_at": "2026-04-27T12:00:00Z",
    "execution_time_ms": 85,
    "total_rows": 27,
    "filters_applied": {"date_from": "2026-04-01", "date_to": "2026-04-27"}
  }
}
```

**Правила:**
- `columns` — всегда присутствует, описывает каждый ключ из `data`
- `totals` — опционально, зависит от отчёта
- `data` — массив строк, ключи совпадают с `columns[].key`

**Типы столбцов:** `string`, `number`, `date`, `datetime`, `boolean`

**Типы визуализации:** `table`, `pie_chart`, `scatter_plot`, `bar_chart`

**Ошибки:**
- `400` — невалидные фильтры (date_from > date_to, диапазон > max_range_days)
- `404` — отчёт не найден или неактивен
- `504` — таймаут SQL (>30 сек)

---

### 5.3. Администрирование отчётов

Только роль `admin`.

---

#### `POST /api/v1/admin/reports/analyze-sql`

Автоанализ SQL-запроса. Выполняет SQL с `LIMIT 0`, считывает метаданные колонок из PostgreSQL (имя, тип), возвращает готовый массив `columns`.

**Request:**
```json
{
  "datasource_id": "uuid",
  "sql_query": "SELECT DATE(created_at) d, COUNT(*) cnt FROM orders GROUP BY d"
}
```

**Response 200:**
```json
{
  "columns": [
    {"key": "d", "label": "D", "type": "date"},
    {"key": "cnt", "label": "Cnt", "type": "number"}
  ]
}
```

Маппинг типов PostgreSQL → Report Service:
| PostgreSQL | Report Service |
|---|---|
| int2, int4, int8, float4, float8, numeric, money | `number` |
| bool | `boolean` |
| date | `date` |
| timestamp, timestamptz | `datetime` |
| text, varchar, char, uuid, json, jsonb | `string` |

**Ошибки:** `400` — невалидный SQL или ошибка подключения.

---

#### Автогенерация columns при создании/обновлении

Если при `POST /admin/reports` или `PUT /admin/reports/{id}` поле `config.columns` **не передано или пустое**, бэк автоматически выполняет `analyze-sql` и заполняет `columns` на основе метаданных SQL-запроса.

При обновлении: автогенерация срабатывает только если изменился `sql_query` и `columns` не переданы явно.

Админ может переопределить `columns` вручную (переименовать `label`, сменить `type`).

---

#### `GET /api/v1/admin/reports/{report_id}`

Полная информация об отчёте, включая SQL.

**Response 200:**
```json
{
  "id": "uuid",
  "slug": "dashboard-stats",
  "name": "Дашборд: скоринг/лимит/займы",
  "description": "Метрики за период с разбивкой по дням",
  "group": "dashboard",
  "type": "bar_chart",
  "datasource_id": "uuid",
  "sql_query": "SELECT DATE(created_at) d, COUNT(*) c FROM ...",
  "config": {
    "filters": [
      {"name": "date_from", "type": "date", "required": true, "label": "Дата с"},
      {"name": "date_to", "type": "date", "required": true, "label": "Дата по"}
    ],
    "columns": [
      {"key": "d", "label": "Дата", "type": "date"},
      {"key": "c", "label": "Количество", "type": "number"}
    ],
    "max_range_days": 90
  },
  "is_active": true,
  "created_at": "2026-04-27T10:00:00Z",
  "updated_at": "2026-04-27T10:00:00Z"
}
```

---

#### `POST /api/v1/admin/reports`

Создание отчёта.

**Request:**
```json
{
  "slug": "dashboard-stats",
  "name": "Дашборд: скоринг/лимит/займы",
  "description": "Метрики за период",
  "group": "dashboard",
  "type": "bar_chart",
  "datasource_id": "uuid",
  "sql_query": "SELECT DATE(created_at) d, COUNT(*) c FROM orders WHERE created_at BETWEEN :date_from AND :date_to GROUP BY DATE(created_at)",
  "config": {
    "filters": [
      {"name": "date_from", "type": "date", "required": true, "label": "Дата с"},
      {"name": "date_to", "type": "date", "required": true, "label": "Дата по"}
    ],
    "columns": [
      {"key": "d", "label": "Дата", "type": "date"},
      {"key": "c", "label": "Количество", "type": "number"}
    ],
    "max_range_days": 90
  }
}
```

**Response 201:** созданный отчёт.

---

#### `PUT /api/v1/admin/reports/{report_id}`

Обновление отчёта. Partial update — отправляются только изменённые поля.

**Response 200:** обновлённый отчёт.

---

#### `DELETE /api/v1/admin/reports/{report_id}`

Деактивация отчёта (`is_active = false`).

**Response 204:** No Content.

---

#### `POST /api/v1/admin/reports/{report_id}/test`

Тестовый запуск SQL. Выполняет запрос с `LIMIT 10`.

**Request:**
```json
{
  "date_from": "2026-04-01",
  "date_to": "2026-04-07",
  "filters": {}
}
```

**Response 200:** формат как у `POST /reports/{id}/data`, но `data` ≤ 10 строк + `"test_mode": true` в `meta`.

---

### 5.4. Источники данных

Только роль `admin`.

---

#### `GET /api/v1/admin/datasources`

Список источников данных.

**Response 200:**
```json
{
  "datasources": [
    {
      "id": "uuid",
      "name": "nasiya-core",
      "host": "10.0.0.5",
      "port": 5432,
      "database": "nasiya",
      "username": "report_readonly",
      "is_active": true,
      "reports_count": 5
    }
  ]
}
```

Пароль **никогда** не возвращается.

---

#### `POST /api/v1/admin/datasources`

Добавление источника.

**Request:**
```json
{
  "name": "nasiya-core",
  "host": "10.0.0.5",
  "port": 5432,
  "database": "nasiya",
  "username": "report_readonly",
  "password": "secret",
  "is_active": true
}
```

**Response 201:** созданный источник (без пароля).

---

#### `PUT /api/v1/admin/datasources/{datasource_id}`

Обновление источника. Пароль отправляется только при смене.

**Response 200:** обновлённый источник (без пароля).

---

#### `DELETE /api/v1/admin/datasources/{datasource_id}`

Удаление источника. Запрещено, если есть привязанные активные отчёты → `409 Conflict`.

**Response 204:** No Content.

---

#### `POST /api/v1/admin/datasources/{datasource_id}/test`

Проверка подключения (`SELECT 1`).

**Response 200:**
```json
{
  "status": "ok",
  "response_time_ms": 12
}
```

**Response 400:**
```json
{
  "status": "error",
  "detail": "Connection refused"
}
```

---

## 6. Модель SQL-отчётов

- 1 отчёт = 1 SQL-запрос в поле `sql_query`
- Параметры — named placeholders: `:date_from`, `:date_to`, `:param`
- SQL содержит только выборку и агрегацию, без бизнес-логики
- Выполнение через `asyncpg` с параметризацией (защита от injection)
- Таймаут: 30 секунд
- `columns` в `config` — автогенерируются из метаданных SQL (можно переопределить вручную)
- `type` — тип визуализации: `table` (default), `pie_chart`, `scatter_plot`, `bar_chart`

---

## 7. Архитектура

```
Router (FastAPI)
  └── ReportService
        ├── ReportExecutor    — загрузка SQL, подстановка параметров, выполнение, нормализация → JSON
        └── DatasourceManager — пул подключений к внешним БД
```

---

## 8. NFR

| Параметр | Значение |
|----------|----------|
| Время ответа | ≤ 3 сек |
| Таймаут SQL | 30 сек |
| Авторизация | JWT (срок жизни 24ч) |
| Хеширование паролей | bcrypt |
| Max диапазон дат | настраивается per-report (default 90 дней) |

---

## 9. Сводная таблица API (MVP)

| # | Метод | Endpoint | Роль |
|---|-------|----------|------|
| 1 | POST | `/api/v1/auth/login` | * |
| 2 | GET | `/api/v1/auth/me` | auth |
| 3 | GET | `/api/v1/reports` | viewer+ |
| 4 | POST | `/api/v1/reports/{id}/data` | viewer+ |
| 5 | POST | `/api/v1/admin/reports/analyze-sql` | admin |
| 6 | GET | `/api/v1/admin/reports/{id}` | admin |
| 7 | POST | `/api/v1/admin/reports` | admin |
| 8 | PUT | `/api/v1/admin/reports/{id}` | admin |
| 9 | DELETE | `/api/v1/admin/reports/{id}` | admin |
| 10 | POST | `/api/v1/admin/reports/{id}/test` | admin |
| 11 | GET | `/api/v1/admin/datasources` | admin |
| 12 | POST | `/api/v1/admin/datasources` | admin |
| 13 | PUT | `/api/v1/admin/datasources/{id}` | admin |
| 14 | DELETE | `/api/v1/admin/datasources/{id}` | admin |
| 15 | POST | `/api/v1/admin/datasources/{id}/test` | admin |

**Итого MVP: 15 эндпоинтов.**
