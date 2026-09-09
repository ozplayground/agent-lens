from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, Index
from app.database import Base

class NewsItem(Base):
    __tablename__ = "news_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=False)
    source = Column(String(50), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True) # harness, mcp_plugins_skills, agent_tech, ai_news
    summary = Column(Text, default="")
    author = Column(String(200), nullable=True)
    tags = Column(String(500), default="")

    # LLM Synthesis & Quality Curation
    tldr_bullets = Column(Text, default="[]") # JSON encoded 3 bullets
    why_it_matters = Column(Text, default="") # Developer insight
    tech_stack = Column(String(500), default="") # Extracted models/tools
    quality_score = Column(Float, default=6.0, index=True)
    is_high_signal = Column(Boolean, default=False, index=True)

    raw_score = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    hotness_score = Column(Float, default=0.0, index=True)
    published_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    dedup_hash = Column(String(64), unique=True, index=True, nullable=False)

    __table_args__ = (
        Index("idx_category_published", "category", "published_at"),
        Index("idx_category_hotness", "category", "hotness_score"),
        Index("idx_high_signal", "is_high_signal", "hotness_score"),
    )

class CrawlLog(Base):
    __tablename__ = "crawl_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source = Column(String(50), nullable=False)
    items_crawled = Column(Integer, default=0)
    items_saved = Column(Integer, default=0)
    status = Column(String(20), default="success")
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SourceResearchLog(Base):
    __tablename__ = "source_research_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_name = Column(String(200), nullable=False)
    site_url = Column(String(500), nullable=False)
    feed_url = Column(String(500), nullable=False)
    category = Column(String(50), nullable=False, default="ai_news")
    relevance_score = Column(Float, nullable=False, default=0.0)
    verdict = Column(String(30), nullable=False) # AUTO_ADOPTED, WATCHLIST, REJECTED
    verdict_reason = Column(Text, nullable=False)
    analyzed_articles_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

