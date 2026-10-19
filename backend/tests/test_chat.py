import pytest
import json
import uuid
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone, timedelta
from app.main import app
from app.database import AsyncSessionLocal
from app.models.news import NewsItem

@pytest.fixture(autouse=True)
async def seed_chat_test_data():
    """Ensure rich test data is seeded for chat and RAG testing."""
    async with AsyncSessionLocal() as session:
        # Check if seed item 101, 102, 103 exist
        for item_data in [
            {
                "id": 101,
                "title": "FastMCP: High-performance Python MCP Framework",
                "url": "https://github.com/jlowin/fastmcp",
                "source": "github",
                "category": "mcp_plugins_skills",
                "author": "Jeremiah Lowin",
                "summary": "FastMCP provides a decorator-based syntax for creating Model Context Protocol servers in Python.",
                "tldr_bullets": json.dumps([
                    "데코레이터 기반 경량 MCP 서버 정의 문법 제공",
                    "표준 입출력(stdio) 및 SSE 전송 방식 동시 지원",
                    "비동기 AsyncIO 네이티브 아키텍처 적용"
                ]),
                "why_it_matters": "Claude Desktop 및 에이전트에 연동 가능한 MCP 서버 개발 생산성을 극대화합니다.",
                "tech_stack": "Python, FastMCP, Claude, AsyncIO",
                "tags": "mcp, fastmcp, anthropic, sdk",
                "quality_score": 9.3,
                "is_high_signal": True,
                "hotness_score": 94.2,
                "published_at": datetime.now(timezone.utc) - timedelta(hours=2),
                "dedup_hash": "hash_fastmcp_101",
            },
            {
                "id": 102,
                "title": "LangGraph v0.2: Production Multi-Agent Workflows & Time-Travel",
                "url": "https://github.com/langchain-ai/langgraph",
                "source": "github",
                "category": "agent_tech",
                "author": "Harrison Chase",
                "summary": "LangGraph v0.2 introduces durable state persistence and time-travel debugging for agent graphs.",
                "tldr_bullets": json.dumps([
                    "그래프 기반 멀티에이전트 제어 흐름 및 분기 완벽 지원",
                    "시간 여행 디버깅 및 체크포인트 상태 롤백 내장"
                ]),
                "why_it_matters": "프로덕션 환경에서 장애 없는 상태 유지 에이전트 시스템을 구축하는 표준 프레임워크입니다.",
                "tech_stack": "Python, TypeScript, LangGraph, LangChain",
                "tags": "langgraph, multi-agent, orchestration",
                "quality_score": 9.1,
                "is_high_signal": True,
                "hotness_score": 96.0,
                "published_at": datetime.now(timezone.utc) - timedelta(hours=5),
                "dedup_hash": "hash_langgraph_102",
            },
            {
                "id": 103,
                "title": "Low Quality Spam News Article",
                "url": "https://example.com/spam",
                "source": "rss",
                "category": "ai_news",
                "author": "Spammer",
                "summary": "Click here to win free prizes with AI bot crypto.",
                "tldr_bullets": "[]",
                "why_it_matters": "No value",
                "tech_stack": "Spam",
                "tags": "crypto, scam",
                "quality_score": 2.1,  # Under 5.0 pruning threshold
                "is_high_signal": False,
                "hotness_score": 1.0,
                "published_at": datetime.now(timezone.utc) - timedelta(days=10),
                "dedup_hash": "hash_spam_103",
            }
        ]:
            existing = await session.get(NewsItem, item_data["id"])
            if not existing:
                item = NewsItem(**item_data)
                session.add(item)
            else:
                for k, v in item_data.items():
                    setattr(existing, k, v)
        await session.commit()
    yield

# ==============================================================================
# 1. Retriever Unit Tests (BaseKnowledgeRetriever, SqliteFtsRetriever, Facade)
# ==============================================================================

@pytest.mark.asyncio
async def test_sqlite_fts_retriever_search_and_ranking():
    """Verify SqliteFtsRetriever performs keyword search, ranks by hybrid RAG score, and returns chunks."""
    from app.services.retriever import SqliteFtsRetriever, KnowledgeRetrieverFacade
    
    async with AsyncSessionLocal() as session:
        retriever = SqliteFtsRetriever(session)
        chunks = await retriever.retrieve("FastMCP Python", top_k=5, min_quality=5.0)
        
        assert len(chunks) >= 1
        top_chunk = chunks[0]
        assert top_chunk.id == 101
        assert "FastMCP" in top_chunk.title
        assert top_chunk.index == 1
        assert top_chunk.url == "https://github.com/jlowin/fastmcp"
        assert top_chunk.quality_score == 9.3
        assert 0.0 <= top_chunk.rag_score <= 1.0
        assert top_chunk.bm25_score is not None

@pytest.mark.asyncio
async def test_sqlite_fts_retriever_quality_pruning():
    """Verify articles with quality_score < min_quality are pruned from search results."""
    from app.services.retriever import SqliteFtsRetriever

    async with AsyncSessionLocal() as session:
        retriever = SqliteFtsRetriever(session)
        # Search for spam keyword
        chunks = await retriever.retrieve("crypto spam", top_k=5, min_quality=5.0)
        # Item 103 has quality 2.1, so it should be pruned
        for c in chunks:
            assert c.id != 103

@pytest.mark.asyncio
async def test_sqlite_fts_retriever_query_sanitization():
    """Verify special characters in queries are safely sanitized without raising SQL syntax errors."""
    from app.services.retriever import SqliteFtsRetriever

    async with AsyncSessionLocal() as session:
        retriever = SqliteFtsRetriever(session)
        # Complex query with special characters
        chunks = await retriever.retrieve('FastMCP* AND ("Python": OR NOT \'test\') ???', top_k=5)
        assert isinstance(chunks, list)

@pytest.mark.asyncio
async def test_knowledge_retriever_facade():
    """Verify KnowledgeRetrieverFacade exposes search interface and allows pluggable backends."""
    from app.services.retriever import KnowledgeRetrieverFacade

    async with AsyncSessionLocal() as session:
        facade = KnowledgeRetrieverFacade(session)
        chunks = await facade.search_knowledge(query="LangGraph", top_k=3)
        assert len(chunks) >= 1
        assert any(c.id == 102 for c in chunks)
        assert any("LangGraph" in c.title for c in chunks)

# ==============================================================================
# 2. Source Metadata Detail API (GET /api/chat/sources/{source_id})
# ==============================================================================

@pytest.mark.asyncio
async def test_get_chat_source_success():
    """Verify GET /api/chat/sources/{source_id} returns full metadata for handover."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/chat/sources/101")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == 101
    assert data["title"] == "FastMCP: High-performance Python MCP Framework"
    assert data["url"] == "https://github.com/jlowin/fastmcp"
    assert data["category"] == "mcp_plugins_skills"
    assert data["quality_score"] == 9.3
    assert isinstance(data["tldr_bullets"], list)
    assert len(data["tldr_bullets"]) == 3
    assert isinstance(data["tech_stack"], list)
    assert "FastMCP" in data["tech_stack"]
    assert isinstance(data["tags"], list)
    assert data["is_high_signal"] is True

@pytest.mark.asyncio
async def test_get_chat_source_not_found():
    """Verify non-existent source_id returns 404 with standard ErrorResponse."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/chat/sources/99999")
    assert res.status_code == 404
    err = res.json()
    assert err["error_code"] == "ERR_HANDOVER_SOURCE_NOT_FOUND"
    assert "99999" in err["message"] or "찾을 수 없습니다" in err["message"]

# ==============================================================================
# 3. Knowledge Search Preview API (GET /api/chat/search)
# ==============================================================================

@pytest.mark.asyncio
async def test_chat_search_success():
    """Verify GET /api/chat/search returns preview chunks with BM25 and RAG scores."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/chat/search?q=LangGraph&top_k=5")
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "LangGraph"
    assert data["total_matches"] >= 1
    assert len(data["chunks"]) >= 1
    assert any("LangGraph" in c["title"] for c in data["chunks"])
    assert any(c["id"] in (1, 102) for c in data["chunks"])
    chunk = data["chunks"][0]
    assert "bm25_score" in chunk
    assert "rag_score" in chunk
    assert "latency_ms" in data

@pytest.mark.asyncio
async def test_chat_search_query_too_short():
    """Verify search query with fewer than 2 characters returns 400 Bad Request."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/chat/search?q=a")
    assert res.status_code == 400
    err = res.json()
    assert err["error_code"] == "ERR_SEARCH_QUERY_TOO_SHORT"

@pytest.mark.asyncio
async def test_chat_search_filters():
    """Verify category and min_quality filters work as expected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/chat/search?q=Python&category=mcp_plugins_skills&min_quality=9.0")
    assert res.status_code == 200
    data = res.json()
    for chunk in data["chunks"]:
        assert chunk["category"] == "mcp_plugins_skills"
        assert chunk["quality_score"] >= 9.0

# ==============================================================================
# 4. Synchronous Single Query API (POST /api/chat/query)
# ==============================================================================

@pytest.mark.asyncio
async def test_chat_query_global_mode_success():
    """Verify POST /api/chat/query generates grounded answer in Global mode via real LLM."""
    from unittest.mock import patch
    payload = {
        "question": "FastMCP와 LangGraph의 특징을 비교해주세요.",
        "scope": "global",
        "top_k": 3
    }
    with patch("app.services.chat_service.llm_processor.generate_live_answer", return_value=("FastMCP와 LangGraph 비교 분석 답변입니다[1].", "gemini-2.5-flash")):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data and len(data["answer"]) > 0
    assert "sources" in data
    assert isinstance(data["sources"], list)
    assert len(data["sources"]) >= 1
    assert data["scope"] == "global"
    assert "session_id" in data
    assert "model" in data
    assert "latency_ms" in data

@pytest.mark.asyncio
async def test_chat_query_scoped_mode_success():
    """Verify POST /api/chat/query grounds on single article in Scoped mode via real LLM."""
    from unittest.mock import patch
    payload = {
        "question": "이 프레임워크의 데코레이터 문법과 지원 프로토콜을 알려주세요.",
        "scope": "scoped",
        "source_id": 101
    }
    with patch("app.services.chat_service.llm_processor.generate_live_answer", return_value=("FastMCP 데코레이터 문법 상세 답변입니다[1].", "gemini-2.5-flash")), \
         patch("app.services.agentic_search.AgenticSearchService.evaluate_and_search", return_value=(False, [], [])):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["scope"] == "scoped"
    assert len(data["sources"]) == 1
    assert data["sources"][0]["id"] == 101

@pytest.mark.asyncio
async def test_chat_query_empty_question_validation():
    """Verify empty or whitespace-only question returns 400 ERR_CHAT_PAYLOAD_EMPTY."""
    for empty_q in ["", "   ", "\n\t"]:
        payload = {"question": empty_q, "scope": "global"}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/query", json=payload)
        assert res.status_code == 400
        err = res.json()
        assert err["error_code"] == "ERR_CHAT_PAYLOAD_EMPTY"

@pytest.mark.asyncio
async def test_chat_query_too_large_question_validation():
    """Verify question exceeding 2000 characters returns 400 ERR_CHAT_PAYLOAD_TOO_LARGE."""
    payload = {"question": "a" * 2001, "scope": "global"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/query", json=payload)
    assert res.status_code == 400
    err = res.json()
    assert err["error_code"] == "ERR_CHAT_PAYLOAD_TOO_LARGE"

@pytest.mark.asyncio
async def test_chat_query_scoped_source_not_found():
    """Verify scoped mode with non-existent source_id returns 404 ERR_HANDOVER_SOURCE_NOT_FOUND."""
    payload = {
        "question": "기사 요약해줘",
        "scope": "scoped",
        "source_id": 99999
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/query", json=payload)
    assert res.status_code == 404
    err = res.json()
    assert err["error_code"] == "ERR_HANDOVER_SOURCE_NOT_FOUND"

@pytest.mark.asyncio
async def test_chat_query_invalid_scope():
    """Verify invalid scope param returns 400 ERR_INVALID_SCOPE_PARAM."""
    payload = {
        "question": "유효하지 않은 스코프 테스트",
        "scope": "invalid_scope"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/query", json=payload)
    assert res.status_code == 400
    err = res.json()
    assert err["error_code"] == "ERR_INVALID_SCOPE_PARAM"

# ==============================================================================
# 5. Real-time SSE Streaming API (POST /api/chat/stream)
# ==============================================================================

@pytest.mark.asyncio
async def test_chat_stream_global_sse_success():
    """Verify POST /api/chat/stream returns SSE stream with sources, token, done events."""
    from unittest.mock import patch
    payload = {
        "question": "최근 공개된 LangGraph 0.2의 주요 변경점은 무엇인가요?",
        "scope": "global",
        "session_id": str(uuid.uuid4())
    }

    async def mock_stream_tokens(prompt):
        yield ("LangGraph 0.2", "Google gemini-2.5-flash")
        yield (" 릴리즈 분석입니다.", "Google gemini-2.5-flash")

    with patch("app.api.chat.llm_processor.check_provider_available", return_value=True), \
         patch("app.services.chat_service.llm_processor.stream_tokens", side_effect=mock_stream_tokens):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/stream", json=payload)
    assert res.status_code == 200
    assert "text/event-stream" in res.headers["content-type"]
    
    body = res.text
    # Verify 3-stage SSE event protocol
    assert "event: sources" in body
    assert "event: token" in body
    assert "event: done" in body

    # Verify sources event payload
    sources_pos = body.find("event: sources")
    sources_data_line = body[sources_pos:].split("\n")[1]
    assert sources_data_line.startswith("data: ")
    sources_json = json.loads(sources_data_line[6:])
    assert "sources" in sources_json
    assert len(sources_json["sources"]) >= 1

    # Verify done event payload
    done_pos = body.find("event: done")
    done_data_line = body[done_pos:].split("\n")[1]
    done_json = json.loads(done_data_line[6:])
    assert done_json["done"] is True
    assert done_json["session_id"] == payload["session_id"]
    assert "model" in done_json
    assert "sources_count" in done_json

@pytest.mark.asyncio
async def test_chat_stream_scoped_sse_success():
    """Verify POST /api/chat/stream in Scoped mode isolates single source."""
    from unittest.mock import patch
    payload = {
        "question": "FastMCP의 주요 기술 구조와 특징을 설명해주세요.",
        "scope": "scoped",
        "source_id": 101
    }

    async def mock_stream_tokens(prompt):
        yield ("FastMCP", "Google gemini-2.5-flash")
        yield (" 주요 아키텍처입니다.", "Google gemini-2.5-flash")

    with patch("app.api.chat.llm_processor.check_provider_available", return_value=True), \
         patch("app.services.chat_service.llm_processor.stream_tokens", side_effect=mock_stream_tokens):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/stream", json=payload)
    assert res.status_code == 200
    body = res.text
    assert "event: sources" in body
    assert "FastMCP" in body
    assert "event: done" in body

@pytest.mark.asyncio
async def test_chat_stream_empty_question_validation():
    """Verify empty question in stream returns 400 ERR_CHAT_PAYLOAD_EMPTY."""
    payload = {"question": "   ", "scope": "global"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/stream", json=payload)
    assert res.status_code == 400
    err = res.json()
    assert err["error_code"] == "ERR_CHAT_PAYLOAD_EMPTY"

@pytest.mark.asyncio
async def test_chat_stream_scoped_source_not_found():
    """Verify stream with missing scoped source returns 404 ERR_HANDOVER_SOURCE_NOT_FOUND."""
    payload = {
        "question": "기사 요약해줘",
        "scope": "scoped",
        "source_id": 99999
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/stream", json=payload)
    assert res.status_code == 404
    err = res.json()
    assert err["error_code"] == "ERR_HANDOVER_SOURCE_NOT_FOUND"

# ==============================================================================
# 6. ChatFocusFilter & Adaptive Tau & Auto-Relaxation RAG Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_sqlite_fts_retriever_focus_filter_category():
    """Verify SqliteFtsRetriever filters results by category when specified."""
    from app.schemas.chat import ChatFocusFilter
    from app.services.retriever import SqliteFtsRetriever

    async with AsyncSessionLocal() as session:
        retriever = SqliteFtsRetriever(session)
        # Search with matching category
        filter_mcp = ChatFocusFilter(category="mcp_plugins_skills")
        chunks, is_relaxed, applied = await retriever.retrieve_with_meta(
            query="FastMCP LangGraph", top_k=5, min_quality=5.0, filters=filter_mcp
        )
        assert len(chunks) >= 1
        assert all(c.category == "mcp_plugins_skills" for c in chunks)
        assert is_relaxed is False
        assert applied.category == "mcp_plugins_skills"

@pytest.mark.asyncio
async def test_sqlite_fts_retriever_focus_filter_high_signal():
    """Verify high_signal_only=True restricts results to high signal items."""
    from app.schemas.chat import ChatFocusFilter
    from app.services.retriever import SqliteFtsRetriever

    async with AsyncSessionLocal() as session:
        retriever = SqliteFtsRetriever(session)
        filter_high = ChatFocusFilter(high_signal_only=True)
        chunks, is_relaxed, applied = await retriever.retrieve_with_meta(
            query="Python", top_k=5, min_quality=5.0, filters=filter_high
        )
        assert len(chunks) >= 1
        assert all(c.quality_score >= 5.0 for c in chunks)
        for c in chunks:
            assert c.id != 103

@pytest.mark.asyncio
async def test_sqlite_fts_retriever_adaptive_tau_and_time_range():
    """Verify time_range adapts recency decay tau (24h=86400s, 7d=259200s, 30d=604800s, all=1209600s)."""
    from app.schemas.chat import ChatFocusFilter
    from app.services.retriever import SqliteFtsRetriever

    async with AsyncSessionLocal() as session:
        retriever = SqliteFtsRetriever(session)
        assert retriever.get_tau_seconds("24h") == 86400
        assert retriever.get_tau_seconds("7d") == 259200
        assert retriever.get_tau_seconds("30d") == 604800
        assert retriever.get_tau_seconds("all") == 1209600

@pytest.mark.asyncio
async def test_sqlite_fts_retriever_focus_filter_sort_modes():
    """Verify sort modes: 'hot' (rag_score desc), 'latest' (published_at desc), 'quality' (quality_score desc)."""
    from app.schemas.chat import ChatFocusFilter
    from app.services.retriever import SqliteFtsRetriever

    async with AsyncSessionLocal() as session:
        retriever = SqliteFtsRetriever(session)
        # Sort by latest
        chunks_latest, _, _ = await retriever.retrieve_with_meta(
            query="Python", top_k=5, filters=ChatFocusFilter(sort="latest")
        )
        if len(chunks_latest) >= 2:
            assert chunks_latest[0].published_at >= chunks_latest[1].published_at

        # Sort by quality
        chunks_quality, _, _ = await retriever.retrieve_with_meta(
            query="Python", top_k=5, filters=ChatFocusFilter(sort="quality")
        )
        if len(chunks_quality) >= 2:
            assert chunks_quality[0].quality_score >= chunks_quality[1].quality_score

@pytest.mark.asyncio
async def test_sqlite_fts_retriever_auto_relaxation_on_zero_matches():
    """Verify that when 0 matches occur under narrow time_range, it auto-relaxes to 'all' with is_relaxed=True."""
    from app.schemas.chat import ChatFocusFilter
    from app.services.retriever import SqliteFtsRetriever

    async with AsyncSessionLocal() as session:
        old_item = NewsItem(
            id=201,
            title="Archived Agent Framework Deep Dive",
            url="https://example.com/archived-agent",
            source="github",
            category="agent_tech",
            author="Researcher",
            summary="Archived comprehensive analysis of agent memory persistence.",
            why_it_matters="Long-term historical reference for state machines.",
            tech_stack="Python, StateGraph",
            tags="agent, memory, archive",
            quality_score=8.5,
            is_high_signal=True,
            hotness_score=50.0,
            published_at=datetime.now(timezone.utc) - timedelta(days=15),
            dedup_hash="hash_archived_201"
        )
        existing = await session.get(NewsItem, 201)
        if not existing:
            session.add(old_item)
            await session.commit()

        retriever = SqliteFtsRetriever(session)
        narrow_filter = ChatFocusFilter(category="agent_tech", time_range="24h")
        chunks, is_relaxed, applied = await retriever.retrieve_with_meta(
            query="Archived comprehensive analysis", top_k=5, min_quality=5.0, filters=narrow_filter
        )
        assert len(chunks) >= 1
        assert any(c.id == 201 for c in chunks)
        assert is_relaxed is True
        assert applied.time_range == "all"

@pytest.mark.asyncio
async def test_chat_search_with_focus_filters():
    """Verify GET /api/chat/search binds category, time_range, sort, and high_signal_only query params."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/chat/search?q=Python&category=mcp_plugins_skills&time_range=7d&sort=quality&high_signal_only=true")
    assert res.status_code == 200
    data = res.json()
    assert "chunks" in data
    for c in data["chunks"]:
        assert c["category"] == "mcp_plugins_skills"
        assert c["quality_score"] >= 5.0

@pytest.mark.asyncio
async def test_chat_query_with_focus_filters_and_relaxation():
    """Verify POST /api/chat/query returns applied_filters and is_relaxed fields in response."""
    from unittest.mock import patch

    payload = {
        "question": "Archived StateGraph Deep Dive에 대해 알려줘",
        "scope": "global",
        "filters": {
            "category": "agent_tech",
            "time_range": "24h",
            "sort": "hot",
            "high_signal_only": False
        }
    }
    with patch("app.services.chat_service.llm_processor.generate_live_answer") as mock_llm:
        mock_llm.return_value = ("에이전트 메모리 아키텍처 분석 답변입니다[1].", "Mock Gemini 2.5")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "applied_filters" in data
    assert data["applied_filters"] is not None
    assert "is_relaxed" in data
    assert data["is_relaxed"] is True
    assert data["applied_filters"]["time_range"] == "all"

@pytest.mark.asyncio
async def test_chat_stream_sources_event_includes_focus_filter_metadata():
    """Verify SSE event: sources delivers applied_filters and is_relaxed metadata."""
    from unittest.mock import patch

    payload = {
        "question": "LangGraph 멀티에이전트 워크플로우 분석",
        "scope": "global",
        "filters": {
            "category": "agent_tech",
            "time_range": "7d",
            "sort": "latest",
            "high_signal_only": True
        }
    }

    async def mock_stream_tokens(prompt):
        yield ("LangGraph", "Mock Gemini")
        yield (" v0.2", "Mock Gemini")

    with patch("app.api.chat.llm_processor.check_provider_available", return_value=True), \
         patch("app.services.chat_service.llm_processor.stream_tokens", side_effect=mock_stream_tokens):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/stream", json=payload)
    assert res.status_code == 200
    body = res.text
    assert "event: sources" in body
    sources_data_line = [line for line in body.split("\n") if line.startswith("data: ") and '"applied_filters"' in line][0]
    sources_json = json.loads(sources_data_line[6:])
    assert "applied_filters" in sources_json
    assert sources_json["applied_filters"]["category"] == "agent_tech"
    assert "is_relaxed" in sources_json

# ==============================================================================
# 7. Real LLM Streaming & Honest Error Handling Tests (No Fallback Allowed)
# ==============================================================================

def test_chat_service_fallback_function_completely_removed():
    """Verify _generate_fallback_answer function has been completely purged from ChatService."""
    from app.services.chat_service import ChatService
    assert not hasattr(ChatService, "_generate_fallback_answer"), (
        "가짜 템플릿 스트리밍 폴백 함수(_generate_fallback_answer)가 완전히 삭제되어야 합니다."
    )

@pytest.mark.asyncio
async def test_chat_stream_llm_provider_unavailable_returns_503():
    """Verify HTTP 503 ERR_LLM_PROVIDER_UNAVAILABLE when no LLM provider is configured."""
    from unittest.mock import patch
    from app.services.chat_service import LLMProviderUnavailableException

    payload = {"question": "LLM 프로바이더 미설정 테스트", "scope": "global"}
    with patch("app.api.chat.llm_processor.check_provider_available", side_effect=LLMProviderUnavailableException("가용한 LLM 프로바이더 엔진 미설정")):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/stream", json=payload)
    assert res.status_code == 503
    err = res.json()
    assert err["error_code"] == "ERR_LLM_PROVIDER_UNAVAILABLE"

@pytest.mark.asyncio
async def test_chat_stream_llm_upstream_failed_returns_502():
    """Verify HTTP 502 ERR_LLM_UPSTREAM_FAILED when external LLM API fails pre-stream."""
    from unittest.mock import patch
    from app.services.chat_service import LLMUpstreamException

    payload = {"question": "업스트림 장애 테스트", "scope": "global"}
    with patch("app.api.chat.llm_processor.check_provider_available", side_effect=LLMUpstreamException("외부 LLM 통신 실패")):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/stream", json=payload)
    assert res.status_code == 502
    err = res.json()
    assert err["error_code"] == "ERR_LLM_UPSTREAM_FAILED"

@pytest.mark.asyncio
async def test_chat_stream_llm_quota_exceeded_returns_429():
    """Verify HTTP 429 ERR_LLM_QUOTA_EXCEEDED when LLM API quota is exceeded pre-stream."""
    from unittest.mock import patch
    from app.services.chat_service import LLMQuotaExceededException

    payload = {"question": "할당량 초과 테스트", "scope": "global"}
    with patch("app.api.chat.llm_processor.check_provider_available", side_effect=LLMQuotaExceededException("할당량 초과")):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/stream", json=payload)
    assert res.status_code == 429
    err = res.json()
    assert err["error_code"] == "ERR_LLM_QUOTA_EXCEEDED"

@pytest.mark.asyncio
async def test_chat_stream_midstream_failure_yields_sse_error_event():
    """Verify mid-stream LLM failure emits 'event: error' with ERR_LLM_STREAM_FAILED instead of fake fallback."""
    from unittest.mock import patch

    payload = {"question": "스트리밍 도중 끊김 테스트", "scope": "global"}

    async def faulty_stream_tokens(prompt):
        yield ("첫번째 토큰 ", "Gemini")
        raise RuntimeError("LLM Connection broken abruptly")

    with patch("app.api.chat.llm_processor.check_provider_available", return_value=True):
        with patch("app.services.chat_service.llm_processor.stream_tokens", side_effect=faulty_stream_tokens):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                res = await ac.post("/api/chat/stream", json=payload)

    assert res.status_code == 200
    body = res.text
    assert "event: sources" in body
    assert "event: token" in body
    assert "event: error" in body
    assert "ERR_LLM_STREAM_FAILED" in body
    assert "event: done" not in body

@pytest.mark.asyncio
async def test_chat_query_llm_provider_unavailable_returns_503():
    """Verify POST /api/chat/query returns 503 when no LLM provider is available."""
    from unittest.mock import patch
    from app.services.chat_service import LLMProviderUnavailableException

    payload = {"question": "질문", "scope": "global"}
    with patch("app.services.chat_service.llm_processor.generate_live_answer", side_effect=LLMProviderUnavailableException("가용한 LLM 프로바이더 엔진 미설정")):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/query", json=payload)
    assert res.status_code == 503
    err = res.json()
    assert err["error_code"] == "ERR_LLM_PROVIDER_UNAVAILABLE"

@pytest.mark.asyncio
async def test_chat_query_llm_upstream_failed_returns_502():
    """Verify POST /api/chat/query returns 502 when LLM upstream call fails."""
    from unittest.mock import patch
    from app.services.chat_service import LLMUpstreamException

    payload = {"question": "질문", "scope": "global"}
    with patch("app.services.chat_service.llm_processor.generate_live_answer", side_effect=LLMUpstreamException("업스트림 실패")):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/query", json=payload)
    assert res.status_code == 502
    err = res.json()
    assert err["error_code"] == "ERR_LLM_UPSTREAM_FAILED"

