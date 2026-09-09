from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from app.database import get_db
from app.models.news import NewsItem
from app.schemas.news import StatsResponse

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("", response_model=StatsResponse)
async def get_system_stats(db: AsyncSession = Depends(get_db)):
    tot = (await db.execute(select(func.count(NewsItem.id)))).scalar_one()
    cats = (await db.execute(select(NewsItem.category, func.count(NewsItem.id)).group_by(NewsItem.category))).all()
    sources = (await db.execute(select(NewsItem.source, func.count(NewsItem.id)).group_by(NewsItem.source))).all()
    return StatsResponse(
        total_news=tot,
        category_counts={r[0]: r[1] for r in cats},
        source_counts={r[0]: r[1] for r in sources},
        last_updated=datetime.now(timezone.utc).isoformat()
    )
