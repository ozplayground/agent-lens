import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.trend_service import trend_service, classify_tag_category
from app.services.webhook_service import webhook_service

def test_classify_tag_category():
    assert classify_tag_category("SWE-bench") == "Harness & Benchmark"
    assert classify_tag_category("FastMCP") == "Protocols & Tooling"
    assert classify_tag_category("DeepSeek-R1") == "Models & Reasoning"
    assert classify_tag_category("vLLM") == "Infra & Runtime"

def test_webhook_provider_detection():
    assert webhook_service.detect_provider("https://hooks.slack.com/services/xxx") == "slack"
    assert webhook_service.detect_provider("https://discord.com/api/webhooks/xxx") == "discord"
    assert webhook_service.detect_provider("https://example.com/webhook") == "generic"

def test_webhook_payload_generation():
    slack_payload = webhook_service.build_test_payload("slack")
    assert "blocks" in slack_payload

    discord_payload = webhook_service.build_test_payload("discord")
    assert "embeds" in discord_payload

    briefing_slack = webhook_service.build_briefing_payload({
        "title": "테스트 브리핑",
        "executive_summary": "요약 내용",
        "top_highlights": [{"title": "하이라이트 1", "url": "https://test.com", "why_it_matters": "중요함"}],
        "date": "2026-09-08"
    }, "slack")
    assert "blocks" in briefing_slack

@pytest.mark.asyncio
async def test_trends_radar_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/trends/radar")
    assert res.status_code == 200
    data = res.json()
    assert "total_analyzed" in data
    assert "surging_tags" in data
    assert "categories" in data
    assert "tags" in data

@pytest.mark.asyncio
async def test_webhook_invalid_url():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/webhook/test", json={"webhook_url": "invalid-url"})
    assert res.status_code == 400
