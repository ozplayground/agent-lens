from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from app.database import get_db
from app.config import settings
from app.schemas.news import ScheduleStatusResponse, ManualCollectResponse
from app.scheduler import get_next_run_time, SCHEDULED_HOURS
from app.collectors.manager import acquire_crawl_lock, collector_manager, release_crawl_lock
from app.services.news_service import NewsService
from app.services.llm_processor import llm_processor

router = APIRouter(prefix="/schedule", tags=["Schedule"])

@router.get("/status", response_model=ScheduleStatusResponse)
async def get_schedule_status(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    next_run = get_next_run_time()
    diff_sec = max(0, (next_run - now).total_seconds())

    formatted_logs = await NewsService(db).recent_crawl_logs(limit=5)
    last_log = formatted_logs[0] if formatted_logs else None
    return ScheduleStatusResponse(
        current_time=now.isoformat(),
        schedule_hours=SCHEDULED_HOURS,
        timezone=settings.CRAWL_TIMEZONE,
        next_run=next_run.isoformat(),
        minutes_until_next_run=round(diff_sec / 60.0, 1),
        is_running=collector_manager.is_running,
        last_crawl_time=last_log["completed_at"] if last_log else None,
        last_crawl_status="running" if collector_manager.is_running else "idle",
        recent_logs=formatted_logs
    )

@router.get("/progress")
async def get_crawl_progress():
    """Returns live progressive ingestion status, current source, and saved count."""
    return collector_manager.get_progress()

@router.post("/trigger", response_model=ManualCollectResponse, response_model_exclude_unset=True)
async def trigger_manual_crawl(background_tasks: BackgroundTasks):
    """Starts progressive streaming collection in background and responds instantly."""
    # 다른 프로세스(MCP 서버·make collect)가 수집 잠금을 쥐고 있어도 already_running 으로 답한다 (D-40)
    if collector_manager.is_busy():
        # other_process: 같은 DB 를 쓰는 다른 프로세스가 수집 중이라 이 backend 의 진행 상태로는 끝을 알 수 없다 (N-12)
        other = not collector_manager.is_running
        return {
            "status": "already_running",
            "message": "다른 프로세스(MCP 서버·make collect)가 같은 DB 에 수집 중입니다." if other else "이미 수집이 진행 중입니다.",
            "other_process": other,
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
    busy = {
        "status": "already_running",
        "message": "현재 수집이 진행 중이므로 초기화할 수 없습니다. 잠시 후 다시 시도해주세요.",
        "deleted_count": 0
    }
    if collector_manager.is_running:
        return busy
    # 삭제하는 동안 수집 잠금을 쥔다. 다른 프로세스가 수집 중이면 지우지 않는다 (D-40)
    lock = acquire_crawl_lock()
    if lock is None:
        return busy
    try:
        # 평가 캐시가 지운 데이터의 판정을 기억하지 않게 비운다 (BUG-10)
        llm_processor.clear_caches()

        # 기사·수집 로그 삭제 (서비스가 한 트랜잭션으로 커밋) 와 진행 상태 초기화
        row_count = await NewsService(db).delete_all_news_and_logs()
        collector_manager.reset_progress("기존 데이터 삭제 완료. 재수집을 시작합니다.")
    finally:
        release_crawl_lock(lock)

    # Launch background collection
    background_tasks.add_task(collector_manager.collect_all)

    return {
        "status": "started",
        "message": f"기존 데이터 {row_count}건이 삭제되었으며, 실시간 클린 재수집이 시작되었습니다.",
        "deleted_count": row_count
    }

