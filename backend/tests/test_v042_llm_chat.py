"""v0.4.2 A 조: LLM·챗·기사 Ask AI 권장 결함 회귀 테스트.

근거: docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md (BUG-09, BUG-10, BUG-13, BUG-14, BUG-16, BUG-17,
CFG-04, PERF-01, PERF-05, ARCH-05, TEST-06, CC-02, N-01, N-05, N-06, N-07),
docs/qa-engineer/02_QA_TEST_REPORT.md 3절 (D-35, D-36, D-43).
"""
import importlib.util
import inspect
import json
import re
import uuid
from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select

from app.config import settings
from app.database import AsyncSessionLocal
from app.main import app
from app.models.chat_session import ChatMessageModel, ChatSessionModel
from app.services.chat_service import ChatService
from app.services.chat_session_service import ChatSessionService
from app.services.llm_processor import llm_processor, LLMUpstreamException
from app.services.llm_providers.anthropic_provider import AnthropicLLMProvider, AnthropicStreamError

# 그림 이모지 (기호·딩뱃·보조 기호 영역과 변형 선택자)
PICTOGRAPH = re.compile("[\U0001F000-\U0001FAFF☀-➿⬀-⯿️]")


def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


def _sse_events(body: str):
    """`event: <name>\\ndata: <json>` 프레임을 (name, data) 목록으로."""
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


async def _ask_events(news_id: int, question: str):
    async with _client() as ac:
        r = await ac.post(f"/api/news/{news_id}/ask/stream", json={"question": question})
    assert r.status_code == 200, r.text
    return [json.loads(line[len("data: "):]) for line in r.text.split("\n") if line.startswith("data: ")]


@pytest.fixture
async def session_ids():
    ids = []

    def make():
        sid = str(uuid.uuid4())
        ids.append(sid)
        return sid

    yield make
    async with AsyncSessionLocal() as s:
        for sid in ids:
            await s.execute(delete(ChatMessageModel).where(ChatMessageModel.session_id == sid))
            await s.execute(delete(ChatSessionModel).where(ChatSessionModel.id == sid))
        await s.commit()


# ---------------------------------------------------------------------------
# CC-02 / D-43 / N-03: 호출처 없는 코드와 엔드포인트 제거
# ---------------------------------------------------------------------------

async def test_cc02_chat_query_and_search_endpoints_are_removed():
    async with _client() as ac:
        q = await ac.post("/api/chat/query", json={"question": "hi", "model_tier": "ultra"})
        s = await ac.get("/api/chat/search", params={"q": "LangGraph"})
    assert q.status_code in (404, 405)
    assert s.status_code in (404, 405)


def test_cc02_unused_services_are_removed():
    assert importlib.util.find_spec("app.services.agentic_search") is None
    assert not hasattr(AnthropicLLMProvider, "generate_structured_summary")
    assert not hasattr(ChatService, "query_chat")
    assert not hasattr(ChatService, "search_corpus")


# ---------------------------------------------------------------------------
# BUG-09 / D-16: 토큰 사용량을 요청끼리 공유하지 않는다
# ---------------------------------------------------------------------------

async def test_bug09_done_usage_is_not_left_over_from_previous_request(llm_sources, fake_llm, monkeypatch):
    # 앞 요청: Anthropic 이 사용량(10/20)을 돌려준다
    llm_sources.anthropic()
    await llm_processor.generate_live_answer("앞 요청")
    # 이번 요청: Anthropic 없이 OpenAI 만 → 사용량 정보가 없다
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
    llm_sources.openai()
    fake_llm.register_openai()

    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json={"question": "안녕", "scope": "global"})
    events = _sse_events(r.text)
    done = [d for n, d in events if n == "done"][0]
    assert done["model"].startswith("OpenAI")
    assert done["usage"] is None


async def test_bug09_done_usage_comes_from_this_stream():
    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json={"question": "안녕", "scope": "global"})
    done = [d for n, d in _sse_events(r.text) if n == "done"][0]
    assert done["usage"]["input_tokens"] == 10
    assert done["usage"]["output_tokens"] == 20


def test_bug09_no_shared_last_usage_attribute():
    assert not hasattr(llm_processor, "last_usage")
    assert not hasattr(llm_processor.anthropic_provider, "last_usage")


# ---------------------------------------------------------------------------
# BUG-10 / D-17 / PERF-05: 평가 캐시는 폴백 결과를 기억하지 않고, 한도·만료가 있고, 초기화로 비운다
# ---------------------------------------------------------------------------

async def test_bug10_fallback_evaluation_is_not_cached(monkeypatch):
    title = f"SWE-bench agent harness benchmark release {uuid.uuid4().hex[:6]}"
    gen = AsyncMock(return_value=(None, None))  # LLM 이 잠깐 답하지 않는다
    monkeypatch.setattr(llm_processor, "_generate_live_answer", gen)
    first = await llm_processor.evaluate_content_with_llm(title, "agent benchmark harness", "github")
    assert first["evaluated_by"] == "heuristic_fallback"

    gen.return_value = (
        '{"is_relevant_to_ai_agent": true, "category": "harness", "relevance_score": 9, "quality_score": 8,'
        ' "is_worthwhile": true, "is_high_signal": true, "rejection_reason": null,'
        ' "why_it_matters": "에이전트 회귀 평가 기준을 제공합니다."}',
        "claude-sonnet-5-5",
    )
    second = await llm_processor.evaluate_content_with_llm(title, "agent benchmark harness", "github")
    assert second["evaluated_by"] == "claude-sonnet-5-5"
    assert gen.await_count == 2


def test_perf05_llm_caches_are_bounded_and_expire(monkeypatch):
    import app.services.llm_processor as lp

    for cache in (llm_processor._eval_cache, llm_processor._qa_cache):
        assert cache.maxsize > 0
        for i in range(cache.maxsize + 5):
            cache[f"k{i}"] = i
        assert len(cache) == cache.maxsize
        assert "k0" not in cache
        cache.clear()

    now = [1000.0]
    monkeypatch.setattr(lp.time, "monotonic", lambda: now[0])
    cache = lp.TTLCache(maxsize=10, ttl=60)
    cache["a"] = 1
    now[0] += 59
    assert cache.get("a") == 1
    now[0] += 2
    assert cache.get("a") is None
    assert "a" not in cache


async def test_bug10_reset_and_collect_clears_llm_caches(monkeypatch):
    from app.collectors.manager import collector_manager

    llm_processor._eval_cache["x::github"] = {"evaluated_by": "heuristic_fallback"}
    llm_processor._qa_cache["t:q"] = ("a", "m")
    monkeypatch.setattr(collector_manager, "collect_all", AsyncMock(return_value={"status": "success"}))
    async with _client() as ac:
        r = await ac.post("/api/schedule/reset-and-collect")
    assert r.status_code == 200
    assert len(llm_processor._eval_cache) == 0
    assert len(llm_processor._qa_cache) == 0


async def test_perf05_scraper_url_locks_do_not_accumulate():
    from app.services.scraper import ArticleScraperService

    url = f"https://example.com/lock-{uuid.uuid4().hex}"
    lock = await ArticleScraperService._get_url_lock(url)
    assert url in ArticleScraperService._url_locks
    del lock
    assert url not in ArticleScraperService._url_locks


# ---------------------------------------------------------------------------
# BUG-13: 챗 스트림 앞 단계 예외도 error 이벤트로 끝난다
# ---------------------------------------------------------------------------

async def test_bug13_planner_failure_ends_stream_with_error_event(monkeypatch):
    monkeypatch.setattr(ChatService, "_plan_react_action", AsyncMock(side_effect=RuntimeError("planner boom")))
    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json={"question": "LangGraph 에이전트 동향", "scope": "global"})
    events = _sse_events(r.text)
    name, data = events[-1]
    assert name == "error"
    assert data["step"] == "thinking"
    assert data["error_code"] == "ERR_LLM_UPSTREAM_FAILED"
    assert "planner boom" not in data["message"]
    assert "done" not in [n for n, _ in events]


async def test_bug13_retriever_failure_ends_stream_with_error_event(monkeypatch):
    monkeypatch.setattr(ChatService, "_plan_react_action", AsyncMock(return_value={
        "action": "search_news_corpus", "search_query": "LangGraph", "thought": "t"}))
    monkeypatch.setattr(ChatService, "_resolve_sources", AsyncMock(side_effect=RuntimeError("fts boom")))
    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json={"question": "LangGraph 에이전트 동향", "scope": "global"})
    events = _sse_events(r.text)
    name, data = events[-1]
    assert name == "error"
    assert data["step"] == "tool_calling"
    assert data["error_code"] == "ERR_RETRIEVER_INDEX_ERROR"
    assert "fts boom" not in data["message"]


# ---------------------------------------------------------------------------
# BUG-14: model_tier 만 보낸 요청은 그 티어로 간다
# ---------------------------------------------------------------------------

async def test_bug14_model_tier_only_request_uses_that_tier(fake_llm):
    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json={"question": "안녕", "scope": "global", "model_tier": "opus"})
    done = [d for n, d in _sse_events(r.text) if n == "done"][0]
    sent = fake_llm.requests("claude", path="/v1/messages")[-1].body
    assert sent["model"] == "claude-opus-5-5"
    assert done["model_tier"] == "opus"


async def test_bug14_explicit_model_wins_over_tier(fake_llm):
    async with _client() as ac:
        await ac.post("/api/chat/stream", json={
            "question": "안녕", "scope": "global", "model": "claude-haiku-5-5", "model_tier": "opus"})
    assert fake_llm.requests("claude", path="/v1/messages")[-1].body["model"] == "claude-haiku-5-5"


# ---------------------------------------------------------------------------
# BUG-16 / D-35, D-36: 사용자에게 보내는 문자열에 그림 이모지가 없다
# ---------------------------------------------------------------------------

async def test_d35_chat_status_labels_have_no_pictographs(fake_llm):
    import llm_fakes

    fake_llm.register_web("https://github.com/example/langgraph-harness", text=llm_fakes.FAKE_ARTICLE_HTML)
    labels = []
    async with _client() as ac:
        for payload in (
            {"question": "LangGraph 에이전트 동향", "scope": "global"},  # thinking → tool_calling → synthesizing
            {"question": "안녕", "scope": "global"},  # thinking → synthesizing (직접)
            {"question": "요약해줘", "scope": "scoped", "source_id": 1},  # extracting_source → synthesizing
        ):
            r = await ac.post("/api/chat/stream", json=payload)
            labels += [d["label"] for n, d in _sse_events(r.text) if n == "status"]
    assert len(labels) >= 7
    assert [l for l in labels if PICTOGRAPH.search(l)] == []


@pytest.mark.parametrize("question", ["어떻게 적용하나요", "기존 방식과 차이는", "동작 원리는", "보안 고려사항", "알려줘"])
def test_d36_heuristic_answer_has_no_pictographs(question):
    answer, _ = llm_processor._generate_heuristic_answer("FastMCP 2.0", "요약", "mcp_plugins_skills", ["FastMCP"], question)
    assert PICTOGRAPH.search(answer) is None, answer.splitlines()[0]


# ---------------------------------------------------------------------------
# BUG-17 / D-19: 근거 없는 카테고리 고정 시사점을 저장하지 않는다
# ---------------------------------------------------------------------------

def test_bug17_synthesis_without_llm_insight_leaves_why_it_matters_empty():
    plain = llm_processor.generate_synthesis("에이전트 관측성 도구", "요약 문장입니다.", "harness")
    with_tech = llm_processor.generate_synthesis("LangGraph 0.3 릴리즈", "LangGraph 요약", "agent_tech")
    assert plain["why_it_matters"] == ""
    assert with_tech["why_it_matters"] == ""
    assert with_tech["tech_stack"] == ["LangGraph"]


def test_bug17_synthesis_keeps_llm_insight():
    out = llm_processor.generate_synthesis("t", "s", "harness", why_it_matters_override="  LLM 이 준 실제 시사점 문장입니다.  ")
    assert out["why_it_matters"] == "LLM 이 준 실제 시사점 문장입니다."


# ---------------------------------------------------------------------------
# CFG-04: 규칙 기반 경로를 LLM 이라 부르지 않는다
# ---------------------------------------------------------------------------

def test_cfg04_rule_based_paths_are_not_described_as_llm():
    spec = app.openapi()
    run_deep = spec["paths"]["/api/research/run-deep"]["post"]
    assert "LLM" not in run_deep.get("description", "")
    assert "규칙" in (llm_processor.generate_synthesis.__doc__ or "")
    assert "규칙" in (llm_processor.evaluate_quality_and_signal.__doc__ or "")


# ---------------------------------------------------------------------------
# PERF-01: Ollama 판정이 이벤트 루프를 막지 않고, 결과를 잠깐 기억한다
# ---------------------------------------------------------------------------

async def test_perf01_ollama_probe_is_async_and_cached(llm_sources, fake_llm):
    assert inspect.iscoroutinefunction(llm_processor._ollama_status)
    assert inspect.iscoroutinefunction(llm_processor.has_live_provider)
    assert inspect.iscoroutinefunction(llm_processor.check_provider_available)

    fake_llm.register_ollama("http://fake-ollama-perf01:11434", state="up", models=["llama3.2:latest"])
    llm_sources.ollama_url("http://fake-ollama-perf01:11434")
    assert await llm_processor.has_live_provider() is True
    assert await llm_processor.has_live_provider() is True
    assert len(fake_llm.requests("ollama", path="/api/tags")) == 1


# ---------------------------------------------------------------------------
# ARCH-05 / TEST-06: 운영 코드가 테스트 환경을 감지하지 않고, 라이브 planner 분기를 검증한다
# ---------------------------------------------------------------------------

def test_arch05_no_test_environment_detection():
    assert not hasattr(llm_processor, "is_test_environment")


@pytest.fixture
async def chat_service():
    async with AsyncSessionLocal() as s:
        yield ChatService(s)


async def test_test06_planner_json_none(chat_service, monkeypatch):
    gen = AsyncMock(return_value=('{"thought": "문법 질문", "action": "none", "search_query": ""}', "claude-haiku-5-5"))
    monkeypatch.setattr(llm_processor, "generate_live_answer", gen)
    plan = await chat_service._plan_react_action("Python 리스트 정렬 문법 알려줘", "global")
    assert plan == {"action": "none", "search_query": "", "thought": "문법 질문"}
    assert gen.await_args.kwargs["model_tier"] == "haiku"


async def test_test06_planner_action_search_line(chat_service, monkeypatch):
    gen = AsyncMock(return_value=("판단: 검색 필요\nACTION: SEARCH FastMCP 서버", "claude-haiku-5-5"))
    monkeypatch.setattr(llm_processor, "generate_live_answer", gen)
    plan = await chat_service._plan_react_action("FastMCP 최신 릴리즈 소식", "global")
    assert plan["action"] == "search_news_corpus"
    assert plan["search_query"] == "FastMCP 서버"


async def test_test06_planner_action_none_line(chat_service, monkeypatch):
    gen = AsyncMock(return_value=("ACTION: NONE", "claude-haiku-5-5"))
    monkeypatch.setattr(llm_processor, "generate_live_answer", gen)
    plan = await chat_service._plan_react_action("LangGraph 는 무슨 뜻이야", "global")
    assert plan["action"] == "none"


async def test_test06_planner_invalid_json_falls_back_to_keywords(chat_service, monkeypatch):
    gen = AsyncMock(return_value=('{"action": "search_news_corpus", "search_query": ', "claude-haiku-5-5"))
    monkeypatch.setattr(llm_processor, "generate_live_answer", gen)
    plan = await chat_service._plan_react_action("LangGraph 에이전트 동향", "global")
    assert gen.await_count == 1
    assert plan["action"] == "search_news_corpus"
    assert plan["thought"] == "기술 키워드 기반 코퍼스 검색 수행"
    assert "LangGraph" in plan["search_query"]


async def test_arch05_planner_runs_even_when_ci_env_is_set(chat_service, monkeypatch):
    monkeypatch.setenv("CI", "true")
    gen = AsyncMock(return_value=('{"thought": "t", "action": "none", "search_query": ""}', "m"))
    monkeypatch.setattr(llm_processor, "generate_live_answer", gen)
    plan = await chat_service._plan_react_action("LangGraph 는 무슨 뜻이야", "global")
    assert plan["action"] == "none"


async def test_arch05_planner_type_error_is_not_retried_without_model(chat_service, monkeypatch):
    gen = AsyncMock(side_effect=TypeError("inner bug"))
    monkeypatch.setattr(llm_processor, "generate_live_answer", gen)
    plan = await chat_service._plan_react_action("LangGraph 에이전트 동향", "global")
    assert gen.await_count == 1
    assert plan["action"] == "search_news_corpus"


# ---------------------------------------------------------------------------
# N-01 / D-47: 기사 Ask AI 스트림 도중 실패·max_tokens 는 error 이벤트로 끝난다
# ---------------------------------------------------------------------------

async def test_n01_ask_stream_truncated_answer_ends_with_error_event(fake_llm):
    fake_llm.claude_stream_stop_reason = "max_tokens"
    events = await _ask_events(1, f"잘림 {uuid.uuid4().hex[:6]}")
    assert [e for e in events if e["event"] == "token"]
    assert not [e for e in events if e["event"] == "done"]
    assert events[-1]["event"] == "error"
    assert events[-1]["error_code"] == "ERR_LLM_STREAM_FAILED"
    assert events[-1]["message"]
    assert events[-1]["retryable"] is True


async def test_n01_ask_stream_error_event_after_tokens_ends_with_error_event(fake_llm):
    fake_llm.claude_stream_error = {"type": "api_error", "message": "Internal server error"}
    events = await _ask_events(1, f"끊김 {uuid.uuid4().hex[:6]}")
    assert events[-1]["event"] == "error"
    assert "Internal server error" not in events[-1]["message"]


# ---------------------------------------------------------------------------
# N-05 / D-51: 비스트림 Anthropic 응답이 max_tokens 로 잘리면 성공으로 넘기지 않는다
# ---------------------------------------------------------------------------

async def test_n05_non_stream_max_tokens_raises(fake_llm):
    fake_llm.claude_message_stop_reason = "max_tokens"
    with pytest.raises(AnthropicStreamError):
        await llm_processor.anthropic_provider.generate_text_with_usage("x")
    with pytest.raises(LLMUpstreamException):
        await llm_processor.generate_live_answer("x")


# ---------------------------------------------------------------------------
# N-06 / D-52: 다른 세션의 메시지 id 를 말없이 버리지 않는다
# N-07: 한 턴의 질문이 답보다 앞선 created_at 을 가진다
# ---------------------------------------------------------------------------

async def test_n06_foreign_message_id_is_rejected_not_dropped(session_ids):
    sid_a, sid_b = session_ids(), session_ids()
    async with AsyncSessionLocal() as s:
        await ChatSessionService(s).persist_turn(
            session_id=sid_a, user_content="A 질문", assistant_content="A 답",
            user_message_id="dup-user", assistant_message_id="a-asst")
    async with AsyncSessionLocal() as s:
        from app.services.chat_session_service import MessageIdConflictException

        with pytest.raises(MessageIdConflictException):
            await ChatSessionService(s).persist_turn(
                session_id=sid_b, user_content="B 질문", assistant_content="B 답",
                user_message_id="dup-user", assistant_message_id="b-asst")

    async with _client() as ac:
        r = await ac.post("/api/chat/sessions", json={"id": sid_b, "messages": [
            {"id": "dup-user", "session_id": sid_b, "role": "user", "content": "B 질문",
             "created_at": "2026-11-10T00:00:00+00:00"}]})
        a = await ac.get(f"/api/chat/sessions/{sid_a}")
    assert r.status_code == 400
    assert r.json()["error_code"] == "ERR_INVALID_PAYLOAD"
    assert "dup-user" in r.json()["message"]
    assert [m["content"] for m in a.json()["messages"]] == ["A 질문", "A 답"]


async def test_n07_turn_messages_have_increasing_created_at(session_ids):
    sid = session_ids()
    async with AsyncSessionLocal() as s:
        user, asst = await ChatSessionService(s).persist_turn(
            session_id=sid, user_content="질문", assistant_content="답")
        assert user.created_at < asst.created_at
    async with AsyncSessionLocal() as s:
        rows = (await s.execute(
            select(ChatMessageModel.role).where(ChatMessageModel.session_id == sid)
            .order_by(ChatMessageModel.created_at.asc())
        )).scalars().all()
    assert rows == ["user", "assistant"]


# ---------------------------------------------------------------------------
# CT-004: 세션 POST 메시지의 model_tier·usage·created_at 을 저장하고 돌려준다
# ---------------------------------------------------------------------------

async def test_ct004_session_post_keeps_model_tier_usage_and_created_at(session_ids):
    sid = session_ids()
    usage = {"input_tokens": 12, "output_tokens": 34, "cache_read_input_tokens": 5, "cache_creation_input_tokens": None}
    messages = [
        {"id": f"u-{sid[:8]}", "session_id": sid, "role": "user", "content": "질문",
         "created_at": "2026-11-09T01:02:03+00:00"},
        {"id": f"a-{sid[:8]}", "session_id": sid, "role": "assistant", "content": "답",
         "created_at": "2026-11-09T01:02:05.500000+00:00", "model": "claude-opus-5-5",
         "model_tier": "opus", "usage": usage, "latency_ms": 900},
    ]
    async with _client() as ac:
        r = await ac.post("/api/chat/sessions", json={"id": sid, "messages": messages})
        d = await ac.get(f"/api/chat/sessions/{sid}")
    assert r.status_code == 201, r.text
    got = d.json()["messages"]
    assert [m["id"] for m in got] == [m["id"] for m in messages]
    assert got[1]["model_tier"] == "opus"
    assert got[1]["usage"] == usage
    assert got[0]["created_at"].startswith("2026-11-09T01:02:03")
    assert got[1]["created_at"].startswith("2026-11-09T01:02:05.5")


async def test_ct004_session_post_skips_ids_already_saved_by_stream(session_ids):
    sid = session_ids()
    async with AsyncSessionLocal() as s:
        await ChatSessionService(s).persist_turn(
            session_id=sid, user_content="서버 질문", assistant_content="서버 답", model_tier="sonnet",
            user_message_id="srv-u", assistant_message_id="srv-a")
    async with _client() as ac:
        r = await ac.post("/api/chat/sessions", json={"id": sid, "messages": [
            {"id": "srv-u", "session_id": sid, "role": "user", "content": "프론트 질문",
             "created_at": "2026-01-01T00:00:00+00:00"},
            {"id": "srv-a", "session_id": sid, "role": "assistant", "content": "프론트 답",
             "created_at": "2026-01-01T00:00:01+00:00", "model_tier": "haiku"},
        ]})
    got = r.json()["messages"]
    assert [m["content"] for m in got] == ["서버 질문", "서버 답"]
    assert got[1]["model_tier"] == "sonnet"


@pytest.mark.parametrize("body", ['{"id": ', '{"messages": "x"}', '[1]'])
async def test_session_post_payload_errors_are_invalid_payload(body):
    async with _client() as ac:
        r = await ac.post("/api/chat/sessions", content=body, headers={"content-type": "application/json"})
    assert r.status_code == 400
    data = r.json()
    assert data["error_code"] == "ERR_INVALID_PAYLOAD"
    assert "Traceback" not in data["message"] and "validation error" not in data["message"]


async def test_session_post_bad_uuid_keeps_invalid_uuid_code():
    async with _client() as ac:
        r = await ac.post("/api/chat/sessions", json={"id": "not-a-uuid"})
    assert r.status_code == 400
    assert r.json()["error_code"] == "ERR_SESSION_INVALID_UUID"


# ---------------------------------------------------------------------------
# CC-02 (후속): 비스트림 `POST /api/news/{id}/ask` 를 지웠으므로 그 경로만 쓰던 함수도 없다
# ---------------------------------------------------------------------------

def test_cc02_non_stream_ask_helpers_are_removed():
    assert not hasattr(llm_processor, "answer_question_with_meta")
    assert not hasattr(llm_processor, "answer_question")
