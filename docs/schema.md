# Database Schema

**Source:** `backend/app/models/`  
**Database:** PostgreSQL  
**ORM:** SQLAlchemy 2 (async, `Mapped` / `mapped_column`)

---

## Table: `users`

Model: [`backend/app/models/user.py`](../backend/app/models/user.py)

| Column | PG Type | Constraints | Default | Notes |
|--------|---------|-------------|---------|-------|
| `id` | `UUID` | PK | `uuid4()` | |
| `username` | `VARCHAR(100)` | NOT NULL, UNIQUE | — | |
| `password_hash` | `VARCHAR(255)` | NOT NULL | — | bcrypt hash, never returned via API |
| `role` | `VARCHAR(20)` | NOT NULL | `'viewer'` | `'admin'` \| `'viewer'` |
| `is_active` | `BOOLEAN` | | `true` | Soft-delete flag |
| `created_at` | `TIMESTAMPTZ` | | `now()` (server) | |

**Notes:**
- The seed admin user is created on startup from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars.
- Deactivation (`is_active = false`) is a soft delete — the row is kept.
- No `updated_at` column on users.

---

## Table: `datasources`

Model: [`backend/app/models/datasource.py`](../backend/app/models/datasource.py)

| Column | PG Type | Constraints | Default | Notes |
|--------|---------|-------------|---------|-------|
| `id` | `UUID` | PK | `uuid4()` | |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | — | Display name |
| `host` | `VARCHAR(255)` | NOT NULL | — | PostgreSQL host |
| `port` | `INTEGER` | | `5432` | |
| `database` | `VARCHAR(100)` | NOT NULL | — | Database name |
| `username` | `VARCHAR(100)` | NOT NULL | — | DB login |
| `password_encrypted` | `VARCHAR(500)` | NOT NULL | — | Encrypted; never returned via API |
| `is_active` | `BOOLEAN` | | `true` | |
| `created_at` | `TIMESTAMPTZ` | | `now()` (server) | |
| `updated_at` | `TIMESTAMPTZ` | | `now()` (server) | Updated on every write |

**Notes:**
- Hard delete is used (row is removed), but only allowed when no active reports reference this datasource — the API returns `409 Conflict` otherwise.
- `DatasourceManager` recreates the asyncpg connection pool whenever a datasource is created or updated.

---

## Table: `reports`

Model: [`backend/app/models/report.py`](../backend/app/models/report.py)

| Column | PG Type | Constraints | Default | Notes |
|--------|---------|-------------|---------|-------|
| `id` | `UUID` | PK | `uuid4()` | |
| `slug` | `VARCHAR(100)` | NOT NULL, UNIQUE | — | URL-safe identifier; accepted in place of `id` in API calls |
| `name` | `VARCHAR(255)` | NOT NULL | — | Display name |
| `description` | `TEXT` | nullable | — | |
| `group` | `VARCHAR(100)` | nullable | — | Used to group reports in the sidebar menu |
| `type` | `VARCHAR(20)` | NOT NULL | `'table'` | Visualization type (see below) |
| `datasource_id` | `UUID` | NOT NULL, FK → `datasources.id` | — | Which external DB to query |
| `sql_query` | `TEXT` | NOT NULL | — | Parameterized SELECT; uses `:param` named placeholders |
| `config` | `JSONB` | NOT NULL | `{}` | Report configuration (see structure below) |
| `is_active` | `BOOLEAN` | | `true` | Soft-delete flag |
| `created_at` | `TIMESTAMPTZ` | | `now()` (server) | |
| `updated_at` | `TIMESTAMPTZ` | | `now()` (server) | Updated on every write |

### `type` values

| Value | Visualization |
|-------|---------------|
| `table` | Data table (default) |
| `bar_chart` | Vertical bar chart |
| `pie_chart` | Pie / donut chart |
| `scatter_plot` | Scatter plot |
| `horizontal_stack` | Horizontal stacked bar |
| `vertical_stack` | Vertical stacked bar |
| `block_chart` | Block / treemap chart |

### `config` JSONB structure

```jsonc
{
  "filters": [
    {
      "name": "date_from",       // parameter name (matches :date_from in sql_query)
      "label": "Дата с",         // UI label
      "type": "date",            // "date" | "datetime" | "string" | "number" | "boolean"
      "required": true
    }
  ],
  "columns": [
    {
      "key": "d",                // matches a column alias in the SELECT
      "label": "Дата",           // UI label
      "type": "date"             // "string" | "number" | "date" | "datetime" | "boolean"
    }
  ],
  "max_range_days": 90           // optional; max allowed date range for filter validation
}
```

`columns` are auto-generated from SQL metadata (`LIMIT 0` introspection) if not provided explicitly.

---

## Relationships

```
datasources ──< reports
   (id)          (datasource_id)
```

- One `Datasource` → many `Reports` (no ORM relationship declared; FK enforced at DB level).
- No SQLAlchemy `relationship()` is defined — joins are done manually in service code.

---

## PostgreSQL → Report Column Type Mapping

Used by `report_executor.py` when auto-generating `config.columns`:

| PostgreSQL types | Report `type` |
|-----------------|---------------|
| `int2`, `int4`, `int8`, `float4`, `float8`, `numeric`, `money` | `number` |
| `bool` | `boolean` |
| `date` | `date` |
| `timestamp`, `timestamptz` | `datetime` |
| `text`, `varchar`, `char`, `uuid`, `json`, `jsonb` | `string` |
