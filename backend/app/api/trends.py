from fastapi import APIRouter
from app.services.trend_service import trend_service

router = APIRouter(prefix="/trends", tags=["trends"])

@router.get("/radar")
async def get_tech_radar():
    """Returns aggregated tech radar data, categories, surging tags and velocities."""
    return await trend_service.get_tech_radar()
