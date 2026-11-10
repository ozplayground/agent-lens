"""v0.4.2 B 조: 설정·스케줄·DB 스키마 결함 회귀 테스트.

근거: docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md CFG-01~03, CC-03, CC-04, CC-06, CC-07, ARCH-03(retriever),
ARCH-04, PERF-04, PERF-06, docs/qa-engineer/02_QA_TEST_REPORT.md D-22~24, D-38, D-39.
"""
import json
import logging
from pathlib import Path
from unittest.mock import AsyncMock

import pytest
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import text

import app.config as app_config
from app.config import BACKEND_DIR, Settings, settings
from app.database import AsyncSessionLocal, engine, ensure_db_schema

REPO_ROOT = BACKEND_DIR.parent


# ---------------------------------------------------------------------------
# CFG-01 / D-22 스케줄 시각이 코드 고정
# ---------------------------------------------------------------------------

def _job_fields(job):
    return {f.name: str(f) for f in job.trigger.fields}


def test_scheduler_jobs_use_configured_hours_and_timezone(monkeypatch):
    import app.scheduler as sched_mod
    monkeypatch.setattr(settings, "CRAWL_SCHEDULE_HOURS", "1,13")
    monkeypatch.setattr(settings, "CRAWL_TIMEZONE", "Asia/Seoul")
    monkeypatch.setattr(settings, "BRIEFING_AUTO_DISPATCH_HOUR", 7)
    s = AsyncIOScheduler()
    sched_mod.add_jobs(s)
    crawl = s.get_job("daily_crawl")
    brief = s.get_job("daily_briefing_dispatch")
    assert _job_fields(crawl)["hour"] == "1,13"
    assert str(crawl.trigger.timezone) == "Asia/Seoul"
    assert _job_fields(brief)["hour"] == "7"
    assert _job_fields(brief)["minute"] == "15"
    assert str(brief.trigger.timezone) == "Asia/Seoul"


def test_scheduler_disabled_does_not_start(monkeypatch):
    import app.scheduler as sched_mod
    monkeypatch.setattr(settings, "SCHEDULER_ENABLED", False)
    sched_mod.start_scheduler()
    assert sched_mod.scheduler.running is False


def test_next_run_fallback_uses_configured_timezone(monkeypatch):
    import app.scheduler as sched_mod
    monkeypatch.setattr(settings, "CRAWL_SCHEDULE_HOURS", "9")
    monkeypatch.setattr(settings, "CRAWL_TIMEZONE", "Asia/Seoul")
    nxt = sched_mod.get_next_run_time()
    assert str(nxt.tzinfo) == "Asia/Seoul"
    assert (nxt.hour, nxt.minute) == (9, 0)


@pytest.mark.asyncio
async def test_crawl_job_log_shows_configured_hours(monkeypatch, capsys):
    """CC-07: 로그가 '0,6,12,18' 고정 문구가 아니다."""
    import app.scheduler as sched_mod
    monkeypatch.setattr(settings, "CRAWL_SCHEDULE_HOURS", "2,14")
    monkeypatch.setattr(sched_mod.collector_manager, "collect_all", AsyncMock(return_value={}))
    await sched_mod.scheduled_crawl_job()
    out = capsys.readouterr().out
    assert "2,14" in out and "0,6,12,18" not in out


# ---------------------------------------------------------------------------
# CFG-02 / D-23 읽는 코드가 없는 설정
# ---------------------------------------------------------------------------

DEAD_FIELDS = ("CORS_ORIGINS", "USER_AGENT", "LLM_PROVIDER", "ANTHROPIC_COLLECTION_MODEL",
               "CHAT_HISTORY_MAX_TURNS", "CHAT_HISTORY_MAX_TOKENS", "AGENTIC_SEARCH_MAX_QUERIES")


def test_dead_settings_are_removed():
    assert [f for f in DEAD_FIELDS if f in Settings.model_fields] == []
    for env_file in (REPO_ROOT / ".env.example", BACKEND_DIR / ".env.example"):
        body = env_file.read_text(encoding="utf-8")
        assert [f for f in DEAD_FIELDS if f"{f}=" in body] == [], env_file
    compose = (REPO_ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    assert [f for f in DEAD_FIELDS if f in compose] == []


def test_dead_config_json_keys_are_removed():
    data = json.loads((REPO_ROOT / "config.json").read_text(encoding="utf-8"))
    assert "crawler" not in data
    assert "provider" not in data["llm"]
    assert "anthropic_collection_model" not in data["llm"]
    assert "auto_briefing_hour" not in data["scheduler"]
    assert "auto_alert_high_signal" not in data["webhooks"]


@pytest.mark.asyncio
async def test_scraper_uses_configured_timeout(monkeypatch):
    from app.services import scraper as scraper_mod
    seen = {}

    class SpyClient:
        def __init__(self, *args, **kwargs):
            seen["timeout"] = kwargs.get("timeout")
            raise RuntimeError("stop")

    monkeypatch.setattr(settings, "SCRAPER_TIMEOUT_SECONDS", 2.5)
    monkeypatch.setattr(scraper_mod.httpx, "AsyncClient", SpyClient)
    with pytest.raises(Exception):
        await scraper_mod.ArticleScraperService().fetch_and_parse("https://scrape.b-test.example/a")
    assert seen["timeout"] == 2.5


@pytest.mark.asyncio
async def test_chat_session_retention_uses_configured_limit(monkeypatch):
    """TEST-07: 업서트·배치 저장이 settings.CHAT_SESSION_MAX_LIMIT 로 FIFO 정리를 부른다 (동작으로 확인)."""
    import uuid
    from httpx import ASGITransport, AsyncClient
    from app.main import app
    from app.services.chat_session_service import ChatSessionService
    limits = []

    async def spy(self, max_limit: int = 30, commit: bool = True):
        limits.append(max_limit)
        return 0

    monkeypatch.setattr(settings, "CHAT_SESSION_MAX_LIMIT", 7)
    monkeypatch.setattr(ChatSessionService, "enforce_fifo_retention", spy)
    sid = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/sessions", json={"id": sid, "title": "limit"})
        assert res.status_code == 201, res.text
        async with AsyncSessionLocal() as s:
            await ChatSessionService(s).append_messages_batch(
                session_id=sid,
                messages=[{"id": str(uuid.uuid4()), "role": "user", "content": "hi"}],
            )
        await ac.delete(f"/api/chat/sessions/{sid}")
    assert limits == [7, 7]


@pytest.mark.asyncio
async def test_auto_dispatch_respects_webhook_flag(monkeypatch, settings_file_copies):
    from app.services.briefing_service import briefing_service
    from app.services.webhook_service import webhook_service
    dispatch = AsyncMock(return_value=(True, "ok"))
    monkeypatch.setattr(webhook_service, "dispatch_briefing", dispatch)
    monkeypatch.setattr(settings, "SLACK_WEBHOOK_URL", "https://hooks.b-test.example/x")
    monkeypatch.setattr(settings, "NOTION_AUTO_EXPORT", False)
    monkeypatch.setattr(settings, "EMAIL_AUTO_SEND", False)
    payload = {"date": "2026-11-10", "headline": "h", "overview": "o", "categories": []}

    monkeypatch.setattr(app_config, "_json_data", {"webhooks": {"auto_dispatch_daily_briefing": False}})
    await briefing_service.auto_dispatch_all(payload)
    dispatch.assert_not_called()

    monkeypatch.setattr(app_config, "_json_data", {"webhooks": {"auto_dispatch_daily_briefing": True}})
    await briefing_service.auto_dispatch_all(payload)
    dispatch.assert_awaited_once()


@pytest.mark.asyncio
async def test_briefing_settings_response_has_no_dead_alert_flag():
    from httpx import ASGITransport, AsyncClient
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/briefing/settings")
    assert res.status_code == 200
    assert "auto_alert_high_signal" not in res.json()["webhooks"]
    assert "auto_dispatch_daily_briefing" in res.json()["webhooks"]


# ---------------------------------------------------------------------------
# CFG-03 / D-24 하이시그널 임계값 기본값 7.8 vs 7.0
# ---------------------------------------------------------------------------

def test_high_signal_threshold_has_single_default(monkeypatch, tmp_path):
    """TEST-07: config.json 에 키가 없으면 7.0 이고, 평가 경로가 settings 값을 쓴다 (동작으로 확인)."""
    import importlib.util
    import shutil
    # config.py 사본을 키 없는 config.json 옆에서 따로 불러온다 (실제 app.config 는 그대로)
    pkg = tmp_path / "pkg" / "app"
    pkg.mkdir(parents=True)
    shutil.copy(BACKEND_DIR / "app" / "config.py", pkg / "config.py")
    (tmp_path / "config.json").write_text(json.dumps({"llm": {}}), encoding="utf-8")
    work = tmp_path / "w1" / "w2"
    work.mkdir(parents=True)
    monkeypatch.chdir(work)
    monkeypatch.delenv("HIGH_SIGNAL_THRESHOLD", raising=False)
    spec = importlib.util.spec_from_file_location("config_copy_cfg03", pkg / "config.py")
    copy_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(copy_mod)
    assert copy_mod.find_config_json() == tmp_path / "config.json"
    assert copy_mod.Settings().HIGH_SIGNAL_THRESHOLD == 7.0

    from app.services.llm_processor import llm_processor
    title, summary = "LangGraph multi-agent harness benchmark release", "agent harness eval benchmark mcp"
    score = llm_processor.evaluate_quality_and_signal(title, summary, "github")["quality_score"]
    monkeypatch.setattr(settings, "HIGH_SIGNAL_THRESHOLD", score + 0.1)
    assert llm_processor.evaluate_quality_and_signal(title, summary, "github")["is_high_signal"] is False
    monkeypatch.setattr(settings, "HIGH_SIGNAL_THRESHOLD", score)
    assert llm_processor.evaluate_quality_and_signal(title, summary, "github")["is_high_signal"] is True


# ---------------------------------------------------------------------------
# ARCH-04 / D-39 DB 경로가 cwd 기준
# ---------------------------------------------------------------------------

def test_relative_sqlite_path_resolves_against_backend_dir():
    expected = f"sqlite+aiosqlite:///{(BACKEND_DIR / 'agentlens.db').resolve()}"
    assert app_config.resolve_database_url("sqlite+aiosqlite:///./agentlens.db") == expected
    assert app_config.resolve_database_url("sqlite+aiosqlite:///agentlens.db") == expected
    assert app_config.resolve_database_url("sqlite+aiosqlite:////abs/x.db") == "sqlite+aiosqlite:////abs/x.db"
    assert app_config.DEFAULT_DATABASE_URL == f"sqlite+aiosqlite:///{BACKEND_DIR / 'agentlens.db'}"
    s = Settings(DATABASE_URL="sqlite+aiosqlite:///./data/agentlens.db")
    assert s.DATABASE_URL == f"sqlite+aiosqlite:///{(BACKEND_DIR / 'data' / 'agentlens.db').resolve()}"


# ---------------------------------------------------------------------------
# PERF-04 호출마다 설정 파일 재읽기
# ---------------------------------------------------------------------------

def test_load_json_config_rereads_only_when_file_changes(monkeypatch, tmp_path):
    cfg = tmp_path / "config.json"
    cfg.write_text(json.dumps({"llm": {"openai_model": "a"}}), encoding="utf-8")
    monkeypatch.setattr(app_config, "find_config_json", lambda: cfg)
    loads = []
    real_load = app_config.json.load
    monkeypatch.setattr(app_config.json, "load", lambda f: loads.append(1) or real_load(f))

    first = app_config.load_json_config()
    first["llm"]["openai_model"] = "mutated"  # 사본이라 캐시가 바뀌지 않는다
    assert app_config.load_json_config()["llm"]["openai_model"] == "a"
    assert len(loads) == 1

    cfg.write_text(json.dumps({"llm": {"openai_model": "bb"}}), encoding="utf-8")
    assert app_config.load_json_config()["llm"]["openai_model"] == "bb"
    assert len(loads) == 2


def test_sources_file_rereads_only_when_file_changes(monkeypatch, tmp_path):
    from app.services import sources_service as ss_mod
    path = tmp_path / "sources.json"
    path.write_text(json.dumps({"rss_feeds": [{"id": "a", "url": "https://a.example/f"}]}), encoding="utf-8")
    svc = ss_mod.SourcesService()
    monkeypatch.setattr(svc, "_file_path", path)
    monkeypatch.setattr(svc, "_mirror_path", path)
    loads = []
    real_load = ss_mod.json.load
    monkeypatch.setattr(ss_mod.json, "load", lambda f: loads.append(1) or real_load(f))

    data = svc.load_sources()
    data["rss_feeds"].clear()
    assert len(svc.load_sources()["rss_feeds"]) == 1
    svc.get_active_rss_feeds()
    assert len(loads) == 1

    path.write_text(json.dumps({"rss_feeds": []}), encoding="utf-8")
    assert svc.load_sources()["rss_feeds"] == []
    assert len(loads) == 2


# ---------------------------------------------------------------------------
# CC-03 / PERF-06 / ARCH-03(retriever) FTS 생성 SQL 두 벌, 검색이 쓰고 커밋한다
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_retriever_does_not_create_fts_or_commit(monkeypatch):
    from app.services.retriever import SqliteFtsRetriever
    assert not hasattr(SqliteFtsRetriever, "_ensure_fts_table")
    async with AsyncSessionLocal() as session:
        commits = []
        real_commit = session.commit

        async def spy_commit():
            commits.append(1)
            await real_commit()

        monkeypatch.setattr(session, "commit", spy_commit)
        await SqliteFtsRetriever(session).retrieve("LangGraph harness", top_k=3)
        assert commits == []


@pytest.mark.asyncio
async def test_ensure_db_schema_rebuilds_missing_fts_rows():
    async with engine.begin() as conn:
        await conn.execute(text("INSERT INTO news_fts(news_fts) VALUES('delete-all');"))
    await ensure_db_schema()
    async with AsyncSessionLocal() as s:
        # 외부 콘텐츠 FTS 의 count(*) 는 news_items 를 세므로 색인 행은 _docsize 로 센다
        fts = (await s.execute(text("SELECT count(*) FROM news_fts_docsize;"))).scalar()
        items = (await s.execute(text("SELECT count(*) FROM news_items;"))).scalar()
    assert fts == items > 0


# ---------------------------------------------------------------------------
# CC-04 중복 인덱스
# ---------------------------------------------------------------------------

async def _index_names(table: str):
    async with AsyncSessionLocal() as s:
        rows = (await s.execute(text(f"PRAGMA index_list({table});"))).fetchall()
    return {r[1] for r in rows}


@pytest.mark.asyncio
async def test_no_duplicate_indexes_after_schema(monkeypatch):
    async with engine.begin() as conn:
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_chat_sessions_updated_at ON chat_sessions (updated_at);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_news_items_id ON news_items (id);"))
        await conn.execute(text("PRAGMA user_version = 0;"))
    await ensure_db_schema()
    chat = await _index_names("chat_sessions")
    assert "idx_chat_sessions_updated_at" in chat
    assert "ix_chat_sessions_updated_at" not in chat
    for table in ("news_items", "crawl_logs", "source_research_logs"):
        assert f"ix_{table}_id" not in await _index_names(table)


# ---------------------------------------------------------------------------
# CC-06 / D-38 스키마 보정 실패를 삼킨다, 마이그레이션 기록 없음
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_schema_migrations_are_versioned():
    import app.database as db_mod
    await ensure_db_schema()
    async with AsyncSessionLocal() as s:
        version = (await s.execute(text("PRAGMA user_version;"))).scalar()
    assert version == len(db_mod.MIGRATIONS) >= 1


@pytest.mark.asyncio
async def test_failed_migration_is_logged_and_raised(monkeypatch, caplog):
    import app.database as db_mod

    def boom(connection):
        raise RuntimeError("alter failed")

    monkeypatch.setattr(db_mod, "MIGRATIONS", db_mod.MIGRATIONS + [boom])
    with caplog.at_level(logging.ERROR, logger="agentlens.database"):
        with pytest.raises(RuntimeError, match="alter failed"):
            await ensure_db_schema()
    assert any("마이그레이션" in r.getMessage() for r in caplog.records)
    async with AsyncSessionLocal() as s:
        version = (await s.execute(text("PRAGMA user_version;"))).scalar()
    assert version == len(db_mod.MIGRATIONS) - 1


def test_verdict_comment_lists_all_values():
    """CC-07: verdict 주석이 실제 값(ALREADY_MONITORED)을 포함한다."""
    body = (BACKEND_DIR / "app" / "models" / "news.py").read_text(encoding="utf-8")
    line = [l for l in body.splitlines() if l.strip().startswith("verdict")][0]
    assert "ALREADY_MONITORED" in line
