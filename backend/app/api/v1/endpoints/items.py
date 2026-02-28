from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.item_repository import ItemRepository
from app.schemas.item import (
    AdjustPayload,
    ItemCreate,
    ItemResponse,
    ItemUpdate,
    MovePayload,
    PaginatedItems,
    StatusPayload,
)
from app.services.inventory_service import InventoryService

router = APIRouter()


@router.get("", response_model=PaginatedItems)
async def list_items(
    item_type: str | None = None,
    category: str | None = None,
    status: str | None = None,
    container_id: UUID | None = None,
    low_stock: bool = False,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    repo = ItemRepository(db)
    items, total = await repo.list_items(
        item_type=item_type,
        category=category,
        status=status,
        container_id=container_id,
        low_stock=low_stock,
        search=search,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return PaginatedItems(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=ItemResponse, status_code=201)
async def create_item(
    data: ItemCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    return await svc.create_item(data)


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    repo = ItemRepository(db)
    item = await repo.get_by_id(item_id)
    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.patch("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: UUID,
    data: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    return await svc.update_item(item_id, data.model_dump(exclude_unset=True))


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    await svc.delete_item(item_id)


@router.post("/{item_id}/adjust", response_model=ItemResponse)
async def adjust_quantity(
    item_id: UUID,
    payload: AdjustPayload,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    return await svc.adjust_quantity(item_id, payload)


@router.patch("/{item_id}/status", response_model=ItemResponse)
async def change_status(
    item_id: UUID,
    payload: StatusPayload,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    return await svc.change_status(item_id, payload)


@router.patch("/{item_id}/move", response_model=ItemResponse)
async def move_item(
    item_id: UUID,
    payload: MovePayload,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    return await svc.move_item(item_id, payload)
