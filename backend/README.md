# Report Service

Backend-сервис отчётности. Выполняет SQL-запросы к внешним PostgreSQL через read-only подключения, возвращает унифицированный JSON.

## Стек

- Python 3.12+
- FastAPI
- SQLAlchemy (async) + Alembic
- asyncpg (подключение к внешним БД)
- PostgreSQL (собственная БД для конфигурации)

## Быстрый старт

```bash
# 1. Клонировать и перейти в каталог
cd report-service

# 2. Скопировать конфиг
cp .env.example .env

# 3. Запустить через Docker
docker compose up -d

# 4. Применить миграции
docker compose exec app alembic upgrade head

# 5. Сервис доступен
curl http://localhost:8000/health
```

### Без Docker

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Создать БД report_service в PostgreSQL, прописать DATABASE_URL в .env

alembic upgrade head
uvicorn app.main:app --reload
```

## Переменные окружения (.env)

| Переменная | Описание | Default |
|---|---|---|
| `APP_HOST` | Хост приложения | `0.0.0.0` |
| `APP_PORT` | Порт | `8000` |
| `DATABASE_URL` | Строка подключения к собственной БД | `postgresql+asyncpg://report:report@localhost:5432/report_service` |
| `JWT_SECRET` | Секрет для подписи JWT | `change-me-in-production` |
| `JWT_ALGORITHM` | Алгоритм JWT | `HS256` |
| `JWT_EXPIRE_HOURS` | Время жизни токена (часы) | `24` |
| `ADMIN_USERNAME` | Логин seed-админа | `admin` |
| `ADMIN_PASSWORD` | Пароль seed-админа | `admin` |

## Архитектура

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Клиент    │────▶│   FastAPI (app)       │────▶│  Собственная БД │
│  (любой)    │◀────│                       │◀────│  (config)       │
└─────────────┘     │  ┌─────────────────┐  │     └─────────────────┘
                    │  │ ReportExecutor   │  │
                    │  │  SQL → JSON      │  │     ┌─────────────────┐
                    │  └────────┬─────────┘  │────▶│ Внешняя БД #1   │
                    │           │             │     │ (read-only)     │
                    │  ┌────────▼─────────┐  │     └─────────────────┘
                    │  │DatasourceManager │  │
                    │  │  пулы asyncpg    │  │     ┌─────────────────┐
                    │  └──────────────────┘  │────▶│ Внешняя БД #2   │
                    └──────────────────────┘       │ (read-only)     │
                                                   └─────────────────┘
```

### Собственная БД (конфигурационная)

Хранит три таблицы:

- **users** — пользователи (admin создаётся при первом запуске из .env)
- **datasources** — подключения к внешним БД (host, port, database, username, пароль)
- **reports** — реестр отчётов (slug, name, type, sql_query, config JSONB)

Сервис **не хранит данные отчётов** — всё выполняется на лету.

### Слои

```
app/
├── api/              — роутеры FastAPI
│   ├── deps.py       — зависимости (auth, role check)
│   ├── auth.py       — POST /login, GET /me
│   ├── reports.py    — GET /reports, POST /reports/{id}/data
│   └── admin/
│       ├── reports.py      — CRUD отчётов + тестовый запуск
│       └── datasources.py  — CRUD источников + проверка подключения
├── models/           — SQLAlchemy модели (User, Report, Datasource)
├── schemas/          — Pydantic схемы (request/response)
├── services/
│   ├── report_executor.py    — ядро: SQL → параметризация → выполнение → JSON
│   ├── datasource_manager.py — управление пулами подключений asyncpg
│   └── seed.py               — seed admin при старте
├── core/
│   └── security.py   — JWT (создание/валидация), bcrypt
├── config.py         — Settings из .env
├── database.py       — async engine + session
└── main.py           — FastAPI app, lifespan, роутеры
```

## API

### Аутентификация

Все запросы (кроме `/auth/login` и `/health`) требуют заголовок:
```
Authorization: Bearer <token>
```

| Метод | Endpoint | Роль | Описание |
|---|---|---|---|
| POST | `/api/v1/auth/login` | * | Логин → JWT токен |
| GET | `/api/v1/auth/me` | auth | Текущий пользователь |

### Отчёты (просмотр)

| Метод | Endpoint | Роль | Описание |
|---|---|---|---|
| GET | `/api/v1/reports` | viewer+ | Список активных отчётов (для меню) |
| POST | `/api/v1/reports/{id}/data` | viewer+ | Выполнение отчёта |

### Администрирование отчётов

| Метод | Endpoint | Описание |
|---|---|---|
| POST | `/api/v1/admin/reports/analyze-sql` | Автоанализ SQL → columns |
| GET | `/api/v1/admin/reports/{id}` | Детали отчёта (включая SQL) |
| POST | `/api/v1/admin/reports` | Создать отчёт (columns автогенерируются) |
| PUT | `/api/v1/admin/reports/{id}` | Обновить отчёт |
| DELETE | `/api/v1/admin/reports/{id}` | Деактивировать отчёт |
| POST | `/api/v1/admin/reports/{id}/test` | Тестовый запуск SQL (LIMIT 10) |

### Источники данных

| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/api/v1/admin/datasources` | Список источников |
| POST | `/api/v1/admin/datasources` | Добавить источник |
| PUT | `/api/v1/admin/datasources/{id}` | Обновить источник |
| DELETE | `/api/v1/admin/datasources/{id}` | Удалить (409 если есть отчёты) |
| POST | `/api/v1/admin/datasources/{id}/test` | Проверить подключение (SELECT 1) |

## Унифицированный формат ответа

Все отчёты возвращают данные в одном формате. Клиент строит UI на основе `columns` — без хардкода.

```json
{
  "report_id": "uuid",
  "slug": "dashboard-stats",
  "title": "Название отчёта",
  "type": "bar_chart",
  "columns": [
    {"key": "date", "label": "Дата", "type": "date"},
    {"key": "count", "label": "Количество", "type": "number"}
  ],
  "data": [
    {"date": "2026-04-01", "count": 15},
    {"date": "2026-04-02", "count": 22}
  ],
  "totals": null,
  "meta": {
    "generated_at": "2026-04-27T12:00:00+00:00",
    "execution_time_ms": 85,
    "total_rows": 2,
    "filters_applied": {"date_from": "2026-04-01", "date_to": "2026-04-27"}
  }
}
```

**Типы столбцов:** `string`, `number`, `date`, `datetime`, `boolean`

**Типы визуализации:** `table` (default), `pie_chart`, `scatter_plot`, `bar_chart`

## Автогенерация columns

При создании отчёта **не обязательно** указывать `config.columns` вручную. Если `columns` не переданы, бэк автоматически:

1. Выполняет SQL с `LIMIT 0` на указанном datasource
2. Считывает метаданные колонок из PostgreSQL (имя, тип)
3. Маппит типы PostgreSQL → Report Service (`int4` → `number`, `timestamp` → `datetime`, и т.д.)
4. Заполняет `config.columns`

Можно также вызвать отдельно `POST /admin/reports/analyze-sql` для предварительного анализа.

При обновлении отчёта (`PUT`): если изменился `sql_query` и `columns` не переданы явно — автогенерация срабатывает повторно.

## Как создать новый отчёт

### 1. Добавить источник данных (если ещё нет)

```bash
curl -X POST http://localhost:8000/api/v1/admin/datasources \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "nasiya-core",
    "host": "10.0.0.5",
    "port": 5432,
    "database": "nasiya",
    "username": "report_readonly",
    "password": "secret"
  }'
```

### 2. Проверить подключение

```bash
curl -X POST http://localhost:8000/api/v1/admin/datasources/<id>/test \
  -H "Authorization: Bearer <token>"
```

### 3. Создать отчёт

Columns указывать не нужно — бэк определит автоматически из SQL:

```bash
curl -X POST http://localhost:8000/api/v1/admin/reports \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "orders-by-day",
    "name": "Заказы по дням",
    "description": "Количество заказов с группировкой по дням",
    "group": "orders",
    "type": "bar_chart",
    "datasource_id": "<datasource-uuid>",
    "sql_query": "SELECT DATE(created_at) d, COUNT(*) cnt FROM orders WHERE created_at BETWEEN :date_from AND :date_to GROUP BY DATE(created_at) ORDER BY d",
    "config": {
      "filters": [
        {"name": "date_from", "type": "date", "required": true, "label": "Дата с"},
        {"name": "date_to", "type": "date", "required": true, "label": "Дата по"}
      ],
      "max_range_days": 90
    }
  }'
```

Бэк выполнит SQL с `LIMIT 0` и автозаполнит `config.columns`:
```json
{"columns": [{"key": "d", "label": "D", "type": "date"}, {"key": "cnt", "label": "Cnt", "type": "number"}]}
```

### 4. Протестировать

```bash
curl -X POST http://localhost:8000/api/v1/admin/reports/<id>/test \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"date_from": "2026-04-01", "date_to": "2026-04-07"}'
```

### 5. Использовать

```bash
curl -X POST http://localhost:8000/api/v1/reports/<id>/data \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"date_from": "2026-04-01", "date_to": "2026-04-27"}'
```

## SQL-запросы: правила

- Параметры — через `:name` плейсхолдеры (`:date_from`, `:date_to`, `:region`)
- Сервис заменяет `:name` на `$1, $2...` и выполняет через asyncpg (защита от SQL injection)
- SQL содержит только SELECT — без INSERT/UPDATE/DELETE
- Таймаут выполнения: 30 секунд
- Используйте read-only учётку на стороне PostgreSQL как дополнительную защиту

## Роли

| Роль | Просмотр отчётов | Управление отчётами | Управление источниками |
|---|:---:|:---:|:---:|
| `viewer` | ✅ | ❌ | ❌ |
| `admin` | ✅ | ✅ | ✅ |

Пользователь `admin` создаётся автоматически при первом запуске из переменных `ADMIN_USERNAME` и `ADMIN_PASSWORD`.

## Миграции

```bash
# Создать миграцию
alembic revision --autogenerate -m "описание"

# Применить
alembic upgrade head

# Откатить
alembic downgrade -1
```
