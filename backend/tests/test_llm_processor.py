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

from typing import AsyncGenerator, Tuple
from unittest.mock import patch, AsyncMock
from app.services.llm_providers.base import BaseLLMProvider
from app.services.llm_processor import LLMProviderUnavailableException, LLMUpstreamException

class UnitTestingMockLLMProvider(BaseLLMProvider):
    """Unit-test only mock provider implemented with unittest best practices."""
    def __init__(self, model_name: str = "TestMockLLM"):
        self._model_name = model_name

    @property
    def provider_name(self) -> str:
        return "test_mock"

    def is_available(self) -> bool:
        return True

    async def generate_text(self, prompt: str, **kwargs) -> Tuple[str, str]:
        return "## 1. 핵심 아키텍처\nTest unit content.", self._model_name

    async def stream_chat(self, prompt: str, **kwargs) -> AsyncGenerator[Tuple[str, str], None]:
        yield ("## 1. 핵심 아키텍처\nTest stream content.", self._model_name)

@pytest.mark.asyncio
async def test_unit_test_mock_provider():
    """Verify mock providers are strictly used within unit tests."""
    provider = UnitTestingMockLLMProvider()
    assert provider.provider_name == "test_mock"
    text, model = await provider.generate_text("Test")
    assert "핵심 아키텍처" in text
    assert model == "TestMockLLM"

def test_check_provider_available_production_gate():
    """Verify check_provider_available raises 503 when no live provider configured (no fake mock fallback)."""
    with patch.object(llm_processor, "has_live_provider", return_value=False):
        with pytest.raises(LLMProviderUnavailableException):
            llm_processor.check_provider_available()

@pytest.mark.asyncio
async def test_generate_live_answer_fails_fast_without_mock_fallback():
    """Verify generate_live_answer raises LLMUpstreamException when live providers fail (no fake mock report)."""
    with patch.object(llm_processor, "has_live_provider", return_value=True), \
         patch.object(llm_processor.anthropic_provider, "is_available", return_value=False), \
         patch.object(llm_processor, "_call_openai", new_callable=AsyncMock, return_value=(None, None)), \
         patch.object(llm_processor, "_call_ollama", new_callable=AsyncMock, return_value=(None, None)):
        with pytest.raises(LLMUpstreamException):
            await llm_processor.generate_live_answer("Test prompt")

@pytest.mark.asyncio
async def test_stream_tokens_fails_fast_without_mock_fallback():
    """Verify stream_tokens raises LLMUpstreamException when live providers fail (no fake mock report)."""
    with patch.object(llm_processor, "has_live_provider", return_value=True), \
         patch.object(llm_processor.anthropic_provider, "is_available", return_value=False), \
         patch.object(llm_processor, "openai_key", ""), \
         patch.object(llm_processor, "ollama_url", ""):
        with pytest.raises(LLMUpstreamException):
            async for _ in llm_processor.stream_tokens("Test prompt"):
                pass

@pytest.mark.asyncio
async def test_chat_stream_end_to_end_with_mocked_llm():
    """Verify POST /api/chat/stream emits SSE events with mocked live LLM tokens."""
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    async def mock_stream(prompt, **kwargs):
        yield ("## 1. 핵심 아키텍처 및 동작 원리\nFastMCP 아키텍처 분석", "claude-sonnet-5-5")

    with patch.object(llm_processor, "stream_tokens", side_effect=mock_stream):
        payload = {
            "question": "자율 에이전트 하네스 구조 설명",
            "scope": "global"
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/stream", json=payload)
        assert res.status_code == 200
        body = res.text
        assert "event: sources" in body
        assert "event: token" in body
        assert "event: done" in body
        assert "claude-sonnet-5-5" in body

@pytest.mark.asyncio
async def test_chat_query_end_to_end_with_mocked_llm():
    """Verify POST /api/chat/query completes 200 OK with mocked live LLM answer."""
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    async def mock_answer(prompt, **kwargs):
        return "## 1. 핵심 아키텍처\nMCP 프로토콜 분석 보고서", "claude-sonnet-5-5"

    with patch.object(llm_processor, "generate_live_answer", side_effect=mock_answer):
        payload = {
            "question": "MCP 프로토콜 도구 연동",
            "scope": "global"
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/chat/query", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "answer" in data
        assert "## 1. 핵심 아키텍처" in data["answer"]
        assert data["model"] == "claude-sonnet-5-5"

@pytest.mark.asyncio
async def test_scoped_chat_stream_end_to_end_with_mocked_llm():
    """Verify Scoped mode POST /api/chat/stream emits all 4 status events + sources + Claude tokens + done."""
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

        async def mock_scoped_stream(prompt, **kwargs):
            yield ("## 1. 핵심 아키텍처\n소식 기반 분석 내용입니다.", "claude-sonnet-5-5")

        with patch.object(llm_processor, "stream_tokens", side_effect=mock_scoped_stream):
            payload = {
                "question": "격리 벤치마크 분석",
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
            assert "claude-sonnet-5-5" in body
            assert "AgentLens Mock Fallback Engine" not in body
    finally:
        async with AsyncSessionLocal() as session:
            to_del = await session.get(NewsItem, 999)
            if to_del:
                await session.delete(to_del)
                await session.commit()

def test_mock_llm_provider_removed_from_app_services():
    """Verify MockLLMProvider is strictly deleted from production app.services."""
    with pytest.raises(ImportError):
        from app.services.llm_providers.mock_provider import MockLLMProvider


