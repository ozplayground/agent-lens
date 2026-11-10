"""v0.4.2 B 조 2차: 재리뷰 권장 지적 회귀 테스트.

근거: docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md 11절 N-10, N-11, N-12, TEST-08,
docs/fullstack-architect/01_ARCHITECTURE_ADR.md Q12.
"""
import fcntl
import hashlib
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import text

from app.collectors import manager as manager_mod
from app.collectors.manager import collector_manager
from app.config import BACKEND_DIR, settings
from app.database import engine

FMT = "%Y-%m-%d %H:%M:%S.%f"


# ---------------------------------------------------------------------------
# N-10 메일의 대시보드 링크 고정 주소
# ---------------------------------------------------------------------------

def test_email_dashboard_link_uses_public_web_url(monkeypatch):
    from app.services.email_service import email_service
    monkeypatch.setattr(settings, "PUBLIC_WEB_URL", "https://web.b-test.example:4100")
    html = email_service._build_html({"date": "2026-11-10", "headline": "h", "overview": "o", "categories": [],
                                      "markdown_report": "", "title": "오늘의 AI 브리핑"})
    assert 'href="https://web.b-test.example:4100"' in html
    assert "localhost:3001" not in html


# ---------------------------------------------------------------------------
# N-11 옛 수집기가 +09:00 시각을 벽시계로 저장한 국내 피드 행 (m003)
# ---------------------------------------------------------------------------

def _ins(conn, rid, title, source, published, created, raw=0, comments=0, hot=100.0, url=None):
    url = url or f"https://m003.b-test.example/{rid}"
    conn.execute(text(
        "INSERT INTO news_items (id, title, url, source, category, summary, tags, tldr_bullets, why_it_matters, "
        "tech_stack, quality_score, is_high_signal, raw_score, comments_count, hotness_score, published_at, "
        "created_at, dedup_hash) VALUES (:id, :t, :u, :s, 'ai_news', '', '', '[]', '', '', 7.0, 0, :r, :c, :h, "
        ":p, :cr, :d)"),
        {"id": rid, "t": title, "u": url, "s": source, "r": raw, "c": comments, "h": hot,
         "p": published.strftime(FMT), "cr": created.strftime(FMT),
         "d": hashlib.sha256(f"{title}|{url}".encode()).hexdigest()})


def _row(conn, rid):
    return conn.execute(text("SELECT published_at, raw_score, comments_count, hotness_score FROM news_items "
                             "WHERE id = :i"), {"i": rid}).one()


def _m003_scenario(conn):
    import app.database as db_mod
    from app.services.categorizer import calculate_hotness

    crawl = datetime(2026, 11, 9, 18, 0, 0)
    # KST 피드: 한 행이라도 발행 > 수집 이면 그 피드의 행 전부가 벽시계 저장이다
    _ins(conn, 990001, "[KST피드] 최신", "rss_kr", crawl + timedelta(hours=5), crawl, raw=180)
    _ins(conn, 990002, "[KST피드] 예전", "rss_kr", crawl - timedelta(hours=30), crawl, raw=180)
    # 날짜 없는 국내 피드(수집 시각 = UTC, 맞다)는 그대로
    _ins(conn, 990003, "[날짜없는피드] 글", "rss_kr", crawl, crawl + timedelta(seconds=3), raw=180)
    # 해외 RSS: 시각 그대로, 합성 150 은 0
    _ins(conn, 990004, "[Global] post", "rss", crawl - timedelta(hours=2), crawl, raw=150)
    # GitHub 감시 저장소 폴백의 합성 지표(별 = stars_hint, 없으면 5000 / 포크 = int(별×0.12))는 0
    _ins(conn, 990005, "own/fallback: d", "github", crawl, crawl, raw=1234, comments=148,
         url="https://github.com/own/fallback")
    _ins(conn, 990006, "own/real: d", "github", crawl - timedelta(hours=3), crawl, raw=321, comments=12)
    _ins(conn, 990010, "own/nohint: d", "github", crawl, crawl, raw=5000, comments=600,
         url="https://github.com/own/nohint")
    # 오탐 회귀 (M003-01): 실제 검색 결과는 별·포크가 우연히 int(별×0.12) 와 맞아도 그대로 둔다
    _ins(conn, 990007, "x/three: d", "github", crawl, crawl, raw=3, comments=0, url="https://github.com/x/three")
    _ins(conn, 990008, "x/eight: d", "github", crawl, crawl, raw=8, comments=0, url="https://github.com/x/eight")
    _ins(conn, 990009, "x/big: d", "github", crawl, crawl, raw=512, comments=61, url="https://github.com/x/big")
    # 감시 저장소지만 별이 stars_hint 와 다르면 실제 검색 결과다
    _ins(conn, 990011, "own/fallback: real", "github", crawl, crawl, raw=900, comments=108,
         url="https://github.com/own/fallback")
    ids = range(990001, 990012)

    db_mod._m003_fix_legacy_news_rows(conn)
    first = {rid: tuple(_row(conn, rid)) for rid in ids}

    assert first[990001][0].startswith("2026-11-09 14:00:00")
    assert first[990002][0].startswith("2026-11-08 03:00:00")
    assert first[990003][0].startswith("2026-11-09 18:00:00")
    assert first[990004][0].startswith("2026-11-09 16:00:00")
    assert [first[i][1] for i in range(990001, 990005)] == [0, 0, 0, 0]
    assert first[990005][1:3] == (0, 0)
    assert first[990010][1:3] == (0, 0)
    assert first[990006][1:3] == (321, 12)
    assert first[990007][1:3] == (3, 0)
    assert first[990008][1:3] == (8, 0)
    assert first[990009][1:3] == (512, 61)
    assert first[990011][1:3] == (900, 108)
    # hotness 는 새 식으로, 수집 시각(created_at) 기준
    ref = crawl.replace(tzinfo=timezone.utc)
    assert first[990001][3] == calculate_hotness(0, 0, datetime(2026, 11, 9, 14, 0, tzinfo=timezone.utc), now=ref)
    assert first[990001][3] < 100
    assert first[990006][3] == calculate_hotness(321, 12, datetime(2026, 11, 9, 15, 0, tzinfo=timezone.utc), now=ref)

    # 두 번 돌려도 바뀌지 않는다
    db_mod._m003_fix_legacy_news_rows(conn)
    assert {rid: tuple(_row(conn, rid)) for rid in ids} == first


MONITORED = {"github_sources": {"monitored_repos": [
    {"repo": "own/fallback", "stars_hint": 1234},
    {"repo": "own/nohint"},
]}}


@pytest.mark.asyncio
async def test_m003_shifts_only_kst_wall_clock_feeds_and_recomputes_hotness(monkeypatch):
    from app.services.sources_service import sources_service
    monkeypatch.setattr(sources_service, "get_all_sources", lambda: MONITORED)
    async with engine.connect() as conn:
        trans = await conn.begin()
        try:
            await conn.run_sync(_m003_scenario)
        finally:
            await trans.rollback()  # 공용 테스트 DB 의 다른 행을 바꾸지 않는다


def test_m003_is_registered_migration():
    import app.database as db_mod
    assert db_mod.MIGRATIONS[2] is db_mod._m003_fix_legacy_news_rows


# ---------------------------------------------------------------------------
# N-12 다른 프로세스가 잠금을 쥐면 make collect(API 모드)가 시간 초과까지 기다린다
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_trigger_says_other_process_when_lock_held_elsewhere(monkeypatch):
    from httpx import ASGITransport, AsyncClient
    from app.main import app
    monkeypatch.setattr(collector_manager, "is_running", False)
    monkeypatch.setattr(collector_manager, "collect_all", AsyncMock(return_value={}))
    with open(manager_mod.crawl_lock_path(), "a+") as other:
        fcntl.flock(other.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                res = await ac.post("/api/schedule/trigger")
        finally:
            fcntl.flock(other.fileno(), fcntl.LOCK_UN)
    body = res.json()
    assert body["status"] == "already_running"
    assert body["other_process"] is True

    monkeypatch.setattr(collector_manager, "is_running", True)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        same = (await ac.post("/api/schedule/trigger")).json()
    assert same["status"] == "already_running"
    assert same["other_process"] is False


# ---------------------------------------------------------------------------
# Q12 fcntl 이 없는 OS(Windows)에서는 프로세스 안 잠금으로 대체한다
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_crawl_lock_falls_back_to_in_process_lock_without_fcntl(monkeypatch):
    monkeypatch.setattr(manager_mod, "fcntl", None)
    first = manager_mod.acquire_crawl_lock()
    assert first is not None
    assert manager_mod.acquire_crawl_lock() is None  # 같은 프로세스 안 두 번째는 못 잡는다
    monkeypatch.setattr(collector_manager, "is_running", False)
    assert collector_manager.is_busy() is True
    manager_mod.release_crawl_lock(first)
    assert collector_manager.is_busy() is False

    for name in ("fetch_rss", "fetch_hackernews", "fetch_github", "fetch_arxiv", "fetch_huggingface", "fetch_reddit"):
        monkeypatch.setattr(manager_mod, name, AsyncMock(return_value=[]))
    monkeypatch.setattr(collector_manager, "_process_and_save_batch", AsyncMock(return_value=0))
    res = await collector_manager.collect_all()
    assert res["status"] == "success"
    again = manager_mod.acquire_crawl_lock()
    assert again is not None  # collect_all 이 잠금을 풀었다
    manager_mod.release_crawl_lock(again)


def test_manager_imports_without_fcntl():
    """fcntl 을 import 할 수 없는 환경에서도 수집 관리자 모듈을 불러올 수 있다."""
    code = (
        "import sys, builtins\n"
        "real = builtins.__import__\n"
        "def fake(name, globals=None, *a, **k):\n"
        "    if name == 'fcntl' and (globals or {}).get('__name__') == 'app.collectors.manager':\n"
        "        raise ImportError('no fcntl')\n"
        "    return real(name, globals, *a, **k)\n"
        "builtins.__import__ = fake\n"
        "import app.collectors.manager as m\n"
        "assert m.fcntl is None\n"
        "h = m.acquire_crawl_lock(); assert h is not None; assert m.acquire_crawl_lock() is None\n"
        "m.release_crawl_lock(h); print('ok')\n"
    )
    env = dict(os.environ, DATABASE_URL=os.environ["DATABASE_URL"])
    out = subprocess.run([sys.executable, "-c", code], cwd=BACKEND_DIR, env=env, capture_output=True, text=True)
    assert out.returncode == 0, out.stderr
    assert out.stdout.strip().endswith("ok")


# ---------------------------------------------------------------------------
# TEST-08 테스트 DB 임시 폴더를 지우지 않는다
# ---------------------------------------------------------------------------

def test_pytest_session_removes_its_test_db_dir(tmp_path):
    tmp_root = tmp_path / "tmp"
    tmp_root.mkdir()
    env = dict(os.environ, TMPDIR=str(tmp_root))
    env.pop("DATABASE_URL", None)
    out = subprocess.run(
        [sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider", "tests/test_api.py::test_health"],
        cwd=BACKEND_DIR, env=env, capture_output=True, text=True, timeout=120,
    )
    assert out.returncode == 0, out.stdout + out.stderr
    assert list(tmp_root.glob("agentlens-test-*")) == []
