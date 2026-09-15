import pytest
from datetime import datetime, timezone, timedelta
from app.collectors.categorizer import classify_and_tag, compute_dedup_hash, calculate_hotness

def test_harness_classification():
    title = "SWE-bench 2.0: Next-Gen Evaluation Harness for Autonomous Coding Agents"
    cat, tags, score = classify_and_tag(title, "A benchmark testing agent test harness and Docker sandboxes.")
    assert cat == "harness"
    assert score > 0

def test_mcp_classification():
    title = "Anthropic Releases Model Context Protocol (MCP) Server Specifications"
    cat, tags, score = classify_and_tag(title, "Connecting agents to external tools and plugins.")
    assert cat == "mcp_plugins_skills"

def test_agent_tech_classification():
    title = "LangGraph Multi-Agent Workflows and Memory Architecture"
    cat, tags, score = classify_and_tag(title, "Autonomous agent team coordination.")
    assert cat == "agent_tech"

def test_ai_news_classification():
    title = "DeepSeek-R1 Open Weight Reasoning Model Breakthrough"
    cat, tags, score = classify_and_tag(title, "Frontier reasoning LLM.")
    assert cat == "ai_news"

def test_dedup_hash_stability():
    u1 = "https://example.com/test"
    u2 = "https://example.com/test?utm_source=twitter"
    assert compute_dedup_hash("Agent News", u1) == compute_dedup_hash("Agent News", u2)

def test_hotness_decay():
    now = datetime.now(timezone.utc)
    recent = calculate_hotness(100, 20, now - timedelta(hours=1))
    older = calculate_hotness(100, 20, now - timedelta(hours=48))
    assert recent > older

def test_unrelated_noise_rejection():
    from app.collectors.categorizer import is_strictly_ai_related
    noisy_titles = [
        "[GeekNews (긱뉴스)] Capsule - 데이터를 SQLite에 저장하는 단일 파일 웹 앱",
        "[GeekNews (긱뉴스)] CSS-Tricks, 다시 불확실한 상태에 놓이다",
        "[GeekNews (긱뉴스)] Java 27 출시",
        "[GeekNews (긱뉴스)] 벨기에 대중교통 실시간 지도",
        "[GeekNews (긱뉴스)] 미국, 우주 무기 배치 사실 처음으로 인정"
    ]
    for title in noisy_titles:
        assert is_strictly_ai_related(title) is False
        cat, _, score = classify_and_tag(title)
        assert cat == "unrelated"
        assert score == 0.0

@pytest.mark.asyncio
async def test_evaluate_content_with_llm_strict_gate():
    from app.services.llm_processor import llm_processor
    # Non-AI GeekNews item must be rejected
    res = await llm_processor.evaluate_content_with_llm(
        title="[GeekNews (긱뉴스)] Capsule - 데이터를 SQLite에 저장하는 단일 파일 웹 앱",
        summary="단일 파일에 데이터를 저장하는 웹 앱 프레임워크입니다.",
        source="rss_kr"
    )
    assert res["is_worthwhile"] is False
    assert res["quality_score"] <= 5.0
    assert "No AI/Agent/MCP domain relevance" in res["rejection_reason"]

    # AI GeekNews item must pass
    ai_res = await llm_processor.evaluate_content_with_llm(
        title="[GeekNews (긱뉴스)] Anthropic Claude 3.7 Sonnet 출시",
        summary="앤트로픽의 새로운 추론 모델 및 코딩 에이전트 발표",
        source="rss_kr"
    )
    assert ai_res["is_worthwhile"] is True
    assert ai_res["quality_score"] >= 7.0
