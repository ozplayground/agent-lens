"""라우터가 모델을 직접 쿼리하지 않고 서비스로 옮긴 뉴스 조회·통계·수집 진행 초기화 (ARCH-01).

`app/services/news_service.py` 가 목록 필터·정렬·페이지, 통계, 최근 수집 로그, 전체 삭제를 맡는다.
라우터(`api/news.py` 목록, `api/stats.py`, `api/schedule.py`)는 서비스만 부른다.
"""
import hashlib
import importlib
import inspect
from datetime import datetime, timedelta, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete

from app.database import AsyncSessionLocal
from app.main import app
from app.models.news import NewsItem


def _svc():
    return importlib.import_module("app.services.news_service")


@pytest.fixture
async def seeded_items():
    """id 9101~9103 기사 3건 (분야·소스·점수가 다르다). 끝나면 지운다."""
    now = datetime.now(timezone.utc)
    rows = [
        dict(id=9101, title="ARCH01 harness alpha", category="harness", source="github", quality_score=9.0,
             hotness_score=1.0, raw_score=10, is_high_signal=True, published_at=now - timedelta(days=2)),
        dict(id=9102, title="ARCH01 mcp beta", category="mcp_plugins_skills", source="reddit", quality_score=6.0,
             hotness_score=3.0, raw_score=50, is_high_signal=False, published_at=now - timedelta(days=1)),
        dict(id=9103, title="ARCH01 harness gamma", category="harness", source="reddit", quality_score=7.0,
             hotness_score=2.0, raw_score=5, is_high_signal=False, published_at=now),
    ]
    async with AsyncSessionLocal() as s:
        for r in rows:
            url = f"https://example.com/arch01/{r['id']}"
            s.add(NewsItem(url=url, summary="s", tags="a,b", tech_stack="Python",
                           dedup_hash=hashlib.sha256(url.encode()).hexdigest(), **r))
        await s.commit()
    yield [r["id"] for r in rows]
    async with AsyncSessionLocal() as s:
        await s.execute(delete(NewsItem).where(NewsItem.id.in_([r["id"] for r in rows])))
        await s.commit()


async def test_list_feed_filters_sorts_and_pages(seeded_items):
    svc = _svc()
    async with AsyncSessionLocal() as s:
        res = await svc.NewsService(s).list_feed(category="harness", search="ARCH01", sort="latest", page=1, size=1)
    assert res.total == 2
    assert res.total_pages == 2
    assert [i.id for i in res.items] == [9103]

    async with AsyncSessionLocal() as s:
        res = await svc.NewsService(s).list_feed(search="ARCH01", sort="top", page=1, size=10)
    assert [i.id for i in res.items] == [9102, 9101, 9103]
    assert res.items[0].tags == ["a", "b"]
    assert res.items[0].tech_stack == ["Python"]

    async with AsyncSessionLocal() as s:
        res = await svc.NewsService(s).list_feed(search="ARCH01", source="reddit", high_signal_only=False,
                                                 sort="quality", page=1, size=10)
    assert [i.id for i in res.items] == [9103, 9102]

    async with AsyncSessionLocal() as s:
        res = await svc.NewsService(s).list_feed(search="ARCH01", high_signal_only=True, page=1, size=10)
    assert [i.id for i in res.items] == [9101]


async def test_feed_endpoint_uses_service(seeded_items):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.get("/api/news?search=ARCH01&category=harness&sort=hot")
    assert r.status_code == 200
    assert [i["id"] for i in r.json()["items"]] == [9103, 9101]


async def test_stats_counts(seeded_items):
    svc = _svc()
    async with AsyncSessionLocal() as s:
        stats = await svc.NewsService(s).stats()
    assert stats.total_news >= 3
    assert stats.category_counts["harness"] >= 2
    assert stats.source_counts["reddit"] >= 2


def test_routers_do_not_query_models_directly():
    """목록·통계·스케줄 라우터에 select/delete/func 쿼리가 없다."""
    import app.api.schedule as schedule_api
    import app.api.stats as stats_api
    import app.api.news as news_api

    import re
    for mod in (stats_api, schedule_api):
        src = inspect.getsource(mod)
        for token in ("select(", "delete(", "func.count"):
            assert token not in src, (mod.__name__, token)
        # 수집기 내부 상태를 라우터가 직접 대입하지 않는다 (읽기는 괜찮다)
        assert not re.search(r"collector_manager\.\w+\s*=(?!=)", src), mod.__name__
    news_src = inspect.getsource(news_api)
    assert "select(" not in news_src and "func.count" not in news_src and "NewsItem" not in news_src


async def test_get_item_and_latest_items(seeded_items):
    svc = _svc()
    async with AsyncSessionLocal() as s:
        service = svc.NewsService(s)
        assert (await service.get_item(9102)).title == "ARCH01 mcp beta"
        assert await service.get_item(999999) is None
        latest = await service.latest_items(limit=50, category="harness")
    ids = [i.id for i in latest]
    assert ids.index(9103) < ids.index(9101)  # 최신 발행 먼저
    assert all(i.category == "harness" for i in latest)


def test_collector_reset_progress():
    from app.collectors.manager import collector_manager
    collector_manager.items_collected = 5
    collector_manager.items_saved = 4
    collector_manager.items_filtered = 1
    collector_manager.current_source = "x"
    collector_manager.reset_progress("기존 데이터 삭제 완료. 재수집을 시작합니다.")
    p = collector_manager.get_progress()
    assert (p["items_collected"], p["items_saved"], p["items_filtered"], p["current_source"]) == (0, 0, 0, "")
    assert p["step_message"] == "기존 데이터 삭제 완료. 재수집을 시작합니다."


def test_shared_item_field_parsers():
    """태그·기술 CSV 와 tldr JSON 변환은 한 곳(news_service)에서 한다 (ARCH-01 중복 변환)."""
    svc = _svc()
    assert svc.split_csv(" a, ,b ,") == ["a", "b"]
    assert svc.split_csv(None) == []
    assert svc.parse_tldr('["x", "y"]') == ["x", "y"]
    assert svc.parse_tldr('"one"') == ["one"]
    assert svc.parse_tldr("not json") == []
    assert svc.parse_tldr(None) == []


def test_chat_services_reuse_shared_parsers():
    import app.services.chat_service as chat_service
    import app.services.chat_session_service as chat_session_service
    import app.services.briefing_service as briefing_service
    for mod in (chat_service, chat_session_service, briefing_service):
        src = inspect.getsource(mod)
        assert 'split(",")' not in src, mod.__name__
        assert "json.loads(item.tldr_bullets)" not in src, mod.__name__
