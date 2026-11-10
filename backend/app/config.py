import os
import copy
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dotenv import load_dotenv

# Pre-load candidate .env files
for env_path in [Path.cwd() / ".env", Path.cwd() / "backend" / ".env", Path.cwd().parent / ".env", Path(__file__).resolve().parent.parent / ".env"]:
    if env_path.exists():
        load_dotenv(env_path, override=False)
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, model_validator

def find_config_json() -> Optional[Path]:
    """Finds config.json from multiple candidate directories."""
    candidates = [
        Path.cwd() / "config.json",
        Path.cwd().parent / "config.json",
        Path(__file__).resolve().parent.parent.parent / "config.json",
        Path(__file__).resolve().parent / "config" / "config.json",
    ]
    for p in candidates:
        if p.exists() and p.is_file():
            return p
    return None

# 파일별 (mtime_ns, size) 와 파싱 결과. 파일이 그대로면 다시 열지 않는다 (PERF-04)
_config_cache: Dict[Path, Tuple[Tuple[int, int], Dict[str, Any]]] = {}


def load_json_config() -> Dict[str, Any]:
    """config.json 내용의 사본. 파일이 바뀌었을 때만 다시 읽는다."""
    p = find_config_json()
    if not p:
        return {}
    try:
        st = p.stat()
        stamp = (st.st_mtime_ns, st.st_size)
        cached = _config_cache.get(p)
        if cached is None or cached[0] != stamp:
            with open(p, "r", encoding="utf-8") as f:
                cached = (stamp, json.load(f))
            _config_cache[p] = cached
        return copy.deepcopy(cached[1])
    except Exception:
        return {}

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATABASE_URL = f"sqlite+aiosqlite:///{BACKEND_DIR / 'agentlens.db'}"


def resolve_database_url(url: str) -> str:
    """SQLite 상대 경로는 실행 위치(cwd)가 아니라 backend/ 기준으로 고정한다 (ARCH-04)."""
    prefix, sep, path = url.partition(":///")
    if not sep or not prefix.startswith("sqlite") or not path or path.startswith("/") or path.startswith(":memory:"):
        return url
    return f"{prefix}:///{(BACKEND_DIR / path).resolve()}"

_json_data = load_json_config()

class Settings(BaseSettings):
    PROJECT_NAME: str = _json_data.get("app", {}).get("project_name", "AgentLens")
    VERSION: str = _json_data.get("app", {}).get("version", "0.4.2")
    DATABASE_URL: str = _json_data.get("app", {}).get("database_url", DEFAULT_DATABASE_URL)
    # RSS 피드 channel link 에 쓰는 웹 화면 주소 (BUG-12)
    PUBLIC_WEB_URL: str = _json_data.get("app", {}).get("public_web_url", "http://localhost:3000")

    # Scheduler (CFG-01): 수집 시각·시간대·자동 발송 시각을 실제 cron 에 쓴다
    SCHEDULER_ENABLED: bool = bool(_json_data.get("scheduler", {}).get("enabled", True))
    CRAWL_SCHEDULE_HOURS: str = ",".join(str(h) for h in _json_data.get("scheduler", {}).get("crawl_hours", [0, 6, 12, 18]))
    CRAWL_TIMEZONE: str = _json_data.get("scheduler", {}).get("timezone", "UTC")

    # LLM Settings from config.json or environment
    ANTHROPIC_API_KEY: str = _json_data.get("llm", {}).get("anthropic_api_key", "")
    ANTHROPIC_MODEL: str = _json_data.get("llm", {}).get("anthropic_model", "claude-sonnet-5-5")
    ANTHROPIC_DEFAULT_CHAT_MODEL: str = _json_data.get("llm", {}).get("anthropic_default_chat_model", "claude-sonnet-5-5")
    ANTHROPIC_HAIKU_MODEL: str = _json_data.get("llm", {}).get("anthropic_haiku_model", "claude-haiku-5-5")
    ANTHROPIC_SONNET_MODEL: str = _json_data.get("llm", {}).get("anthropic_sonnet_model", "claude-sonnet-5-5")
    ANTHROPIC_OPUS_MODEL: str = _json_data.get("llm", {}).get("anthropic_opus_model", "claude-opus-5-5")
    GEMINI_API_KEY: str = _json_data.get("llm", {}).get("gemini_api_key", "")
    GEMINI_MODEL: str = _json_data.get("llm", {}).get("gemini_model", "gemini-3.5-flash-lite")
    OPENAI_API_KEY: str = _json_data.get("llm", {}).get("openai_api_key", "")
    OPENAI_MODEL: str = _json_data.get("llm", {}).get("openai_model", "gpt-4o-mini")
    OLLAMA_BASE_URL: str = _json_data.get("llm", {}).get("ollama_base_url", "http://localhost:11434")
    OLLAMA_MODEL: str = _json_data.get("llm", {}).get("ollama_model", "llama3.2:latest")
    QUALITY_CUTOFF_SCORE: float = float(_json_data.get("llm", {}).get("quality_cutoff_score", 5.0))
    HIGH_SIGNAL_THRESHOLD: float = float(_json_data.get("llm", {}).get("high_signal_threshold", 7.0))

    # Chat & Session Settings
    CHAT_SESSION_MAX_LIMIT: int = int(_json_data.get("chat", {}).get("max_session_limit", 30))
    SCRAPER_TIMEOUT_SECONDS: float = float(_json_data.get("scraper", {}).get("timeout_seconds", 5.0))


    # Briefing & Export Settings
    BRIEFING_TITLE: str = _json_data.get("briefing", {}).get("title", "오늘의 AI 브리핑")
    BRIEFING_AUTO_DISPATCH_HOUR: int = int(_json_data.get("briefing", {}).get("auto_dispatch_hour", 0))

    # Notion Settings
    NOTION_API_KEY: str = _json_data.get("briefing", {}).get("notion", {}).get("api_key", "")
    NOTION_PAGE_ID: str = _json_data.get("briefing", {}).get("notion", {}).get("page_id", "")
    NOTION_AUTO_EXPORT: bool = bool(_json_data.get("briefing", {}).get("notion", {}).get("auto_export", False))

    # Email (SMTP) Settings
    SMTP_HOST: str = _json_data.get("briefing", {}).get("email", {}).get("smtp_host", "")
    SMTP_PORT: int = int(_json_data.get("briefing", {}).get("email", {}).get("smtp_port", 587))
    SMTP_USER: str = _json_data.get("briefing", {}).get("email", {}).get("smtp_user", "")
    SMTP_PASSWORD: str = _json_data.get("briefing", {}).get("email", {}).get("smtp_password", "")
    SMTP_FROM: str = _json_data.get("briefing", {}).get("email", {}).get("smtp_from", "")
    SMTP_TO: str = _json_data.get("briefing", {}).get("email", {}).get("smtp_to", "")
    SMTP_USE_TLS: bool = bool(_json_data.get("briefing", {}).get("email", {}).get("use_tls", True))
    EMAIL_AUTO_SEND: bool = bool(_json_data.get("briefing", {}).get("email", {}).get("auto_send", False))

    # Security & Environment
    SECRET_KEY: str = _json_data.get("security", {}).get("secret_key", "agentlens-default-secret-key-32chars-minimum-safe-value")
    ENVIRONMENT: str = "development"

    # Webhooks
    SLACK_WEBHOOK_URL: str = _json_data.get("webhooks", {}).get("slack_webhook_url", "")
    DISCORD_WEBHOOK_URL: str = _json_data.get("webhooks", {}).get("discord_webhook_url", "")

    model_config = ConfigDict(
        extra="allow",
        env_file=(".env", "backend/.env", "../.env"),
        env_file_encoding="utf-8"
    )

    @model_validator(mode="after")
    def merge_json_and_env(self):
        llm = _json_data.get("llm", {})
        if not self.ANTHROPIC_API_KEY:
            self.ANTHROPIC_API_KEY = llm.get("anthropic_api_key") or os.environ.get("ANTHROPIC_API_KEY", "")
        if not self.ANTHROPIC_MODEL:
            self.ANTHROPIC_MODEL = llm.get("anthropic_model") or os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5-5")
        if not self.ANTHROPIC_DEFAULT_CHAT_MODEL:
            self.ANTHROPIC_DEFAULT_CHAT_MODEL = llm.get("anthropic_default_chat_model") or os.environ.get("ANTHROPIC_DEFAULT_CHAT_MODEL", "claude-sonnet-5-5")
        if not self.ANTHROPIC_HAIKU_MODEL:
            self.ANTHROPIC_HAIKU_MODEL = llm.get("anthropic_haiku_model") or os.environ.get("ANTHROPIC_HAIKU_MODEL", "claude-haiku-5-5")
        if not self.ANTHROPIC_SONNET_MODEL:
            self.ANTHROPIC_SONNET_MODEL = llm.get("anthropic_sonnet_model") or os.environ.get("ANTHROPIC_SONNET_MODEL", "claude-sonnet-5-5")
        if not self.ANTHROPIC_OPUS_MODEL:
            self.ANTHROPIC_OPUS_MODEL = llm.get("anthropic_opus_model") or os.environ.get("ANTHROPIC_OPUS_MODEL", "claude-opus-5-5")
        if not self.GEMINI_API_KEY:
            self.GEMINI_API_KEY = llm.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY", "")
        if (not self.GEMINI_MODEL or self.GEMINI_MODEL in ["", "gemini-2.0-flash", "gemini-flash-latest"]):
            self.GEMINI_MODEL = llm.get("gemini_model") or os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
        if not self.OPENAI_API_KEY:
            self.OPENAI_API_KEY = llm.get("openai_api_key") or os.environ.get("OPENAI_API_KEY", "")
        if not self.SLACK_WEBHOOK_URL and _json_data.get("webhooks", {}).get("slack_webhook_url"):

            self.SLACK_WEBHOOK_URL = _json_data.get("webhooks", {}).get("slack_webhook_url") or os.environ.get("SLACK_WEBHOOK_URL", "")
        if not self.DISCORD_WEBHOOK_URL and _json_data.get("webhooks", {}).get("discord_webhook_url"):
            self.DISCORD_WEBHOOK_URL = _json_data.get("webhooks", {}).get("discord_webhook_url") or os.environ.get("DISCORD_WEBHOOK_URL", "")
        if not self.SECRET_KEY:
            self.SECRET_KEY = _json_data.get("security", {}).get("secret_key") or os.environ.get("SECRET_KEY", "agentlens-default-secret-key-32chars-minimum-safe-value")
        self.DATABASE_URL = resolve_database_url(self.DATABASE_URL)
        if self.ENVIRONMENT == "production" and len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters in production mode.")
        return self

    @property
    def raw_json_config(self) -> Dict[str, Any]:
        """Returns the full raw dictionary parsed from config.json."""
        return _json_data

    def get_custom_json_value(self, section: str, key: str, default: Any = None) -> Any:
        """Retrieves any newly added user key from config.json dynamically."""
        return _json_data.get(section, {}).get(key, default)

    def reload(self):
        """Reloads settings from disk."""
        global _json_data
        _json_data = load_json_config()
        self.__init__()

settings = Settings()

def save_json_config(data: Dict[str, Any]) -> bool:
    """Saves updated configuration data back to config.json and reloads settings."""
    p = find_config_json()
    if not p:
        p = Path.cwd() / "config.json"
    # 직렬화를 먼저 끝내고 임시 파일에 쓴 뒤 교체한다. 중간에 실패해도 원래 config.json 이 깨지지 않는다 (BUG-21)
    tmp = p.with_name(p.name + ".tmp")
    try:
        content = json.dumps(data, indent=2, ensure_ascii=False)
        tmp.write_text(content, encoding="utf-8")
        try:
            tmp.replace(p)
        except OSError:
            # 단일 파일 bind mount(Docker) 위로는 rename 이 실패한다 → 대상 파일에 제자리로 쓴다 (sources_service 와 같은 대체)
            p.write_text(content, encoding="utf-8")
        settings.reload()
        return True
    except Exception as e:
        print(f"[Config] Error saving config.json: {e}")
        return False
    finally:
        tmp.unlink(missing_ok=True)
