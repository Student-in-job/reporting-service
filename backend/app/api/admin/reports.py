from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.models.report import Report
from app.models.datasource import Datasource
from app.schemas.report import (
    ReportCreate,
    ReportUpdate,
    ReportAdminOut,
    ReportDataRequest,
    ReportDataOut,
    AnalyzeSqlRequest,
    AnalyzeSqlOut,
)
from app.services.report_executor import report_executor

router = APIRouter()


async def _get_datasource(db: AsyncSession, datasource_id: UUID) -> Datasource:
    result = await db.execute(select(Datasource).where(Datasource.id == datasource_id))
    ds = result.scalar_one_or_none()
    if ds is None:
        raise HTTPException(status_code=400, detail="Datasource not found")
    return ds


@router.post("/analyze-sql", response_model=AnalyzeSqlOut)
async def analyze_sql(
    body: AnalyzeSqlRequest, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
):
    """Analyze SQL query: execute with LIMIT 0, return auto-detected columns."""
    datasource = await _get_datasource(db, body.datasource_id)
    try:
        columns = await report_executor.analyze_sql(datasource, body.sql_query)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL analysis failed: {e}")
    return AnalyzeSqlOut(columns=columns)


@router.get("/{report_id}", response_model=ReportAdminOut)
async def get_report(report_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportAdminOut.model_validate(report)


@router.post("", response_model=ReportAdminOut, status_code=status.HTTP_201_CREATED)
async def create_report(
    body: ReportCreate, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
):
    datasource = await _get_datasource(db, body.datasource_id)

    config = body.config or {}

    # Auto-generate columns if not provided
    if not config.get("columns"):
        try:
            columns = await report_executor.analyze_sql(datasource, body.sql_query)
            config["columns"] = [c.model_dump() for c in columns]
        except Exception:
            pass  # columns will need to be set manually

    data = body.model_dump()
    data["config"] = config

    report = Report(**data)
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return ReportAdminOut.model_validate(report)


@router.put("/{report_id}", response_model=ReportAdminOut)
async def update_report(
    report_id: UUID,
    body: ReportUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    update_data = body.model_dump(exclude_unset=True)

    if "datasource_id" in update_data:
        await _get_datasource(db, update_data["datasource_id"])

    # Auto-regenerate columns if sql_query changed and columns not explicitly provided
    if "sql_query" in update_data:
        new_config = update_data.get("config", report.config or {})
        if not new_config.get("columns"):
            ds_id = update_data.get("datasource_id", report.datasource_id)
            ds_result = await db.execute(select(Datasource).where(Datasource.id == ds_id))
            datasource = ds_result.scalar_one_or_none()
            if datasource:
                try:
                    columns = await report_executor.analyze_sql(datasource, update_data["sql_query"])
                    new_config["columns"] = [c.model_dump() for c in columns]
                    update_data["config"] = new_config
                except Exception:
                    pass

    for key, value in update_data.items():
        setattr(report, key, value)

    await db.commit()
    await db.refresh(report)
    return ReportAdminOut.model_validate(report)


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    report.is_active = False
    await db.commit()


@router.post("/{report_id}/test", response_model=ReportDataOut)
async def test_report(
    report_id: UUID,
    body: ReportDataRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    ds_result = await db.execute(select(Datasource).where(Datasource.id == report.datasource_id))
    datasource = ds_result.scalar_one_or_none()
    if datasource is None:
        raise HTTPException(status_code=500, detail="Datasource not configured")

    params = {"date_from": body.date_from, "date_to": body.date_to, "extra_filters": body.filters}

    try:
        return await report_executor.execute(report, datasource, params, test_mode=True)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=504, detail=f"Query execution failed: {e}")
