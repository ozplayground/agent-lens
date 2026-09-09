import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.deep_researcher import deep_researcher
from app.models.news import SourceResearchLog
from app.database import AsyncSessionLocal
from sqlalchemy import select

@pytest.mark.asyncio
async def test_probe_and_discover_feed_github():
    res = await deep_researcher.probe_and_discover_feed("https://github.com/All-Hands-AI/OpenHands")
    assert res.get("status") == "success"
    assert "releases.atom" in res.get("feed_url", "")
    assert len(res.get("entries", [])) > 0

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
    assert decision["verdict"] in ["AUTO_ADOPTED", "WATCHLIST"]
    assert decision["score"] >= 7.5
    assert len(decision["reason"]) > 20

@pytest.mark.asyncio
async def test_deep_research_run_and_audit():
    # Run a small batch of 2 candidates
    summary = await deep_researcher.run_deep_research(max_candidates=2)
    assert summary["evaluated_total"] > 0
    assert "completed_at" in summary

    # Verify audit log in database
    async with AsyncSessionLocal() as session:
        logs = await session.execute(select(SourceResearchLog))
        items = logs.scalars().all()
        assert len(items) > 0
        latest = items[-1]
        assert latest.verdict in ["AUTO_ADOPTED", "WATCHLIST", "REJECTED", "ALREADY_MONITORED"]
        assert len(latest.verdict_reason) > 5

@pytest.mark.asyncio
async def test_deep_research_api_endpoints():
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
        assert t_data["status"] in ["started", "already_running"]
