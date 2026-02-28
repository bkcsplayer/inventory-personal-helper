from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.container_repository import ContainerRepository
from app.services.qr_service import generate_qr_code

router = APIRouter()


@router.get("/{qr_code_id}")
async def scan_lookup(qr_code_id: str, db: AsyncSession = Depends(get_db)):
    repo = ContainerRepository(db)
    container = await repo.get_by_qr_code(qr_code_id)
    if not container:
        raise HTTPException(status_code=404, detail="QR code not recognized")
    return {
        "container": {
            "id": str(container.id),
            "name": container.name,
            "location": container.location,
            "qr_code_id": container.qr_code_id,
        },
        "items": [
            {
                "id": str(item.id),
                "name": item.name,
                "item_type": item.item_type,
                "category": item.category,
                "quantity": float(item.quantity),
                "unit": item.unit,
                "status": item.status,
                "min_stock": float(item.min_stock) if item.min_stock else None,
            }
            for item in container.items
        ],
    }


@router.get("/{qr_code_id}/qr-image")
async def get_qr_image(qr_code_id: str):
    image_bytes = generate_qr_code(qr_code_id)
    return Response(content=image_bytes, media_type="image/png")
