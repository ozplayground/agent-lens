from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.api.router import api_router
from app.scheduler import start_scheduler, stop_scheduler
from app.collectors.manager import collector_manager
from app.models.news import NewsItem

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    start_scheduler()

    async with AsyncSessionLocal() as s:
        cnt = (await s.execute(select(func.count(NewsItem.id)))).scalar_one()
        if cnt == 0:
            print("[AgentLens] Initial database seed collection...")
            await collector_manager.collect_all(session=s)

    yield
    stop_scheduler()
    await engine.dispose()

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    import traceback
    print(f"[AgentLens ERROR] Unhandled exception on {request.url.path}: {exc}")
    traceback.print_exc()
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred. Please check server logs.", "error": str(exc)},
    )

app.include_router(api_router)

@app.get("/")
async def root():
    return {"service": "AgentLens API", "version": settings.VERSION, "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "healthy", "running": collector_manager.is_running}
