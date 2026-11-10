import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.deep_researcher import deep_researcher
from app.models.news import SourceResearchLog
from app.database import AsyncSessionLocal
from sqlalchemy import select
from unittest.mock import AsyncMock

import llm_fakes
import app.services.deep_researcher as deep_researcher_module

@pytest.mark.asyncio
async def test_probe_and_discover_feed_github(fake_llm):
    fake_llm.register_web("https://github.com/All-Hands-AI/OpenHands/releases.atom",
                          text=llm_fakes.FAKE_ATOM_FEED, content_type="application/atom+xml")
    res = await deep_researcher.probe_and_discover_feed("https://github.com/All-Hands-AI/OpenHands")
    assert res.get("status") == "success"
    assert res["feed_url"] == "https://github.com/All-Hands-AI/OpenHands/releases.atom"
    assert len(res["entries"]) == 2

@pytest.mark.asyncio
async def test_evaluate_and_decide_scoring():
    mock_feed = {
        "name": "SWE-bench Regression Testing Blog",
        "feed_url": "https://example.com/swe_feed.xml",
        "site_url": "https://example.com",
        "description": "Standardized evaluation harness and docker benchmark regression suite for autonomous coding agents.",
        "entries": [
            {
                "title": "Benchmarking Multi-Agent Reasoning with SWE-bench Docker Harness",
                "summary": "Deep dive into regression test suites, deterministic evaluation, and sandbox isolation."
            }
        ]
    }
    decision = await deep_researcher.evaluate_and_decide(mock_feed, hint_cat="harness")
    assert decision["score"] >= 7.5
    # 판정은 점수 구간으로 하나로 정해진다 (8.2 이상 채택, 6.5 이상 관찰)
    expected = "AUTO_ADOPTED" if decision["score"] >= 8.2 else "WATCHLIST"
    assert decision["verdict"] == expected
    assert decision["should_add"] is (expected == "AUTO_ADOPTED")
    assert len(decision["reason"]) > 20

@pytest.mark.asyncio
async def test_deep_research_run_and_audit(fake_llm, monkeypatch):
    # 후보 2개: 피드가 있는 GitHub 저장소(흉내 Atom), 응답 404 인 사이트. 실제 네트워크로 나가지 않는다
    seeds = [
        {"name": "Fake Harness Repo", "url": "https://github.com/fake-org/fake-harness", "category_hint": "harness"},
        {"name": "Fake Dead Site", "url": "https://dead.example.org", "category_hint": "ai_news"},
    ]
    monkeypatch.setattr(deep_researcher_module, "SEED_EXPLORATION_TARGETS", seeds)
    monkeypatch.setattr(deep_researcher, "mine_reference_domains_from_articles", AsyncMock(return_value=[]))
    adopted = []
    monkeypatch.setattr(deep_researcher_module.sources_service, "add_rss_source", lambda **kw: adopted.append(kw))
    fake_llm.register_web("https://github.com/fake-org/fake-harness/releases.atom",
                          text=llm_fakes.FAKE_ATOM_FEED, content_type="application/atom+xml")
    fake_llm.register_web("https://dead.example.org", status=404, text="not found")

    summary = await deep_researcher.run_deep_research(max_candidates=2)
    assert summary["evaluated_total"] == 2
    assert "completed_at" in summary
    by_url = {r["site_url"]: r for r in summary["results"]}
    assert by_url["https://dead.example.org"]["verdict"] == "REJECTED"
    good = by_url["https://github.com/fake-org/fake-harness"]
    assert good["feed_url"] == "https://github.com/fake-org/fake-harness/releases.atom"
    assert "기술 실증 실패" not in good["reason"]  # 피드 탐지가 성공해 평가 단계까지 갔다
    assert summary["auto_adopted"] == len(adopted)

    # 이번 실행의 감사 로그 (앞 실행·다른 테스트 행과 섞이지 않게 URL 로 찾는다)
    async with AsyncSessionLocal() as session:
        rows = (await session.execute(
            select(SourceResearchLog).where(SourceResearchLog.site_url.in_(list(by_url)))
        )).scalars().all()
        logged = {r.site_url: r for r in rows}
        assert logged["https://dead.example.org"].verdict == "REJECTED"
        assert "HTTP 404" in logged["https://dead.example.org"].verdict_reason
        assert logged["https://github.com/fake-org/fake-harness"].verdict == good["verdict"]
        assert logged["https://github.com/fake-org/fake-harness"].analyzed_articles_count == 2

@pytest.mark.asyncio
async def test_deep_research_api_endpoints(monkeypatch):
    # run-deep 는 백그라운드 태스크로 사이클을 띄운다. 사이클 자체는 흉내 내고 호출 인자만 본다
    run_mock = AsyncMock(return_value={})
    monkeypatch.setattr(deep_researcher, "run_deep_research", run_mock)
    monkeypatch.setattr(deep_researcher, "is_running", False)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Status endpoint
        s_res = await ac.get("/api/research/status")
        assert s_res.status_code == 200
        s_data = s_res.json()
        assert "is_running" in s_data
        assert "cadence" in s_data

        # 2. Audit logs endpoint
        a_res = await ac.get("/api/research/audit-logs?limit=5")
        assert a_res.status_code == 200
        a_data = a_res.json()
        assert a_data["status"] == "success"
        assert "logs" in a_data

        # 3. Trigger run-deep endpoint
        t_res = await ac.post("/api/research/run-deep?max_candidates=1")
        assert t_res.status_code == 200
        t_data = t_res.json()
        assert t_data["status"] == "started"
        assert t_data["max_candidates"] == 1
    import asyncio
    await asyncio.sleep(0)
    run_mock.assert_awaited_once_with(max_candidates=1)
