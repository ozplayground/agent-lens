"""v0.4.2 B 조: 뉴스 API 결함 회귀 테스트.

근거: docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md BUG-12, BUG-18(시각), CC-02,
docs/qa-engineer/02_QA_TEST_REPORT.md D-26, D-41(backend), D-43.
"""
import hashlib
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, text

from app.config import settings
from app.database import AsyncSessionLocal
from app.main import app
from app.models.news import NewsItem


def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.fixture
async def odd_item():
    url = "https://b-news.example/null-columns"
    async with AsyncSessionLocal() as s:
        it = NewsItem(title="NULL <columns> & co", url=url, source="rss", category="ai_news & <x>",
                      summary="s", published_at=datetime(2099, 1, 1, tzinfo=timezone.utc),
                      dedup_hash=hashlib.sha256(url.encode()).hexdigest())
        s.add(it)
        await s.commit()
        item_id = it.id
        await s.execute(text("UPDATE news_items SET summary = NULL, published_at = NULL WHERE id = :i"), {"i": item_id})
        await s.commit()
    yield item_id
    async with AsyncSessionLocal() as s:
        await s.execute(delete(NewsItem).where(NewsItem.id == item_id))
        await s.commit()


# ---------------------------------------------------------------------------
# BUG-12 / D-26 RSS NULL 열 500, 채널 링크 3000 고정
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_rss_feed_survives_null_columns_and_escapes(odd_item, monkeypatch):
    monkeypatch.setattr(settings, "PUBLIC_WEB_URL", "http://web.b-test.example:3001")
    async with _client() as ac:
        res = await ac.get("/api/news/feed/rss.xml")
    assert res.status_code == 200, res.text
    root = ET.fromstring(res.text)  # 이스케이프가 틀리면 여기서 깨진다
    assert root.find("channel/link").text == "http://web.b-test.example:3001"
    odd = [i for i in root.iter("item") if i.find("title").text == "NULL <columns> & co"][0]
    assert odd.find("description").text in (None, "")
    assert odd.find("category").text == "ai_news & <x>"
    assert odd.find("pubDate").text.endswith("GMT")


# ---------------------------------------------------------------------------
# BUG-18 시각: 응답 시각에 UTC 오프셋이 붙는다 (브라우저가 현지 시각으로 읽지 않게)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_news_feed_datetimes_carry_utc_offset():
    async with _client() as ac:
        res = await ac.get("/api/news?size=5")
    assert res.status_code == 200
    for item in res.json()["items"]:
        for key in ("published_at", "created_at"):
            assert item[key].endswith("Z") or item[key].endswith("+00:00"), (key, item[key])


# ---------------------------------------------------------------------------
# D-41 (backend) 기사 질문 스트림이 프록시에서 압축·버퍼링되지 않게 no-transform
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ask_stream_sets_no_transform_cache_header():
    async with _client() as ac:
        res = await ac.post("/api/news/1/ask/stream", json={"question": "핵심이 뭐야?"})
    assert res.status_code == 200
    assert res.headers["cache-control"] == "no-cache, no-transform"


# ---------------------------------------------------------------------------
# CC-02 / D-43 화면이 부르지 않는 뉴스 엔드포인트를 지운다
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_unused_news_endpoints_are_removed():
    async with _client() as ac:
        detail = await ac.get("/api/news/1")
        ask = await ac.post("/api/news/1/ask", json={"question": "x"})
        delete_all = await ac.delete("/api/news/all")
        feed = await ac.get("/api/news?size=1")
    assert detail.status_code in (404, 405)
    assert ask.status_code in (404, 405)
    assert delete_all.status_code in (404, 405)
    assert feed.json()["total"] >= 1  # 지우는 경로가 없으니 데이터는 그대로다
    paths = app.openapi()["paths"]
    assert "/api/news/{news_id}" not in paths
    assert "/api/news/{news_id}/ask" not in paths
    assert "/api/news/all" not in paths
    assert "post" in paths["/api/news/{news_id}/ask/stream"]
