from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.item import Item


class ItemRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> Item:
        item = Item(**kwargs)
        self.db.add(item)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def get_by_id(self, item_id: UUID) -> Item | None:
        return await self.db.get(Item, item_id)

    async def list_items(
        self,
        *,
        item_type: str | None = None,
        category: str | None = None,
        status: str | None = None,
        container_id: UUID | None = None,
        low_stock: bool = False,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "updated_at",
        sort_order: str = "desc",
    ) -> tuple[list[Item], int]:
        query = select(Item)
        count_query = select(func.count()).select_from(Item)

        filters = []
        if item_type:
            filters.append(Item.item_type == item_type)
        if category:
            cats = [c.strip() for c in category.split(",")]
            filters.append(Item.category.in_(cats))
        if status:
            statuses = [s.strip() for s in status.split(",")]
            filters.append(Item.status.in_(statuses))
        if container_id:
            filters.append(Item.container_id == container_id)
        if low_stock:
            filters.append(Item.min_stock.isnot(None))
            filters.append(Item.quantity < Item.min_stock)
        if search:
            term = f"%{search}%"
            filters.append(
                or_(
                    Item.name.ilike(term),
                    Item.sku.ilike(term),
                    Item.barcode.ilike(term),
                )
            )

        for f in filters:
            query = query.where(f)
            count_query = count_query.where(f)

        total = (await self.db.execute(count_query)).scalar() or 0

        sort_col = getattr(Item, sort_by, Item.updated_at)
        if sort_order == "asc":
            query = query.order_by(sort_col.asc())
        else:
            query = query.order_by(sort_col.desc())

        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def update(self, item: Item, **kwargs) -> Item:
        for key, value in kwargs.items():
            if value is not None:
                setattr(item, key, value)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def delete(self, item: Item) -> None:
        await self.db.delete(item)
        await self.db.flush()

    async def has_children(self, item_id: UUID) -> bool:
        q = select(func.count()).select_from(Item).where(Item.parent_item_id == item_id)
        count = (await self.db.execute(q)).scalar() or 0
        return count > 0

    async def get_low_stock(self) -> list[Item]:
        q = (
            select(Item)
            .where(Item.item_type == "consumable")
            .where(Item.min_stock.isnot(None))
            .where(Item.quantity < Item.min_stock)
            .order_by(Item.name)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get_by_status(self, status: str) -> list[Item]:
        q = select(Item).where(Item.status == status).order_by(Item.name)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get_summary(self) -> dict:
        total_q = select(func.count()).select_from(Item)
        total = (await self.db.execute(total_q)).scalar() or 0

        value_q = select(func.sum(Item.unit_price * Item.quantity)).select_from(Item)
        total_value = (await self.db.execute(value_q)).scalar() or Decimal("0")

        cat_q = select(Item.category, func.count()).group_by(Item.category)
        cat_result = await self.db.execute(cat_q)
        by_category = {row[0]: row[1] for row in cat_result.all()}

        type_q = select(Item.item_type, func.count()).group_by(Item.item_type)
        type_result = await self.db.execute(type_q)
        by_type = {row[0]: row[1] for row in type_result.all()}

        status_q = select(Item.status, func.count()).group_by(Item.status)
        status_result = await self.db.execute(status_q)
        by_status = {row[0]: row[1] for row in status_result.all()}

        return {
            "total_items": total,
            "total_value": float(total_value),
            "by_category": by_category,
            "by_type": by_type,
            "by_status": by_status,
        }
