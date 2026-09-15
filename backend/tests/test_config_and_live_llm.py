import pytest
from app.config import settings, find_config_json
from app.services.llm_processor import llm_processor

def test_config_json_found_and_loaded():
    path = find_config_json()
    assert path is not None
    assert path.exists()

    assert settings.PROJECT_NAME == "AgentLens"
    assert settings.VERSION == "1.4.3"
    assert len(settings.CRAWL_SCHEDULE_HOURS) > 0
    assert settings.QUALITY_CUTOFF_SCORE == 5.0
    assert settings.HIGH_SIGNAL_THRESHOLD == 7.0

def test_get_custom_json_value():
    crawler_agent = settings.get_custom_json_value("crawler", "user_agent")
    assert "AgentLens" in crawler_agent

    non_existent = settings.get_custom_json_value("non_existent_section", "foo", default="bar")
    assert non_existent == "bar"

@pytest.mark.asyncio
async def test_llm_processor_fallback_and_answer():
    ans = await llm_processor.answer_question(
        item_title="SWE-bench Docker Sandbox Isolation Release",
        item_summary="새로운 격리 샌드박스를 통해 에이전트 평가 안전성을 강화했습니다.",
        category="harness",
        tech_stack=["SWE-bench", "Docker Sandbox"],
        question="우리 프로젝트에 어떻게 적용할 수 있어?"
    )
    assert ans is not None
    assert isinstance(ans, str)
    assert len(ans) > 20
