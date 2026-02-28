from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.container import Container
from app.models.item import Item


class ContainerRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> Container:
        container = Container(**kwargs)
        self.db.add(container)
        await self.db.flush()
        await self.db.refresh(container)
        return container

    async def get_by_id(self, container_id: UUID) -> Container | None:
        return await self.db.get(Container, container_id)

    async def get_detail(self, container_id: UUID) -> Container | None:
        q = (
            select(Container)
            .where(Container.id == container_id)
            .options(selectinload(Container.items), selectinload(Container.children))
        )
        result = await self.db.execute(q)
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Container]:
        q = select(Container).order_by(Container.name)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def update(self, container: Container, **kwargs) -> Container:
        for key, value in kwargs.items():
            if value is not None:
                setattr(container, key, value)
        await self.db.flush()
        await self.db.refresh(container)
        return container

    async def delete(self, container: Container) -> None:
        await self.db.delete(container)
        await self.db.flush()

    async def has_items(self, container_id: UUID) -> bool:
        q = select(func.count()).select_from(Item).where(Item.container_id == container_id)
        count = (await self.db.execute(q)).scalar() or 0
        return count > 0

    async def has_children(self, container_id: UUID) -> bool:
        q = (
            select(func.count())
            .select_from(Container)
            .where(Container.parent_container_id == container_id)
        )
        count = (await self.db.execute(q)).scalar() or 0
        return count > 0

    async def get_by_qr_code(self, qr_code_id: str) -> Container | None:
        q = (
            select(Container)
            .where(Container.qr_code_id == qr_code_id)
            .options(selectinload(Container.items))
        )
        result = await self.db.execute(q)
        return result.scalar_one_or_none()
