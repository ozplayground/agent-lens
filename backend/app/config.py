import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
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

def load_json_config() -> Dict[str, Any]:
    p = find_config_json()
    if p:
        try:
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

_json_data = load_json_config()

class Settings(BaseSettings):
    PROJECT_NAME: str = _json_data.get("app", {}).get("project_name", "AgentLens")
    VERSION: str = _json_data.get("app", {}).get("version", "1.3.1")
    DATABASE_URL: str = _json_data.get("app", {}).get("database_url", "sqlite+aiosqlite:///./agentlens.db")
    CRAWL_SCHEDULE_HOURS: str = ",".join(str(h) for h in _json_data.get("scheduler", {}).get("crawl_hours", [0, 6, 12, 18]))
    CRAWL_TIMEZONE: str = _json_data.get("scheduler", {}).get("timezone", "UTC")
    CORS_ORIGINS: Any = ["*"]
    USER_AGENT: str = _json_data.get("crawler", {}).get("user_agent", "AgentLens-Collector/1.0")

    # LLM Settings from config.json or environment
    LLM_PROVIDER: str = _json_data.get("llm", {}).get("provider", "auto")
    GEMINI_API_KEY: str = _json_data.get("llm", {}).get("gemini_api_key", "")
    GEMINI_MODEL: str = _json_data.get("llm", {}).get("gemini_model", "gemini-2.0-flash")
    OPENAI_API_KEY: str = _json_data.get("llm", {}).get("openai_api_key", "")
    OPENAI_MODEL: str = _json_data.get("llm", {}).get("openai_model", "gpt-4o-mini")
    OLLAMA_BASE_URL: str = _json_data.get("llm", {}).get("ollama_base_url", "http://localhost:11434")
    OLLAMA_MODEL: str = _json_data.get("llm", {}).get("ollama_model", "llama3.2:latest")
    QUALITY_CUTOFF_SCORE: float = float(_json_data.get("llm", {}).get("quality_cutoff_score", 5.0))
    HIGH_SIGNAL_THRESHOLD: float = float(_json_data.get("llm", {}).get("high_signal_threshold", 7.8))

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
        if not self.GEMINI_API_KEY and llm.get("gemini_api_key"):
            self.GEMINI_API_KEY = llm.get("gemini_api_key")
        if (not self.GEMINI_MODEL or self.GEMINI_MODEL in ["", "gemini-2.0-flash"]) and llm.get("gemini_model"):
            self.GEMINI_MODEL = llm.get("gemini_model")
        if not self.OPENAI_API_KEY and llm.get("openai_api_key"):
            self.OPENAI_API_KEY = llm.get("openai_api_key")
        if not self.SLACK_WEBHOOK_URL and _json_data.get("webhooks", {}).get("slack_webhook_url"):
            self.SLACK_WEBHOOK_URL = _json_data.get("webhooks", {}).get("slack_webhook_url")
        if not self.DISCORD_WEBHOOK_URL and _json_data.get("webhooks", {}).get("discord_webhook_url"):
            self.DISCORD_WEBHOOK_URL = _json_data.get("webhooks", {}).get("discord_webhook_url")
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
    try:
        with open(p, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        settings.reload()
        return True
    except Exception as e:
        print(f"[Config] Error saving config.json: {e}")
        return False
