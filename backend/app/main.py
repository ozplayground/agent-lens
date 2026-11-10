import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal, ensure_db_schema
from app.api.router import api_router
from app.api.errors import install_error_handlers
from app.scheduler import start_scheduler, stop_scheduler
from app.collectors.manager import collector_manager
from app.models.news import NewsItem


def _log_seed_task_error(task: "asyncio.Task") -> None:
    if task.cancelled():
        return
    exc = task.exception()
    if exc is not None:
        print(f"[AgentLens] 첫 수집 백그라운드 태스크 오류: {exc!r}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_db_schema()
    start_scheduler()

    async with AsyncSessionLocal() as s:
        cnt = (await s.execute(select(func.count(NewsItem.id)))).scalar_one()

    # 빈 DB 의 첫 수집은 백그라운드로 돌려 시작(healthcheck, 준비 대기)을 막지 않는다
    seed_task = None
    if cnt == 0:
        print("[AgentLens] Initial database seed collection (백그라운드로)...")
        seed_task = asyncio.create_task(collector_manager.collect_all())
        seed_task.add_done_callback(_log_seed_task_error)

    yield

    if seed_task is not None and not seed_task.done():
        seed_task.cancel()
        try:
            await seed_task
        except asyncio.CancelledError:
            pass
    stop_scheduler()
    await engine.dispose()

# redirect_slashes=False: 없는 경로에 끝 슬래시를 붙여 /{source_type}/{item_id:path} 같은 경로로 307 을 주지 않고
# 바로 404·405 를 준다 (D-54). frontend·scripts 는 끝 슬래시로 부르는 곳이 없다 (grep)
app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan, redirect_slashes=False)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 오류 응답 형식 통일 (error_code, message, details). 예외 문자열은 로그에만 남긴다
install_error_handlers(app)

app.include_router(api_router)

@app.get("/")
async def root():
    return {"service": "AgentLens API", "version": settings.VERSION, "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "healthy", "version": settings.VERSION, "running": collector_manager.is_running}

