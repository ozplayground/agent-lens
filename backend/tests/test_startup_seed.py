"""T7: 빈 DB 첫 수집이 lifespan 시작을 막지 않는지 (make-targets, spec 1.9).

- 기사 0건이면 첫 수집을 백그라운드 태스크로 띄우고 바로 서비스한다.
- lifespan 을 빠져나올 때 끝나지 않은 첫 수집 태스크를 취소한다.
- 기사가 있으면 첫 수집을 부르지 않는다.

공용 테스트 DB(conftest 의 init_db 가 기사 1건을 넣는다)는 건드리지 않고,
tmp_path 의 별도 SQLite 엔진으로 0건·1건 상태를 만든다.
"""
import asyncio
import contextlib
import hashlib
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import httpx
import pytest
from httpx import ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.main as main_mod
from app.collectors.manager import collector_manager
from app.database import Base
from app.models import NewsItem


async def _make_db(tmp_path, name, with_item):
    eng = create_async_engine(f"sqlite+aiosqlite:///{tmp_path}/{name}")
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(bind=eng, class_=AsyncSession, expire_on_commit=False)
    if with_item:
        url = "https://example.com/startup-seed-item"
        async with maker() as s:
            s.add(NewsItem(
                id=1,
                title="Startup seed test item",
                url=url,
                summary="summary",
                source="github",
                category="harness",
                tags="agent",
                quality_score=8.0,
                published_at=datetime.now(timezone.utc),
                is_high_signal=False,
                dedup_hash=hashlib.sha256(url.encode()).hexdigest(),
                hotness_score=1.0,
            ))
            await s.commit()
    return eng, maker


def _patch_startup(monkeypatch, eng, maker):
    monkeypatch.setattr(main_mod, "start_scheduler", lambda: None)
    monkeypatch.setattr(main_mod, "stop_scheduler", lambda: None)
    monkeypatch.setattr(main_mod, "ensure_db_schema", AsyncMock())
    monkeypatch.setattr(main_mod, "AsyncSessionLocal", maker)
    monkeypatch.setattr(main_mod, "engine", eng)
    monkeypatch.setattr(collector_manager, "is_running", False)


async def test_empty_db_seed_runs_in_background_and_is_cancelled_on_shutdown(monkeypatch, tmp_path):
    eng, maker = await _make_db(tmp_path, "empty.db", with_item=False)
    _patch_startup(monkeypatch, eng, maker)

    started = asyncio.Event()
    state = {"cancelled": False, "calls": 0}

    async def slow_collect_all(*args, **kwargs):
        state["calls"] += 1
        collector_manager.is_running = True
        started.set()
        try:
            await asyncio.sleep(30)
        except asyncio.CancelledError:
            state["cancelled"] = True
            raise
        finally:
            collector_manager.is_running = False
        return {"status": "success"}

    monkeypatch.setattr(collector_manager, "collect_all", slow_collect_all)

    app = main_mod.app
    try:
        async with contextlib.AsyncExitStack() as stack:
            # 시작이 첫 수집을 기다리지 않아야 한다 (1초 안에 들어간다)
            async with asyncio.timeout(1.0):
                await stack.enter_async_context(app.router.lifespan_context(app))

            await asyncio.wait_for(started.wait(), 1)
            assert state["calls"] == 1

            async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                r = await client.get("/health")
            assert r.status_code == 200
            assert r.json()["running"] is True
            assert state["cancelled"] is False

        # lifespan 을 빠져나오면 끝나지 않은 첫 수집이 취소된다
        assert state["cancelled"] is True
        assert collector_manager.is_running is False
    finally:
        await eng.dispose()


async def test_db_with_items_does_not_seed(monkeypatch, tmp_path):
    eng, maker = await _make_db(tmp_path, "one.db", with_item=True)
    _patch_startup(monkeypatch, eng, maker)

    collect_mock = AsyncMock(return_value={"status": "success"})
    monkeypatch.setattr(collector_manager, "collect_all", collect_mock)

    app = main_mod.app
    try:
        async with asyncio.timeout(5.0):
            async with app.router.lifespan_context(app):
                pass
        collect_mock.assert_not_called()
    finally:
        await eng.dispose()
