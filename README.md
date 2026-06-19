# Report Project (Paystep Analytics)

A web analytics/reporting service: an admin defines reports (SQL queries against
configured data sources) and end users run them with filters, viewing the
results as tables or charts and exporting them to Excel.

The repository contains two applications plus a set of build scripts that
assemble a self-contained, runnable bundle in the `publish/` folder.

---

## Projects

### Frontend (`frontend/`)

| | |
|---|---|
| **Platform** | Single-page web application (browser) |
| **Language** | TypeScript |
| **Framework** | Vue 3 (Composition API, `<script setup>`) |
| **Build tool** | Vite 8 |
| **UI library** | Naive UI |
| **State / data** | Pinia, TanStack Vue Query, Axios |
| **Charts** | ECharts (via `vue-echarts`) |
| **Routing** | Vue Router |
| **Styling** | SCSS (sass-embedded) with auto-injected design tokens |
| **Validation** | Zod |
| **Architecture** | Feature-Sliced Design (`shared` → `entities` → `features` → `widgets` → `pages`) |
| **Tooling** | ESLint + oxlint, Prettier |

The build output is a static site (`index.html` + hashed JS/CSS + assets). It is
built with a public base path of `/static/` so it can be served by the backend
under `/static`. The browser talks to the API at the relative path `/api/v1`.

### Backend (`backend/`)

| | |
|---|---|
| **Platform** | HTTP API service (ASGI) |
| **Language** | Python 3.11+ (Docker image uses 3.12) |
| **Framework** | FastAPI |
| **Server** | Uvicorn |
| **ORM** | SQLAlchemy 2 (async) + asyncpg driver |
| **Migrations** | Alembic |
| **Schemas** | Pydantic v2 / pydantic-settings |
| **Auth** | JWT (python-jose) with bcrypt password hashing (passlib) |
| **Excel export** | openpyxl |
| **Database** | PostgreSQL |

The API is served under `/api/v1`. On startup it seeds an admin user and (when
run via the entrypoint) applies migrations. It also serves the built frontend:
the static folder is mounted at `/static` and `/` returns the SPA's `index.html`.

---

## Infrastructure

- **PostgreSQL** — the application's own configuration/data store.
- **Docker** — both apps have Dockerfiles. The frontend image is a multi-stage
  build (Node 22 → nginx); nginx serves the SPA and proxies `/api` to the
  backend (backend host/port come from env via the nginx entrypoint).
- **Docker Compose** (`docker/docker-compose.yml`) — runs `backend` + `frontend`
  together. It expects PostgreSQL to be running on the **host** machine and
  reaches it from the backend container via `host.docker.internal`.

---

## Repository layout

```
.
├─ frontend/      Vue 3 + Vite SPA
├─ backend/       FastAPI service (app/, alembic/, ...)
├─ docker/        docker-compose.yml (runs both apps)
├─ scripts/       Build/publish scripts + DB export utility (see below)
├─ publish/       Generated runnable bundle (frontend build + backend + venv)
└─ docs/
```

---

## Prerequisites

- **Docker Desktop** — required by the build scripts. The frontend is built
  inside a Node 22 container, so **no local Node.js install is needed**.
- **Python 3.11+** on the host — used once to bootstrap the virtual environment.
- **PostgreSQL** running locally with:
  - role **`report`** / password **`report`**
  - database **`report_service`**

  Quick setup (psql):

  ```sql
  CREATE ROLE report WITH LOGIN PASSWORD 'report';
  CREATE DATABASE report_service OWNER report;
  ```

---

## Build & publish scripts (`scripts/`)

Every script is available in two formats — `.ps1` (PowerShell 5.1+) and `.bat`
(CMD) — with identical behavior. All scripts resolve paths relative to the
project root, so they can be run from any working directory.

| Script | What it does |
|---|---|
| `install-environment` | Creates a Python virtual environment at `publish/venv` and installs the backend dependencies from `backend/requirements.txt`. Pass `-Recreate` (PS) or `recreate` (CMD) to rebuild from scratch. |
| `build-frontend` | Builds the SPA in a Node 22 Docker container (`vite build --base=/static/`) and writes the static output to `publish/static`. |
| `build-backend` | Copies the backend (`app/`, `alembic/`, `alembic.ini`, `requirements.txt`, `entrypoint.sh`, `.env`) into `publish/`. Merges `backend/static` into `publish/static` (the backend's `index.html` is copied as `api-reference.html` so it doesn't overwrite the SPA). Rewrites the published `.env`'s `DATABASE_URL` host to `localhost` for local runs. |
| `build-clean` | Removes everything from `publish/` **except** `publish/venv` (the slow-to-recreate environment), for a fresh publish. |
| `export.py` | Exports all configuration data (datasources, users, reports) from the `report_service` database to `export.dat` as SQL (TRUNCATE + INSERT in FK-safe order). Re-import with `psql -d report_service -f export.dat`. |

### Recommended sequence

First-time setup (or whenever `requirements.txt` changes):

```powershell
# PowerShell
.\scripts\install-environment.ps1

# CMD
scripts\install-environment.bat
```

Then, to produce / refresh the bundle:

```powershell
# PowerShell
.\scripts\build-clean.ps1       # optional: wipe publish (keeps venv)
.\scripts\build-frontend.ps1    # SPA -> publish/static
.\scripts\build-backend.ps1     # backend -> publish/ (+ .env to localhost)

# CMD
scripts\build-clean.bat
scripts\build-frontend.bat
scripts\build-backend.bat
```

After this, `publish/` contains:

```
publish/
├─ app/  alembic/  alembic.ini  requirements.txt  entrypoint.sh  .env   ← backend
├─ static/    index.html + assets/ (SPA)  +  api-reference.html         ← frontend + API docs
└─ venv/                                                                ← Python environment
```

Useful overrides:

- `build-frontend.ps1 -Base '/'` or `build-frontend.bat /` — build for serving at the site root instead of `/static/`.
- `build-backend.ps1 -DatabaseUrl '<full url>'` or `build-backend.bat "<full url>"` — set an explicit `DATABASE_URL` in the published `.env`.

### Database export / import

Export the current configuration data to SQL:

```powershell
# From repo root, with publish venv active (or any env with asyncpg)
python scripts/export.py                        # reads DATABASE_URL from publish/.env or backend/.env
python scripts/export.py --url "postgresql://report:report@localhost:5432/report_service"
python scripts/export.py --out path/to/out.dat  # custom output path
```

Re-import on another machine:

```bash
psql -d report_service -f export.dat
```

---

## Running the published bundle locally

Make sure PostgreSQL is running with the role/database from
[Prerequisites](#prerequisites). Then, from the repo root:

```powershell
cd publish
.\venv\Scripts\Activate.ps1          # PowerShell
# or: venv\Scripts\activate.bat      # CMD

# Apply database migrations (first run / after schema changes)
alembic upgrade head

# Start the API + SPA
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Then open:

- **App (SPA):** http://localhost:8000/
- **API base:** http://localhost:8000/api/v1
- **API reference page:** http://localhost:8000/static/api-reference.html

Default admin credentials are seeded on startup: **`admin` / `admin`**
(configurable via `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `publish/.env`).

> Note: the backend serves the SPA's `index.html` at `/`, but it does not yet
> have a catch-all fallback for client-side routes, so a hard refresh on a deep
> link (e.g. `/reports/123`) may 404. Navigating within the app works.

---

## Running with Docker (alternative)

This runs both apps in containers and still uses your **host** PostgreSQL.

```powershell
docker compose -f docker/docker-compose.yml up --build
```

- **Frontend (nginx):** http://localhost:8080/
- **Backend (API):** http://localhost:8000/

The backend container reaches host PostgreSQL via `host.docker.internal`
(configured in `backend/.env`). Tear down with:

```powershell
docker compose -f docker/docker-compose.yml down
```
