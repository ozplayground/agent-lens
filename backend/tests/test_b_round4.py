"""v0.4.2 B 조 4차: spec-writer 가 찾은 backend 문구·동작 불일치.

(1) Slack 테스트 메시지, (3) category_hint, (4) inspect-url 예외 원문, (5) 딥 리서치 채택 저장 실패.
(2) make collect 직접 모드 경고는 tests/test_collect_script.py.
"""
import hashlib
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import delete, desc, select

from app.database import AsyncSessionLocal
from app.models.news import NewsItem, SourceResearchLog

SECRET = "secret-detail /etc/passwd 10.0.0.7"


# (1) 테스트 메시지가 없는 기능(매일 아침 Must Read 하네스 소식)을 안내한다
def test_webhook_test_messages_describe_only_daily_briefing():
    from app.services.webhook_service import webhook_service
    for provider in ("slack", "discord", "generic"):
        body = str(webhook_service.build_test_payload(provider))
        assert "Must Read" not in body
        assert "매일 아침" not in body
    slack = str(webhook_service.build_test_payload("slack"))
    assert "일일 브리핑" in slack
    assert "auto_dispatch_daily_briefing" in slack or "자동 발송" in slack


# (3) category_hint: 분류기가 판단하지 못한(unrelated) 항목은 피드의 기본 카테고리로 저장한다
@pytest.mark.asyncio
async def test_feed_category_hint_is_default_when_classifier_cannot_decide(monkeypatch):
    from app.collectors import manager as manager_mod
    from app.collectors.manager import collector_manager
    url = "https://hint.b-test.example/post"
    monkeypatch.setattr(manager_mod.llm_processor, "evaluate_content_with_llm", AsyncMock(return_value={
        "is_worthwhile": True, "quality_score": 7.0, "is_high_signal": False, "category": None, "why_it_matters": ""}))
    raw = {"title": "[Feed] 사내 개발 문화 회고", "url": url, "source": "rss_kr", "summary": "팀 회고",
           "published_at": datetime.now(timezone.utc) - timedelta(hours=1), "category_hint": "harness"}
    try:
        saved = await collector_manager._process_and_save_batch([raw], "RSS")
        assert saved == 1
        async with AsyncSessionLocal() as s:
            row = (await s.execute(select(NewsItem).where(NewsItem.url == url))).scalar_one()
        assert row.category == "harness"
    finally:
        async with AsyncSessionLocal() as s:
            await s.execute(delete(NewsItem).where(NewsItem.url == url))
            await s.commit()


@pytest.mark.asyncio
async def test_rss_items_carry_feed_category_hint(fake_llm, monkeypatch):
    from app.collectors.sources import rss
    feed_url = "https://feed.b-test.example/hint.xml"
    fake_llm.register_web(feed_url, content_type="application/rss+xml", text=(
        '<?xml version="1.0"?><rss version="2.0"><channel><title>T</title>'
        '<item><title>a</title><link>https://feed.b-test.example/a</link></item></channel></rss>'))
    monkeypatch.setattr(rss, "load_feeds_from_config",
                        lambda: [{"name": "H", "url": feed_url, "category_hint": "mcp_plugins_skills"}])
    items = await rss.fetch_rss()
    assert items[0]["category_hint"] == "mcp_plugins_skills"


# (4) inspect-url·딥 리서치 탐침의 접속 예외 원문을 응답·감사 기록에 싣지 않는다
class _BoomClient:
    def __init__(self, *a, **kw):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    async def get(self, *a, **kw):
        raise RuntimeError(SECRET)


@pytest.mark.asyncio
async def test_inspect_url_hides_connection_exception_text(monkeypatch, caplog):
    from app.services import source_researcher as sr_mod
    monkeypatch.setattr(sr_mod.httpx, "AsyncClient", _BoomClient)
    res = await sr_mod.source_researcher.inspect_url("https://boom.b-test.example")
    assert res["status"] == "error"
    assert SECRET not in str(res)
    feed = await sr_mod.source_researcher._test_and_extract_feed("https://boom.b-test.example/feed")
    assert feed["status"] == "error" and SECRET not in str(feed)
    assert SECRET in caplog.text  # 원문은 로그에만


@pytest.mark.asyncio
async def test_deep_research_probe_hides_connection_exception_text(monkeypatch):
    from app.services import deep_researcher as dr_mod
    monkeypatch.setattr(dr_mod.httpx, "AsyncClient", _BoomClient)
    probe = await dr_mod.deep_researcher.probe_and_discover_feed("https://boom.b-test.example")
    feed = await dr_mod.deep_researcher._fetch_and_parse_feed("https://boom.b-test.example/feed")
    assert probe["status"] == "error" and SECRET not in str(probe)
    assert feed["status"] == "error" and SECRET not in str(feed)


# (5) 자동 채택 중 sources.json 저장 실패: 사이클을 끝까지 돌고 그 후보의 감사 기록에 실패를 남긴다
@pytest.mark.asyncio
async def test_deep_research_adoption_write_failure_is_audited(monkeypatch):
    from app.services import deep_researcher as dr_mod
    from app.services.sources_service import SourcesWriteError
    researcher = dr_mod.AutonomousDeepResearcher()
    target = "https://adopt-fail.b-test.example"
    monkeypatch.setattr(researcher, "mine_reference_domains_from_articles", AsyncMock(return_value=[target]))
    monkeypatch.setattr(researcher, "probe_and_discover_feed", AsyncMock(return_value={
        "status": "success", "name": "Adopt Fail Blog", "feed_url": f"{target}/feed",
        "site_url": target, "description": "", "entries": [{"title": "t"}]}))
    monkeypatch.setattr(researcher, "evaluate_and_decide", AsyncMock(return_value={
        "verdict": "AUTO_ADOPTED", "score": 9.0, "category": "harness", "reason": "좋음", "should_add": True}))
    monkeypatch.setattr(dr_mod.sources_service, "add_rss_source",
                        lambda **kw: (_ for _ in ()).throw(SourcesWriteError("sources.json")))

    summary = await researcher.run_deep_research(max_candidates=1)

    assert summary["auto_adopted"] == 0
    assert summary["adopt_failed"] == 1
    assert summary["results"][0]["verdict"] != "AUTO_ADOPTED"
    async with AsyncSessionLocal() as s:
        log = (await s.execute(select(SourceResearchLog).where(SourceResearchLog.feed_url == f"{target}/feed")
                                .order_by(desc(SourceResearchLog.id)))).scalars().first()
        assert log is not None
        assert "저장" in log.verdict_reason
        await s.execute(delete(SourceResearchLog).where(SourceResearchLog.feed_url == f"{target}/feed"))
        await s.commit()


# D-54 지운 엔드포인트가 슬래시 리다이렉트(307) 없이 바로 404·405 를 준다
DELETED_ENDPOINTS = [
    ("POST", "/api/chat/query"),
    ("GET", "/api/chat/search?q=agent"),
    ("POST", "/api/research/discover"),
    ("POST", "/api/research/register-candidate"),
    ("POST", "/api/sources/github"),
    ("GET", "/api/mcp/info"),
    ("POST", "/api/webhook/send-briefing"),
    ("POST", "/api/briefing/generate"),
    ("GET", "/api/news/1"),
    ("POST", "/api/news/1/ask"),
    ("DELETE", "/api/news/all"),
]


@pytest.mark.asyncio
async def test_deleted_endpoints_answer_404_or_405_without_redirect():
    from httpx import ASGITransport, AsyncClient
    from app.main import app
    got = {}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=False) as ac:
        for method, path in DELETED_ENDPOINTS:
            res = await ac.request(method, path, json={})
            got[f"{method} {path}"] = res.status_code
    assert {k: v for k, v in got.items() if v not in (404, 405)} == {}


# BRIEFING_TITLE(briefing.title) 을 마크다운·Notion·메일·웹훅 브리핑 제목이 쓴다
TITLE = "팀 데일리 에이전트 브리핑"


@pytest.fixture
def custom_title(monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "BRIEFING_TITLE", TITLE)
    return TITLE


@pytest.mark.asyncio
async def test_briefing_markdown_and_payload_use_configured_title(custom_title):
    from app.services.briefing_service import briefing_service
    data = await briefing_service.generate_daily_briefing()
    assert data["title"] == TITLE
    assert data["markdown_report"].splitlines()[0] == f"# {TITLE}"


@pytest.mark.asyncio
async def test_briefing_email_uses_configured_title(custom_title, monkeypatch, fake_smtp):
    import email
    from email.header import decode_header, make_header
    from app.config import settings
    from app.services.email_service import email_service
    briefing = {"date": "2026-11-10", "headline": "h", "overview": "o", "categories": [], "title": TITLE}
    html = email_service._build_html(briefing)
    assert f"<title>{TITLE} - 2026-11-10</title>" in html
    assert "오늘의 AI 브리핑" not in html
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.b-test.example")
    ok, _ = await email_service.send_briefing_email(briefing, to_email="team@b-test.example")
    assert ok
    msg = email.message_from_string(fake_smtp.sent[-1]["msg"])
    assert str(make_header(decode_header(msg["Subject"]))) == f"[AgentLens] {TITLE} - 2026-11-10"


@pytest.mark.asyncio
async def test_briefing_notion_page_uses_configured_title(custom_title, monkeypatch):
    from app.services import notion_service as ns_mod
    sent = {}

    class Resp:
        def __init__(self, code, body):
            self.status_code, self._body, self.text = code, body, ""

        def json(self):
            return self._body

    class SpyClient:
        def __init__(self, *a, **kw):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def get(self, *a, **kw):
            return Resp(404, {})

        async def post(self, url, headers=None, json=None):
            sent["payload"] = json
            return Resp(200, {"url": "https://notion.so/x", "id": "x"})

        async def patch(self, *a, **kw):
            return Resp(200, {})

    monkeypatch.setattr(ns_mod.httpx, "AsyncClient", SpyClient)
    await ns_mod.notion_service.create_briefing_page(
        {"date": "2026-11-10", "headline": "h", "overview": "o", "categories": []},
        api_key="secret_x", parent_page_id="0123456789abcdef0123456789abcdef")
    title = sent["payload"]["properties"]["title"][0]["text"]["content"]
    assert title == f"{TITLE} - 2026-11-10"


@pytest.mark.asyncio
async def test_briefing_webhook_dispatch_uses_configured_title(custom_title, monkeypatch):
    from app.config import settings
    from app.services.briefing_service import briefing_service
    from app.services.webhook_service import webhook_service
    dispatch = AsyncMock(return_value=(True, "ok"))
    monkeypatch.setattr(webhook_service, "dispatch_briefing", dispatch)
    monkeypatch.setattr(settings, "SLACK_WEBHOOK_URL", "https://hooks.b-test.example/x")
    monkeypatch.setattr(settings, "NOTION_AUTO_EXPORT", False)
    monkeypatch.setattr(settings, "EMAIL_AUTO_SEND", False)
    await briefing_service.auto_dispatch_all({"date": "2026-11-10", "headline": "h", "overview": "o", "categories": []})
    assert dispatch.await_args.args[1]["title"] == f"{TITLE} (2026-11-10)"


def test_briefing_email_heading_is_not_overwritten_by_item_titles(custom_title):
    from app.services.email_service import email_service
    briefing = {"date": "2026-11-10", "headline": "h", "overview": "o", "categories": [
        {"id": "harness", "name": "하네스", "summary": "s", "items": [{"title": "마지막 기사 제목", "url": "https://x.example"}]}]}
    html = email_service._build_html(briefing)
    assert f"<title>{TITLE} - 2026-11-10</title>" in html
    head = html.split("</h1>")[0]
    assert TITLE in head and "마지막 기사 제목" not in head
