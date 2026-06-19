from enum import Enum
from uuid import UUID
from datetime import datetime, date
from typing import Any

from pydantic import BaseModel


class ReportType(str, Enum):
    TABLE = "table"
    PIE_CHART = "pie_chart"
    SCATTER_PLOT = "scatter_plot"
    BAR_CHART = "bar_chart"
    HORIZONTAL_STACK = "horizontal_stack"
    VERTICAL_STACK = "vertical_stack"
    BLOCK_CHART = "block_chart"


# --- Public ---

class ReportListItem(BaseModel):
    id: UUID
    slug: str
    name: str
    description: str | None = None
    group: str | None = None
    type: ReportType = ReportType.TABLE
    filters: list[dict] = []

    model_config = {"from_attributes": True}


class ReportListOut(BaseModel):
    reports: list[ReportListItem]


class ReportDataRequest(BaseModel):
    date_from: date
    date_to: date
    filters: dict[str, Any] = {}


class ColumnDef(BaseModel):
    key: str
    label: str
    type: str  # string, number, date, datetime, boolean


class ReportDataOut(BaseModel):
    report_id: UUID
    slug: str
    title: str
    type: ReportType = ReportType.TABLE
    columns: list[ColumnDef]
    data: list[dict[str, Any]]
    totals: dict[str, Any] | None = None
    meta: dict[str, Any]


# --- Admin ---

class AnalyzeSqlRequest(BaseModel):
    datasource_id: UUID
    sql_query: str


class AnalyzeSqlOut(BaseModel):
    columns: list[ColumnDef]


class ReportCreate(BaseModel):
    slug: str
    name: str
    description: str | None = None
    group: str | None = None
    type: ReportType = ReportType.TABLE
    datasource_id: UUID
    sql_query: str
    config: dict = {}


class ReportUpdate(BaseModel):
    slug: str | None = None
    name: str | None = None
    description: str | None = None
    group: str | None = None
    type: ReportType | None = None
    datasource_id: UUID | None = None
    sql_query: str | None = None
    config: dict | None = None
    is_active: bool | None = None


class ReportAdminOut(BaseModel):
    id: UUID
    slug: str
    name: str
    description: str | None = None
    group: str | None = None
    type: ReportType = ReportType.TABLE
    datasource_id: UUID
    sql_query: str
    config: dict
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
