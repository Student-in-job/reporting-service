# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Paystep Analytics** — a BI/reporting service. Admins define SQL reports against external PostgreSQL databases; end users run them with filters, viewing results as tables/charts and exporting to Excel.

Monorepo with three subprojects, each with its own `.git`:

| Folder | What | Stack |
|--------|------|-------|
| `backend/` | FastAPI API service | Python 3.12+, SQLAlchemy 2 (async), asyncpg, Alembic, Pydantic v2, JWT auth |
| `frontend/` | Vue 3 SPA | TypeScript, Vite 8, Naive UI, Pinia, TanStack Vue Query, ECharts, SCSS |
| `publish/` | Generated runnable bundle | Combined frontend build + backend + venv (produced by `scripts/`) |

## Build & Run Commands

### Backend (from `backend/`)

```bash
pip install -r requirements.txt
alembic upgrade head                          # apply migrations
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

New migration: `alembic revision --autogenerate -m "description"`

### Frontend (from `frontend/`)

```bash
yarn install
yarn dev          # dev server on :5173, proxies /api → localhost:8000
yarn build        # production build (outputs to dist/)
yarn type-check   # vue-tsc --noEmit
yarn lint         # oxlint + eslint
yarn format       # prettier write
```

### Publish bundle (from repo root)

Every build script has both `.ps1` (PowerShell) and `.bat` (CMD) variants with identical behavior.

```powershell
# PowerShell
.\scripts\install-environment.ps1    # create venv + install deps (first time / deps change)
.\scripts\build-clean.ps1            # wipe publish/ (keeps venv)
.\scripts\build-frontend.ps1         # SPA → publish/static (uses Docker Node 22)
.\scripts\build-backend.ps1          # backend → publish/

# CMD equivalent
scripts\install-environment.bat
scripts\build-clean.bat
scripts\build-frontend.bat
scripts\build-backend.bat
```

Run published bundle: `cd publish; .\venv\Scripts\Activate.ps1; alembic upgrade head; uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Database export

`scripts/export.py` exports all configuration data (datasources, users, reports) from `report_service` to `export.dat` as SQL (TRUNCATE + INSERT in FK-safe order). Requires asyncpg.

```bash
python scripts/export.py                        # reads DATABASE_URL from .env
python scripts/export.py --url "postgresql://..."  # explicit URL
psql -d report_service -f export.dat            # re-import
```

### Docker

```bash
docker compose -f docker/docker-compose.yml up --build
# frontend: :8080, backend: :8000
# Backend reaches host PostgreSQL via host.docker.internal
```

### Prerequisites

PostgreSQL with role `report`/password `report`, database `report_service`. Default admin credentials seeded on startup: `admin`/`admin` (configurable via `.env`).

## Architecture

### Backend

```
Router (FastAPI) → Services → External DBs
├── ReportExecutor   — loads SQL, substitutes named params (:date_from, :date_to),
│                      executes via asyncpg with 30s timeout, normalizes → JSON
└── DatasourceManager — manages asyncpg connection pools per external datasource
```

Key layers in `app/`:
- `api/` — route handlers. `deps.py` provides `get_current_user` and `require_admin` guards.
- `models/` — SQLAlchemy models (User, Report, Datasource)
- `schemas/` — Pydantic v2 request/response schemas. Always `from_attributes=True`, never expose passwords.
- `services/` — business logic. `seed.py` creates admin user on startup.
- `core/security.py` — JWT create/verify, bcrypt hashing
- `config.py` — `pydantic-settings` from `.env`
- `database.py` — async engine + session factory

API prefix: `/api/v1`. Roles: `admin` (full access), `viewer` (read reports only). See `backend/BRD.md` for complete API spec (15 endpoints).

### Frontend (Feature-Sliced Design)

```
pages → widgets → features → entities → shared  (import only downward)
```

- **entities/** — domain models + API calls (datasource, report, user). Each has `api/`, `model/`, `index.ts`.
- **features/** — reusable UI features: `report-chart`, `report-filters`, `report-summary`, `report-table`, `report-blocks`
- **widgets/** — layout components: `main-layout`, `auth-layout`, `report-renderer` (dispatches to correct visualization by report type)
- **pages/** — route-level: login, home, report-show, admin-reports, admin-datasources, admin-users
- **shared/** — API client (Axios at `/api/v1`), composables, config, lib utilities, base UI components

Component pattern: every component has `ComponentName.vue` (template) + `useComponentName.ts` (all logic as composable). Logic never lives directly in `<script setup>`.

Auto-imports configured (do NOT import manually): Vue composables, Vue Router, Pinia, VueUse, Naive UI dialog/message/notification/loadingBar, and all `src/shared/composables/`. Naive UI components are also auto-imported.

SCSS: settings/tokens auto-injected globally. Use CSS custom properties (`var(--bg-card)`, `var(--text-2)`, etc.) for theming — never hardcode hex colors.

Report visualization types: `table` → ReportTable, `bar_chart`/`pie_chart`/`scatter_plot` → ReportChart (ECharts). `ReportRenderer` widget selects the correct one.

## Workflow Rules

### Backend: after any API change (add/remove/modify route or body)

1. Update `backend/static/index.html` (API docs page)
2. Update `backend/BRD.md` (section 5 API + section 9 summary table)
3. Commit with descriptive message tying code + docs changes

### Frontend: before starting work

Read `backend/BRD.md` to understand the current API contract.

### Commit messages (both projects)

```
<type>(<scope>): <short description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`, `test`. Each subproject has its own git repo — commit separately with messages that identify cross-project correlation.

## Known Limitations

- No SPA catch-all fallback in backend: hard refresh on deep links (e.g. `/reports/123`) returns 404. In-app navigation works fine.
- `publish/` frontend build uses base path `/static/` — the backend serves the SPA's `index.html` at `/` and static assets from `/static`.
