from fastapi import APIRouter
from app.api.news import router as news_router
from app.api.schedule import router as schedule_router
from app.api.stats import router as stats_router
from app.api.mcp import router as mcp_router
from app.api.briefing import router as briefing_router
from app.api.trends import router as trends_router
from app.api.webhook import router as webhook_router
from app.api.sources import router as sources_router
from app.api.research import router as research_router

api_router = APIRouter(prefix="/api")
api_router.include_router(news_router)
api_router.include_router(schedule_router)
api_router.include_router(stats_router)
api_router.include_router(mcp_router)
api_router.include_router(briefing_router)
api_router.include_router(trends_router)
api_router.include_router(webhook_router)
api_router.include_router(sources_router)
api_router.include_router(research_router)
