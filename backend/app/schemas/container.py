from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ContainerCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: str | None = None
    location: str | None = None
    qr_code_id: str = Field(..., max_length=100)
    parent_container_id: UUID | None = None


class ContainerUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    location: str | None = None
    parent_container_id: UUID | None = None


class ContainerResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    location: str | None
    qr_code_id: str
    parent_container_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ContainerDetail(ContainerResponse):
    items: list["ItemBrief"] = []
    children: list["ContainerResponse"] = []


class ItemBrief(BaseModel):
    id: UUID
    name: str
    item_type: str
    category: str
    quantity: float
    unit: str
    status: str

    model_config = {"from_attributes": True}


ContainerDetail.model_rebuild()
