from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.models.datasource import Datasource
from app.models.report import Report
from app.schemas.datasource import (
    DatasourceCreate,
    DatasourceUpdate,
    DatasourceOut,
    DatasourceListOut,
    DatasourceTestOut,
)
from app.services.datasource_manager import datasource_manager

router = APIRouter()


@router.get("", response_model=DatasourceListOut)
async def list_datasources(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    result = await db.execute(select(Datasource).order_by(Datasource.name))
    items = [DatasourceOut.model_validate(ds) for ds in result.scalars().all()]
    return DatasourceListOut(datasources=items)


@router.post("", response_model=DatasourceOut, status_code=status.HTTP_201_CREATED)
async def create_datasource(
    body: DatasourceCreate, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
):
    ds = Datasource(
        name=body.name,
        host=body.host,
        port=body.port,
        database=body.database,
        username=body.username,
        password_encrypted=body.password,
    )
    db.add(ds)
    await db.commit()
    await db.refresh(ds)
    return DatasourceOut.model_validate(ds)


@router.put("/{datasource_id}", response_model=DatasourceOut)
async def update_datasource(
    datasource_id: UUID,
    body: DatasourceUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Datasource).where(Datasource.id == datasource_id))
    ds = result.scalar_one_or_none()
    if ds is None:
        raise HTTPException(status_code=404, detail="Datasource not found")

    update_data = body.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["password_encrypted"] = update_data.pop("password")

    for key, value in update_data.items():
        setattr(ds, key, value)

    await db.commit()
    await db.refresh(ds)
    await datasource_manager.drop_pool(datasource_id)
    return DatasourceOut.model_validate(ds)


@router.delete("/{datasource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_datasource(
    datasource_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
):
    result = await db.execute(select(Datasource).where(Datasource.id == datasource_id))
    ds = result.scalar_one_or_none()
    if ds is None:
        raise HTTPException(status_code=404, detail="Datasource not found")

    # Check any linked reports (FK constraint won't allow delete even for inactive)
    count_result = await db.execute(
        select(func.count()).select_from(Report).where(Report.datasource_id == datasource_id)
    )
    if count_result.scalar() > 0:
        raise HTTPException(status_code=409, detail="Datasource has linked reports, delete them first")

    await datasource_manager.drop_pool(datasource_id)
    await db.delete(ds)
    await db.commit()


@router.post("/{datasource_id}/test", response_model=DatasourceTestOut)
async def test_datasource(
    datasource_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
):
    result = await db.execute(select(Datasource).where(Datasource.id == datasource_id))
    ds = result.scalar_one_or_none()
    if ds is None:
        raise HTTPException(status_code=404, detail="Datasource not found")

    ok, ms, detail = await datasource_manager.test_connection(ds)
    if ok:
        return DatasourceTestOut(status="ok", response_time_ms=ms)
    return DatasourceTestOut(status="error", response_time_ms=ms, detail=detail)
