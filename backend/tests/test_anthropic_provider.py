import json
import uuid
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import Response, Request, ASGITransport, AsyncClient

from app.main import app
from app.config import settings
from app.database import AsyncSessionLocal
from app.models.chat_session import ChatSessionModel, ChatMessageModel
from app.services.chat_session_service import ChatSessionService
from app.schemas.chat import (
    ModelTier,
    ChatModel,
    TokenUsageMeta,
    ChatStreamRequest,
    ChatQueryRequest,
    ChatQueryResponse,
    DonePayload,
    ChatMessageItem,
    ChatSourceItem,
)
from app.services.llm_processor import llm_processor


@pytest.mark.asyncio
async def test_anthropic_provider_interface_and_model_resolution():
    """Verify AnthropicLLMProvider implements BaseLLMProvider and resolves 3-tier models."""
    from app.services.llm_providers.anthropic_provider import (
        AnthropicLLMProvider,
        resolve_model_and_tier,
    )
    from app.services.llm_providers.base import BaseLLMProvider

    provider = AnthropicLLMProvider(api_key="sk-ant-test-key")
    assert isinstance(provider, BaseLLMProvider)
    assert provider.provider_name == "anthropic"
    assert provider.is_available() is True

    # Provider without key
    empty_provider = AnthropicLLMProvider(api_key="")
    assert empty_provider.is_available() is False

    # 3-tier model resolution
    # Haiku
    m_id, tier = resolve_model_and_tier("haiku")
    assert m_id == "claude-haiku-5-5"
    assert tier == "haiku"

    m_id, tier = resolve_model_and_tier("claude-haiku-5-5")
    assert m_id == "claude-haiku-5-5"
    assert tier == "haiku"

    # Sonnet (default)
    m_id, tier = resolve_model_and_tier("sonnet")
    assert m_id == "claude-sonnet-5-5"
    assert tier == "sonnet"

    m_id, tier = resolve_model_and_tier("claude-sonnet-5-5")
    assert m_id == "claude-sonnet-5-5"
    assert tier == "sonnet"

    m_id, tier = resolve_model_and_tier(None)
    assert m_id == "claude-sonnet-5-5"
    assert tier == "sonnet"

    # Opus
    m_id, tier = resolve_model_and_tier("opus")
    assert m_id == "claude-opus-5-5"
    assert tier == "opus"

    m_id, tier = resolve_model_and_tier("claude-opus-5-5")
    assert m_id == "claude-opus-5-5"
    assert tier == "opus"


@pytest.mark.asyncio
async def test_anthropic_generate_text_mocked_http():
    """Verify generate_text calls Anthropic REST API with expected headers and extracts usage."""
    from app.services.llm_providers.anthropic_provider import AnthropicLLMProvider

    provider = AnthropicLLMProvider(api_key="sk-ant-test-12345")

    mock_resp_data = {
        "id": "msg_01XyZ",
        "type": "message",
        "role": "assistant",
        "content": [{"type": "text", "text": "Anthropic Claude generated answer."}],
        "model": "claude-sonnet-5-5",
        "stop_reason": "end_turn",
        "usage": {
            "input_tokens": 1500,
            "output_tokens": 250,
            "cache_read_input_tokens": 1200,
            "cache_creation_input_tokens": 300,
        },
    }

    mock_response = Response(
        status_code=200,
        json=mock_resp_data,
        request=Request("POST", "https://api.anthropic.com/v1/messages"),
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        text, model, usage = await provider.generate_text_with_usage(
            prompt="Hello Claude",
            model="claude-sonnet-5-5",
        )

        assert text == "Anthropic Claude generated answer."
        assert "sonnet" in model
        assert usage["input_tokens"] == 1500
        assert usage["output_tokens"] == 250
        assert usage["cache_read_input_tokens"] == 1200
        assert usage["cache_creation_input_tokens"] == 300

        # Verify headers sent
        call_kwargs = mock_post.call_args[1]
        headers = call_kwargs["headers"]
        assert headers["x-api-key"] == "sk-ant-test-12345"
        assert headers["anthropic-version"] == "2023-06-01"
        assert "prompt-caching-2024-07-31" in headers["anthropic-beta"]


@pytest.mark.asyncio
async def test_anthropic_stream_chat_mocked_sse():
    """Verify stream_chat parses SSE delta events and yields text tokens."""
    from app.services.llm_providers.anthropic_provider import AnthropicLLMProvider

    provider = AnthropicLLMProvider(api_key="sk-ant-stream-key")

    sse_lines = [
        b'event: message_start\r\n',
        b'data: {"type": "message_start", "message": {"id": "msg_1", "role": "assistant", "model": "claude-haiku-5-5", "usage": {"input_tokens": 50, "output_tokens": 1}}}\r\n\r\n',
        b'event: content_block_delta\r\n',
        b'data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Rapid "}}\r\n\r\n',
        b'event: content_block_delta\r\n',
        b'data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Haiku "}}\r\n\r\n',
        b'event: content_block_delta\r\n',
        b'data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "response."}}\r\n\r\n',
        b'event: message_delta\r\n',
        b'data: {"type": "message_delta", "delta": {"stop_reason": "end_turn"}, "usage": {"output_tokens": 15}}\r\n\r\n',
        b'event: message_stop\r\n',
        b'data: {"type": "message_stop"}\r\n\r\n',
    ]

    class MockStreamResponse:
        status_code = 200

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def aiter_lines(self):
            for l in sse_lines:
                decoded = l.decode("utf-8").strip()
                if decoded:
                    yield decoded

    with patch("httpx.AsyncClient.stream", return_value=MockStreamResponse()):
        tokens = []
        models = []
        async for chunk, m in provider.stream_chat(prompt="Test", model="claude-haiku-5-5"):
            tokens.append(chunk)
            models.append(m)

        assert "".join(tokens) == "Rapid Haiku response."
        assert len(models) == 3
        assert "haiku" in models[0]


@pytest.mark.asyncio
async def test_anthropic_prompt_caching_ephemeral_structure():
    """Verify build_cached_system_block creates ephemeral cache_control per ADR-011."""
    from app.services.llm_providers.anthropic_provider import AnthropicLLMProvider

    provider = AnthropicLLMProvider(api_key="sk-test")
    block = provider.build_cached_system_block("System instruction >= 2500 tokens")
    assert len(block) == 1
    assert block[0]["type"] == "text"
    assert block[0]["cache_control"] == {"type": "ephemeral"}


@pytest.mark.asyncio
async def test_anthropic_generate_structured_summary_with_caching():
    """Verify generate_structured_summary invokes Sonnet 5.5 and extracts JSON metadata."""
    from app.services.llm_providers.anthropic_provider import AnthropicLLMProvider

    provider = AnthropicLLMProvider(api_key="sk-ant-sonnet-key")

    mock_resp_data = {
        "id": "msg_sonnet_01",
        "type": "message",
        "role": "assistant",
        "content": [{
            "type": "text",
            "text": json.dumps({
                "is_relevant_to_ai_agent": True,
                "category": "harness",
                "relevance_score": 9.2,
                "quality_score": 8.5,
                "is_worthwhile": True,
                "is_high_signal": True,
                "rejection_reason": None,
                "why_it_matters": "SWE-bench 2.0 벤치마크 규격을 통해 자율 코딩 에이전트의 회귀 테스트 신뢰도를 극대화합니다.",
                "tldr_bullets": ["평가 하네스 표준화", "도커 샌드박스 지원", "회귀 검증 체계"],
                "tech_stack": ["SWE-bench", "Docker", "Python"],
            }),
        }],
        "model": "claude-sonnet-5-5",
        "usage": {
            "input_tokens": 2800,
            "output_tokens": 180,
            "cache_read_input_tokens": 2500,
            "cache_creation_input_tokens": 0,
        },
    }

    mock_response = Response(
        status_code=200,
        json=mock_resp_data,
        request=Request("POST", "https://api.anthropic.com/v1/messages"),
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        result = await provider.generate_structured_summary(
            title="SWE-bench 2.0 Released",
            summary="Next-gen evaluation harness for coding agents",
            source="github",
            full_content="Full benchmark paper content here...",
        )

        assert result["is_relevant_to_ai_agent"] is True
        assert result["category"] == "harness"
        assert result["quality_score"] == 8.5
        assert result["is_high_signal"] is True
        assert result["usage"]["cache_read_input_tokens"] == 2500


@pytest.mark.asyncio
async def test_anthropic_error_mapping():
    """Verify HTTP 401, 429, 529 map to specialized Anthropic exceptions."""
    from app.services.llm_providers.anthropic_provider import (
        AnthropicLLMProvider,
        AnthropicKeyMissingException,
        AnthropicQuotaExceededException,
        AnthropicOverloadedException,
    )

    provider = AnthropicLLMProvider(api_key="sk-ant-test")

    # 401
    resp_401 = Response(
        status_code=401,
        content=b'{"error": {"type": "authentication_error", "message": "invalid api key"}}',
        request=Request("POST", "https://api.anthropic.com/v1/messages"),
    )
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=resp_401):
        with pytest.raises(AnthropicKeyMissingException):
            await provider.generate_text("Prompt")

    # 429
    resp_429 = Response(
        status_code=429,
        content=b'{"error": {"type": "rate_limit_error", "message": "quota exceeded"}}',
        request=Request("POST", "https://api.anthropic.com/v1/messages"),
    )
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=resp_429):
        with pytest.raises(AnthropicQuotaExceededException):
            await provider.generate_text("Prompt")

    # 529
    resp_529 = Response(
        status_code=529,
        content=b'{"error": {"type": "overloaded_error", "message": "server is overloaded"}}',
        request=Request("POST", "https://api.anthropic.com/v1/messages"),
    )
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=resp_529):
        with pytest.raises(AnthropicOverloadedException):
            await provider.generate_text("Prompt")


@pytest.mark.asyncio
async def test_llm_processor_anthropic_priority_and_routing():
    """Verify LLMProcessor prioritizes Anthropic provider when key is available."""
    mock_provider = MagicMock()
    mock_provider.is_available.return_value = True

    async def mock_gen(prompt, **kwargs):
        return "Anthropic Response", "claude-haiku-5-5", {"input_tokens": 100, "output_tokens": 50}

    mock_provider.generate_text_with_usage = AsyncMock(side_effect=mock_gen)

    with patch.object(llm_processor, "anthropic_provider", mock_provider):
        assert llm_processor.has_live_provider() is True
        ans, model = await llm_processor.generate_live_answer("Test question", model="haiku")
        assert ans == "Anthropic Response"
        assert "haiku" in model


@pytest.mark.asyncio
async def test_chat_stream_3tier_model_routing():
    """Verify POST /api/chat/stream accepts model and model_tier and emits done event with usage."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        req_body = {
            "question": "3-Tier Multi-Model routing test",
            "scope": "global",
            "model": "claude-haiku-5-5",
            "model_tier": "haiku",
        }
        res = await ac.post("/api/chat/stream", json=req_body)
        assert res.status_code == 200

        lines = res.text.split("\n")
        done_events = [line for line in lines if line.startswith("data: ") and '"done": true' in line.lower()]
        assert len(done_events) >= 1
        done_data = json.loads(done_events[0].replace("data: ", ""))
        assert "model_tier" in done_data
        assert done_data["model_tier"] == "haiku"
        assert "usage" in done_data


@pytest.mark.asyncio
async def test_chat_query_3tier_model_routing():
    """Verify POST /api/chat/query returns model, model_tier, and usage meta."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        req_body = {
            "question": "3-Tier query routing test",
            "scope": "global",
            "model": "claude-opus-5-5",
            "model_tier": "opus",
        }
        res = await ac.post("/api/chat/query", json=req_body)
        assert res.status_code == 200
        data = res.json()
        assert data["model_tier"] == "opus"
        assert "opus" in data["model"]
        assert "usage" in data


@pytest.mark.asyncio
async def test_chat_session_persistence_with_model_tier_and_usage():
    """Verify ChatSessionService persists model_tier and usage in SQLite and rehydrates properly."""
    session_id = str(uuid.uuid4())
    async with AsyncSessionLocal() as db_session:
        service = ChatSessionService(db_session)
        user_msg, assistant_msg = await service.persist_turn(
            session_id=session_id,
            user_content="멀티모델 영속화 테스트",
            assistant_content="Opus 5.5로 생성된 답변입니다.",
            model="claude-opus-5-5",
            model_tier="opus",
            usage={
                "input_tokens": 1200,
                "output_tokens": 340,
                "cache_read_input_tokens": 900,
                "cache_creation_input_tokens": 100,
            },
            latency_ms=1250,
        )

        assert assistant_msg.model_tier == "opus"
        assert assistant_msg.model == "claude-opus-5-5"

        # Hydrate via get_session_detail
        detail = await service.get_session_detail(session_id)
        assert len(detail.messages) == 2
        asst = detail.messages[1]
        assert asst.model_tier == "opus"
        assert asst.usage is not None
        assert asst.usage.input_tokens == 1200
        assert asst.usage.cache_read_input_tokens == 900

        # Clean up session
        await service.delete_session(session_id)


# ==============================================================================
# Anti-Gemini Isolation & Model Sanitization Tests (POL-LLM-005, REQ-LLM-002, ADR-012)
# ==============================================================================

@pytest.mark.asyncio
async def test_anti_gemini_has_live_provider_ignores_gemini_key():
    """POL-LLM-005: has_live_provider must return False if only GEMINI_API_KEY is configured."""
    with patch.object(settings, "ANTHROPIC_API_KEY", ""), \
         patch.object(settings, "OPENAI_API_KEY", ""), \
         patch.object(settings, "OLLAMA_BASE_URL", ""), \
         patch.object(settings, "GEMINI_API_KEY", "fake_gemini_key_12345"), \
         patch.dict("os.environ", {
             "GEMINI_API_KEY": "fake_gemini_key_12345",
             "ANTHROPIC_API_KEY": "",
             "OPENAI_API_KEY": "",
             "OLLAMA_BASE_URL": "",
         }, clear=False), \
         patch.object(llm_processor, "openai_key", ""), \
         patch.object(llm_processor, "ollama_url", ""), \
         patch("app.services.llm_processor.load_json_config", return_value={"llm": {"gemini_api_key": "fake_key"}}):
        # Anthropic provider explicitly unavailable
        with patch.object(llm_processor.anthropic_provider, "is_available", return_value=False):
            assert llm_processor.has_live_provider() is False


def test_anti_gemini_model_sanitization():
    """POL-LLM-005: sanitize_model_identifier converts any live Gemini model string to claude-sonnet-5-5."""
    from app.services.llm_processor import sanitize_model_identifier

    # Live Gemini model names must be sanitized to claude-sonnet-5-5
    assert sanitize_model_identifier("Google gemini-2.0-flash") == "claude-sonnet-5-5"
    assert sanitize_model_identifier("Google gemini-3.5-flash-lite") == "claude-sonnet-5-5"
    assert sanitize_model_identifier("gemini-3.5-flash") == "claude-sonnet-5-5"
    assert sanitize_model_identifier("Google Gemini 1.5 Pro") == "claude-sonnet-5-5"
    assert sanitize_model_identifier("gemini-2.5-flash") == "claude-sonnet-5-5"

    # Valid Claude models remain intact
    assert sanitize_model_identifier("claude-sonnet-5-5") == "claude-sonnet-5-5"
    assert sanitize_model_identifier("claude-haiku-5-5") == "claude-haiku-5-5"
    assert sanitize_model_identifier("claude-opus-5-5") == "claude-opus-5-5"

    # Test mocks are preserved
    assert sanitize_model_identifier("Mock Gemini") == "Mock Gemini"
    assert sanitize_model_identifier("MockLLMProvider") == "MockLLMProvider"


def test_anthropic_config_and_schema_defaults():
    """Verify settings defaults and chat schema defaults use claude-sonnet-5-5."""
    from app.services.llm_providers.anthropic_provider import DEFAULT_MODEL
    from app.schemas.chat import ChatStreamRequest, ChatQueryRequest, DonePayload, ChatQueryResponse
    from app.config import settings

    assert DEFAULT_MODEL == "claude-sonnet-5-5"
    assert settings.ANTHROPIC_COLLECTION_MODEL == "claude-sonnet-5-5"
    assert settings.ANTHROPIC_DEFAULT_CHAT_MODEL == "claude-sonnet-5-5"

    stream_req = ChatStreamRequest(question="test")
    assert stream_req.model == "claude-sonnet-5-5"

    query_req = ChatQueryRequest(question="test")
    assert query_req.model == "claude-sonnet-5-5"

    done = DonePayload(session_id="test", sources_count=0, latency_ms=10)
    assert done.model == "claude-sonnet-5-5"

    query_res = ChatQueryResponse(answer="ok", sources=[], session_id="s1", scope="global", latency_ms=10)
    assert query_res.model == "claude-sonnet-5-5"


@pytest.mark.asyncio
async def test_anti_gemini_isolation_in_generate_live_answer():
    """POL-LLM-005 & ADR-012: generate_live_answer must never invoke Gemini even if key exists."""
    with patch.object(settings, "ANTHROPIC_API_KEY", ""), \
         patch.object(settings, "OPENAI_API_KEY", ""), \
         patch.object(settings, "OLLAMA_BASE_URL", ""), \
         patch.object(settings, "GEMINI_API_KEY", "fake_gemini_key_12345"), \
         patch.object(settings, "ALLOW_MOCK_FALLBACK", True), \
         patch.object(settings, "TESTING", True), \
         patch.object(llm_processor.anthropic_provider, "is_available", return_value=False), \
         patch.object(llm_processor, "_call_gemini", new_callable=AsyncMock) as mock_gemini:
        
        ans, model_name = await llm_processor.generate_live_answer("Test query")
        # _call_gemini MUST NEVER BE CALLED
        assert mock_gemini.call_count == 0
        # Model returned must never be Gemini
        assert "gemini" not in model_name.lower() or "mock" in model_name.lower()
        assert not model_name.startswith("Google ")


@pytest.mark.asyncio
async def test_anti_gemini_isolation_in_stream_tokens():
    """POL-LLM-005 & ADR-012: stream_tokens must never invoke Gemini SDK streaming."""
    with patch.object(settings, "ANTHROPIC_API_KEY", ""), \
         patch.object(settings, "OPENAI_API_KEY", ""), \
         patch.object(settings, "OLLAMA_BASE_URL", ""), \
         patch.object(settings, "GEMINI_API_KEY", "fake_gemini_key_12345"), \
         patch.object(settings, "ALLOW_MOCK_FALLBACK", True), \
         patch.object(settings, "TESTING", True), \
         patch.object(llm_processor.anthropic_provider, "is_available", return_value=False):
        
        chunks = []
        models = []
        async for chunk, m_name in llm_processor.stream_tokens("Test prompt"):
            chunks.append(chunk)
            models.append(m_name)
        
        assert len(chunks) > 0
        for m in models:
            assert not m.startswith("Google ")
            assert "gemini" not in m.lower() or "mock" in m.lower()


@pytest.mark.asyncio
async def test_anti_gemini_stream_question_answer_never_yields_gemini():
    """POL-LLM-005: stream_question_answer must never emit Google Gemini meta event or model."""
    with patch.object(settings, "ANTHROPIC_API_KEY", ""), \
         patch.object(settings, "OPENAI_API_KEY", ""), \
         patch.object(settings, "OLLAMA_BASE_URL", ""), \
         patch.object(settings, "GEMINI_API_KEY", "fake_gemini_key_12345"), \
         patch.dict("os.environ", {"GEMINI_API_KEY": "fake_gemini_key_12345"}, clear=False), \
         patch.object(llm_processor.anthropic_provider, "is_available", return_value=False):
        
        events = []
        async for evt in llm_processor.stream_question_answer(
            item_title="SWE-bench Docker Sandbox Isolation Release",
            item_summary="새로운 격리 샌드박스를 통해 에이전트 평가 안전성을 강화했습니다.",
            category="harness",
            tech_stack=["SWE-bench", "Docker Sandbox"],
            question="우리 프로젝트에 어떻게 적용할 수 있어?"
        ):
            events.append(evt)
        
        meta_events = [e for e in events if e.get("event") == "meta"]
        for m in meta_events:
            assert not m.get("model", "").startswith("Google ")
            assert "gemini" not in m.get("model", "").lower()


