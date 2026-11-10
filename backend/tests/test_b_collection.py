"""v0.4.2 B 조: 수집 파이프라인 결함 회귀 테스트.

근거: docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md BUG-11, BUG-18, PERF-02, PERF-03, ARCH-02, ARCH-04,
docs/qa-engineer/02_QA_TEST_REPORT.md D-18, D-20, D-40.
"""
import fcntl
import json
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import delete, desc, select

from app.collectors import manager as manager_mod
from app.collectors.manager import collector_manager
from app.database import AsyncSessionLocal
from app.models.news import CrawlLog, NewsItem

SOURCE_FETCHERS = ("fetch_rss", "fetch_hackernews", "fetch_github", "fetch_arxiv", "fetch_huggingface", "fetch_reddit")

WORTHWHILE = {
    "is_worthwhile": True,
    "quality_score": 7.5,
    "is_high_signal": True,
    "category": "agent_tech",
    "why_it_matters": "테스트 시사점",
}


def _raw(title: str, url: str, **extra) -> dict:
    item = {
        "title": title,
        "url": url,
        "source": "hackernews",
        "summary": "LangGraph multi-agent harness benchmark",
        "published_at": datetime.now(timezone.utc) - timedelta(hours=1),
        "raw_score": 10,
        "comments_count": 1,
    }
    item.update(extra)
    return item


@pytest.fixture
def quiet_sources(monkeypatch):
    """모든 소스가 빈 목록을 돌려주고 LLM 평가는 고정 값."""
    for name in SOURCE_FETCHERS:
        monkeypatch.setattr(manager_mod, name, AsyncMock(return_value=[]))
    monkeypatch.setattr(manager_mod.llm_processor, "evaluate_content_with_llm", AsyncMock(return_value=dict(WORTHWHILE)))
    monkeypatch.setattr(collector_manager, "is_running", False)
    return monkeypatch


async def _latest_log() -> CrawlLog:
    async with AsyncSessionLocal() as s:
        return (await s.execute(select(CrawlLog).order_by(desc(CrawlLog.id)).limit(1))).scalar_one()


async def _delete_urls(*urls: str) -> None:
    async with AsyncSessionLocal() as s:
        await s.execute(delete(NewsItem).where(NewsItem.url.in_(urls)))
        await s.commit()


# ---------------------------------------------------------------------------
# BUG-11 / D-18 크롤 로그가 항상 success, error_message 미기록
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_crawl_log_records_source_failure(quiet_sources):
    url = "https://b-collection.example/bug11-ok"
    quiet_sources.setattr(manager_mod, "fetch_rss", AsyncMock(side_effect=RuntimeError("rss down")))
    quiet_sources.setattr(manager_mod, "fetch_hackernews", AsyncMock(return_value=[_raw("Agent harness OK", url)]))
    try:
        res = await collector_manager.collect_all()
        assert res["status"] == "success"
        log = await _latest_log()
        assert log.status == "partial_failure"
        errors = json.loads(log.error_message)
        assert "rss down" in errors["국내 & 글로벌 RSS 피드"]
        assert "HackerNews" not in errors
    finally:
        await _delete_urls(url)


@pytest.mark.asyncio
async def test_crawl_log_records_batch_save_failure(quiet_sources):
    url = "https://b-collection.example/bug11-batch"
    quiet_sources.setattr(manager_mod, "fetch_hackernews", AsyncMock(return_value=[_raw("Agent harness batch", url)]))
    quiet_sources.setattr(manager_mod.llm_processor, "generate_synthesis",
                          lambda **kw: (_ for _ in ()).throw(RuntimeError("synth boom")))
    res = await collector_manager.collect_all()
    assert "synth boom" in res["source_results"]["HackerNews"]["error"]
    log = await _latest_log()
    assert log.status in ("partial_failure", "failed")
    assert "synth boom" in json.loads(log.error_message)["HackerNews"]


@pytest.mark.asyncio
async def test_crawl_log_success_has_no_error_message(quiet_sources):
    url = "https://b-collection.example/bug11-clean"
    quiet_sources.setattr(manager_mod, "fetch_hackernews", AsyncMock(return_value=[_raw("Agent harness clean", url)]))
    try:
        await collector_manager.collect_all()
        log = await _latest_log()
        assert log.status == "success"
        assert log.error_message is None
    finally:
        await _delete_urls(url)


# ---------------------------------------------------------------------------
# PERF-02 배치가 잠금을 쥔 채 LLM 을 기다린다
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_llm_evaluation_runs_outside_db_lock(quiet_sources):
    url = "https://b-collection.example/perf02"
    seen_locked = []

    async def evaluate(**kwargs):
        seen_locked.append(collector_manager._db_lock.locked())
        return dict(WORTHWHILE)

    quiet_sources.setattr(manager_mod.llm_processor, "evaluate_content_with_llm", evaluate)
    try:
        saved = await collector_manager._process_and_save_batch([_raw("Agent harness perf", url)], "HackerNews")
        assert saved == 1
        assert seen_locked == [False]
    finally:
        await _delete_urls(url)


# ---------------------------------------------------------------------------
# ARCH-04 / D-40 수집 중복 방지가 프로세스 사이에 공유되지 않는다
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_collect_all_refuses_when_other_process_holds_lock(quiet_sources):
    lock_path = manager_mod.crawl_lock_path()
    assert lock_path.parent.exists()
    with open(lock_path, "a+") as other:  # 다른 프로세스(MCP·make collect)가 쥔 잠금
        fcntl.flock(other.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        try:
            res = await collector_manager.collect_all()
        finally:
            fcntl.flock(other.fileno(), fcntl.LOCK_UN)
    assert res["status"] == "already_running"
    manager_mod.fetch_hackernews.assert_not_called()
    assert collector_manager.is_running is False

    # 잠금이 풀리면 다시 돈다
    res2 = await collector_manager.collect_all()
    assert res2["status"] == "success"


def test_crawl_lock_path_sits_next_to_database():
    from app.config import settings
    db_file = Path(settings.DATABASE_URL.split("///", 1)[1])
    assert manager_mod.crawl_lock_path() == db_file.with_name(db_file.name + ".crawl.lock")


@pytest.mark.asyncio
async def test_mcp_server_creates_schema_before_tools(monkeypatch):
    import app.mcp.server as mcp_server
    ensure = AsyncMock()
    monkeypatch.setattr(mcp_server, "ensure_db_schema", ensure)
    monkeypatch.setattr(mcp_server, "_schema_ready", False)
    await mcp_server.search_agent_news("harness")
    await mcp_server.get_latest_harness_methods()
    ensure.assert_awaited_once()


# ---------------------------------------------------------------------------
# BUG-18 / D-20 raw_score 합성 값, 인기 점수 포화, 시각 저장
# ---------------------------------------------------------------------------

def test_hotness_does_not_saturate_for_popular_items():
    from app.services.categorizer import calculate_hotness
    now = datetime.now(timezone.utc)
    a = calculate_hotness(5000, 100, now - timedelta(hours=1))
    b = calculate_hotness(20000, 300, now - timedelta(hours=1))
    assert 0 < a < b < 100
    # 지표가 없는 최근 항목은 낮다
    assert calculate_hotness(0, 0, now - timedelta(hours=1)) < 25


def test_categorizer_lives_in_services_not_collectors():
    """ARCH-02: services 가 collectors 를 import 하지 않는다."""
    root = Path(__file__).resolve().parent.parent / "app" / "services"
    offenders = [p.name for p in root.rglob("*.py") if "app.collectors" in p.read_text(encoding="utf-8")]
    assert offenders == []


RSS_TEXT = """<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel><title>T</title><link>https://feed.b-test.example/</link>
<item><title>KST item</title><link>https://feed.b-test.example/1</link>
<description>agent harness</description><pubDate>Tue, 10 Nov 2026 00:32:25 +0900</pubDate></item>
</channel></rss>"""


@pytest.mark.asyncio
async def test_rss_items_have_no_synthetic_score_and_utc_dates(fake_llm, monkeypatch):
    from app.collectors.sources import rss
    feed_url = "https://feed.b-test.example/rss.xml"
    fake_llm.register_web(feed_url, text=RSS_TEXT, content_type="application/rss+xml")
    monkeypatch.setattr(rss, "load_feeds_from_config", lambda: [{"name": "KR", "url": feed_url, "country": "KR"}])
    items = await rss.fetch_rss()
    assert len(items) == 1
    it = items[0]
    assert it["raw_score"] == 0
    assert it["published_at"] == datetime(2026, 11, 9, 15, 32, 25, tzinfo=timezone.utc)
    assert it["published_at"].utcoffset() == timedelta(0)


def test_rss_feed_is_parsed_off_the_event_loop(fake_llm, monkeypatch):
    """PERF-03: feedparser.parse 는 이벤트 루프 스레드에서 돌지 않는다."""
    import asyncio
    from app.collectors.sources import rss
    feed_url = "https://feed.b-test.example/rss2.xml"
    fake_llm.register_web(feed_url, text=RSS_TEXT, content_type="application/rss+xml")
    monkeypatch.setattr(rss, "load_feeds_from_config", lambda: [{"name": "G", "url": feed_url}])
    threads = []
    real_parse = rss.feedparser.parse

    def spy(text):
        threads.append(threading.current_thread() is threading.main_thread())
        return real_parse(text)

    monkeypatch.setattr(rss.feedparser, "parse", spy)
    asyncio.run(rss.fetch_rss())
    assert threads == [False]


@pytest.mark.asyncio
async def test_arxiv_items_have_no_synthetic_score(fake_llm, monkeypatch):
    from app.collectors.sources import arxiv
    xml = """<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>http://arxiv.org/abs/1</id>
    <title>Agent harness</title><summary>s</summary><published>2026-11-01T00:00:00Z</published></entry></feed>"""
    fake_llm.register_web(arxiv.ARXIV_API_URL, text=xml, content_type="application/atom+xml")
    monkeypatch.setattr(arxiv.sources_service, "get_arxiv_config", lambda: {"enabled": True, "queries": ["q"]})
    items = await arxiv.fetch_arxiv()
    assert items and items[0]["raw_score"] == 0


@pytest.mark.asyncio
async def test_huggingface_uses_real_upvotes(fake_llm, monkeypatch):
    from app.collectors.sources import huggingface
    data = [{"paper": {"id": "2611.0001", "title": "Agent", "summary": "s", "upvotes": 17},
             "publishedAt": "2026-11-01T00:00:00Z", "numComments": 3}]
    fake_llm.register_web(huggingface.HF_PAPERS_URL, text=json.dumps(data), content_type="application/json")
    monkeypatch.setattr(huggingface.sources_service, "is_huggingface_enabled", lambda: True)
    items = await huggingface.fetch_huggingface()
    assert items[0]["raw_score"] == 17
    assert items[0]["comments_count"] == 3


@pytest.mark.asyncio
async def test_github_monitored_repo_uses_real_metrics_or_is_skipped(fake_llm, monkeypatch):
    from app.collectors.sources import github
    monkeypatch.setattr(github.sources_service, "get_github_config", lambda: {
        "enabled": True, "search_queries": [],
        "monitored_repos": [{"repo": "own/real", "stars_hint": 5000}, {"repo": "own/missing"}],
    })
    fake_llm.register_web("https://api.github.com/repos/own/real", text=json.dumps({
        "html_url": "https://github.com/own/real", "full_name": "own/real", "description": "agent repo",
        "stargazers_count": 321, "forks_count": 12, "pushed_at": "2026-11-02T03:04:05Z",
        "owner": {"login": "own"},
    }), content_type="application/json")
    fake_llm.register_web("https://api.github.com/repos/own/missing", status=404, text="{}",
                          content_type="application/json")
    items = await github.fetch_github()
    assert [i["url"] for i in items] == ["https://github.com/own/real"]
    assert items[0]["raw_score"] == 321
    assert items[0]["comments_count"] == 12
    assert items[0]["published_at"] == datetime(2026, 11, 2, 3, 4, 5, tzinfo=timezone.utc)


@pytest.mark.asyncio
async def test_collector_stores_published_at_in_utc(quiet_sources):
    url = "https://b-collection.example/utc"
    kst = timezone(timedelta(hours=9))
    pub = datetime(2026, 11, 10, 0, 32, 25, tzinfo=kst)
    try:
        await collector_manager._process_and_save_batch([_raw("Agent harness utc", url, published_at=pub)], "RSS")
        async with AsyncSessionLocal() as s:
            row = (await s.execute(select(NewsItem).where(NewsItem.url == url))).scalar_one()
        assert row.published_at.replace(tzinfo=None) == datetime(2026, 11, 9, 15, 32, 25)
    finally:
        await _delete_urls(url)


def test_seed_items_carry_no_synthetic_metrics():
    assert all(s["raw_score"] == 0 and s["comments_count"] == 0 for s in manager_mod.SEED_ITEMS)


# ---------------------------------------------------------------------------
# PERF-03 본문 추출·피드 파싱이 이벤트 루프 스레드에서 돈다
# ---------------------------------------------------------------------------

def test_scraper_extraction_runs_off_the_event_loop(fake_llm, monkeypatch):
    import asyncio
    import llm_fakes
    from app.services import scraper as scraper_mod
    url = "https://article.b-test.example/post"
    fake_llm.register_web(url, text=llm_fakes.FAKE_ARTICLE_HTML)
    threads = []
    real_extract = scraper_mod._extract_text

    def spy(html, u):
        threads.append(threading.current_thread() is threading.main_thread())
        return real_extract(html, u)

    monkeypatch.setattr(scraper_mod, "_extract_text", spy)
    text = asyncio.run(scraper_mod.ArticleScraperService().fetch_and_parse(url))
    assert threads == [False]
    assert len(text) >= 500


@pytest.mark.parametrize("module_name, call", [
    ("app.services.deep_researcher", lambda m, url: m.deep_researcher._fetch_and_parse_feed(url)),
    ("app.services.source_researcher", lambda m, url: m.source_researcher._test_and_extract_feed(url)),
])
def test_research_feed_parsing_runs_off_the_event_loop(fake_llm, monkeypatch, module_name, call):
    import asyncio
    import importlib
    mod = importlib.import_module(module_name)
    url = "https://feed.b-test.example/research.xml"
    fake_llm.register_web(url, text=RSS_TEXT, content_type="application/rss+xml")
    threads = []
    real_parse = mod.feedparser.parse

    def spy(text):
        threads.append(threading.current_thread() is threading.main_thread())
        return real_parse(text)

    monkeypatch.setattr(mod.feedparser, "parse", spy)
    asyncio.run(call(mod, url))
    assert threads == [False]


def test_collection_evaluation_has_no_unused_category_hint():
    """CFG-02: 평가 함수가 쓰지 않던 category_hint 인자를 받지 않는다."""
    import inspect
    from app.services.llm_processor import llm_processor
    assert "category_hint" not in inspect.signature(llm_processor.evaluate_content_with_llm).parameters


@pytest.mark.asyncio
async def test_progress_messages_have_no_pictographs(quiet_sources):
    """수집 진행 문구(step_message, make collect 출력)에 그림 이모지를 쓰지 않는다 (UI 원칙, C 조 지적)."""
    import re
    messages = []

    real_setattr = object.__setattr__

    def record(self, name, value):
        if name == "step_message":
            messages.append(value)
        real_setattr(self, name, value)

    quiet_sources.setattr(type(collector_manager), "__setattr__", record)
    await collector_manager.collect_all()
    assert messages
    pictograph = re.compile("[\U0001F300-\U0001FAFF☀-➿]")
    assert [m for m in messages if pictograph.search(m)] == []


# ---------------------------------------------------------------------------
# D-40 남은 것: 다른 프로세스가 잠금을 쥐면 trigger·reset 이 응답 전에 already_running
# ---------------------------------------------------------------------------

@pytest.fixture
def lock_held_elsewhere(monkeypatch):
    """다른 프로세스(MCP 서버·make collect)가 수집 잠금을 쥔 상태."""
    monkeypatch.setattr(collector_manager, "is_running", False)
    collect = AsyncMock(return_value={"status": "success"})
    monkeypatch.setattr(collector_manager, "collect_all", collect)
    other = open(manager_mod.crawl_lock_path(), "a+")
    fcntl.flock(other.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    yield collect
    fcntl.flock(other.fileno(), fcntl.LOCK_UN)
    other.close()


@pytest.mark.asyncio
async def test_trigger_reports_already_running_when_other_process_collects(lock_held_elsewhere):
    from httpx import ASGITransport, AsyncClient
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/schedule/trigger")
    assert res.status_code == 200
    assert res.json()["status"] == "already_running"
    lock_held_elsewhere.assert_not_called()


@pytest.mark.asyncio
async def test_reset_does_not_delete_while_other_process_collects(lock_held_elsewhere):
    from httpx import ASGITransport, AsyncClient
    from sqlalchemy import func
    from app.main import app
    async with AsyncSessionLocal() as s:
        before = (await s.execute(select(func.count(NewsItem.id)))).scalar_one()
    assert before >= 1
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/schedule/reset-and-collect")
    assert res.status_code == 200
    assert res.json()["status"] == "already_running"
    assert res.json()["deleted_count"] == 0
    async with AsyncSessionLocal() as s:
        after = (await s.execute(select(func.count(NewsItem.id)))).scalar_one()
    assert after == before
    lock_held_elsewhere.assert_not_called()


@pytest.mark.asyncio
async def test_trigger_starts_when_lock_is_free(monkeypatch):
    from httpx import ASGITransport, AsyncClient
    from app.main import app
    monkeypatch.setattr(collector_manager, "is_running", False)
    collect = AsyncMock(return_value={"status": "success"})
    monkeypatch.setattr(collector_manager, "collect_all", collect)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/schedule/trigger")
    assert res.json()["status"] == "started"
    collect.assert_awaited_once()
