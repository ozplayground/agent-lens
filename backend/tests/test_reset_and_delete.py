import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

from unittest.mock import AsyncMock
from app.collectors.manager import collector_manager
from sqlalchemy import select, func
from app.database import AsyncSessionLocal
from app.models.news import NewsItem, CrawlLog

@pytest.mark.asyncio
async def test_reset_and_collect_endpoint(monkeypatch):
    collect_mock = AsyncMock(return_value={"status": "success"})
    monkeypatch.setattr(collector_manager, "collect_all", collect_mock)
    monkeypatch.setattr(collector_manager, "is_running", False)
    async with AsyncSessionLocal() as s:
        before = (await s.execute(select(func.count(NewsItem.id)))).scalar_one()
    assert before >= 1  # conftest 가 기사 id=1 을 넣는다
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/schedule/reset-and-collect")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "started"
    assert data["deleted_count"] == before
    async with AsyncSessionLocal() as s:
        assert (await s.execute(select(func.count(NewsItem.id)))).scalar_one() == 0
        assert (await s.execute(select(func.count(CrawlLog.id)))).scalar_one() == 0
    collect_mock.assert_awaited_once()
    assert collector_manager.get_progress()["items_saved"] == 0

# DELETE /api/news/all 은 v0.4.2 에서 지웠다 (CC-02, 호출처 없음). 회귀는 tests/test_b_news_api.py
