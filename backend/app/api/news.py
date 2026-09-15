import json
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_, delete
from typing import Optional
from math import ceil
import xml.sax.saxutils as saxutils

from app.database import get_db
from app.models.news import NewsItem
from app.schemas.news import NewsListResponse, NewsItemResponse, AskQuestionRequest, AskQuestionResponse
from app.services.llm_processor import llm_processor

router = APIRouter(prefix="/news", tags=["News"])

def format_news_item(it: NewsItem) -> NewsItemResponse:
    tags = [t.strip() for t in it.tags.split(",") if t.strip()] if it.tags else []
    tech = [t.strip() for t in it.tech_stack.split(",") if t.strip()] if it.tech_stack else []
    try:
        bullets = json.loads(it.tldr_bullets) if it.tldr_bullets else []
    except Exception:
        bullets = []

    return NewsItemResponse(
        id=it.id,
        title=it.title,
        url=it.url,
        source=it.source,
        category=it.category,
        summary=it.summary or "",
        author=it.author,
        tags=tags,
        tldr_bullets=bullets,
        why_it_matters=it.why_it_matters or "",
        tech_stack=tech,
        quality_score=it.quality_score or 6.0,
        is_high_signal=it.is_high_signal or False,
        raw_score=it.raw_score,
        comments_count=it.comments_count,
        hotness_score=it.hotness_score,
        published_at=it.published_at,
        created_at=it.created_at,
        dedup_hash=it.dedup_hash
    )

@router.get("", response_model=NewsListResponse)
async def get_news_feed(
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    high_signal_only: bool = Query(False),
    sort: str = Query("hot"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(NewsItem)
    if category and category.lower() != "all":
        query = query.where(NewsItem.category == category.lower())
    if source and source.lower() != "all":
        query = query.where(NewsItem.source == source.lower())
    if high_signal_only:
        query = query.where(NewsItem.is_high_signal == True)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                NewsItem.title.ilike(term),
                NewsItem.summary.ilike(term),
                NewsItem.tags.ilike(term),
                NewsItem.tech_stack.ilike(term),
                NewsItem.why_it_matters.ilike(term)
            )
        )

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    if sort == "latest":
        query = query.order_by(desc(NewsItem.published_at))
    elif sort == "top":
        query = query.order_by(desc(NewsItem.raw_score))
    elif sort == "quality":
        query = query.order_by(desc(NewsItem.quality_score), desc(NewsItem.hotness_score))
    else:
        query = query.order_by(desc(NewsItem.hotness_score), desc(NewsItem.published_at))

    query = query.offset((page - 1) * size).limit(size)
    items = (await db.execute(query)).scalars().all()

    formatted = [format_news_item(i) for i in items]
    total_pages = ceil(total / size) if total > 0 else 1
    return NewsListResponse(items=formatted, total=total, page=page, size=size, total_pages=total_pages)

@router.delete("/all")
async def delete_all_news(db: AsyncSession = Depends(get_db)):
    """Deletes all news items from database."""
    res = await db.execute(delete(NewsItem))
    await db.commit()
    row_count = res.rowcount if res.rowcount and res.rowcount > 0 else 0
    return {"status": "success", "deleted_count": row_count}

@router.get("/{news_id}", response_model=NewsItemResponse)
async def get_news_detail(news_id: int, db: AsyncSession = Depends(get_db)):
    it = (await db.execute(select(NewsItem).where(NewsItem.id == news_id))).scalar_one_or_none()
    if not it:
        raise HTTPException(status_code=404, detail="News item not found")
    return format_news_item(it)

@router.post("/{news_id}/ask", response_model=AskQuestionResponse)
async def ask_about_news_item(
    news_id: int,
    body: AskQuestionRequest,
    db: AsyncSession = Depends(get_db)
):
    it = (await db.execute(select(NewsItem).where(NewsItem.id == news_id))).scalar_one_or_none()
    if not it:
        raise HTTPException(status_code=404, detail="News item not found")

    tech_stack = [t.strip() for t in it.tech_stack.split(",") if t.strip()] if it.tech_stack else []
    answer, model_used = await llm_processor.answer_question_with_meta(
        item_title=it.title,
        item_summary=it.summary or "",
        category=it.category,
        tech_stack=tech_stack,
        question=body.question
    )

    return AskQuestionResponse(
        news_id=it.id,
        question=body.question,
        answer=answer,
        model_used=model_used
    )

@router.get("/feed/rss.xml")
async def get_rss_feed(category: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    q = select(NewsItem).order_by(desc(NewsItem.published_at)).limit(50)
    if category and category != "all":
        q = q.where(NewsItem.category == category)
    items = (await db.execute(q)).scalars().all()

    rss_items = []
    for it in items:
        rss_items.append(f"""
        <item>
            <title>{saxutils.escape(it.title)}</title>
            <link>{saxutils.escape(it.url)}</link>
            <description>{saxutils.escape(it.summary)}</description>
            <category>{it.category}</category>
            <pubDate>{it.published_at.strftime("%a, %d %b %Y %H:%M:%S GMT")}</pubDate>
            <guid>{saxutils.escape(it.url)}</guid>
        </item>
        """)
    xml_data = f"""<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
    <channel>
        <title>AgentLens RSS</title>
        <link>http://localhost:3000</link>
        <description>Global AI, Agent, Harness &amp; MCP News</description>
        {''.join(rss_items)}
    </channel>
    </rss>"""
    return Response(content=xml_data, media_type="application/xml")
