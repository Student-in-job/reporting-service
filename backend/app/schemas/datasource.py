from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


class DatasourceCreate(BaseModel):
    name: str
    host: str
    port: int = 5432
    database: str
    username: str
    password: str
    is_active: bool = True


class DatasourceUpdate(BaseModel):
    name: str | None = None
    host: str | None = None
    port: int | None = None
    database: str | None = None
    username: str | None = None
    password: str | None = None
    is_active: bool | None = None


class DatasourceOut(BaseModel):
    id: UUID
    name: str
    host: str
    port: int
    database: str
    username: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DatasourceListOut(BaseModel):
    datasources: list[DatasourceOut]


class DatasourceTestOut(BaseModel):
    status: str
    response_time_ms: int | None = None
    detail: str | None = None
