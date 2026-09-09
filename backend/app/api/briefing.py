from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.briefing_service import briefing_service
from app.schemas.news import DailyBriefingResponse

router = APIRouter(prefix="/briefing", tags=["Daily Briefing"])

@router.get("/today", response_model=DailyBriefingResponse)
async def get_today_briefing(db: AsyncSession = Depends(get_db)):
    data = await briefing_service.generate_daily_briefing(session=db)
    return DailyBriefingResponse(
        date=data["date"],
        headline=data["headline"],
        markdown_report=data["markdown_report"],
        featured_items_count=data["featured_items_count"],
        generated_at=data["generated_at"]
    )

@router.post("/generate", response_model=DailyBriefingResponse)
async def regenerate_briefing(db: AsyncSession = Depends(get_db)):
    data = await briefing_service.generate_daily_briefing(session=db)
    return DailyBriefingResponse(
        date=data["date"],
        headline=data["headline"],
        markdown_report=data["markdown_report"],
        featured_items_count=data["featured_items_count"],
        generated_at=data["generated_at"]
    )
