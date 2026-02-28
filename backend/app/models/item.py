import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)  # consumable | asset
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    container_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("containers.id"), nullable=True, index=True
    )
    parent_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("items.id"), nullable=True, index=True
    )
    location_note: Mapped[str | None] = mapped_column(String(500), nullable=True)

    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False, default=1)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="个")
    min_stock: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)

    unit_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="in_stock")
    assigned_to: Mapped[str | None] = mapped_column(String(255), nullable=True)

    attributes: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    restock_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    barcode: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    container: Mapped["Container | None"] = relationship(  # noqa: F821
        "Container", back_populates="items", lazy="selectin"
    )
    parent_item: Mapped["Item | None"] = relationship(
        "Item", remote_side="Item.id", back_populates="child_items", lazy="selectin"
    )
    child_items: Mapped[list["Item"]] = relationship(
        "Item", back_populates="parent_item", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_items_type_category", "item_type", "category"),
        Index("ix_items_status", "status"),
    )
