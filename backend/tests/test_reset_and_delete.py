import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_reset_and_collect_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/schedule/reset-and-collect")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["started", "already_running"]
    assert "deleted_count" in data

@pytest.mark.asyncio
async def test_delete_all_news_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.delete("/api/news/all")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "deleted_count" in data
