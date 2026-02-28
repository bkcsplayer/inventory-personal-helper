import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.item_repository import ItemRepository

router = APIRouter()

UPLOAD_DIR = Path("/app/uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/image/{item_id}")
async def upload_item_image(
    item_id: uuid.UUID,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    repo = ItemRepository(db)
    item = await repo.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    if item.image_url:
        old_path = UPLOAD_DIR / os.path.basename(item.image_url)
        if old_path.exists():
            old_path.unlink()

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    filepath.write_bytes(content)

    image_url = f"/uploads/{filename}"
    await repo.update(item, image_url=image_url)

    return {"image_url": image_url}


@router.delete("/image/{item_id}")
async def delete_item_image(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    repo = ItemRepository(db)
    item = await repo.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.image_url:
        old_path = UPLOAD_DIR / os.path.basename(item.image_url)
        if old_path.exists():
            old_path.unlink()
        await repo.update(item, image_url=None)

    return {"ok": True}
