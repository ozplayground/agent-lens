import os
from pathlib import Path
import pytest

# Ensure tests use an isolated test database so agentlens.db is never wiped
TEST_DB_FILE = Path(__file__).resolve().parent / "test_agentlens.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

from app.database import engine, Base, AsyncSessionLocal, ensure_db_schema
from app.models import NewsItem
from datetime import datetime, timezone

@pytest.fixture(autouse=True)
async def init_db():
    await ensure_db_schema()

    # Seed at least one item for endpoints that query or ask AI
    async with AsyncSessionLocal() as session:
        existing = await session.get(NewsItem, 1)
        if not existing:
            import hashlib
            sample = NewsItem(
                id=1,
                title="LangGraph Harness Test Framework Released",
                url="https://github.com/example/langgraph-harness",
                summary="Test summary of LangGraph Harness framework.",
                source="github",
                category="harness",
                tags="agent,harness,python",
                quality_score=8.5,
                published_at=datetime.now(timezone.utc),
                is_high_signal=True,
                why_it_matters="This is a test insight for developers",
                tldr_bullets='["Harness testing", "Agent evaluation"]',
                tech_stack="Python, LangGraph",
                dedup_hash=hashlib.sha256("https://github.com/example/langgraph-harness".encode()).hexdigest(),
                hotness_score=9.5,
            )
            session.add(sample)
            try:
                await session.commit()
            except Exception:
                await session.rollback()
    yield



# ---------------------------------------------------------------------------
# LLM 격리 도구 (backend-llm-test-isolation)
# ---------------------------------------------------------------------------
import copy
import json

import llm_fakes

LLM_ENV_VARS = ("ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "OLLAMA_BASE_URL", "OLLAMA_MODEL")
CONFIG_LLM_BLANK_KEYS = ("anthropic_api_key", "openai_api_key", "gemini_api_key", "ollama_base_url")
_UNSET = object()


def blank_llm_config(data):
    """config.json 내용에서 LLM 키 세 개와 ollama_base_url 을 비운 사본을 돌려준다."""
    out = copy.deepcopy(data) if isinstance(data, dict) else {}
    llm = out.setdefault("llm", {})
    for key in CONFIG_LLM_BLANK_KEYS:
        llm[key] = ""
    return out


def clear_llm_sources(monkeypatch):
    """LLM 설정 원천(환경 변수, settings, llm_processor 덮어쓰기)을 모두 '없음' 으로 둔다."""
    from app.config import settings
    from app.services.llm_processor import llm_processor

    for name in LLM_ENV_VARS:
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    monkeypatch.setattr(settings, "OLLAMA_BASE_URL", "")
    monkeypatch.setattr(settings, "OLLAMA_MODEL", "llama3.2:latest")
    monkeypatch.setattr(llm_processor, "openai_key", None)
    monkeypatch.setattr(llm_processor, "ollama_url", None)
    monkeypatch.setattr(llm_processor, "gemini_key", "")


class LLMSources:
    """테스트 한 개 동안 LLM 설정 원천을 하나씩 켜는 조절 객체.

    시작 상태: 환경 변수 없음, settings 의 LLM 키·Ollama 주소 빈 값 (OLLAMA_MODEL 은 llama3.2:latest),
    llm_processor 덮어쓰기 None, config.json 은 LLM 키·ollama_base_url 을 비운 테스트별 사본.
    """

    def __init__(self, monkeypatch, config_path):
        self._mp = monkeypatch
        self.config_path = config_path

    # config.json 사본
    def read_config(self):
        with open(self.config_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def set_config_llm(self, key, value):
        data = self.read_config()
        data.setdefault("llm", {})[key] = value
        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def _settings(self, name, value):
        from app.config import settings
        self._mp.setattr(settings, name, value)

    # 켜는 메서드
    def anthropic(self, key="sk-ant-test-fake"):
        self._settings("ANTHROPIC_API_KEY", key)

    def gemini(self, key="fake-gemini-key-12345"):
        self._settings("GEMINI_API_KEY", key)

    def openai(self, key="sk-openai-test-fake", source="settings"):
        if source == "settings":
            self._settings("OPENAI_API_KEY", key)
        elif source == "env":
            self._mp.setenv("OPENAI_API_KEY", key)
        elif source == "config":
            self.set_config_llm("openai_api_key", key)
        else:
            raise ValueError(f"unknown source: {source}")

    def ollama_url(self, url, source="settings"):
        if source == "settings":
            self._settings("OLLAMA_BASE_URL", url)
        elif source == "config":
            self.set_config_llm("ollama_base_url", url)
        else:
            raise ValueError(f"unknown source: {source}")

    def ollama_model(self, model, source="settings"):
        if source == "settings":
            self._settings("OLLAMA_MODEL", model)
        elif source == "config":
            self.set_config_llm("ollama_model", model)
        else:
            raise ValueError(f"unknown source: {source}")

    def override(self, openai_key=_UNSET, ollama_url=_UNSET):
        from app.services.llm_processor import llm_processor
        if openai_key is not _UNSET:
            self._mp.setattr(llm_processor, "openai_key", openai_key)
        if ollama_url is not _UNSET:
            self._mp.setattr(llm_processor, "ollama_url", ollama_url)


@pytest.fixture
def fake_llm(monkeypatch):
    """httpx(와 httpx2) 전송 계층에 흉내 LLM 을 설치한다. 흉내 Claude 는 기본 등록."""
    fake = llm_fakes.FakeLLM()
    llm_fakes.install(fake, monkeypatch)
    return fake


@pytest.fixture(scope="session")
def settings_file_copies(tmp_path_factory):
    """세션 임시 폴더의 config.json·sources.json 사본. 원본은 읽기만 한다.

    config.json 사본은 llm 절의 LLM 키 세 개와 ollama_base_url 을 비운다.
    세션 동안 같은 사본을 써서 테스트 사이 상태가 이어진다.
    """
    import app.config as app_config
    from app.services.sources_service import find_sources_file

    root = tmp_path_factory.mktemp("settings_files")
    config_path = root / "config.json"
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(blank_llm_config(app_config.load_json_config()), f, ensure_ascii=False, indent=2)

    sources_path = root / "sources.json"
    src = find_sources_file()
    sources_path.write_bytes(src.read_bytes() if src.exists() else b"{}")
    return config_path, sources_path


@pytest.fixture(autouse=True)
def llm_isolation(monkeypatch, settings_file_copies, fake_llm):
    """모든 테스트의 LLM·설정 파일 기본 상태.

    LLM 원천을 비운 뒤 흉내 Claude 를 쓸 수 있는 상태(ANTHROPIC_API_KEY 가짜 값)로 두고,
    config.json·sources.json 은 세션 사본으로 돌리며, 흉내 없는 LLM 요청이 있으면 테스트를 실패시킨다.
    """
    import app.config as app_config
    from app.config import Settings, settings
    from app.services.sources_service import sources_service

    config_path, sources_path = settings_file_copies

    # 1·2. 원천 비우기와 기본 상태
    clear_llm_sources(monkeypatch)
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "sk-ant-test-fake")

    # 3. config.json → 세션 사본 (settings.raw_json_config 도 사본 내용)
    monkeypatch.setattr(app_config, "find_config_json", lambda: config_path)
    monkeypatch.setattr(app_config, "_json_data", app_config.load_json_config())

    # 4. settings.reload() 가 .env 를 다시 읽지 않게
    monkeypatch.setitem(Settings.model_config, "env_file", None)

    # 5. sources.json 과 거울 → 세션 사본
    monkeypatch.setattr(sources_service, "_file_path", sources_path)
    monkeypatch.setattr(sources_service, "_mirror_path", sources_path)

    # 6. 흉내 LLM (fake_llm fixture 가 설치) 과 가드
    yield fake_llm
    fake_llm.assert_no_unmocked()


@pytest.fixture
def llm_sources(monkeypatch, tmp_path, llm_isolation):
    """LLM 설정 원천을 모두 비우고 테스트가 하나씩 켜게 하는 조절 객체.

    기본 상태(llm_isolation) 위에서 Anthropic 키까지 비우고, 세션 사본에서 테스트별 config.json 사본을 만든다.
    """
    import app.config as app_config

    base = app_config.load_json_config()
    config_path = tmp_path / "config.json"
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(blank_llm_config(base), f, ensure_ascii=False, indent=2)
    monkeypatch.setattr(app_config, "find_config_json", lambda: config_path)
    clear_llm_sources(monkeypatch)
    return LLMSources(monkeypatch, config_path)
