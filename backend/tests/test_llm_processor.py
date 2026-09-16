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
