from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

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

class NewsListResponse(BaseModel):
    items: List[NewsItemResponse]
    total: int
    page: int
    size: int
    total_pages: int

class AskQuestionRequest(BaseModel):
    question: str

class AskQuestionResponse(BaseModel):
    news_id: int
    question: str
    answer: str

class DailyBriefingResponse(BaseModel):
    date: str
    headline: str
    markdown_report: str
    featured_items_count: int
    generated_at: str

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
    message: str
    total_collected: int
    total_saved: int
    source_results: Dict[str, Any]
