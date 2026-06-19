# Project Analysis

**Date:** 2026-06-18

---

## Backend (Python / FastAPI)

**Stack:** FastAPI + SQLAlchemy async + asyncpg + Alembic + PostgreSQL, JWT via python-jose, bcrypt passwords.

### Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── datasources.py
│   │   │   ├── reports.py
│   │   │   └── users.py
│   │   ├── auth.py
│   │   ├── deps.py
│   │   └── reports.py
│   ├── core/
│   │   └── security.py       # JWT creation/verification, bcrypt hashing
│   ├── models/
│   │   ├── datasource.py
│   │   ├── report.py
│   │   └── user.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── datasource.py
│   │   ├── report.py
│   │   └── user.py
│   ├── services/
│   │   ├── datasource_manager.py   # Connection pool management
│   │   ├── report_executor.py      # SQL execution + result normalization
│   │   └── seed.py                 # Admin user seeding on startup
│   ├── config.py
│   ├── database.py
│   └── main.py
├── alembic/
├── static/
│   └── index.html            # API docs
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── BRD.md
```

### Actual Endpoints (20 total)

| # | Method | Endpoint | Role | Notes |
|---|--------|----------|------|-------|
| 1 | POST | `/api/v1/auth/login` | * | Returns JWT |
| 2 | GET | `/api/v1/auth/me` | auth | Current user info |
| 3 | GET | `/api/v1/reports` | viewer+ | List active reports |
| 4 | POST | `/api/v1/reports/{id}/data` | viewer+ | Execute report |
| 5 | POST | `/api/v1/reports/{id}/export` | viewer+ | **⚠ Not in BRD** — Excel export via openpyxl |
| 6 | POST | `/api/v1/admin/reports/analyze-sql` | admin | Auto-analyze SQL columns |
| 7 | GET | `/api/v1/admin/reports/{id}` | admin | Full report info incl. SQL |
| 8 | POST | `/api/v1/admin/reports` | admin | Create report |
| 9 | PUT | `/api/v1/admin/reports/{id}` | admin | Update report |
| 10 | DELETE | `/api/v1/admin/reports/{id}` | admin | Soft-delete (is_active=false) |
| 11 | POST | `/api/v1/admin/reports/{id}/test` | admin | Test SQL with LIMIT 10 |
| 12 | GET | `/api/v1/admin/datasources` | admin | List datasources |
| 13 | POST | `/api/v1/admin/datasources` | admin | Add datasource |
| 14 | PUT | `/api/v1/admin/datasources/{id}` | admin | Update datasource |
| 15 | DELETE | `/api/v1/admin/datasources/{id}` | admin | Hard-delete (409 if reports linked) |
| 16 | POST | `/api/v1/admin/datasources/{id}/test` | admin | Test connection (SELECT 1) |
| 17 | GET | `/api/v1/admin/users` | admin | **⚠ Not in BRD** — List users |
| 18 | POST | `/api/v1/admin/users` | admin | **⚠ Not in BRD** — Create user |
| 19 | PUT | `/api/v1/admin/users/{id}` | admin | **⚠ Not in BRD** — Update user |
| 20 | DELETE | `/api/v1/admin/users/{id}` | admin | **⚠ Not in BRD** — Deactivate user (soft) |

### Key Observations

- **Soft deletes** for Users and Reports (`is_active = false`); **hard delete** for Datasources with a 409 guard if active reports are linked.
- **Password security:** bcrypt hashing, passwords never returned in any response.
- **SQL injection protection:** Parameterized queries via asyncpg named placeholders (`:param`).
- **Connection pools:** DatasourceManager recreates pools on datasource create/update.
- **Excel export:** `POST /reports/{id}/export` uses openpyxl with styled headers, auto-column widths, and frozen header row — returns a `.xlsx` stream.
- **CORS:** Currently `allow_origins=["*"]` — should be restricted for production.

---

## Frontend (Vue 3 / TypeScript)

**Stack:** Vue 3 + Vite + TypeScript, Naive UI, Pinia, TanStack Vue Query, ECharts (vue-echarts), Zod, dayjs, axios, SCSS.

### Architecture — Feature-Sliced Design (FSD)

```
frontend/src/
├── app/
│   ├── providers/            # Theme, palette, error toast bridge
│   └── styles/               # SCSS design tokens (spacing, colors, typography, breakpoints, z-index)
├── entities/
│   ├── datasource/           # API client + types
│   ├── report/               # API client + types + format helpers
│   └── user/                 # API client + Pinia store + types
├── features/
│   ├── report-chart/         # ECharts wrapper, buildChartOption, color palette
│   ├── report-filters/       # Filter bar UI + date presets
│   ├── report-summary/       # Totals summary card
│   └── report-table/         # Data table rendering
├── pages/
│   ├── login/
│   ├── home/
│   ├── report-show/
│   ├── admin-reports/
│   ├── admin-datasources/
│   └── admin-users/
├── widgets/
│   ├── auth-layout/
│   ├── main-layout/          # Sidebar + reports menu
│   └── report-renderer/      # Orchestrates chart/table/filters/summary
├── router/
│   └── routes/               # auth.routes, reports.routes, admin.routes
└── shared/
    ├── api/                  # axios instance, interceptors, token management, ApiError
    ├── composables/          # useSidebar, useTheme
    ├── config/               # env, routes, UI constants
    ├── lib/                  # date, number formatters
    └── ui/                   # AppLogo, AppThemeToggle
```

### Key Patterns

- **Page composables:** Every page has a `useXxxPage.ts` that owns all state, queries, and mutations. Vue components are thin wrappers.
- **Server state:** TanStack Vue Query for caching, invalidation, and loading states. No manual fetch/loading boilerplate.
- **Form validation:** Naive UI form rules (`FormRules`) with computed rules (create vs. edit mode differ in required fields).
- **Chart rendering:** ECharts is isolated in `features/report-chart`; `buildChartOption.ts` maps report type (`bar_chart`, `pie_chart`, `scatter_plot`) to ECharts options.
- **Token management:** JWT stored and attached via axios interceptors in `shared/api/`.

### Pages Summary

| Page | Route | Role | Description |
|------|-------|------|-------------|
| LoginPage | `/login` | * | Username/password form |
| HomePage | `/` | auth | Landing / redirect |
| ReportShowPage | `/reports/:id` | viewer+ | Filters → execute → chart/table/summary |
| AdminReportsPage | `/admin/reports` | admin | CRUD for reports |
| AdminDatasourcesPage | `/admin/datasources` | admin | CRUD for datasources |
| AdminUsersPage | `/admin/users` | admin | CRUD for users |

---

## Cross-Cutting Issues

| # | Issue | Severity |
|---|-------|----------|
| 1 | `POST /reports/{id}/export` missing from BRD and `static/index.html` | Medium |
| 2 | Entire `/admin/users` CRUD missing from BRD and `static/index.html` | High |
| 3 | CORS `allow_origins=["*"]` — should be locked to frontend origin in production | Medium |
| 4 | `ReportListItem` schema — verify `type` field is included (needed by frontend for routing/icons per BRD) | Low |

---

## Dependency Versions (notable)

| Package | Version |
|---------|---------|
| Python | 3.12+ |
| FastAPI | ≥0.110.0 |
| SQLAlchemy | ≥2.0.30 |
| asyncpg | ≥0.29.0 |
| Pydantic | ≥2.7.0 |
| Vue | ^3.5.32 |
| Vite | ^8.0.10 |
| TypeScript | ~6.0.2 |
| Naive UI | ^2.44.1 |
| ECharts | ^6.0.0 |
| TanStack Vue Query | ^5.100.5 |
