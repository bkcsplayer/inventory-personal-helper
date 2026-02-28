from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.container_repository import ContainerRepository
from app.repositories.item_repository import ItemRepository
from app.schemas.item import AdjustPayload, ItemCreate, MovePayload, StatusPayload


class InventoryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.item_repo = ItemRepository(db)
        self.container_repo = ContainerRepository(db)

    async def create_item(self, data: ItemCreate):
        payload = data.model_dump()
        if payload["item_type"] == "asset":
            payload["quantity"] = Decimal("1")
            payload["min_stock"] = None
        return await self.item_repo.create(**payload)

    async def update_item(self, item_id: UUID, data: dict):
        item = await self._get_item_or_404(item_id)
        update_data = {k: v for k, v in data.items() if v is not None}
        if item.item_type == "asset" and "quantity" in update_data:
            update_data["quantity"] = Decimal("1")
        return await self.item_repo.update(item, **update_data)

    async def delete_item(self, item_id: UUID):
        item = await self._get_item_or_404(item_id)
        if await self.item_repo.has_children(item_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete item with child dependencies. Remove children first.",
            )
        await self.item_repo.delete(item)

    async def adjust_quantity(self, item_id: UUID, payload: AdjustPayload):
        item = await self._get_item_or_404(item_id)
        if item.item_type == "asset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot adjust quantity for asset type items.",
            )
        new_qty = item.quantity + payload.delta
        if new_qty < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Current: {item.quantity}, delta: {payload.delta}",
            )
        return await self.item_repo.update(item, quantity=new_qty)

    async def change_status(self, item_id: UUID, payload: StatusPayload):
        item = await self._get_item_or_404(item_id)
        if payload.status == "loaned" and not payload.assigned_to:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="assigned_to is required when status is 'loaned'.",
            )
        return await self.item_repo.update(
            item, status=payload.status, assigned_to=payload.assigned_to
        )

    async def move_item(self, item_id: UUID, payload: MovePayload):
        item = await self._get_item_or_404(item_id)
        update_data = {}
        if payload.container_id is not None:
            container = await self.container_repo.get_by_id(payload.container_id)
            if not container:
                raise HTTPException(status_code=404, detail="Target container not found.")
            update_data["container_id"] = payload.container_id
        else:
            update_data["container_id"] = None

        if payload.parent_item_id is not None:
            parent = await self.item_repo.get_by_id(payload.parent_item_id)
            if not parent:
                raise HTTPException(status_code=404, detail="Target parent item not found.")
            if payload.parent_item_id == item_id:
                raise HTTPException(status_code=400, detail="Item cannot be its own parent.")
            update_data["parent_item_id"] = payload.parent_item_id
        else:
            update_data["parent_item_id"] = None

        return await self.item_repo.update(item, **update_data)

    async def delete_container(self, container_id: UUID):
        container = await self.container_repo.get_by_id(container_id)
        if not container:
            raise HTTPException(status_code=404, detail="Container not found.")
        if await self.container_repo.has_items(container_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete non-empty container. Remove items first.",
            )
        if await self.container_repo.has_children(container_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete container with child containers.",
            )
        await self.container_repo.delete(container)

    async def _get_item_or_404(self, item_id: UUID):
        item = await self.item_repo.get_by_id(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found.")
        return item
