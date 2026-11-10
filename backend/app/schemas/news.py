from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Literal, Union
from pydantic import BaseModel, Field, ConfigDict, field_validator

class NewsItemBase(BaseModel):
    title: str
    url: str
    source: str
    category: str
    summary: Optional[str] = ""
    author: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    # LLM Synthesis & Curation
    tldr_bullets: List[str] = Field(default_factory=list)
    why_it_matters: Optional[str] = ""
    tech_stack: List[str] = Field(default_factory=list)
    quality_score: float = 6.0
    is_high_signal: bool = False

    raw_score: int = 0
    comments_count: int = 0
    hotness_score: float = 0.0
    published_at: datetime

class NewsItemResponse(NewsItemBase):
    id: int
    created_at: datetime
    dedup_hash: str
    model_config = ConfigDict(from_attributes=True)

    @field_validator("published_at", "created_at", mode="after")
    @classmethod
    def as_utc(cls, v: datetime) -> datetime:
        """DB 는 UTC 를 오프셋 없이 저장한다. 오프셋을 붙여 보내야 브라우저가 현지 시각으로 읽지 않는다 (BUG-18)."""
        return v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v.astimezone(timezone.utc)

class NewsListResponse(BaseModel):
    items: List[NewsItemResponse]
    total: int
    page: int
    size: int
    total_pages: int

class AskQuestionRequest(BaseModel):
    # 챗과 같은 한도 (PERF-07). 빈 문자열·2000자 초과는 400 ERR_INVALID_PAYLOAD
    question: str = Field(..., min_length=1, max_length=2000)

class BriefingCategoryItem(BaseModel):
    id: Optional[int] = None
    title: str
    url: str
    source: Optional[str] = ""
    why_it_matters: Optional[str] = ""
    summary: Optional[str] = ""
    tags: Optional[List[str]] = []
    category: Optional[str] = ""
    category_name: Optional[str] = ""
    hotness_score: Optional[float] = 0.0

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v):
        if isinstance(v, str):
            return [t.strip() for t in v.split(",") if t.strip()]
        if isinstance(v, list):
            return v
        return []

class BriefingCategorySection(BaseModel):
    id: str
    name: str
    icon: str
    summary: str
    items: List[BriefingCategoryItem] = []

class DailyBriefingResponse(BaseModel):
    title: Optional[str] = "오늘의 AI 브리핑"
    date: str
    headline: str
    overview: Optional[str] = ""
    categories: Optional[List[BriefingCategorySection]] = []
    action_items: Optional[List[str]] = []
    markdown_report: str
    featured_items_count: int
    generated_at: str

class NotionExportRequest(BaseModel):
    api_key: Optional[str] = None
    page_id: Optional[str] = None

class NotionExportResponse(BaseModel):
    success: bool
    message: str
    url: Optional[str] = None

class EmailSendRequest(BaseModel):
    to_email: Optional[str] = None
    subject: Optional[str] = None

class EmailSendResponse(BaseModel):
    success: bool
    message: str

class TestNotionRequest(BaseModel):
    api_key: Optional[str] = None
    page_id: Optional[str] = None

class TestEmailRequest(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    use_tls: Optional[bool] = True
    to_email: Optional[str] = None

class BriefingSettingsUpdate(BaseModel):
    notion_api_key: Optional[str] = None
    notion_page_id: Optional[str] = None
    notion_auto_export: Optional[bool] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None
    smtp_to: Optional[str] = None
    smtp_use_tls: Optional[bool] = None
    email_auto_send: Optional[bool] = None
    slack_webhook_url: Optional[str] = None
    discord_webhook_url: Optional[str] = None

class ScheduleStatusResponse(BaseModel):
    current_time: str
    schedule_hours: List[int]
    timezone: str
    next_run: str
    minutes_until_next_run: float
    is_running: bool
    last_crawl_time: Optional[str] = None
    last_crawl_status: Optional[str] = "idle"
    recent_logs: List[Dict[str, Any]] = Field(default_factory=list)

class StatsResponse(BaseModel):
    total_news: int
    category_counts: Dict[str, int]
    source_counts: Dict[str, int]
    last_updated: Optional[str] = None

class ManualCollectResponse(BaseModel):
    """POST /api/schedule/trigger 응답. other_process 는 already_running 일 때만 싣는다 (라우터가 exclude_unset)."""
    status: Literal["started", "already_running"]
    message: str
    other_process: Optional[bool] = None
    total_collected: int
    total_saved: int
    source_results: Dict[str, Any]
