import pytest
import uuid
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select, func, delete, text

from app.main import app
from app.database import AsyncSessionLocal
from app.models.news import NewsItem

@pytest.fixture(autouse=True)
async def cleanup_chat_sessions():
    """Ensure chat_sessions and chat_messages are wiped before each test."""
    async with AsyncSessionLocal() as session:
        try:
            from app.models.chat_session import ChatSessionModel, ChatMessageModel
            await session.execute(delete(ChatMessageModel))
            await session.execute(delete(ChatSessionModel))
            await session.commit()
        except Exception:
            # Models or tables might not exist yet during RED phase
            await session.rollback()
    yield

# ==============================================================================
# 1. GET /api/chat/sessions (List Sessions)
# ==============================================================================

@pytest.mark.asyncio
async def test_get_sessions_empty():
    """Verify GET /api/chat/sessions returns an empty list with 200 OK when no sessions exist."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/chat/sessions")
    assert res.status_code == 200
    assert res.json() == []

@pytest.mark.asyncio
async def test_get_sessions_list_and_ordering():
    """Verify GET /api/chat/sessions returns sessions ordered by updated_at DESC and supports limit/offset."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create 3 sessions
        res1 = await ac.post("/api/chat/sessions", json={"title": "Session 1", "scope_mode": "global"})
        assert res1.status_code == 201
        sid1 = res1.json()["id"]

        res2 = await ac.post("/api/chat/sessions", json={"title": "Session 2", "scope_mode": "scoped", "active_source_id": 1})
        assert res2.status_code == 201
        sid2 = res2.json()["id"]

        res3 = await ac.post("/api/chat/sessions", json={"title": "Session 3", "scope_mode": "global"})
        assert res3.status_code == 201
        sid3 = res3.json()["id"]

        # Update Session 1 so it becomes the most recently updated
        await ac.post("/api/chat/sessions", json={"id": sid1, "title": "Session 1 Updated"})

        # Query all
        res = await ac.get("/api/chat/sessions")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 3
        # Most recently updated first: sid1, then sid3, then sid2
        assert data[0]["id"] == sid1
        assert data[0]["title"] == "Session 1 Updated"
        assert data[1]["id"] == sid3
        assert data[2]["id"] == sid2

        # Test limit
        res_limit = await ac.get("/api/chat/sessions?limit=2")
        assert res_limit.status_code == 200
        assert len(res_limit.json()) == 2
        assert res_limit.json()[0]["id"] == sid1
        assert res_limit.json()[1]["id"] == sid3

        # Test offset
        res_offset = await ac.get("/api/chat/sessions?limit=2&offset=1")
        assert res_offset.status_code == 200
        assert len(res_offset.json()) == 2
        assert res_offset.json()[0]["id"] == sid3
        assert res_offset.json()[1]["id"] == sid2

# ==============================================================================
# 2. POST /api/chat/sessions (Create or Upsert Session)
# ==============================================================================

@pytest.mark.asyncio
async def test_create_session_defaults():
    """Verify POST /api/chat/sessions creates a session with defaults ('새 대화', 'global', auto UUID)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/sessions", json={})
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert uuid.UUID(data["id"])  # Valid UUID
    assert data["title"] == "새 대화"
    assert data["scope_mode"] == "global"
    assert data["active_source_id"] is None
    assert data["messages"] == []
    assert "created_at" in data
    assert "updated_at" in data

@pytest.mark.asyncio
async def test_create_session_explicit_uuid_and_fields():
    """Verify POST /api/chat/sessions creates a session with user-specified UUID and fields."""
    custom_id = str(uuid.uuid4())
    payload = {
        "id": custom_id,
        "title": "FastMCP 기술 분석",
        "scope_mode": "scoped",
        "active_source_id": 1,
        "active_filters": {
            "category": "mcp_plugins_skills",
            "time_range": "7d",
            "sort": "quality",
            "high_signal_only": True
        }
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/sessions", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["id"] == custom_id
    assert data["title"] == "FastMCP 기술 분석"
    assert data["scope_mode"] == "scoped"
    assert data["active_source_id"] == 1
    assert data["active_filters"]["category"] == "mcp_plugins_skills"
    assert data["active_filters"]["high_signal_only"] is True

@pytest.mark.asyncio
async def test_create_session_invalid_uuid():
    """Verify POST /api/chat/sessions returns 400 Bad Request on malformed UUID."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/sessions", json={"id": "not-a-valid-uuid"})
    assert res.status_code == 400
    data = res.json()
    assert data["error_code"] == "ERR_SESSION_INVALID_UUID"

@pytest.mark.asyncio
async def test_upsert_existing_session():
    """Verify POST /api/chat/sessions updates existing session metadata if ID already exists."""
    custom_id = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res1 = await ac.post("/api/chat/sessions", json={"id": custom_id, "title": "초기 제목", "scope_mode": "global"})
        assert res1.status_code == 201

        # Upsert with new title and scope
        res2 = await ac.post("/api/chat/sessions", json={
            "id": custom_id,
            "title": "변경된 제목",
            "scope_mode": "scoped",
            "active_source_id": 1
        })
        assert res2.status_code in (200, 201)
        data = res2.json()
        assert data["id"] == custom_id
        assert data["title"] == "변경된 제목"
        assert data["scope_mode"] == "scoped"
        assert data["active_source_id"] == 1

# ==============================================================================
# 3. GET /api/chat/sessions/{session_id} (Session Detail)
# ==============================================================================

@pytest.mark.asyncio
async def test_get_session_detail_success():
    """Verify GET /api/chat/sessions/{session_id} returns complete detail with hydrated active_source and sorted messages."""
    custom_id = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create session attached to source 1
        res = await ac.post("/api/chat/sessions", json={
            "id": custom_id,
            "title": "LangGraph 분석",
            "scope_mode": "scoped",
            "active_source_id": 1
        })
        assert res.status_code == 201

        # Retrieve detail
        res_get = await ac.get(f"/api/chat/sessions/{custom_id}")
        assert res_get.status_code == 200
        detail = res_get.json()
        assert detail["id"] == custom_id
        assert detail["title"] == "LangGraph 분석"
        assert detail["scope_mode"] == "scoped"
        assert detail["active_source_id"] == 1
        assert detail["active_source"] is not None
        assert detail["active_source"]["id"] == 1
        assert isinstance(detail["messages"], list)

@pytest.mark.asyncio
async def test_get_session_detail_not_found():
    """Verify GET /api/chat/sessions/{session_id} returns 404 ERR_SESSION_NOT_FOUND when session does not exist."""
    non_existent_id = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(f"/api/chat/sessions/{non_existent_id}")
    assert res.status_code == 404
    data = res.json()
    assert data["error_code"] == "ERR_SESSION_NOT_FOUND"

# ==============================================================================
# 4. DELETE /api/chat/sessions/{session_id} (Delete & Cascade)
# ==============================================================================

@pytest.mark.asyncio
async def test_delete_session_and_cascade_messages():
    """Verify DELETE /api/chat/sessions/{session_id} removes session and cascades to delete all child messages."""
    custom_id = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Create session
        res = await ac.post("/api/chat/sessions", json={"id": custom_id, "title": "삭제 예정 세션"})
        assert res.status_code == 201

    # 2. Add messages directly to DB for this session
    from app.models.chat_session import ChatMessageModel
    async with AsyncSessionLocal() as session:
        msg1 = ChatMessageModel(
            id=str(uuid.uuid4()),
            session_id=custom_id,
            role="user",
            content="삭제 테스트 질문",
            status="completed"
        )
        msg2 = ChatMessageModel(
            id=str(uuid.uuid4()),
            session_id=custom_id,
            role="assistant",
            content="삭제 테스트 답변",
            status="completed"
        )
        session.add_all([msg1, msg2])
        await session.commit()

        # Confirm 2 messages exist
        count = (await session.execute(
            select(func.count(ChatMessageModel.id)).where(ChatMessageModel.session_id == custom_id)
        )).scalar_one()
        assert count == 2

    # 3. Call DELETE API
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        del_res = await ac.delete(f"/api/chat/sessions/{custom_id}")
        assert del_res.status_code == 200
        del_data = del_res.json()
        assert del_data["status"] == "success"
        assert del_data["deleted_count"] == 1

        # 4. Verify GET returns 404
        get_res = await ac.get(f"/api/chat/sessions/{custom_id}")
        assert get_res.status_code == 404

    # 5. Verify child messages are also CASCADE deleted from DB
    async with AsyncSessionLocal() as session:
        count_after = (await session.execute(
            select(func.count(ChatMessageModel.id)).where(ChatMessageModel.session_id == custom_id)
        )).scalar_one()
        assert count_after == 0

@pytest.mark.asyncio
async def test_delete_session_not_found():
    """Verify DELETE /api/chat/sessions/{session_id} returns 404 ERR_SESSION_NOT_FOUND when session does not exist."""
    non_existent_id = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.delete(f"/api/chat/sessions/{non_existent_id}")
    assert res.status_code == 404
    data = res.json()
    assert data["error_code"] == "ERR_SESSION_NOT_FOUND"

# ==============================================================================
# 5. FIFO 30 Retention Eviction Policy
# ==============================================================================

@pytest.mark.asyncio
async def test_fifo_30_retention_eviction():
    """Verify that creating more than 30 sessions automatically evicts the oldest session by updated_at."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        session_ids = []
        # Create 30 sessions sequentially
        for i in range(30):
            res = await ac.post("/api/chat/sessions", json={"title": f"Session {i:02d}"})
            assert res.status_code == 201
            session_ids.append(res.json()["id"])

        # Check count is 30
        res_list = await ac.get("/api/chat/sessions?limit=50")
        assert len(res_list.json()) == 30
        first_created_id = session_ids[0]

        # Create 31st session
        res_31 = await ac.post("/api/chat/sessions", json={"title": "Session 30 (31st)"})
        assert res_31.status_code == 201
        new_id = res_31.json()["id"]

        # Total count must remain at 30
        res_list_after = await ac.get("/api/chat/sessions?limit=50")
        current_sessions = res_list_after.json()
        assert len(current_sessions) == 30

        # The oldest session (first_created_id) should have been evicted
        current_ids = [s["id"] for s in current_sessions]
        assert first_created_id not in current_ids
        assert new_id in current_ids

        # Attempt to GET the evicted session should return 404
        evicted_res = await ac.get(f"/api/chat/sessions/{first_created_id}")
        assert evicted_res.status_code == 404

# ==============================================================================
# 6. POST /api/chat/stream Auto-Persistence & Auto-Titling
# ==============================================================================

@pytest.mark.asyncio
async def test_chat_stream_auto_persists_turn_and_auto_titles():
    """Verify POST /api/chat/stream persists user & assistant messages upon completion and auto-titles the session."""
    session_id = str(uuid.uuid4())
    question = "LangGraph v0.3 Functional API 상태 머신 원리를 설명해줘"

    async def mock_stream_tokens(prompt):
        yield ("LangGraph v0.3은 ", "Mock Gemini")
        yield ("함수형 API를 지원합니다.", "Mock Gemini")

    with patch("app.api.chat.llm_processor.check_provider_available", return_value=True), \
         patch("app.services.chat_service.llm_processor.stream_tokens", side_effect=mock_stream_tokens):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            # 1. Call stream with new session_id
            payload = {
                "question": question,
                "scope": "scoped",
                "source_id": 1,
                "session_id": session_id,
            }
            res = await ac.post("/api/chat/stream", json=payload)
            assert res.status_code == 200
            stream_text = res.text
            assert "event: done" in stream_text

            # 2. Retrieve session detail via API
            detail_res = await ac.get(f"/api/chat/sessions/{session_id}")
            assert detail_res.status_code == 200
            detail = detail_res.json()

            # 3. Verify auto-titling (first 30 sanitized chars)
            assert detail["title"].startswith("LangGraph v0.3 Functional API")
            assert detail["scope_mode"] == "scoped"
            assert detail["active_source_id"] == 1

            # 4. Verify messages are persisted
            messages = detail["messages"]
            assert len(messages) == 2

            # User message
            user_msg = messages[0]
            assert user_msg["role"] == "user"
            assert user_msg["content"] == question
            assert user_msg["status"] == "completed"

            # Assistant message
            asst_msg = messages[1]
            assert asst_msg["role"] == "assistant"
            assert "LangGraph v0.3은 함수형 API를 지원합니다." in asst_msg["content"]
            assert asst_msg["status"] == "completed"
            assert asst_msg["model"] == "Mock Gemini"
            assert asst_msg["sources"] is not None
            assert len(asst_msg["sources"]) >= 1

            # 5. Verify session in GET /api/chat/sessions summary
            summary_res = await ac.get("/api/chat/sessions")
            assert summary_res.status_code == 200
            summaries = summary_res.json()
            matching = [s for s in summaries if s["id"] == session_id]
            assert len(matching) == 1
            assert matching[0]["message_count"] == 2
            assert matching[0]["last_message_preview"] is not None

# ==============================================================================
# 7. Auto-titling Algorithm & Service Unit Tests
# ==============================================================================

def test_generate_auto_title_rules():
    """Verify generate_auto_title handles markdown, html, whitespace, and length boundaries."""
    from app.services.chat_session_service import generate_auto_title

    assert generate_auto_title("") == "새 대화"
    assert generate_auto_title("   ") == "새 대화"
    assert generate_auto_title("# Header *bold* `code`") == "Header bold code"
    assert generate_auto_title("<div>HTML Tag</div> Content") == "HTML Tag Content"
    assert generate_auto_title("Short prompt") == "Short prompt"
    # Exactly 30 chars
    exact_30 = "123456789012345678901234567890"
    assert generate_auto_title(exact_30) == exact_30
    # Over 30 chars
    over_30 = "123456789012345678901234567890Extra"
    assert generate_auto_title(over_30) == exact_30 + "..."

@pytest.mark.asyncio
async def test_create_session_with_initial_messages():
    """Verify POST /api/chat/sessions persists initial messages passed in request body."""
    session_id = str(uuid.uuid4())
    msg_id = str(uuid.uuid4())
    now_str = datetime.now(timezone.utc).isoformat()
    payload = {
        "id": session_id,
        "title": "초기 메시지 포함 세션",
        "messages": [
            {
                "id": msg_id,
                "session_id": session_id,
                "role": "user",
                "content": "미리 동기화된 메시지",
                "created_at": now_str,
                "status": "completed",
            }
        ]
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/sessions", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert len(data["messages"]) == 1
        assert data["messages"][0]["content"] == "미리 동기화된 메시지"

@pytest.mark.asyncio
async def test_chat_session_service_append_single_message():
    """Verify ChatSessionService.append_message_and_update_session unit behavior."""
    from app.services.chat_session_service import ChatSessionService
    session_id = str(uuid.uuid4())

    async with AsyncSessionLocal() as session:
        service = ChatSessionService(session)
        msg = await service.append_message_and_update_session(
            session_id=session_id,
            role="user",
            content="단일 메시지 추가 테스트",
        )
        assert msg.session_id == session_id
        assert msg.role == "user"
        assert msg.content == "단일 메시지 추가 테스트"

        detail = await service.get_session_detail(session_id)
        assert detail.title == "단일 메시지 추가 테스트"
        assert len(detail.messages) == 1

@pytest.mark.asyncio
async def test_api_session_error_handling_branches():
    """Verify 500 error responses on internal service failures."""
    from app.services.chat_session_service import SessionDeleteFailedException

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. List sessions internal error
        with patch("app.api.chat.ChatSessionService.list_sessions", side_effect=Exception("DB connection error")):
            res = await ac.get("/api/chat/sessions")
            assert res.status_code == 500
            assert res.json()["error_code"] == "ERR_SERVER_INTERNAL"

        # 2. Get detail internal error
        with patch("app.api.chat.ChatSessionService.get_session_detail", side_effect=Exception("DB read error")):
            res = await ac.get(f"/api/chat/sessions/{uuid.uuid4()}")
            assert res.status_code == 500
            assert res.json()["error_code"] == "ERR_SERVER_INTERNAL"

        # 3. Create session internal error
        with patch("app.api.chat.ChatSessionService.create_or_upsert_session", side_effect=Exception("DB write error")):
            res = await ac.post("/api/chat/sessions", json={"title": "Error test"})
            assert res.status_code == 500
            assert res.json()["error_code"] == "ERR_SESSION_CREATE_FAILED"

        # 4. Delete session failure
        with patch("app.api.chat.ChatSessionService.delete_session", side_effect=SessionDeleteFailedException("Cascade failed")):
            res = await ac.delete(f"/api/chat/sessions/{uuid.uuid4()}")
            assert res.status_code == 500
            assert res.json()["error_code"] == "ERR_SESSION_DELETE_FAILED"

@pytest.mark.asyncio
async def test_chat_session_service_direct_unit():
    """Verify ChatSessionService direct methods: create, list, detail, delete, fifo."""
    from app.services.chat_session_service import ChatSessionService, SessionNotFoundException
    from app.schemas.chat import ChatSessionCreateRequest, ChatFocusFilter, ChatSourceItem

    async with AsyncSessionLocal() as session:
        service = ChatSessionService(session)
        # Create with active_filters and source
        req = ChatSessionCreateRequest(
            title="직접 단위 테스트 세션",
            scope_mode="scoped",
            active_source_id=1,
            active_filters=ChatFocusFilter(category="harness", time_range="7d")
        )
        detail = await service.create_or_upsert_session(req)
        assert detail.title == "직접 단위 테스트 세션"
        assert detail.active_filters is not None
        assert detail.active_filters.category == "harness"
        assert detail.active_source is not None
        assert detail.active_source.id == 1

        # Add turn with sources
        sources = [ChatSourceItem(index=1, title="Test", url="https://example.com", source="github")]
        await service.persist_turn(
            session_id=detail.id,
            user_content="질문",
            assistant_content="답변",
            sources=sources,
            model="gemini-2.5-flash",
            latency_ms=100
        )

        # List
        summaries = await service.list_sessions(limit=10)
        assert len(summaries) >= 1
        s = next(x for x in summaries if x.id == detail.id)
        assert s.message_count == 2
        assert s.active_filters is not None
        assert s.active_filters.category == "harness"

        # Detail
        refreshed = await service.get_session_detail(detail.id)
        assert len(refreshed.messages) == 2
        assert refreshed.messages[1].sources is not None
        assert len(refreshed.messages[1].sources) == 1

        # Delete
        del_res = await service.delete_session(detail.id)
        assert del_res.status == "success"

        # Not found on delete
        with pytest.raises(SessionNotFoundException):
            await service.delete_session("00000000-0000-0000-0000-000000000000")

        # Not found on detail
        with pytest.raises(SessionNotFoundException):
            await service.get_session_detail("00000000-0000-0000-0000-000000000000")

        # Fifo retention with small limit
        assert await service.enforce_fifo_retention(max_limit=100) == 0

@pytest.mark.asyncio
async def test_chat_session_service_json_fallbacks_and_upsert_branches():
    """Verify JSON decode error fallbacks and upserting existing fields."""
    from app.services.chat_session_service import ChatSessionService
    from app.models.chat_session import ChatSessionModel, ChatMessageModel
    from app.schemas.chat import ChatSessionCreateRequest, ChatFocusFilter

    async with AsyncSessionLocal() as session:
        service = ChatSessionService(session)

        # 1. Create a session with corrupted active_filters_json and message with corrupted sources_json
        corrupted_sid = str(uuid.uuid4())
        s = ChatSessionModel(
            id=corrupted_sid,
            title="손상된 JSON 세션",
            active_filters_json="invalid json",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(s)
        msg = ChatMessageModel(
            id=str(uuid.uuid4()),
            session_id=corrupted_sid,
            role="assistant",
            content="답변",
            sources_json="invalid json",
            status="completed",
            created_at=datetime.now(timezone.utc),
        )
        session.add(msg)
        await session.commit()

        # get_session_detail and list_sessions should gracefully fallback active_filters and sources to None
        detail = await service.get_session_detail(corrupted_sid)
        assert detail.active_filters is None
        assert detail.messages[0].sources is None

        summaries = await service.list_sessions(limit=10)
        corrupted_summary = next(x for x in summaries if x.id == corrupted_sid)
        assert corrupted_summary.active_filters is None

        # 2. Test upsert with all fields
        upsert_req = ChatSessionCreateRequest(
            id=corrupted_sid,
            title="완전 갱신된 제목",
            scope_mode="scoped",
            active_source_id=1,
            active_filters=ChatFocusFilter(category="ai_news", time_range="24h"),
        )
        updated_detail = await service.create_or_upsert_session(upsert_req)
        assert updated_detail.title == "완전 갱신된 제목"
        assert updated_detail.scope_mode == "scoped"
        assert updated_detail.active_source_id == 1
        assert updated_detail.active_filters.category == "ai_news"

        # 3. Test enforce_fifo_retention evicts excess when total_count > max_limit
        evicted = await service.enforce_fifo_retention(max_limit=0)
        assert evicted >= 1
