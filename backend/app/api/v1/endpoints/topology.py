from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.topology_service import TopologyService

router = APIRouter()


@router.get("/{item_id}")
async def get_topology(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    svc = TopologyService(db)
    tree = await svc.get_topology_tree(item_id)
    if not tree:
        raise HTTPException(status_code=404, detail="Item not found")
    return tree
