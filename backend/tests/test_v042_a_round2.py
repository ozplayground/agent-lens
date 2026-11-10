"""v0.4.2 A 조 2차: 재리뷰(11절) 권장 지적과 ADR 열린 질문.

근거: docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md 11절 (ARCH-03R, CFG-02R, N-08, N-09),
docs/fullstack-architect/01_ARCHITECTURE_ADR.md 열린 질문 Q4·Q11·Q13.
"""
import json
import re
import uuid
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete

from app.config import Settings
from app.database import AsyncSessionLocal
from app.main import app
from app.models.chat_session import ChatMessageModel, ChatSessionModel
from app.models.news import CrawlLog, SourceResearchLog
from app.services.chat_session_service import ChatSessionService
from app.services.llm_processor import llm_processor

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent

# ISO 날짜시각처럼 보이는 문자열 (날짜만인 값은 보지 않는다)
ISO_DATETIME = re.compile(r"^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}")
HAS_OFFSET = re.compile(r"(Z|[+-]\d{2}:\d{2})$")


def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


def _naive_timestamps(obj, path="$"):
    """JSON 안에서 UTC 오프셋 없는 날짜시각 문자열의 경로를 모은다."""
    found = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            found += _naive_timestamps(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            found += _naive_timestamps(v, f"{path}[{i}]")
    elif isinstance(obj, str) and ISO_DATETIME.match(obj) and not HAS_OFFSET.search(obj):
        found.append(f"{path}={obj}")
    return found


def _sse_events(body: str):
    events = []
    for frame in body.split("\n\n"):
        name, data = None, None
        for line in frame.split("\n"):
            if line.startswith("event: "):
                name = line[len("event: "):].strip()
            elif line.startswith("data: "):
                data = json.loads(line[len("data: "):])
        if name:
            events.append((name, data))
    return events


@pytest.fixture
async def session_id():
    sid = str(uuid.uuid4())
    yield sid
    async with AsyncSessionLocal() as s:
        await s.execute(delete(ChatMessageModel).where(ChatMessageModel.session_id == sid))
        await s.execute(delete(ChatSessionModel).where(ChatSessionModel.id == sid))
        await s.commit()


# ---------------------------------------------------------------------------
# N-09 / ADR Q11: 응답의 모든 시각에 UTC 오프셋이 붙는다
# ---------------------------------------------------------------------------

async def test_n09_chat_session_times_have_utc_offset(session_id):
    async with _client() as ac:
        r = await ac.post("/api/chat/sessions", json={
            "id": session_id, "title": "시각", "active_source_id": 1,
            "messages": [{"id": f"u-{session_id[:8]}", "session_id": session_id, "role": "user",
                          "content": "질문", "created_at": "2026-11-10T04:40:35+00:00"}]})
        assert r.status_code == 201, r.text
        listing = await ac.get("/api/chat/sessions")
        detail = await ac.get(f"/api/chat/sessions/{session_id}")
        source = await ac.get("/api/chat/sources/1")
    assert _naive_timestamps(r.json()) == []
    assert _naive_timestamps(listing.json()) == []
    assert _naive_timestamps(detail.json()) == []
    assert detail.json()["active_source"]["published_at"]
    assert _naive_timestamps(source.json()) == []


async def test_n09_server_saved_turn_times_have_utc_offset(session_id):
    async with AsyncSessionLocal() as s:
        await ChatSessionService(s).persist_turn(session_id=session_id, user_content="q", assistant_content="a")
    async with _client() as ac:
        detail = await ac.get(f"/api/chat/sessions/{session_id}")
    msgs = detail.json()["messages"]
    assert len(msgs) == 2
    assert _naive_timestamps(detail.json()) == []


async def test_n09_chat_stream_source_times_have_utc_offset(fake_llm):
    import llm_fakes

    fake_llm.register_web("https://github.com/example/langgraph-harness", text=llm_fakes.FAKE_ARTICLE_HTML)
    async with _client() as ac:
        scoped = await ac.post("/api/chat/stream", json={"question": "요약해줘", "scope": "scoped", "source_id": 1})
        global_ = await ac.post("/api/chat/stream", json={"question": "LangGraph 하네스 동향", "scope": "global"})
    sources = [d for body in (scoped.text, global_.text) for n, d in _sse_events(body) if n == "sources"]
    assert len(sources) == 2
    assert all(d["sources"] for d in sources)
    assert _naive_timestamps(sources) == []


async def test_n09_crawl_and_research_log_times_have_utc_offset():
    async with AsyncSessionLocal() as s:
        log = CrawlLog(source="n09-test", items_crawled=1, items_saved=1, status="success")
        research = SourceResearchLog(source_name="n09", site_url="https://n09.example", feed_url="https://n09.example/feed",
                                     verdict="WATCHLIST", verdict_reason="t")
        s.add_all([log, research])
        await s.commit()
        ids = (log.id, research.id)
    try:
        async with _client() as ac:
            status = await ac.get("/api/schedule/status")
            audit = await ac.get("/api/research/audit-logs")
        assert status.json()["recent_logs"]
        assert _naive_timestamps(status.json()) == []
        assert audit.json()["logs"]
        assert _naive_timestamps(audit.json()) == []
    finally:
        async with AsyncSessionLocal() as s:
            await s.execute(delete(CrawlLog).where(CrawlLog.id == ids[0]))
            await s.execute(delete(SourceResearchLog).where(SourceResearchLog.id == ids[1]))
            await s.commit()


# ---------------------------------------------------------------------------
# ARCH-03R: 세션 업서트·삭제가 실패하면 HTTP 경로에서도 부분 변경이 남지 않는다
# ---------------------------------------------------------------------------

async def test_arch03r_failed_upsert_over_http_keeps_previous_title(session_id, monkeypatch):
    async with _client() as ac:
        r = await ac.post("/api/chat/sessions", json={"id": session_id, "title": "원래 제목"})
        assert r.status_code == 201

        async def boom(self, *args, **kwargs):
            raise RuntimeError("append failed")

        monkeypatch.setattr(ChatSessionService, "append_messages_batch", boom)
        failed = await ac.post("/api/chat/sessions", json={"id": session_id, "title": "바뀐 제목", "messages": [
            {"id": f"m-{session_id[:8]}", "session_id": session_id, "role": "user", "content": "q",
             "created_at": "2026-01-01T00:00:00+00:00"}]})
        detail = await ac.get(f"/api/chat/sessions/{session_id}")
    assert failed.status_code == 500
    assert failed.json()["error_code"] == "ERR_SESSION_CREATE_FAILED"
    assert detail.json()["title"] == "원래 제목"


async def test_arch03r_failed_delete_over_http_keeps_session(session_id, monkeypatch):
    async with _client() as ac:
        await ac.post("/api/chat/sessions", json={"id": session_id, "title": "남아야 함"})

        original_delete = ChatSessionService.delete_session

        async def delete_then_fail(self, sid):
            await self.session.delete(await self.session.get(ChatSessionModel, sid))
            await self.session.flush()
            raise RuntimeError("after flush")

        monkeypatch.setattr(ChatSessionService, "delete_session", delete_then_fail)
        failed = await ac.delete(f"/api/chat/sessions/{session_id}")
        monkeypatch.setattr(ChatSessionService, "delete_session", original_delete)
        detail = await ac.get(f"/api/chat/sessions/{session_id}")
    assert failed.status_code == 500
    assert detail.status_code == 200
    assert detail.json()["title"] == "남아야 함"


# ---------------------------------------------------------------------------
# CFG-02R: 읽는 곳 없는 TESTING 설정을 지운다
# ---------------------------------------------------------------------------

def test_cfg02r_testing_setting_is_removed():
    assert "TESTING" not in Settings.model_fields
    assert "TESTING" not in (BACKEND_DIR / "app" / "config.py").read_text(encoding="utf-8")
    for env_file in (REPO_ROOT / ".env.example", BACKEND_DIR / ".env.example"):
        assert "TESTING=" not in env_file.read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# N-08: 기사 Ask AI 의 휴리스틱 폴백 답은 캐시하지 않는다
# ---------------------------------------------------------------------------

async def _ask(question: str):
    async with _client() as ac:
        r = await ac.post("/api/news/1/ask/stream", json={"question": question})
    return [json.loads(l[len("data: "):]) for l in r.text.split("\n") if l.startswith("data: ")]


async def test_n08_heuristic_fallback_answer_is_not_cached(fake_llm):
    question = f"폴백 뒤 회복 {uuid.uuid4().hex[:6]}"
    fake_llm.unregister_claude()  # Anthropic 이 잠깐 안 된다 → 휴리스틱 폴백
    first = await _ask(question)
    fake_llm.take_unmocked()  # 막힌 Anthropic 호출은 이 테스트가 일부러 낸 것
    assert first[0] == {"event": "meta", "model": "AgentLens Heuristic Engine"}
    assert len(llm_processor._qa_cache) == 0

    fake_llm.register_claude()  # 회복 → 같은 질문은 LLM 이 답한다
    second = await _ask(question)
    assert "(캐시됨)" not in second[0]["model"]
    assert second[0]["model"].startswith("claude-")
    assert len(llm_processor._qa_cache) == 1


# ---------------------------------------------------------------------------
# ADR Q13: 런타임 OpenAPI 의 검증 실패 응답은 실제 400 ErrorResponse 다
# ---------------------------------------------------------------------------

def test_q13_runtime_openapi_shows_400_error_response_not_422():
    app.openapi_schema = None
    spec = app.openapi()
    ops = [(p, m, op) for p, item in spec["paths"].items() for m, op in item.items()]
    assert [f"{m.upper()} {p}" for p, m, op in ops if "422" in op.get("responses", {})] == []
    assert "HTTPValidationError" not in spec.get("components", {}).get("schemas", {})
    # 쿼리 검증이 있는 경로는 400 ErrorResponse 를 보인다
    news_400 = spec["paths"]["/api/news"]["get"]["responses"]["400"]
    ref = news_400["content"]["application/json"]["schema"]["$ref"]
    error_schema = spec["components"]["schemas"][ref.rsplit("/", 1)[-1]]
    assert set(error_schema["required"]) >= {"error_code", "message"}
    assert set(error_schema["properties"]) == {"error_code", "message", "details"}


# ---------------------------------------------------------------------------
# ADR Q4: 쓰지 않는 google-genai 의존성을 지운다
# ---------------------------------------------------------------------------

def test_q4_unused_google_genai_dependency_is_removed():
    reqs = (BACKEND_DIR / "requirements.txt").read_text(encoding="utf-8")
    assert "google-genai" not in reqs
    imports = [p for p in (BACKEND_DIR / "app").rglob("*.py")
               if re.search(r"^\s*(from google import genai|import google\.genai|from google\.genai)", p.read_text(encoding="utf-8"), re.M)]
    assert imports == []


# ---------------------------------------------------------------------------
# 스트림 session_id 형식: 세션 POST 와 같이 UUID 가 아니면 400 ERR_SESSION_INVALID_UUID
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("bad", ["not-a-uuid", "", "123"])
async def test_stream_rejects_non_uuid_session_id(bad):
    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json={"question": "안녕", "scope": "global", "session_id": bad})
    assert r.status_code == 400
    assert r.json()["error_code"] == "ERR_SESSION_INVALID_UUID"
    assert bad == "" or bad not in r.json()["message"]


async def test_stream_accepts_uuid_or_missing_session_id(session_id):
    async with _client() as ac:
        ok = await ac.post("/api/chat/stream", json={"question": "안녕", "scope": "global", "session_id": session_id})
        none = await ac.post("/api/chat/stream", json={"question": "안녕", "scope": "global"})
    assert ok.status_code == 200 and "event: done" in ok.text
    assert none.status_code == 200 and "event: done" in none.text
    done = [d for n, d in _sse_events(none.text) if n == "done"][0]
    uuid.UUID(done["session_id"])
    async with AsyncSessionLocal() as s:  # 서버가 만든 세션 정리
        await s.execute(delete(ChatMessageModel).where(ChatMessageModel.session_id == done["session_id"]))
        await s.execute(delete(ChatSessionModel).where(ChatSessionModel.id == done["session_id"]))
        await s.commit()


# ---------------------------------------------------------------------------
# 모델 정리 (계약 담당 지적): ChatStatusStep 은 실제로 보내는 4값, trigger 응답은 ManualCollectResponse
# ---------------------------------------------------------------------------

def test_chat_status_step_has_only_sent_values():
    from typing import get_args
    from pydantic import ValidationError
    from app.schemas.chat import ChatStatusPayload, ChatStatusStep

    assert set(get_args(ChatStatusStep)) == {"thinking", "tool_calling", "extracting_source", "synthesizing"}
    with pytest.raises(ValidationError):
        ChatStatusPayload(step="observing", label="x", timestamp="2026-11-10T00:00:00+00:00")


async def test_chat_stream_status_events_fit_status_payload():
    from app.schemas.chat import ChatStatusPayload
    import llm_fakes

    async with _client() as ac:
        bodies = [
            (await ac.post("/api/chat/stream", json={"question": "LangGraph 에이전트 동향", "scope": "global"})).text,
            (await ac.post("/api/chat/stream", json={"question": "안녕", "scope": "global"})).text,
        ]
    steps = set()
    for body in bodies:
        for n, d in _sse_events(body):
            if n == "status":
                steps.add(ChatStatusPayload(**d).step)
    assert steps == {"thinking", "tool_calling", "synthesizing"}


def test_trigger_uses_manual_collect_response_model():
    app.openapi_schema = None
    spec = app.openapi()
    ok = spec["paths"]["/api/schedule/trigger"]["post"]["responses"]["200"]
    assert ok["content"]["application/json"]["schema"] == {"$ref": "#/components/schemas/ManualCollectResponse"}
    props = spec["components"]["schemas"]["ManualCollectResponse"]["properties"]
    assert set(props) == {"status", "message", "other_process", "total_collected", "total_saved", "source_results"}


async def test_trigger_response_bodies_are_unchanged(monkeypatch):
    from app.collectors.manager import collector_manager

    async def no_collect():
        return {"status": "success"}

    monkeypatch.setattr(collector_manager, "collect_all", no_collect)
    monkeypatch.setattr(collector_manager, "is_busy", lambda: False)
    async with _client() as ac:
        started = (await ac.post("/api/schedule/trigger")).json()
        monkeypatch.setattr(collector_manager, "is_busy", lambda: True)
        monkeypatch.setattr(collector_manager, "is_running", False)
        busy = (await ac.post("/api/schedule/trigger")).json()
    assert set(started) == {"status", "message", "total_collected", "total_saved", "source_results"}
    assert started["status"] == "started"
    assert set(busy) == {"status", "message", "other_process", "total_collected", "total_saved", "source_results"}
    assert busy["status"] == "already_running" and busy["other_process"] is True
