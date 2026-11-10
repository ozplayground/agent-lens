import pytest
from app.config import settings, find_config_json
from app.services.llm_processor import llm_processor

def test_config_json_found_and_loaded():
    path = find_config_json()
    assert path is not None
    assert path.exists()

    assert settings.PROJECT_NAME == "AgentLens"
    # 버전은 하나만 맞다: 저장소 루트 config.json 의 app.version (docs/releases.md '버전 문자열 위치')
    import json
    from pathlib import Path
    root_config = Path(__file__).resolve().parents[2] / "config.json"
    assert settings.VERSION == json.loads(root_config.read_text(encoding="utf-8"))["app"]["version"]
    assert len(settings.CRAWL_SCHEDULE_HOURS) > 0
    assert settings.QUALITY_CUTOFF_SCORE == 5.0
    assert settings.HIGH_SIGNAL_THRESHOLD == 7.0

def test_get_custom_json_value():
    # v0.4.2: 읽는 코드가 없던 crawler 절은 config.json 에서 지웠다 (CFG-02). 남은 키로 확인한다
    project_name = settings.get_custom_json_value("app", "project_name")
    assert "AgentLens" in project_name

    non_existent = settings.get_custom_json_value("non_existent_section", "foo", default="bar")
    assert non_existent == "bar"
