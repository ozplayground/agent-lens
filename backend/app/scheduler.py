from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.config import settings
from app.collectors.manager import collector_manager

scheduler = AsyncIOScheduler()
SCHEDULED_HOURS = [int(h.strip()) for h in settings.CRAWL_SCHEDULE_HOURS.split(",")]
# 딥 리서치 시각은 설정이 없어 UTC 고정이다
DEEP_RESEARCH_HOURS_UTC = "3,15"


def _hours() -> list:
    return sorted(int(h.strip()) for h in settings.CRAWL_SCHEDULE_HOURS.split(",") if h.strip())


async def scheduled_crawl_job():
    print(f"[Scheduler] crawl ({settings.CRAWL_SCHEDULE_HOURS} {settings.CRAWL_TIMEZONE}) triggered at {datetime.now(timezone.utc).isoformat()}")
    await collector_manager.collect_all()

async def scheduled_deep_research_job():
    print(f"[Scheduler] Deep Research triggered at {datetime.now(timezone.utc).isoformat()}")
    from app.services.deep_researcher import deep_researcher
    await deep_researcher.run_deep_research()

async def scheduled_briefing_dispatch_job():
    print(f"[Scheduler] Daily Briefing auto-dispatch triggered at {datetime.now(timezone.utc).isoformat()}")
    from app.services.briefing_service import briefing_service
    await briefing_service.auto_dispatch_all()

def get_next_run_time() -> datetime:
    job = scheduler.get_job("daily_crawl")
    next_run = getattr(job, "next_run_time", None) if job else None
    if next_run:
        return next_run
    tz = ZoneInfo(settings.CRAWL_TIMEZONE)
    now = datetime.now(tz)
    hours = _hours()
    for h in hours:
        candidate = now.replace(hour=h, minute=0, second=0, microsecond=0)
        if candidate > now:
            return candidate
    tomorrow = now + timedelta(days=1)
    return tomorrow.replace(hour=hours[0], minute=0, second=0, microsecond=0)

def add_jobs(target: AsyncIOScheduler) -> None:
    """설정의 수집 시각·시간대·브리핑 자동 발송 시각으로 job 을 건다 (CFG-01)."""
    tz = settings.CRAWL_TIMEZONE
    target.add_job(
        scheduled_crawl_job,
        trigger=CronTrigger(hour=settings.CRAWL_SCHEDULE_HOURS, minute="0", timezone=tz),
        id="daily_crawl",
        name=f"Crawl ({settings.CRAWL_SCHEDULE_HOURS} {tz})",
        replace_existing=True
    )
    target.add_job(
        scheduled_deep_research_job,
        trigger=CronTrigger(hour=DEEP_RESEARCH_HOURS_UTC, minute="0", timezone="UTC"),
        id="deep_research",
        name="Autonomous Deep Research Cycle",
        replace_existing=True
    )
    target.add_job(
        scheduled_briefing_dispatch_job,
        trigger=CronTrigger(hour=str(settings.BRIEFING_AUTO_DISPATCH_HOUR), minute="15", timezone=tz),
        id="daily_briefing_dispatch",
        name="Daily Briefing Auto Dispatch (Notion, Email, Webhook)",
        replace_existing=True
    )

def start_scheduler():
    if not settings.SCHEDULER_ENABLED:
        print("[Scheduler] scheduler.enabled=false, 스케줄러를 띄우지 않는다")
        return
    if not scheduler.running:
        add_jobs(scheduler)
        scheduler.start()
        tz = settings.CRAWL_TIMEZONE
        print(
            f"[Scheduler] Started for Crawl ({settings.CRAWL_SCHEDULE_HOURS} {tz}), "
            f"Briefing ({settings.BRIEFING_AUTO_DISPATCH_HOUR}:15 {tz}) and Deep Research ({DEEP_RESEARCH_HOURS_UTC} UTC)"
        )

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
