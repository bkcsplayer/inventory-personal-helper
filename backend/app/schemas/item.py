from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class ItemCreate(BaseModel):
    item_type: str = Field(..., pattern="^(consumable|asset)$")
    name: str = Field(..., max_length=255)
    sku: str | None = None
    category: str = Field(..., max_length=100)
    container_id: UUID | None = None
    parent_item_id: UUID | None = None
    location_note: str | None = None
    quantity: Decimal = Field(default=Decimal("1"))
    unit: str = Field(default="个", max_length=20)
    min_stock: Decimal | None = None
    unit_price: Decimal | None = None
    purchase_date: date | None = None
    status: str = Field(default="in_stock")
    assigned_to: str | None = None
    attributes: dict = Field(default_factory=dict)
    restock_url: str | None = None
    barcode: str | None = None
    image_url: str | None = None


class ItemUpdate(BaseModel):
    name: str | None = None
    sku: str | None = None
    category: str | None = None
    container_id: UUID | None = None
    parent_item_id: UUID | None = None
    location_note: str | None = None
    quantity: Decimal | None = None
    unit: str | None = None
    min_stock: Decimal | None = None
    unit_price: Decimal | None = None
    purchase_date: date | None = None
    status: str | None = None
    assigned_to: str | None = None
    attributes: dict | None = None
    restock_url: str | None = None
    barcode: str | None = None
    image_url: str | None = None


class ItemResponse(BaseModel):
    id: UUID
    item_type: str
    name: str
    sku: str | None
    category: str
    container_id: UUID | None
    parent_item_id: UUID | None
    location_note: str | None
    quantity: Decimal
    unit: str
    min_stock: Decimal | None
    unit_price: Decimal | None
    purchase_date: date | None
    status: str
    assigned_to: str | None
    attributes: dict
    restock_url: str | None
    barcode: str | None
    image_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdjustPayload(BaseModel):
    delta: Decimal
    note: str | None = None


class StatusPayload(BaseModel):
    status: str = Field(..., pattern="^(in_stock|in_service|idle|loaned|damaged|retired)$")
    assigned_to: str | None = None


class MovePayload(BaseModel):
    container_id: UUID | None = None
    parent_item_id: UUID | None = None


class PaginatedItems(BaseModel):
    items: list[ItemResponse]
    total: int
    page: int
    page_size: int
