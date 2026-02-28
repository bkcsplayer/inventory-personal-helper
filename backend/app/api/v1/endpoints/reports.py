from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.item_repository import ItemRepository
from app.schemas.item import ItemResponse

router = APIRouter()


@router.get("/low-stock", response_model=list[ItemResponse])
async def low_stock_report(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    repo = ItemRepository(db)
    return await repo.get_low_stock()


@router.get("/idle-assets", response_model=list[ItemResponse])
async def idle_assets_report(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    repo = ItemRepository(db)
    return await repo.get_by_status("idle")


@router.get("/loaned", response_model=list[ItemResponse])
async def loaned_report(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    repo = ItemRepository(db)
    return await repo.get_by_status("loaned")


@router.get("/summary")
async def summary_report(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    repo = ItemRepository(db)
    return await repo.get_summary()
