import pytest
from app.services.llm_processor import llm_processor
from app.services.briefing_service import briefing_service

def test_extract_tech_stack():
    text = "Evaluating Claude 3.7 and DeepSeek-R1 on SWE-bench with LangGraph and FastMCP tools."
    stack = llm_processor.extract_tech_stack(text)
    assert "Claude 3.7" in stack
    assert "DeepSeek-R1" in stack
    assert "SWE-bench" in stack
    assert "LangGraph" in stack
    assert "FastMCP" in stack

def test_evaluate_quality_and_signal():
    high_text = "SWE-bench Verified benchmark regression test harness for AI coding agents."
    res_high = llm_processor.evaluate_quality_and_signal("SWE-bench 2.0", high_text, "github")
    assert res_high["quality_score"] >= 7.0
    assert res_high["is_worthwhile"] is True

    spam_text = "Get 50% discount sale coupon for crypto tokens now!"
    res_spam = llm_processor.evaluate_quality_and_signal("Sale", spam_text, "web")
    assert res_spam["quality_score"] < 5.0
    assert res_spam["is_worthwhile"] is False

def test_generate_synthesis():
    title = "Anthropic Releases Model Context Protocol (MCP) Server"
    summary = "An open standard connecting agents to external databases and tool calling APIs."
    synth = llm_processor.generate_synthesis(title, summary, "mcp_plugins_skills")
    assert len(synth["tldr_bullets"]) >= 2
    assert "why_it_matters" in synth
    assert "Model Context Protocol" in synth["tech_stack"]

@pytest.mark.asyncio
async def test_answer_question():
    ans = await llm_processor.answer_question(
        item_title="SWE-bench Evaluation Harness",
        item_summary="Benchmark for software engineering agents in Docker sandboxes.",
        category="harness",
        tech_stack=["SWE-bench", "Docker Sandbox"],
        question="이걸 어떻게 우리 프로젝트에 적용할 수 있나요?"
    )
    assert isinstance(ans, str)
    assert len(ans) > 20

# ==============================================================================
# ADR-008: Pluggable LLM Providers & Mock Fallback Chain (Zero 503 Guarantee)
# ==============================================================================

def test_base_llm_provider_interface():
    """Verify BaseLLMProvider abstract interface defines required methods."""
    from app.services.llm_providers.base import BaseLLMProvider
    import inspect

    assert inspect.isabstract(BaseLLMProvider)
    # Check abstract methods
    abstract_methods = BaseLLMProvider.__abstractmethods__
    assert "provider_name" in abstract_methods
    assert "is_available" in abstract_methods
    assert "generate_text" in abstract_methods
    assert "stream_chat" in abstract_methods

@pytest.mark.asyncio
async def test_mock_llm_provider_structure_and_tokens():
    """Verify MockLLMProvider emits 4-section structured engineering report tokens."""
    from app.services.llm_providers.mock_provider import MockLLMProvider

    provider = MockLLMProvider()
    assert provider.provider_name == "mock"
    assert provider.is_available() is True

    # Test complete text generation
    text, model = await provider.generate_text("Prompt test")
    assert "Mock" in model
    assert "## 1. 핵심 아키텍처" in text
    assert "## 2. 주요 기능 및 코드 구현" in text
    assert "## 3. 기존 기술 대비 차별점" in text
    assert "## 4. 실무 도입 시 고려사항" in text

    # Test streaming
    tokens = []
    async for chunk, m in provider.stream_chat("Prompt test"):
        tokens.append(chunk)
        assert "Mock" in m
    full_streamed = "".join(tokens)
    assert "## 1. 핵심 아키텍처" in full_streamed
    assert "## 4. 실무 도입 시 고려사항" in full_streamed

def test_check_provider_available_testing_and_fallback_modes():
    """Verify check_provider_available honors TESTING and ALLOW_MOCK_FALLBACK (Zero 503)."""
    from unittest.mock import patch
    from app.services.llm_processor import LLMProviderUnavailableException

    # When testing flag is True -> Should always return True (Zero 503)
    with patch.object(llm_processor, "has_live_provider", return_value=False), \
         patch.object(llm_processor, "is_test_environment", return_value=True):
        assert llm_processor.check_provider_available() is True

    # When not testing, but ALLOW_MOCK_FALLBACK=True -> Should return True
    with patch.object(llm_processor, "has_live_provider", return_value=False), \
         patch.object(llm_processor, "is_test_environment", return_value=False), \
         patch.object(llm_processor, "is_mock_fallback_allowed", return_value=True):
        assert llm_processor.check_provider_available() is True

    # When not testing and ALLOW_MOCK_FALLBACK=False -> Must fail-fast with 503 in strict production
    with patch.object(llm_processor, "has_live_provider", return_value=False), \
         patch.object(llm_processor, "is_test_environment", return_value=False), \
         patch.object(llm_processor, "is_mock_fallback_allowed", return_value=False):
        with pytest.raises(LLMProviderUnavailableException):
            llm_processor.check_provider_available()

@pytest.mark.asyncio
async def test_generate_live_answer_mock_fallback():
    """Verify generate_live_answer safely falls back to MockLLMProvider when live keys absent."""
    from unittest.mock import patch

    with patch.object(llm_processor, "has_live_provider", return_value=False), \
         patch.object(llm_processor, "is_mock_fallback_allowed", return_value=True):
        ans, model = await llm_processor.generate_live_answer("자율 에이전트 아키텍처 분석")
        assert "Mock" in model
        assert "## 1. 핵심 아키텍처" in ans
        assert "## 2. 주요 기능 및 코드 구현" in ans

@pytest.mark.asyncio
async def test_stream_tokens_mock_fallback():
    """Verify stream_tokens safely yields mock tokens when live keys absent."""
    from unittest.mock import patch

    with patch.object(llm_processor, "has_live_provider", return_value=False), \
         patch.object(llm_processor, "is_mock_fallback_allowed", return_value=True):
        tokens = []
        async for chunk, model in llm_processor.stream_tokens("에이전트 하네스 분석"):
            tokens.append(chunk)
            assert "Mock" in model
        streamed = "".join(tokens)
        assert len(streamed) > 100
        assert "## 1. 핵심 아키텍처" in streamed

@pytest.mark.asyncio
async def test_chat_stream_zero_503_end_to_end():
    """Verify POST /api/chat/stream completes 200 OK with full SSE events without mocks (Zero 503)."""
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    payload = {
        "question": "Zero 503 검증: 자율 에이전트 하네스 구조 설명",
        "scope": "global"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/stream", json=payload)
    assert res.status_code == 200
    body = res.text
    assert "event: sources" in body
    assert "event: token" in body
    assert "event: done" in body

    # Reassemble streamed tokens from SSE data payloads
    import json
    tokens = []
    for line in body.split("\n"):
        if line.startswith('data: {"token":'):
            tokens.append(json.loads(line[6:])["token"])
    assembled_text = "".join(tokens)
    assert "## 1. 핵심 아키텍처" in assembled_text
    assert "## 4. 실무 도입 시 고려사항" in assembled_text



@pytest.mark.asyncio
async def test_chat_query_zero_503_end_to_end():
    """Verify POST /api/chat/query completes 200 OK without mocks (Zero 503)."""
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    payload = {
        "question": "Zero 503 동기 쿼리 검증: MCP 프로토콜 도구 연동",
        "scope": "global"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert len(data["answer"]) > 50
    assert "## 1. 핵심 아키텍처" in data["answer"]

@pytest.mark.asyncio
async def test_scoped_chat_stream_zero_503_end_to_end():
    """Verify Scoped mode POST /api/chat/stream emits all 4 status events + sources + mock tokens + done."""
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    from app.database import AsyncSessionLocal
    from app.models.news import NewsItem
    from datetime import datetime, timezone

    try:
        async with AsyncSessionLocal() as session:
            existing = await session.get(NewsItem, 999)
            if not existing:
                item = NewsItem(
                    id=999,
                    title="Unique Isolated Scoped Zero 503 Benchmark Report",
                    url="https://example.com/isolated-scoped-benchmark",
                    source="github",
                    category="harness",
                    author="TestHarness",
                    summary="Detailed evaluation of isolated agent benchmark execution.",
                    why_it_matters="Verifies Zero 503 scoped streaming pipeline.",
                    tech_stack="Python, EvalHarness",
                    tags="harness, eval",
                    quality_score=7.0,
                    is_high_signal=True,
                    hotness_score=10.0,
                    published_at=datetime.now(timezone.utc),
                    dedup_hash="hash_isolated_999"
                )
                session.add(item)
                await session.commit()

        payload = {
            "question": "Scoped mode Zero 503 검증: 격리 벤치마크 분석",
            "scope": "scoped",
            "source_id": 999
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/stream", json=payload)
        assert res.status_code == 200
        body = res.text
        assert "event: status" in body
        assert "event: sources" in body
        assert "event: token" in body
        assert "event: done" in body
        assert "MockLLMProvider" in body
    finally:
        async with AsyncSessionLocal() as session:
            to_del = await session.get(NewsItem, 999)
            if to_del:
                await session.delete(to_del)
                await session.commit()



def test_is_mock_fallback_allowed_env_override(monkeypatch):
    """Verify is_mock_fallback_allowed respects ALLOW_MOCK_FALLBACK env var."""
    monkeypatch.setattr(llm_processor, "is_test_environment", lambda: False)

    monkeypatch.setenv("ALLOW_MOCK_FALLBACK", "false")
    assert llm_processor.is_mock_fallback_allowed() is False

    monkeypatch.setenv("ALLOW_MOCK_FALLBACK", "true")
    assert llm_processor.is_mock_fallback_allowed() is True

def test_mock_llm_provider_custom_model_name():
    """Verify MockLLMProvider constructor handles custom model identifier."""
    from app.services.llm_providers.mock_provider import MockLLMProvider

    custom_provider = MockLLMProvider(model_name="Custom-Mock-Agent-v2")
    assert custom_provider.provider_name == "mock"
    assert custom_provider._model_name == "Custom-Mock-Agent-v2"


