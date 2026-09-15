import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_schedule():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/schedule/status")
    assert res.status_code == 200
    assert res.json()["schedule_hours"] == [0, 6, 12, 18]

@pytest.mark.asyncio
async def test_news():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/news")
    assert res.status_code == 200
    assert "items" in res.json()

@pytest.mark.asyncio
async def test_stats():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/stats")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_mcp_info():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/mcp/info")
    assert res.status_code == 200
    assert len(res.json()["tools"]) >= 4

@pytest.mark.asyncio
async def test_rss():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/news/feed/rss.xml")
    assert res.status_code == 200
    assert "xml" in res.headers["content-type"]

@pytest.mark.asyncio
async def test_daily_briefing_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/briefing/today")
    assert res.status_code == 200
    data = res.json()
    assert "headline" in data
    assert "markdown_report" in data

@pytest.mark.asyncio
async def test_ask_ai_endpoint():
    # First fetch a news item
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        news_res = await ac.get("/api/news?size=1")
        items = news_res.json()["items"]
        if items:
            item_id = items[0]["id"]
            ask_res = await ac.post(f"/api/news/{item_id}/ask", json={"question": "핵심 기술이 뭐야?"})
            assert ask_res.status_code == 200
            assert "answer" in ask_res.json()

@pytest.mark.asyncio
async def test_ask_ai_stream_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        news_res = await ac.get("/api/news?size=1")
        items = news_res.json()["items"]
        if items:
            item_id = items[0]["id"]
            stream_res = await ac.post(
                f"/api/news/{item_id}/ask/stream",
                json={"question": "핵심 기술 도입 방법이 뭐야?"}
            )
            assert stream_res.status_code == 200
            assert "text/event-stream" in stream_res.headers["content-type"]
            assert "data: " in stream_res.text
