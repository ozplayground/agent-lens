"""LLM 프로바이더 판정·설정 해석·테스트 격리 회귀 테스트 (backend-llm-test-isolation).

모든 행 테스트는 Gemini 키를 settings 에 두고 `_call_gemini` 가 불리지 않음을 단언한다 (POL-LLM-005).
흉내 Ollama 주소는 실제 호스트가 아닌 이름을 쓴다.
"""
import logging
from unittest.mock import AsyncMock

import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from app.services.llm_processor import (
    LLMProviderUnavailableException,
    llm_processor,
)
from llm_fakes import FAKE_CLAUDE_ANSWER, FAKE_OLLAMA_ANSWER, FAKE_OPENAI_ANSWER

FAKE_OLLAMA = "http://fake-ollama.test:11434"
INSTALLED = "llama3.2:latest"


@pytest.fixture
def gemini_spy(llm_sources, monkeypatch):
    llm_sources.gemini("fake-gemini-key-12345")
    spy = AsyncMock(return_value=("gemini answer", "Google gemini-test"))
    monkeypatch.setattr(llm_processor, "_call_gemini", spy)
    return spy


async def _collect_stream(prompt="테스트 질문"):
    parts, models = [], []
    async for text, model in llm_processor.stream_tokens(prompt):
        parts.append(text)
        models.append(model)
    return "".join(parts), models


async def _assert_unavailable():
    with pytest.raises(LLMProviderUnavailableException):
        await llm_processor.generate_live_answer("테스트 질문")
    with pytest.raises(LLMProviderUnavailableException):
        await _collect_stream()


# T1
async def test_t1_claude_key_skips_ollama_probe(llm_sources, fake_llm, gemini_spy):
    llm_sources.anthropic()
    fake_llm.register_ollama(FAKE_OLLAMA, state="down")
    llm_sources.ollama_url(FAKE_OLLAMA)

    assert await llm_processor.has_live_provider() is True
    assert fake_llm.requests("ollama") == []

    ans, model = await llm_processor.generate_live_answer("테스트 질문")
    assert ans == FAKE_CLAUDE_ANSWER
    assert model.startswith("claude-")

    text, models = await _collect_stream()
    assert text == FAKE_CLAUDE_ANSWER
    assert models and all(m.startswith("claude-") for m in models)

    assert fake_llm.requests("ollama") == []
    assert gemini_spy.call_count == 0


# T2
async def test_t2_claude_preferred_over_installed_ollama(llm_sources, fake_llm, gemini_spy):
    llm_sources.anthropic()
    fake_llm.register_ollama(FAKE_OLLAMA, state="up", models=[INSTALLED])
    llm_sources.ollama_url(FAKE_OLLAMA)

    assert await llm_processor.has_live_provider() is True
    assert fake_llm.requests("ollama", path="/api/tags") == []

    ans, model = await llm_processor.generate_live_answer("테스트 질문")
    assert ans == FAKE_CLAUDE_ANSWER
    assert model.startswith("claude-")

    text, models = await _collect_stream()
    assert text == FAKE_CLAUDE_ANSWER
    assert models and all(m.startswith("claude-") for m in models)

    assert fake_llm.requests("ollama", path="/api/generate") == []
    assert gemini_spy.call_count == 0


# T3
async def test_t3_no_provider_when_ollama_unreachable(llm_sources, fake_llm, gemini_spy):
    fake_llm.register_ollama(FAKE_OLLAMA, state="down")
    llm_sources.ollama_url(FAKE_OLLAMA)

    assert await llm_processor.has_live_provider() is False
    await _assert_unavailable()
    assert gemini_spy.call_count == 0


# T4
async def test_t4_missing_ollama_model_is_unavailable(llm_sources, fake_llm, gemini_spy):
    fake_llm.register_ollama(FAKE_OLLAMA, state="up", models=["gpt-oss:20b"])
    llm_sources.ollama_url(FAKE_OLLAMA)
    llm_sources.ollama_model(INSTALLED)

    assert await llm_processor.has_live_provider() is False
    await _assert_unavailable()
    assert fake_llm.requests("ollama", path="/api/generate") == []
    assert gemini_spy.call_count == 0


# T5
@pytest.mark.parametrize("model_source", ["settings_model", "config_model"])
async def test_t5_installed_ollama_model_used(llm_sources, fake_llm, gemini_spy, model_source):
    fake_llm.register_ollama(FAKE_OLLAMA, state="up", models=[INSTALLED])
    llm_sources.ollama_url(FAKE_OLLAMA)
    if model_source == "settings_model":
        llm_sources.ollama_model(INSTALLED)
    else:
        llm_sources.ollama_model("")
        llm_sources.ollama_model(INSTALLED, source="config")

    assert await llm_processor.has_live_provider() is True

    ans, _ = await llm_processor.generate_live_answer("테스트 질문")
    assert ans == FAKE_OLLAMA_ANSWER

    text, _ = await _collect_stream()
    assert text == FAKE_OLLAMA_ANSWER

    generate_reqs = fake_llm.requests("ollama", path="/api/generate")
    assert len(generate_reqs) == 2
    assert [r.body["model"] for r in generate_reqs] == [INSTALLED, INSTALLED]
    assert gemini_spy.call_count == 0


# T6
async def test_t6_openai_key_only(llm_sources, fake_llm, gemini_spy):
    llm_sources.openai(source="settings")
    fake_llm.register_openai()
    fake_llm.register_ollama(FAKE_OLLAMA, state="down")
    llm_sources.ollama_url(FAKE_OLLAMA)

    assert await llm_processor.has_live_provider() is True

    ans, _ = await llm_processor.generate_live_answer("테스트 질문")
    assert ans == FAKE_OPENAI_ANSWER

    text, _ = await _collect_stream()
    assert text == FAKE_OPENAI_ANSWER

    assert len(fake_llm.requests("openai")) == 2
    assert gemini_spy.call_count == 0


# T7
async def test_t7_ollama_url_from_config_json_when_settings_empty(llm_sources, fake_llm, gemini_spy):
    fake_llm.register_ollama(FAKE_OLLAMA, state="up", models=[INSTALLED])
    llm_sources.ollama_url("")
    llm_sources.ollama_url(FAKE_OLLAMA, source="config")

    assert await llm_processor.has_live_provider() is True

    ans, _ = await llm_processor.generate_live_answer("테스트 질문")
    assert ans == FAKE_OLLAMA_ANSWER

    text, _ = await _collect_stream()
    assert text == FAKE_OLLAMA_ANSWER

    generate_reqs = fake_llm.requests("ollama", path="/api/generate")
    assert len(generate_reqs) == 2
    assert all(r.url.startswith(f"{FAKE_OLLAMA}/api/generate") for r in generate_reqs)
    assert gemini_spy.call_count == 0


# T7b
async def test_t7b_empty_overrides_disable_openai_and_ollama(llm_sources, fake_llm, gemini_spy):
    fake_llm.register_openai()
    llm_sources.openai(source="settings")
    llm_sources.openai(source="env")
    llm_sources.openai(source="config")
    fake_llm.register_ollama(FAKE_OLLAMA, state="up", models=[INSTALLED])
    llm_sources.ollama_url(FAKE_OLLAMA, source="settings")
    llm_sources.ollama_url(FAKE_OLLAMA, source="config")
    llm_sources.override(openai_key="", ollama_url="")

    assert await llm_processor.has_live_provider() is False
    await _assert_unavailable()
    assert fake_llm.requests("openai") == []
    assert fake_llm.requests("ollama") == []
    assert gemini_spy.call_count == 0


# T8
async def test_t8_untagged_model_matches_latest_tag(llm_sources, fake_llm, gemini_spy):
    fake_llm.register_ollama(FAKE_OLLAMA, state="up", models=[INSTALLED])
    llm_sources.ollama_url(FAKE_OLLAMA)
    llm_sources.ollama_model("llama3.2")

    assert await llm_processor.has_live_provider() is True
    ans, _ = await llm_processor.generate_live_answer("테스트 질문")
    assert ans == FAKE_OLLAMA_ANSWER
    assert gemini_spy.call_count == 0


# R2, R12: 탐침은 한 번, timeout 1.0
async def test_ollama_probe_is_single_request_with_1s_timeout(llm_sources, fake_llm, gemini_spy):
    fake_llm.register_ollama(FAKE_OLLAMA, state="up", models=[INSTALLED])
    llm_sources.ollama_url(FAKE_OLLAMA)

    await llm_processor.has_live_provider()

    probes = fake_llm.requests("ollama", path="/api/tags")
    assert len(probes) == 1
    timeout = probes[0].timeout
    assert isinstance(timeout, dict) and timeout
    assert all(v == 1.0 for v in timeout.values())
    assert gemini_spy.call_count == 0


def _t4_condition(llm_sources, fake_llm):
    fake_llm.register_ollama(FAKE_OLLAMA, state="up", models=["gpt-oss:20b"])
    llm_sources.ollama_url(FAKE_OLLAMA)
    llm_sources.ollama_model(INSTALLED)


# R4: API 503
async def test_api_chat_stream_503_when_ollama_model_missing(llm_sources, fake_llm, gemini_spy, caplog):
    from app.main import app

    _t4_condition(llm_sources, fake_llm)
    caplog.set_level(logging.WARNING, logger="agentlens.llm")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/chat/stream", json={"question": "에이전트 하네스 구조 설명", "scope": "global"})
    assert res.status_code == 503
    assert res.json()["error_code"] == "ERR_LLM_PROVIDER_UNAVAILABLE"
    warnings = [r.getMessage() for r in caplog.records if r.levelno >= logging.WARNING]
    assert any("설정 모델 미설치" in m for m in warnings)
    assert gemini_spy.call_count == 0


# R6 a: 가드
def test_guard_records_unmocked_llm_request(fake_llm):
    with pytest.raises(httpx.ConnectError):
        with httpx.Client() as client:
            client.get("http://localhost:11434/api/tags")
    with pytest.raises(AssertionError):
        fake_llm.assert_no_unmocked()
    taken = fake_llm.take_unmocked()
    assert len(taken) == 1 and "localhost:11434/api/tags" in taken[0]
    fake_llm.assert_no_unmocked()
