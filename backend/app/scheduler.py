import asyncio
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.config import settings
from app.collectors.manager import collector_manager

scheduler = AsyncIOScheduler()
SCHEDULED_HOURS = [int(h.strip()) for h in settings.CRAWL_SCHEDULE_HOURS.split(",")]

async def scheduled_crawl_job():
    print(f"[Scheduler] 0,6,12,18 crawl triggered at {datetime.now(timezone.utc).isoformat()}")
    await collector_manager.collect_all()

async def scheduled_deep_research_job():
    print(f"[Scheduler] Deep Research triggered at {datetime.now(timezone.utc).isoformat()}")
    from app.services.deep_researcher import deep_researcher
    await deep_researcher.run_deep_research()

def get_next_run_time() -> datetime:
    job = scheduler.get_job("daily_crawl")
    if job and job.next_run_time:
        return job.next_run_time
    now = datetime.now(timezone.utc)
    for h in sorted(SCHEDULED_HOURS):
        candidate = now.replace(hour=h, minute=0, second=0, microsecond=0)
        if candidate > now:
            return candidate
    tomorrow = now + timedelta(days=1)
    return tomorrow.replace(hour=SCHEDULED_HOURS[0], minute=0, second=0, microsecond=0)

def start_scheduler():
    if not scheduler.running:
        trigger = CronTrigger(hour="0,6,12,18", minute="0", timezone="UTC")
        scheduler.add_job(
            scheduled_crawl_job,
            trigger=trigger,
            id="daily_crawl",
            name="Daily 0,6,12,18 Global Crawl",
            replace_existing=True
        )
        research_trigger = CronTrigger(hour="3,15", minute="0", timezone="UTC")
        scheduler.add_job(
            scheduled_deep_research_job,
            trigger=research_trigger,
            id="deep_research",
            name="Autonomous Deep Research Cycle",
            replace_existing=True
        )
        scheduler.start()
        print("[Scheduler] Started for Crawl (0,6,12,18 UTC) and Deep Research (3,15 UTC)")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
