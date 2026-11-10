"""코드 리뷰 '머지 전 필수' 결함(BUG-02~08)의 회귀 테스트 (TEST-01).

근거: docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md 2.2절, 2.7절.
"""
import json
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select

from app.database import AsyncSessionLocal
from app.main import app
from app.models.chat_session import ChatMessageModel, ChatSessionModel
from app.services.deep_researcher import AutonomousDeepResearcher
from app.services.llm_processor import llm_processor
from app.services.sources_service import sources_service


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


# ---------------------------------------------------------------------------
# BUG-02 세션 업서트가 이미 있는 메시지 id 를 다시 받아도 중복·500 없이 갱신 뒤 상태를 돌려준다
# ---------------------------------------------------------------------------

def _msg(mid: str, sid: str, role: str, content: str) -> dict:
    return {"id": mid, "session_id": sid, "role": role, "content": content,
            "created_at": "2026-11-09T00:00:00+00:00"}


@pytest.fixture
async def chat_session_id():
    sid = str(uuid.uuid4())
    yield sid
    async with AsyncSessionLocal() as s:
        await s.execute(delete(ChatMessageModel).where(ChatMessageModel.session_id == sid))
        await s.execute(delete(ChatSessionModel).where(ChatSessionModel.id == sid))
        await s.commit()


@pytest.mark.asyncio
async def test_session_upsert_with_existing_message_ids_is_idempotent(chat_session_id):
    sid = chat_session_id
    u1, a1, u2, a2 = (str(uuid.uuid4()) for _ in range(4))
    turn1 = [_msg(u1, sid, "user", "q1"), _msg(a1, sid, "assistant", "a1")]
    turn2 = turn1 + [_msg(u2, sid, "user", "q2"), _msg(a2, sid, "assistant", "a2")]

    async with _client() as ac:
        r1 = await ac.post("/api/chat/sessions", json={"id": sid, "title": "t", "messages": turn1})
        assert r1.status_code == 201
        assert len(r1.json()["messages"]) == 2

        # 두 번째 동기화: 이전 메시지 id 를 다시 포함한다 → 500 이 아니고 새 메시지만 더한다
        r2 = await ac.post("/api/chat/sessions", json={"id": sid, "title": "t2", "messages": turn2})
        assert r2.status_code == 201, r2.text
        # 응답은 갱신 뒤 상태 (identity map 의 옛 컬렉션이 아니다)
        assert sorted(m["id"] for m in r2.json()["messages"]) == sorted([u1, a1, u2, a2])
        assert r2.json()["title"] == "t2"

        # 같은 요청을 한 번 더 보내도 그대로다
        r3 = await ac.post("/api/chat/sessions", json={"id": sid, "title": "t2", "messages": turn2})
        assert r3.status_code == 201, r3.text
        assert len(r3.json()["messages"]) == 4

        detail = await ac.get(f"/api/chat/sessions/{sid}")
    assert sorted(m["id"] for m in detail.json()["messages"]) == sorted([u1, a1, u2, a2])

    async with AsyncSessionLocal() as s:
        rows = (await s.execute(select(ChatMessageModel.id).where(ChatMessageModel.session_id == sid))).scalars().all()
    assert len(rows) == 4


# ---------------------------------------------------------------------------
# BUG-03 딥 리서치 예외 뒤 is_running 고착
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_deep_research_resets_running_flag_on_error(monkeypatch):
    researcher = AutonomousDeepResearcher()
    monkeypatch.setattr(researcher, "mine_reference_domains_from_articles", AsyncMock(return_value=[]))
    monkeypatch.setattr(researcher, "probe_and_discover_feed", AsyncMock(side_effect=RuntimeError("probe boom")))

    with pytest.raises(RuntimeError):
        await researcher.run_deep_research(max_candidates=1)

    assert researcher.is_running is False
    # 다음 실행이 already_running 으로 막히지 않는다
    monkeypatch.setattr(researcher, "probe_and_discover_feed",
                        AsyncMock(return_value={"status": "error", "message": "no feed"}))
    summary = await researcher.run_deep_research(max_candidates=1)
    assert summary.get("status") != "already_running"
    assert summary["evaluated_total"] == 1


# ---------------------------------------------------------------------------
# BUG-04 발굴 후보가 시드 뒤에 있어 컷에 걸려 평가되지 않음
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_deep_research_evaluates_mined_candidates(monkeypatch):
    researcher = AutonomousDeepResearcher()
    mined = ["https://mined-one.example", "https://mined-two.example"]
    probed = []

    async def fake_probe(url):
        probed.append(url)
        return {"status": "error", "message": "no feed"}

    monkeypatch.setattr(researcher, "mine_reference_domains_from_articles", AsyncMock(return_value=mined))
    monkeypatch.setattr(researcher, "probe_and_discover_feed", fake_probe)

    summary = await researcher.run_deep_research(max_candidates=6)

    assert set(mined) <= set(probed)
    assert len(probed) == 6  # 컷은 그대로
    assert summary["evaluated_total"] == 6


# ---------------------------------------------------------------------------
# BUG-05 owner/repo 저장소·URL id 피드의 토글·삭제가 라우팅 404
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_toggle_and_delete_github_repo_with_slash():
    repo = "tdd-owner/tdd-repo"
    # POST /api/sources/github·add_github_repo 는 v0.4.2 에서 지웠다 (CC-02). 사본 sources.json 에 직접 넣는다
    data = sources_service.load_sources()
    data["github_sources"].setdefault("monitored_repos", []).append({"repo": repo, "enabled": True})
    sources_service.save_sources(data)

    def current():
        repos = sources_service.get_all_sources()["github_sources"]["monitored_repos"]
        return [r for r in repos if r["repo"] == repo]

    try:
        async with _client() as ac:
            t = await ac.patch("/api/sources/github_repo/tdd-owner%2Ftdd-repo/toggle")
            assert t.status_code == 200, t.text
            assert current()[0]["enabled"] is False

            d = await ac.delete("/api/sources/github_repo/tdd-owner%2Ftdd-repo")
            assert d.status_code == 200, d.text
        assert current() == []
    finally:
        sources_service.delete_source("github_repo", repo)


@pytest.mark.asyncio
async def test_toggle_rss_feed_by_url_id():
    url = "https://tdd-feed.example/feed.xml"
    feed = sources_service.add_rss_source(name="tdd url feed", url=url)
    try:
        async with _client() as ac:
            t = await ac.patch("/api/sources/rss/https%3A%2F%2Ftdd-feed.example%2Ffeed.xml/toggle")
        assert t.status_code == 200, t.text
        now = [f for f in sources_service.get_all_sources()["rss_feeds"] if f["url"] == url][0]
        assert now["enabled"] is False
    finally:
        sources_service.delete_source("rss", feed["id"])


@pytest.mark.asyncio
async def test_toggle_unknown_repo_still_404():
    async with _client() as ac:
        r = await ac.patch("/api/sources/github_repo/no-such-owner%2Fno-such-repo/toggle")
    assert r.status_code == 404
    assert r.json() == {"error_code": "ERR_NOT_FOUND", "message": "해당 소스를 찾을 수 없습니다.", "details": None}


# ---------------------------------------------------------------------------
# BUG-06 POST /api/chat/stream 검증 실패가 500
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_chat_stream_invalid_model_tier_returns_400():
    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json={"question": "hello", "model_tier": "ultra"})
    assert r.status_code == 400, r.text
    body = r.json()
    assert body["error_code"] == "ERR_INVALID_MODEL_TIER"
    assert body["message"]
    assert "details" in body


@pytest.mark.asyncio
async def test_chat_stream_non_object_body_returns_400():
    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json=["x"])
    assert r.status_code == 400, r.text
    assert r.json()["error_code"] == "ERR_INVALID_PAYLOAD"


@pytest.mark.asyncio
async def test_chat_stream_invalid_field_returns_400():
    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json={"question": "hello", "top_k": 99})
    assert r.status_code == 400, r.text
    assert r.json()["error_code"] == "ERR_INVALID_PAYLOAD"


# ---------------------------------------------------------------------------
# BUG-07 Ask AI 스트림 도중 실패하면 다른 엔진 답을 이어 붙이고 섞인 답을 캐시
# ---------------------------------------------------------------------------

async def _collect_ask_events(question: str):
    return [e async for e in llm_processor.stream_question_answer(
        item_title="TDD 기사", item_summary="요약", category="harness", tech_stack=[], question=question,
    )]


@pytest.mark.asyncio
async def test_ask_stream_partial_failure_does_not_append_fallback(monkeypatch):
    monkeypatch.setattr(llm_processor, "_qa_cache", {})

    async def broken_stream(prompt, **kwargs):
        yield "부분 ", "claude-sonnet-5-5"
        yield "답변", "claude-sonnet-5-5"
        raise RuntimeError("connection reset")

    monkeypatch.setattr(llm_processor.anthropic_provider, "stream_chat", broken_stream)

    events = await _collect_ask_events("부분 실패?")

    assert [e for e in events if e["event"] == "meta"] == [{"event": "meta", "model": "claude-sonnet-5-5"}]
    assert "".join(e["text"] for e in events if e["event"] == "token") == "부분 답변"
    assert not [e for e in events if e["event"] == "done"]
    assert llm_processor._qa_cache == {}


@pytest.mark.asyncio
async def test_ask_stream_openai_partial_failure_does_not_append_fallback(monkeypatch):
    import openai
    from app.config import settings

    monkeypatch.setattr(llm_processor, "_qa_cache", {})
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")  # Anthropic 경로를 건너뛴다
    monkeypatch.setattr(llm_processor, "openai_key", "sk-openai-test-fake")

    def chunk(text):
        return SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content=text))])

    async def broken_openai_stream():
        yield chunk("OpenAI 부분")
        raise RuntimeError("openai reset")

    class FakeAsyncOpenAI:
        def __init__(self, api_key=None):
            self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

        async def _create(self, **kwargs):
            return broken_openai_stream()

    monkeypatch.setattr(openai, "AsyncOpenAI", FakeAsyncOpenAI)

    events = await _collect_ask_events("OpenAI 부분 실패?")

    assert len([e for e in events if e["event"] == "meta"]) == 1
    assert "".join(e["text"] for e in events if e["event"] == "token") == "OpenAI 부분"
    assert not [e for e in events if e["event"] == "done"]
    assert llm_processor._qa_cache == {}


@pytest.mark.asyncio
async def test_ask_stream_failure_before_tokens_still_falls_back(monkeypatch):
    """토큰을 보내기 전 실패는 지금처럼 다음 엔진(휴리스틱)으로 넘어간다."""
    monkeypatch.setattr(llm_processor, "_qa_cache", {})

    async def failing_stream(prompt, **kwargs):
        raise RuntimeError("connect failed")
        yield  # pragma: no cover

    monkeypatch.setattr(llm_processor.anthropic_provider, "stream_chat", failing_stream)

    events = await _collect_ask_events("처음부터 실패?")

    assert events[-1]["event"] == "done"
    assert events[-1]["total_text"]
    # N-08: 휴리스틱 폴백 답은 캐시하지 않는다 (v0.4.2 2차에서 바뀐 기대값)
    assert len(llm_processor._qa_cache) == 0


# ---------------------------------------------------------------------------
# BUG-08 Anthropic 스트림 error 이벤트·stop_reason 무시
# ---------------------------------------------------------------------------

def _mock_stream_response(lines):
    class MockStreamResponse:
        status_code = 200

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def aiter_lines(self):
            for line in lines:
                yield line

    return MockStreamResponse()


def _sse(data: dict) -> str:
    return "data: " + json.dumps(data)


_DELTA = _sse({"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "잘린 "}})
_START = _sse({"type": "message_start", "message": {"usage": {"input_tokens": 5, "output_tokens": 1}}})


@pytest.mark.asyncio
async def test_anthropic_stream_overloaded_error_event_raises():
    from app.services.llm_providers.anthropic_provider import AnthropicLLMProvider, AnthropicOverloadedException

    provider = AnthropicLLMProvider(api_key="sk-ant-test")
    lines = [_START, _DELTA, _sse({"type": "error", "error": {"type": "overloaded_error", "message": "Overloaded"}})]
    tokens = []
    with patch("httpx.AsyncClient.stream", return_value=_mock_stream_response(lines)):
        with pytest.raises(AnthropicOverloadedException):
            async for chunk, _ in provider.stream_chat(prompt="p"):
                tokens.append(chunk)
    assert tokens == ["잘린 "]


@pytest.mark.asyncio
async def test_anthropic_stream_error_event_raises():
    from app.services.llm_providers.anthropic_provider import AnthropicLLMProvider

    provider = AnthropicLLMProvider(api_key="sk-ant-test")
    lines = [_START, _DELTA, _sse({"type": "error", "error": {"type": "api_error", "message": "Internal"}})]
    with patch("httpx.AsyncClient.stream", return_value=_mock_stream_response(lines)):
        with pytest.raises(Exception) as exc_info:
            async for _ in provider.stream_chat(prompt="p"):
                pass
    assert type(exc_info.value).__name__ == "AnthropicStreamError"
    assert "Internal" in str(exc_info.value)


@pytest.mark.asyncio
async def test_anthropic_stream_max_tokens_raises_truncated():
    from app.services.llm_providers.anthropic_provider import AnthropicLLMProvider

    provider = AnthropicLLMProvider(api_key="sk-ant-test")
    lines = [
        _START, _DELTA,
        _sse({"type": "message_delta", "delta": {"stop_reason": "max_tokens"}, "usage": {"output_tokens": 4096}}),
        _sse({"type": "message_stop"}),
    ]
    tokens = []
    with patch("httpx.AsyncClient.stream", return_value=_mock_stream_response(lines)):
        with pytest.raises(Exception) as exc_info:
            async for chunk, _ in provider.stream_chat(prompt="p"):
                tokens.append(chunk)
    assert type(exc_info.value).__name__ == "AnthropicStreamError"
    assert "max_tokens" in str(exc_info.value)
    assert tokens == ["잘린 "]


async def _post_chat_stream(sid: str):
    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json={"question": "잘린 답 테스트", "scope": "global", "session_id": sid})
    assert r.status_code == 200
    return _sse_events(r.text)


async def _persisted_count(sid: str) -> int:
    async with AsyncSessionLocal() as s:
        return len((await s.execute(
            select(ChatMessageModel.id).where(ChatMessageModel.session_id == sid)
        )).scalars().all())


@pytest.mark.asyncio
async def test_chat_stream_truncated_answer_ends_with_error_not_done(fake_llm, chat_session_id):
    fake_llm.claude_stream_stop_reason = "max_tokens"

    events = await _post_chat_stream(chat_session_id)
    names = [n for n, _ in events]

    assert "token" in names
    assert "done" not in names
    assert names[-1] == "error"
    assert events[-1][1]["error_code"] == "ERR_LLM_STREAM_FAILED"
    assert await _persisted_count(chat_session_id) == 0


@pytest.mark.asyncio
async def test_chat_stream_anthropic_error_event_ends_with_error_not_done(fake_llm, chat_session_id):
    fake_llm.claude_stream_error = {"type": "api_error", "message": "Internal server error"}

    events = await _post_chat_stream(chat_session_id)
    names = [n for n, _ in events]

    assert "done" not in names
    assert names[-1] == "error"
    assert await _persisted_count(chat_session_id) == 0


@pytest.mark.asyncio
async def test_chat_stream_end_turn_still_completes(fake_llm, chat_session_id):
    """정상 종료(end_turn)는 지금처럼 done 으로 끝나고 저장된다."""
    events = await _post_chat_stream(chat_session_id)
    names = [n for n, _ in events]

    assert names[-1] == "done"
    assert await _persisted_count(chat_session_id) == 2


# ---------------------------------------------------------------------------
# BUG-02R 스트림 서버 저장과 프론트 세션 POST 가 같은 턴을 다른 id 로 두 번 저장
# (계약: docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md 8.1절)
# ---------------------------------------------------------------------------

async def _stream_turn(sid: str, question: str, user_id=None, assistant_id=None):
    payload = {"question": question, "scope": "global", "session_id": sid}
    if user_id is not None:
        payload["user_message_id"] = user_id
    if assistant_id is not None:
        payload["assistant_message_id"] = assistant_id
    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json=payload)
    assert r.status_code == 200, r.text
    return _sse_events(r.text)


async def _session_post(sid: str, messages: list):
    async with _client() as ac:
        r = await ac.post("/api/chat/sessions", json={"id": sid, "title": "t", "messages": messages})
    assert r.status_code == 201, r.text
    return r.json()


@pytest.mark.asyncio
async def test_stream_with_client_ids_then_session_post_saves_each_turn_once(chat_session_id):
    sid = chat_session_id
    turns = [("q1", "msg-user-aaaa111", "msg-asst-aaaa111"), ("q2", "msg-user-bbbb222", "msg-asst-bbbb222")]
    sent = []
    for question, uid, aid in turns:
        events = await _stream_turn(sid, question, uid, aid)
        assert events[-1][0] == "done"
        # 프론트 saveTurn: 그 턴까지의 전체 메시지를 같은 클라이언트 id 로
        sent += [_msg(uid, sid, "user", question), _msg(aid, sid, "assistant", "답")]
        await _session_post(sid, sent)

    async with _client() as ac:
        detail = (await ac.get(f"/api/chat/sessions/{sid}")).json()
        summaries = (await ac.get("/api/chat/sessions")).json()
    assert sorted(m["id"] for m in detail["messages"]) == sorted(
        [t[1] for t in turns] + [t[2] for t in turns]
    )
    assert next(s for s in summaries if s["id"] == sid)["message_count"] == 4
    assert await _persisted_count(sid) == 4


@pytest.mark.asyncio
async def test_stream_after_session_post_with_same_ids_does_not_duplicate(chat_session_id):
    """프론트 POST 가 먼저 저장해도 서버 저장이 IndexError 없이 건너뛰고, done 으로 끝난다."""
    sid = chat_session_id
    uid, aid = "msg-user-cccc333", "msg-asst-cccc333"
    await _session_post(sid, [_msg(uid, sid, "user", "q1"), _msg(aid, sid, "assistant", "a1")])

    events = await _stream_turn(sid, "q1", uid, aid)

    assert events[-1][0] == "done"
    assert await _persisted_count(sid) == 2


@pytest.mark.asyncio
async def test_persist_turn_with_existing_ids_returns_without_index_error(chat_session_id):
    from app.services.chat_session_service import ChatSessionService

    sid = chat_session_id
    async with AsyncSessionLocal() as db:
        svc = ChatSessionService(db)
        user_msg, assistant_msg = await svc.persist_turn(
            session_id=sid, user_content="q", assistant_content="a",
            user_message_id="msg-user-dddd444", assistant_message_id="msg-asst-dddd444",
        )
        assert (user_msg.id, assistant_msg.id) == ("msg-user-dddd444", "msg-asst-dddd444")

        again = await svc.persist_turn(
            session_id=sid, user_content="q", assistant_content="a",
            user_message_id="msg-user-dddd444", assistant_message_id="msg-asst-dddd444",
        )
        assert again == (None, None)
    assert await _persisted_count(sid) == 2


@pytest.mark.asyncio
async def test_stream_persists_turn_before_done_event(chat_session_id):
    """서버 저장이 done 이벤트보다 먼저 끝나야 프론트 POST·상세 재조회와 경합하지 않는다."""
    from app.schemas.chat import ChatStreamRequest
    from app.services.chat_service import ChatService

    sid = chat_session_id
    req = ChatStreamRequest(question="저장 순서", scope="global", session_id=sid,
                            user_message_id="msg-user-eeee555", assistant_message_id="msg-asst-eeee555")
    count_at_done = None
    async with AsyncSessionLocal() as db:
        async for frame in ChatService(db).stream_chat(req):
            if frame.startswith("event: done"):
                count_at_done = await _persisted_count(sid)
    assert count_at_done == 2


@pytest.mark.asyncio
@pytest.mark.parametrize("ids", [
    {"user_message_id": "same-id", "assistant_message_id": "same-id"},
    {"user_message_id": ""},
    {"assistant_message_id": "x" * 37},
    {"user_message_id": 123},
])
async def test_chat_stream_invalid_message_ids_return_400(ids):
    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json={"question": "hello", **ids})
    assert r.status_code == 400, r.text
    assert r.json()["error_code"] == "ERR_INVALID_PAYLOAD"
    assert r.json()["details"] is None


@pytest.mark.asyncio
async def test_chat_stream_message_ids_null_or_36_chars_are_accepted(chat_session_id):
    long_id = "u" * 36
    async with _client() as ac:
        r = await ac.post("/api/chat/stream", json={
            "question": "경계", "scope": "global", "session_id": chat_session_id,
            "user_message_id": long_id, "assistant_message_id": None,
        })
    assert r.status_code == 200, r.text
    assert _sse_events(r.text)[-1][0] == "done"
    async with AsyncSessionLocal() as s:
        ids = (await s.execute(
            select(ChatMessageModel.id, ChatMessageModel.role).where(ChatMessageModel.session_id == chat_session_id)
        )).all()
    roles = {role: mid for mid, role in ids}
    assert roles["user"] == long_id
    assert roles["assistant"] != long_id and len(roles["assistant"]) == 36  # uuid4
