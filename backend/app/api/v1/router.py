from fastapi import APIRouter

from app.api.v1.endpoints import auth, containers, items, reports, scan, topology, uploads

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(containers.router, prefix="/containers", tags=["containers"])
api_router.include_router(topology.router, prefix="/topology", tags=["topology"])
api_router.include_router(scan.router, prefix="/scan", tags=["scan"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
