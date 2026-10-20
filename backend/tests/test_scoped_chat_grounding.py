import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import Response
from app.config import settings
from app.services.llm_providers.anthropic_provider import AnthropicLLMProvider
from app.services.llm_processor import llm_processor, LLMUpstreamException, LLMProviderUnavailableException

def test_version_is_0_2_2():
    """Verify application version is synchronized to 0.3.1 per release mandate."""
    assert settings.VERSION == "0.3.1"


def test_mock_llm_provider_removed_from_production():
    """Verify MockLLMProvider is completely removed from production app.services.llm_providers."""
    with pytest.raises(ImportError):
        from app.services.llm_providers.mock_provider import MockLLMProvider  # type: ignore

def test_anthropic_payload_omits_temperature():
    """Verify Anthropic Claude API request payload omits deprecated temperature parameter."""
    provider = AnthropicLLMProvider(api_key="sk-ant-test-key")
    # Both generate_text_with_usage and stream_chat must not send temperature in payload
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = Response(
            200,
            json={
                "id": "msg_01",
                "type": "message",
                "role": "assistant",
                "content": [{"type": "text", "text": "OK"}],
                "usage": {"input_tokens": 10, "output_tokens": 5}
            }
        )
        import asyncio
        asyncio.run(provider.generate_text_with_usage("Hello", model="claude-sonnet-5-5"))
        call_payload = mock_post.call_args[1]["json"]
        assert "temperature" not in call_payload, "temperature must be omitted to prevent Anthropic 400 error"

@pytest.mark.asyncio
async def test_scoped_chat_prompt_injects_focused_article_and_no_mock_fallback():
    """
    Verify that in Scoped mode:
    1. Grounding prompt prominently injects article title, summary, and full content.
    2. Anthropic Claude stream receives the grounded prompt and streams response.
    3. Production code never falls back to hardcoded AgentLens mock fallback report.
    """
    from app.services.chat_service import ChatService
    from app.schemas.chat import ChatStreamRequest
    from app.models.news import NewsItem
    from datetime import datetime, timezone
    import json

    # Mock DB session and NewsItem
    mock_item = NewsItem(
        id=777,
        title="DeepSeek R1 Open-Source Reasoning Architecture",
        url="https://example.com/deepseek-r1",
        source="github",
        category="ai_news",
        author="DeepSeek-AI",
        summary="DeepSeek-R1 achieves state-of-the-art reasoning via large-scale reinforcement learning without supervised fine-tuning.",
        why_it_matters="Revolutionizes open-source reasoning model architectures.",
        tech_stack="DeepSeek-R1, PyTorch",
        tags="reasoning, open-source",
        quality_score=9.5,
        is_high_signal=True,
        hotness_score=100.0,
        published_at=datetime.now(timezone.utc),
        dedup_hash="hash_deepseek_777"
    )

    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    mock_session.get.return_value = mock_item

    chat_service = ChatService(mock_session)
    chat_service.session_service.persist_turn = AsyncMock()
    chat_service.scraper.get_article_content = AsyncMock(return_value="Detailed full text: DeepSeek-R1 architecture deep dive with pure RL.")

    captured_prompts = []

    async def mock_stream_tokens(prompt, **kwargs):
        captured_prompts.append(prompt)
        yield ("DeepSeek-R1의 핵심 아키텍처는 순수 강화학습(RL) 기반입니다. [1]", "claude-sonnet-5-5")

    with patch.object(llm_processor, "stream_tokens", side_effect=mock_stream_tokens):
        req = ChatStreamRequest(
            question="이 모델의 강화학습 원리를 설명해줘",
            scope="scoped",
            source_id=777
        )

        events = []
        async for sse in chat_service.stream_chat(req):
            events.append(sse)

        assert len(captured_prompts) == 1
        prompt = captured_prompts[0]

        # Verify article title, summary, and full content are injected
        assert "DeepSeek R1 Open-Source Reasoning Architecture" in prompt
        assert "DeepSeek-R1 achieves state-of-the-art reasoning" in prompt
        assert "Detailed full text: DeepSeek-R1 architecture" in prompt
        assert "이 모델의 강화학습 원리를 설명해줘" in prompt

        # Verify prompt commands strict focus on the article
        assert "포커스" in prompt or "기사 원본 출처" in prompt

        # Verify response stream contains Claude's answer, NOT the mock report
        full_sse_text = "".join(events)
        assert "AgentLens Mock Fallback Engine" not in full_sse_text
        assert "순수 강화학습" in full_sse_text

def test_sanitize_model_identifier_preserves_historical_models():
    """Verify that historical model names (Gemini, OpenAI, Claude) are strictly preserved."""
    from app.services.llm_processor import sanitize_model_identifier

    # Historical Gemini models must NOT be overwritten with claude-sonnet-5-5
    assert sanitize_model_identifier("gemini-2.0-flash") == "gemini-2.0-flash"
    assert sanitize_model_identifier("Google gemini-3.5-flash-lite") == "Google gemini-3.5-flash-lite"
    assert sanitize_model_identifier("gemini-1.5-pro") == "gemini-1.5-pro"

    # OpenAI models
    assert sanitize_model_identifier("gpt-4o-mini") == "gpt-4o-mini"
    assert sanitize_model_identifier("OpenAI o1") == "OpenAI o1"

    # Claude models
    assert sanitize_model_identifier("claude-sonnet-5-5") == "claude-sonnet-5-5"
    assert sanitize_model_identifier("claude-haiku-5-5") == "claude-haiku-5-5"

    # None or empty defaults to claude-sonnet-5-5 for new requests
    assert sanitize_model_identifier(None) == "claude-sonnet-5-5"
    assert sanitize_model_identifier("") == "claude-sonnet-5-5"

@pytest.mark.asyncio
async def test_no_mock_fallback_on_provider_absence():
    """Verify check_provider_available and generate_live_answer fail-fast without fake mock text."""
    with patch.object(llm_processor, "has_live_provider", return_value=False):
        with pytest.raises(LLMProviderUnavailableException):
            llm_processor.check_provider_available()

        with pytest.raises(LLMProviderUnavailableException):
            await llm_processor.generate_live_answer("Test prompt")

        with pytest.raises(LLMProviderUnavailableException):
            async for _ in llm_processor.stream_tokens("Test prompt"):
                pass
