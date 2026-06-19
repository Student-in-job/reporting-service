from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.exceptions import StarletteHTTPException

from app.api.auth import router as auth_router
from app.api.reports import router as reports_router
from app.api.admin.reports import router as admin_reports_router
from app.api.admin.datasources import router as admin_datasources_router
from app.api.admin.users import router as admin_users_router
from app.services.seed import seed_admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    await seed_admin()
    yield


app = FastAPI(title="Report Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(reports_router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(admin_reports_router, prefix="/api/v1/admin/reports", tags=["admin:reports"])
app.include_router(admin_datasources_router, prefix="/api/v1/admin/datasources", tags=["admin:datasources"])
app.include_router(admin_users_router, prefix="/api/v1/admin/users", tags=["admin:users"])


STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.exception_handler(StarletteHTTPException)
async def spa_fallback(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404 and not request.url.path.startswith("/api/"):
        return FileResponse(STATIC_DIR / "index.html")
    raise exc
