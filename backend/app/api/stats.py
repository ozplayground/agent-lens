from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.news import StatsResponse
from app.services.news_service import NewsService

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("", response_model=StatsResponse)
async def get_system_stats(db: AsyncSession = Depends(get_db)):
    return await NewsService(db).stats()
