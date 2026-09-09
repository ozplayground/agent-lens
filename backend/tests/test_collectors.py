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
