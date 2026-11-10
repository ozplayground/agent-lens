"""비용이 드는 엔드포인트의 입력 길이·범위 제한 (PERF-07).

- 기사 질문(`/api/news/{id}/ask`, `/ask/stream`): 질문 1~2000자 (챗과 같은 한도)
- 딥 리서치 `run-deep` 의 `max_candidates`: 1~20, 감사 로그 `limit`: 1~200
- 소스 탐색 `discover` 의 `limit`: 1~50
범위를 벗어나면 400 ERR_INVALID_PAYLOAD 이고 LLM·네트워크를 부르지 않는다.
"""
from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


def _client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.mark.parametrize("path", ["/api/news/1/ask/stream"])
@pytest.mark.parametrize("question", ["", "x" * 2001])
async def test_news_ask_rejects_empty_or_too_long_question(path, question, fake_llm):
    async with _client() as ac:
        r = await ac.post(path, json={"question": question})
    assert r.status_code == 400
    assert r.json()["error_code"] == "ERR_INVALID_PAYLOAD"
    assert r.json()["details"][0]["loc"] == ["body", "question"]
    assert fake_llm.requests() == []


async def test_news_ask_accepts_2000_chars(fake_llm):
    async with _client() as ac:
        r = await ac.post("/api/news/1/ask/stream", json={"question": "가" * 2000})
    assert r.status_code == 200


@pytest.mark.parametrize("value", [0, -1, 21])
async def test_run_deep_max_candidates_range(value, monkeypatch):
    from app.services.deep_researcher import deep_researcher
    run_mock = AsyncMock(return_value={})
    monkeypatch.setattr(deep_researcher, "run_deep_research", run_mock)
    async with _client() as ac:
        r = await ac.post(f"/api/research/run-deep?max_candidates={value}")
    assert r.status_code == 400
    assert r.json()["error_code"] == "ERR_INVALID_PAYLOAD"
    run_mock.assert_not_called()


@pytest.mark.parametrize("value", [0, -1, 201])
async def test_audit_logs_limit_range(value):
    async with _client() as ac:
        r = await ac.get(f"/api/research/audit-logs?limit={value}")
    assert r.status_code == 400
    assert r.json()["error_code"] == "ERR_INVALID_PAYLOAD"


async def test_audit_logs_limit_in_range_ok():
    async with _client() as ac:
        r = await ac.get("/api/research/audit-logs?limit=200")
    assert r.status_code == 200
