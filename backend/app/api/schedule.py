from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete
from datetime import datetime, timezone
from app.database import get_db
from app.config import settings
from app.models.news import NewsItem, CrawlLog
from app.schemas.news import ScheduleStatusResponse, ManualCollectResponse
from app.scheduler import get_next_run_time, SCHEDULED_HOURS
from app.collectors.manager import collector_manager

router = APIRouter(prefix="/schedule", tags=["Schedule"])

@router.get("/status", response_model=ScheduleStatusResponse)
async def get_schedule_status(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    next_run = get_next_run_time()
    diff_sec = max(0, (next_run - now).total_seconds())

    logs = (await db.execute(select(CrawlLog).order_by(desc(CrawlLog.id)).limit(5))).scalars().all()
    formatted_logs = [
        {
            "id": l.id, "source": l.source, "items_crawled": l.items_crawled,
            "items_saved": l.items_saved, "status": l.status,
            "started_at": l.started_at.isoformat() if l.started_at else None,
            "completed_at": l.completed_at.isoformat() if l.completed_at else None
        }
        for l in logs
    ]
    last_log = logs[0] if logs else None
    return ScheduleStatusResponse(
        current_time=now.isoformat(),
        schedule_hours=SCHEDULED_HOURS,
        timezone=settings.CRAWL_TIMEZONE,
        next_run=next_run.isoformat(),
        minutes_until_next_run=round(diff_sec / 60.0, 1),
        is_running=collector_manager.is_running,
        last_crawl_time=last_log.completed_at.isoformat() if last_log and last_log.completed_at else None,
        last_crawl_status="running" if collector_manager.is_running else "idle",
        recent_logs=formatted_logs
    )

@router.get("/progress")
async def get_crawl_progress():
    """Returns live progressive ingestion status, current source, and saved count."""
    return collector_manager.get_progress()

@router.post("/trigger")
async def trigger_manual_crawl(background_tasks: BackgroundTasks):
    """Starts progressive streaming collection in background and responds instantly."""
    if collector_manager.is_running:
        return {
            "status": "already_running",
            "message": "이미 수집이 진행 중입니다.",
            "total_collected": collector_manager.items_collected,
            "total_saved": collector_manager.items_saved,
            "source_results": {}
        }

    background_tasks.add_task(collector_manager.collect_all)
    return {
        "status": "started",
        "message": "실시간 점진적 수집이 시작되었습니다. 소식이 화면에 순차적으로 반영됩니다.",
        "total_collected": 0,
        "total_saved": 0,
        "source_results": {}
    }

@router.post("/reset-and-collect")
async def reset_and_collect(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Deletes all existing news items and crawl logs, then triggers fresh progressive collection."""
    if collector_manager.is_running:
        return {
            "status": "already_running",
            "message": "현재 수집이 진행 중이므로 초기화할 수 없습니다. 잠시 후 다시 시도해주세요.",
            "deleted_count": 0
        }

    # Delete all records from NewsItem and CrawlLog
    deleted_news = await db.execute(delete(NewsItem))
    await db.execute(delete(CrawlLog))
    await db.commit()

    # Reset in-memory collector state
    collector_manager.items_collected = 0
    collector_manager.items_saved = 0
    collector_manager.items_filtered = 0
    collector_manager.current_source = ""
    collector_manager.step_message = "🧹 기존 데이터 삭제 완료. 실시간 재수집을 시작합니다."

    # Launch background collection
    background_tasks.add_task(collector_manager.collect_all)

    row_count = deleted_news.rowcount if deleted_news.rowcount and deleted_news.rowcount > 0 else 0
    return {
        "status": "started",
        "message": f"기존 데이터 {row_count}건이 삭제되었으며, 실시간 클린 재수집이 시작되었습니다.",
        "deleted_count": row_count
    }

