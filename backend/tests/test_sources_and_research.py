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
async def test_source_researcher_discover():
    res = await source_researcher.discover_sources(query="harness", limit=5)
    assert res["total_found"] > 0
    assert len(res["candidates"]) > 0
    c = res["candidates"][0]
    assert "feed_url" in c
    assert c["relevance_score"] >= 7.0

@pytest.mark.asyncio
async def test_source_researcher_inspect_url():
    res = await source_researcher.inspect_url("https://github.com/princeton-nlp/SWE-bench")
    assert res.get("status") == "found"
    assert "swe-bench" in res.get("feed_url", "").lower()

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

        # 2. POST /api/research/discover
        disc_res = await ac.post("/api/research/discover", json={"query": "agent", "limit": 4})
        assert disc_res.status_code == 200
        disc_data = disc_res.json()
        assert "candidates" in disc_data

        # 3. POST /api/research/register-candidate
        candidate_payload = {
            "name": "Test Autogen Blog",
            "feed_url": "https://example.org/autogen_test/feed.xml",
            "site_url": "https://example.org/autogen_test",
            "category_hint": "agent_tech",
            "country": "GLOBAL",
            "description": "Candidate registered via API"
        }
        reg_res = await ac.post("/api/research/register-candidate", json=candidate_payload)
        assert reg_res.status_code == 200
        reg_data = reg_res.json()
        assert reg_data["status"] == "success"

        # Cleanup created test feed
        sources_service.delete_source("rss", "test_autogen_blog")
