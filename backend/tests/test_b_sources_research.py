"""v0.4.2 B 조: 소스·딥 리서치 결함 회귀 테스트.

근거: docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md BUG-20, CC-02, N-02, N-04,
docs/qa-engineer/02_QA_TEST_REPORT.md D-43, D-48, D-50, D-53.
sources.json 은 conftest 의 세션 사본만 쓴다 (실제 파일은 건드리지 않는다).
"""
import asyncio
from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services import sources_service as ss_mod
from app.services.deep_researcher import SEED_EXPLORATION_TARGETS, AutonomousDeepResearcher
from app.services.sources_service import sources_service


def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


def _feeds():
    return sources_service.get_all_sources()["rss_feeds"]


# ---------------------------------------------------------------------------
# BUG-20 저장 실패를 무시하고 성공, RSS id 충돌, 입력 검증 없음
# ---------------------------------------------------------------------------

def test_save_sources_raises_on_write_failure(monkeypatch):
    def broken_dump(*a, **kw):
        raise OSError("disk full")

    monkeypatch.setattr(ss_mod.json, "dump", broken_dump)
    with pytest.raises(ss_mod.SourcesWriteError):
        sources_service.save_sources(sources_service.load_sources())


@pytest.mark.asyncio
async def test_add_rss_reports_write_failure_as_500(monkeypatch):
    monkeypatch.setattr(ss_mod.json, "dump", lambda *a, **kw: (_ for _ in ()).throw(OSError("disk full")))
    async with _client() as ac:
        res = await ac.post("/api/sources/rss", json={"name": "W", "url": "https://write-fail.b-test.example/feed"})
    assert res.status_code == 500
    body = res.json()
    assert body["error_code"] == "ERR_SERVER_INTERNAL"
    assert "sources.json" in body["message"]
    assert "disk full" not in res.text


@pytest.mark.asyncio
async def test_toggle_reports_write_failure_as_500(monkeypatch):
    feed_id = _feeds()[0]["id"]
    monkeypatch.setattr(ss_mod.json, "dump", lambda *a, **kw: (_ for _ in ()).throw(OSError("disk full")))
    async with _client() as ac:
        res = await ac.patch(f"/api/sources/rss/{feed_id}/toggle")
    assert res.status_code == 500
    assert res.json()["error_code"] == "ERR_SERVER_INTERNAL"


def test_rss_ids_do_not_collide_for_non_ascii_names():
    a = sources_service.add_rss_source(name="한글 소스", url="https://kr-a.b-test.example/feed")
    b = sources_service.add_rss_source(name="다른 소스", url="https://kr-b.b-test.example/feed")
    try:
        assert a["id"] != b["id"]
        assert a["id"].strip("_") and b["id"].strip("_")
        sources_service.delete_source("rss", a["id"])
        assert [f["url"] for f in _feeds() if f["id"] == b["id"]] == ["https://kr-b.b-test.example/feed"]
    finally:
        sources_service.delete_source("rss", a["id"])
        sources_service.delete_source("rss", b["id"])


def test_rss_id_gets_suffix_when_slug_already_used():
    a = sources_service.add_rss_source(name="Same Name", url="https://same-a.b-test.example/feed")
    b = sources_service.add_rss_source(name="Same Name", url="https://same-b.b-test.example/feed")
    try:
        assert a["id"] == "same_name"
        assert b["id"] != a["id"] and b["id"].startswith("same_name_")
    finally:
        sources_service.delete_source("rss", a["id"])
        sources_service.delete_source("rss", b["id"])


@pytest.mark.asyncio
@pytest.mark.parametrize("payload", [
    {"name": "X", "url": "https://v.b-test.example/f", "category_hint": "bogus"},
    {"name": "X", "url": "https://v.b-test.example/f", "country": "US"},
    {"name": "X", "url": "ftp://v.b-test.example/f"},
    {"name": "", "url": "https://v.b-test.example/f"},
])
async def test_add_rss_validates_fields(payload):
    before = len(_feeds())
    async with _client() as ac:
        res = await ac.post("/api/sources/rss", json=payload)
    assert res.status_code == 400
    assert res.json()["error_code"] == "ERR_INVALID_PAYLOAD"
    assert len(_feeds()) == before


# ---------------------------------------------------------------------------
# D-53 유형 토글이 item_id 를 무시하고 없는 id 도 200
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_type_toggle_requires_all_and_unknown_id_is_404():
    before = sources_service.get_all_sources()["github_sources"]["enabled"]
    async with _client() as ac:
        bad = await ac.patch("/api/sources/github/owner/repo/toggle")
        assert bad.status_code == 404
        assert bad.json()["error_code"] == "ERR_NOT_FOUND"
        assert sources_service.get_all_sources()["github_sources"]["enabled"] == before

        ok = await ac.patch("/api/sources/github/all/toggle")
        assert ok.status_code == 200
        assert sources_service.get_all_sources()["github_sources"]["enabled"] == (not before)
        back = await ac.patch("/api/sources/github/all/toggle")
        assert back.status_code == 200
    assert sources_service.get_all_sources()["github_sources"]["enabled"] == before


# ---------------------------------------------------------------------------
# CC-02 / D-43 화면이 부르지 않는 소스·리서치 엔드포인트를 지운다
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_unused_source_and_research_endpoints_are_removed():
    async with _client() as ac:
        gh = await ac.post("/api/sources/github", json={"repo": "a/b"})
        disc = await ac.post("/api/research/discover", json={"query": "agent"})
        reg = await ac.post("/api/research/register-candidate", json={"name": "n", "feed_url": "https://x/f"})
    assert gh.status_code in (404, 405)  # D-54: 307 리다이렉트 없이
    assert disc.status_code in (404, 405)
    assert reg.status_code in (404, 405)
    paths = app.openapi()["paths"]
    assert "post" not in paths.get("/api/sources/github", {})
    assert "/api/research/discover" not in paths
    assert "/api/research/register-candidate" not in paths
    assert not hasattr(sources_service, "add_github_repo")


# ---------------------------------------------------------------------------
# N-02 / D-48 run-deep 태스크 참조 보관, 실패 요약
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_deep_research_failure_is_recorded_in_summary(monkeypatch):
    researcher = AutonomousDeepResearcher()
    monkeypatch.setattr(researcher, "mine_reference_domains_from_articles", AsyncMock(side_effect=RuntimeError("mine boom")))
    with pytest.raises(RuntimeError):
        await researcher.run_deep_research(max_candidates=1)
    summary = researcher.get_status()["last_run_summary"]
    assert summary["status"] == "error"
    assert summary["error"] == "RuntimeError"
    assert summary["completed_at"]


@pytest.mark.asyncio
async def test_run_deep_keeps_task_reference_until_done(monkeypatch):
    import app.api.research as research_api
    gate = asyncio.Event()

    async def slow_run(max_candidates=6):
        await gate.wait()
        return {}

    monkeypatch.setattr(research_api.deep_researcher, "is_running", False)
    monkeypatch.setattr(research_api.deep_researcher, "run_deep_research", slow_run)
    async with _client() as ac:
        res = await ac.post("/api/research/run-deep?max_candidates=2")
    assert res.status_code == 200
    assert len(research_api._background_tasks) == 1
    gate.set()
    await asyncio.gather(*research_api._background_tasks)
    await asyncio.sleep(0)
    assert research_api._background_tasks == set()


# ---------------------------------------------------------------------------
# N-04 / D-50 발굴 후보가 많으면 시드가 굶고, 등록된 소스를 다시 탐침한다
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_deep_research_interleaves_seeds_and_skips_monitored(monkeypatch):
    researcher = AutonomousDeepResearcher()
    monitored = _feeds()[0]
    mined = [f"https://mined-{i}.b-test.example" for i in range(10)]
    mined.insert(0, monitored["url"])  # 이미 등록된 피드 주소
    probed = []

    async def fake_probe(url):
        probed.append(url)
        return {"status": "error", "message": "no feed"}

    monkeypatch.setattr(researcher, "mine_reference_domains_from_articles", AsyncMock(return_value=mined))
    monkeypatch.setattr(researcher, "probe_and_discover_feed", fake_probe)
    summary = await researcher.run_deep_research(max_candidates=6)

    assert monitored["url"] not in probed
    seed_urls = {s["url"] for s in SEED_EXPLORATION_TARGETS}
    assert sum(1 for u in probed if u in seed_urls) >= 2
    assert sum(1 for u in probed if u.startswith("https://mined-")) >= 2
    assert len(probed) == 6 == summary["evaluated_total"]
