import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import xml.sax.saxutils as saxutils

from app.database import get_db
from app.config import settings
from app.schemas.news import NewsListResponse, AskQuestionRequest
from app.services.llm_processor import llm_processor
from app.services.news_service import NewsService, split_csv

router = APIRouter(prefix="/news", tags=["News"])

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
    return await NewsService(db).list_feed(
        category=category, source=source, search=search, high_signal_only=high_signal_only,
        sort=sort, page=page, size=size,
    )

@router.post("/{news_id}/ask/stream")
async def ask_about_news_item_stream(
    news_id: int,
    body: AskQuestionRequest,
    db: AsyncSession = Depends(get_db)
):
    it = await NewsService(db).get_item(news_id)
    if not it:
        raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다.")

    tech_stack = split_csv(it.tech_stack)

    async def event_generator():
        async for evt in llm_processor.stream_question_answer(
            item_title=it.title,
            item_summary=it.summary or "",
            category=it.category,
            tech_stack=tech_stack,
            question=body.question
        ):
            yield f"data: {json.dumps(evt, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            # no-transform: Next rewrite 프록시가 gzip 으로 묶어 SSE 토큰을 버퍼링하지 않게 한다 (D-41)
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/feed/rss.xml")
async def get_rss_feed(category: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    items = await NewsService(db).latest_items(limit=50, category=category)

    rss_items = []
    for it in items:
        # NULL summary·published_at 에도 500 이 나지 않게 한다 (BUG-12). 저장 시각은 UTC 다
        pub = it.published_at or it.created_at or datetime.now(timezone.utc)
        rss_items.append(f"""
        <item>
            <title>{saxutils.escape(it.title or "")}</title>
            <link>{saxutils.escape(it.url)}</link>
            <description>{saxutils.escape(it.summary or "")}</description>
            <category>{saxutils.escape(it.category or "")}</category>
            <pubDate>{pub.strftime("%a, %d %b %Y %H:%M:%S GMT")}</pubDate>
            <guid>{saxutils.escape(it.url)}</guid>
        </item>
        """)
    xml_data = f"""<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
    <channel>
        <title>AgentLens RSS</title>
        <link>{saxutils.escape(settings.PUBLIC_WEB_URL)}</link>
        <description>Global AI, Agent, Harness &amp; MCP News</description>
        {''.join(rss_items)}
    </channel>
    </rss>"""
    return Response(content=xml_data, media_type="application/xml")
