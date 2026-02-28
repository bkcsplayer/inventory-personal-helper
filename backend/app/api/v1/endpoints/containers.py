from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.container_repository import ContainerRepository
from app.schemas.container import (
    ContainerCreate,
    ContainerDetail,
    ContainerResponse,
    ContainerUpdate,
)
from app.services.inventory_service import InventoryService

router = APIRouter()


@router.get("", response_model=list[ContainerResponse])
async def list_containers(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    repo = ContainerRepository(db)
    return await repo.list_all()


@router.post("", response_model=ContainerResponse, status_code=201)
async def create_container(
    data: ContainerCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    repo = ContainerRepository(db)
    return await repo.create(**data.model_dump())


@router.get("/{container_id}", response_model=ContainerDetail)
async def get_container(
    container_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    repo = ContainerRepository(db)
    container = await repo.get_detail(container_id)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    return container


@router.patch("/{container_id}", response_model=ContainerResponse)
async def update_container(
    container_id: UUID,
    data: ContainerUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    repo = ContainerRepository(db)
    container = await repo.get_by_id(container_id)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    return await repo.update(container, **data.model_dump(exclude_unset=True))


@router.delete("/{container_id}", status_code=204)
async def delete_container(
    container_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    svc = InventoryService(db)
    await svc.delete_container(container_id)
