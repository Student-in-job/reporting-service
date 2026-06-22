# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Paystep Analytics** — a BI/reporting service. Admins define SQL reports against external PostgreSQL databases; end users run them with filters, viewing results as tables/charts and exporting to Excel.

Monorepo with working projects, original references, and supporting directories:

| Folder | What | Editable? |
|--------|------|-----------|
| `backend/` | FastAPI API service — **working project** | Yes — all backend work happens here |
| `frontend/` | Vue 3 SPA — **working project** | Yes — all frontend work happens here |
| `backend-company-repo/` | Original backend reference | **Read-only** — scan to check differences only |
| `frontend-company-repo/` | Original frontend reference | **Read-only** — scan to check differences only |
| `publish/` | Generated runnable bundle | Do not edit — produced by `scripts/` |

**Stack:** Backend — Python 3.12+, SQLAlchemy 2 (async), asyncpg, Alembic, Pydantic v2, JWT auth. Frontend — TypeScript, Vite 8, Naive UI, Pinia, TanStack Vue Query, ECharts, SCSS.

---

## 1. Git Workflow

### Branching

Each working repo (`backend/`, `frontend/`) has its own `.git` with three branches: `dev`, `staging` (if exists), and `master`.

**Rules:**
- All changes MUST be made on the `dev` branch
- Push changes to the remote `dev` branch when a task is complete
- NEVER push to `master` — merges to master are done manually by the project owner
- Always pull latest `dev` before starting work

### Commit Messages — Conventional Commits

Format: `<type>(<scope>): <short description>`

**Types:**
| Type | Use |
|------|-----|
| `feat` | New feature or endpoint |
| `fix` | Bug fix |
| `refactor` | Code restructure, no behavior change |
| `docs` | Documentation only (BRD, API docs, README) |
| `style` | Formatting, whitespace, linting (no logic) |
| `chore` | Build, deps, config changes |
| `test` | Adding or fixing tests |

**Scope** should reflect the module affected. Examples:
- Backend: `auth`, `reports`, `admin/reports`, `admin/datasources`, `services`, `models`, `schemas`
- Frontend: `report-chart`, `report-filters`, `admin-reports`, `shared/api`, `router`

**Examples:**
```
feat(admin/reports): add analyze-sql endpoint
fix(reports): handle slug lookup in data endpoint
docs(api): update BRD and static docs for datasource DELETE 409 rule
refactor(shared/api): extract error handler to separate module
```

### Cross-Repo Correlation

When a change spans both repos, use matching scope/description so commits are traceable:
```
# Backend
feat(admin/users): add PATCH role endpoint

# Frontend
feat(admin-users): add role change UI for PATCH role endpoint
```

---

## 2. Build & Run Commands

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

Run published bundle: `cd publish; .\venv\Scripts\Activate.ps1; alembic upgrade head; uvicorn app.main:app --host 0.0.0.0 --port 8080`

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

---

## 3. Architecture

### Backend

```
Router (FastAPI) → Services → External DBs
├── ReportExecutor   — loads SQL, substitutes named params (:date_from, :date_to),
│                      executes via asyncpg with 30s timeout, normalizes → JSON
└── DatasourceManager — manages asyncpg connection pools per external datasource
```

Key layers in `app/`:
- `api/` — route handlers only, no business logic. `deps.py` provides `get_current_user` and `require_admin` guards.
- `models/` — SQLAlchemy models (User, Report, Datasource)
- `schemas/` — Pydantic v2 request/response schemas. Always `from_attributes=True`, never expose passwords.
- `services/` — business logic. `seed.py` creates admin user on startup.
- `core/security.py` — JWT create/verify, bcrypt hashing
- `config.py` — `pydantic-settings` from `.env`
- `database.py` — async engine + session factory

API prefix: `/api/v1`. Roles: `admin` (full access), `viewer` (read reports only). See `backend/BRD.md` for complete API spec.

### Original Repos (Reference Only)

`backend-company-repo/` and `frontend-company-repo/` contain the original codebase. **Never edit these.** Use them only to scan and compare differences against the working `backend/` and `frontend/` folders.

### Frontend (Feature-Sliced Design)

```
pages → widgets → features → entities → shared  (import only downward)
```

- **entities/** — domain models + API calls (datasource, report, user). Each has `api/`, `model/`, `index.ts`.
- **features/** — reusable UI features: `report-chart`, `report-filters`, `report-summary`, `report-table`, `report-blocks`
- **widgets/** — layout components: `main-layout`, `auth-layout`, `report-renderer` (dispatches to correct visualization by report type)
- **pages/** — route-level: login, home, report-show, admin-reports, admin-datasources, admin-users
- **shared/** — API client (Axios at `/api/v1`), composables, config, lib utilities, base UI components

---

## 4. Backend Rules (FastAPI — Middle Developer)

### After ANY API Change (add/remove/modify route or request/response body):
1. Update `static/index.html` — regenerate API docs page
2. Update `BRD.md` — section 5 (API details) and section 9 (summary table)
3. Commit code + docs together

### Adding a New Endpoint
1. Add route to appropriate router in `app/api/`
2. Add/update Pydantic schemas in `app/schemas/`
3. Implement service logic in `app/services/` if needed
4. Update `BRD.md` (sections 5 and 9)
5. Regenerate `static/index.html`
6. Commit with `feat(<scope>)` message

### Code Conventions
- **Auth guards:** `Depends(get_current_user)` for any auth, `Depends(require_admin)` for admin-only
- **Schemas:** Pydantic v2 with `ConfigDict(from_attributes=True)`, never expose sensitive fields
- **DB access:** async SQLAlchemy sessions via `get_db` dependency
- **External DBs:** asyncpg pools via `DatasourceManager`, read-only
- **SQL execution:** named placeholders (`:param`), parameterized queries, 30s timeout
- **Error responses:** `{"detail": "message"}` with standard HTTP codes (400, 401, 403, 404, 409, 504)
- **Type hints** on all function signatures
- **Async everywhere** — no sync DB calls

---

## 5. Frontend Rules (Vue 3 + FSD)

### Before Starting Work
Read `backend/BRD.md` to understand current API surface.

### FSD Import Rules
Import direction is strictly **downward**: `pages → widgets → features → entities → shared`
- No upward imports. No cross-entity sibling imports.
- Each layer's `index.ts` is the public API — import from it, not internal paths.

### Component Pattern
Every feature/page/widget follows:
- `ComponentName.vue` — template + scoped styles
- `useComponentName.ts` — all logic as a composable
- Logic never lives directly in `<script setup>` beyond calling the composable

### Auto-Imports (do NOT import manually)
- Vue composables: `ref`, `computed`, `watch`, `onMounted`, etc.
- Vue Router: `useRouter`, `useRoute`
- Pinia: `defineStore`, `storeToRefs`
- VueUse composables
- Naive UI: `useDialog`, `useMessage`, `useNotification`, `useLoadingBar`
- All composables from `src/shared/composables/`
- Naive UI components (`NButton`, `NDataTable`, etc.)

### State Management
- **Server state:** TanStack Vue Query (`useQuery`, `useMutation`) — NOT Pinia
- **Client state:** Pinia stores (minimal, only truly global client state)

### Styling
- SCSS with scoped styles: `<style lang="scss" scoped>`
- Use CSS custom properties for colors: `var(--bg-card)`, `var(--text-2)`, `var(--border)`
- Never hardcode hex colors — use tokens from `_tokens.scss`

### API Layer
- All API calls through `api` from `@/shared/api`
- Base URL: `/api/v1`
- Auth token auto-injected by interceptor
- 401 → auto-logout; errors → toast via `ErrorToastBridge`

### Routing
- Use `RouteNames` enum from `shared/config/routes.ts`
- Always navigate by name: `router.push({ name: RouteNames.REPORTS_SHOW, params: { id } })`

### Code Quality
- TypeScript strict mode — no `any` unless absolutely necessary
- `yarn type-check` must pass before committing
- `yarn lint` must pass before committing

---

## 6. API Documentation Standards

### `static/index.html` (Backend)
- Must reflect ALL current endpoints with request/response examples
- Update immediately when any route changes

### `BRD.md` (Backend)
- Section 5: Full API documentation with request/response JSON examples
- Section 9: Summary table of all endpoints with method, path, and required role
- Keep endpoint count accurate

---

## 7. Security

- JWT auth with 24h lifetime
- Passwords hashed with bcrypt
- Datasource passwords stored encrypted, never returned in API
- External DB connections are read-only
- CORS configured in `main.py`
- SQL injection prevention via parameterized queries only

---

## 8. Known Limitations

- No SPA catch-all fallback in backend: hard refresh on deep links (e.g. `/reports/123`) returns 404. In-app navigation works fine.
- `publish/` frontend build uses base path `/static/` — the backend serves the SPA's `index.html` at `/` and static assets from `/static`.
