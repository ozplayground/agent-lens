import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.sources_service import sources_service
from app.services.source_researcher import source_researcher

def test_sources_service_load():
    data = sources_service.get_all_sources()
    assert "rss_feeds" in data
    assert "github_sources" in data
    assert "reddit_sources" in data
    assert len(data["rss_feeds"]) >= 10

def test_sources_service_active_feeds():
    feeds = sources_service.get_active_rss_feeds()
    assert len(feeds) > 0
    for f in feeds:
        assert f.get("enabled", True) is True

def test_sources_toggle_and_crud():
    # 1. Add temp source
    temp_feed = sources_service.add_rss_source(
        name="Test Feed Discovery",
        url="https://example.com/test_feed.xml",
        category_hint="harness",
        description="Testing CRUD"
    )
    assert temp_feed["url"] == "https://example.com/test_feed.xml"
    assert temp_feed["enabled"] is True

    # 2. Toggle source
    toggled = sources_service.toggle_source("rss", temp_feed["id"])
    assert toggled is True
    updated = [f for f in sources_service.get_all_sources()["rss_feeds"] if f["id"] == temp_feed["id"]][0]
    assert updated["enabled"] is False

    # 3. Delete source
    deleted = sources_service.delete_source("rss", temp_feed["id"])
    assert deleted is True
    rem = [f for f in sources_service.get_all_sources()["rss_feeds"] if f["id"] == temp_feed["id"]]
    assert len(rem) == 0

@pytest.mark.asyncio
async def test_source_researcher_inspect_url(fake_llm):
    import llm_fakes
    fake_llm.register_web("https://github.com/princeton-nlp/SWE-bench/releases.atom",
                          text=llm_fakes.FAKE_ATOM_FEED, content_type="application/atom+xml")
    res = await source_researcher.inspect_url("https://github.com/princeton-nlp/SWE-bench")
    assert res.get("status") == "found"
    assert res["feed_url"] == "https://github.com/princeton-nlp/SWE-bench/releases.atom"
    assert len(res["recent_posts"]) == 2

@pytest.mark.asyncio
async def test_sources_and_research_api_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. GET /api/sources
        res = await ac.get("/api/sources")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert "stats" in data
        assert data["stats"]["total_rss"] >= 10

        # discover·register-candidate 는 v0.4.2 에서 지웠다 (CC-02). 회귀는 tests/test_b_sources_research.py
