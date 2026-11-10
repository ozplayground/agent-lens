"""뉴스 조회·통계·삭제 서비스 (ARCH-01: 라우터는 이 서비스만 부르고 모델을 직접 쿼리하지 않는다)."""
import json
from datetime import datetime, timezone
from math import ceil
from typing import Any, Dict, List, Optional

from sqlalchemy import delete, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.time_utils import iso_utc
from app.models.news import CrawlLog, NewsItem
from app.schemas.news import NewsItemResponse, NewsListResponse, StatsResponse


def split_csv(value: Optional[str]) -> List[str]:
    return [t.strip() for t in value.split(",") if t.strip()] if value else []


def parse_tldr(value: Optional[str]) -> List[str]:
    """tldr_bullets JSON 문자열 → 문자열 목록. 목록이 아니면 한 항목, 깨졌으면 빈 목록."""
    try:
        parsed = json.loads(value) if value else []
    except Exception:
        return []
    return parsed if isinstance(parsed, list) else [str(parsed)]


def format_news_item(it: NewsItem) -> NewsItemResponse:
    bullets = parse_tldr(it.tldr_bullets)

    return NewsItemResponse(
        id=it.id,
        title=it.title,
        url=it.url,
        source=it.source,
        category=it.category,
        summary=it.summary or "",
        author=it.author,
        tags=split_csv(it.tags),
        tldr_bullets=bullets,
        why_it_matters=it.why_it_matters or "",
        tech_stack=split_csv(it.tech_stack),
        quality_score=it.quality_score or 6.0,
        is_high_signal=it.is_high_signal or False,
        raw_score=it.raw_score,
        comments_count=it.comments_count,
        hotness_score=it.hotness_score,
        published_at=it.published_at,
        created_at=it.created_at,
        dedup_hash=it.dedup_hash
    )


class NewsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_feed(
        self,
        category: Optional[str] = None,
        source: Optional[str] = None,
        search: Optional[str] = None,
        high_signal_only: bool = False,
        sort: str = "hot",
        page: int = 1,
        size: int = 20,
    ) -> NewsListResponse:
        query = select(NewsItem)
        if category and category.lower() != "all":
            query = query.where(NewsItem.category == category.lower())
        if source and source.lower() != "all":
            query = query.where(NewsItem.source == source.lower())
        if high_signal_only:
            query = query.where(NewsItem.is_high_signal == True)  # noqa: E712
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

        total = (await self.session.execute(select(func.count()).select_from(query.subquery()))).scalar_one()

        if sort == "latest":
            query = query.order_by(desc(NewsItem.published_at))
        elif sort == "top":
            query = query.order_by(desc(NewsItem.raw_score))
        elif sort == "quality":
            query = query.order_by(desc(NewsItem.quality_score), desc(NewsItem.hotness_score))
        else:
            query = query.order_by(desc(NewsItem.hotness_score), desc(NewsItem.published_at))

        items = (await self.session.execute(query.offset((page - 1) * size).limit(size))).scalars().all()
        total_pages = ceil(total / size) if total > 0 else 1
        return NewsListResponse(items=[format_news_item(i) for i in items], total=total, page=page,
                                size=size, total_pages=total_pages)

    async def get_item(self, news_id: int) -> Optional[NewsItem]:
        return await self.session.get(NewsItem, news_id)

    async def latest_items(self, limit: int = 50, category: Optional[str] = None) -> List[NewsItem]:
        q = select(NewsItem).order_by(desc(NewsItem.published_at)).limit(limit)
        if category and category != "all":
            q = q.where(NewsItem.category == category)
        return list((await self.session.execute(q)).scalars().all())

    async def stats(self) -> StatsResponse:
        tot = (await self.session.execute(select(func.count(NewsItem.id)))).scalar_one()
        cats = (await self.session.execute(
            select(NewsItem.category, func.count(NewsItem.id)).group_by(NewsItem.category))).all()
        sources = (await self.session.execute(
            select(NewsItem.source, func.count(NewsItem.id)).group_by(NewsItem.source))).all()
        return StatsResponse(
            total_news=tot,
            category_counts={r[0]: r[1] for r in cats},
            source_counts={r[0]: r[1] for r in sources},
            last_updated=datetime.now(timezone.utc).isoformat()
        )

    async def recent_crawl_logs(self, limit: int = 5) -> List[Dict[str, Any]]:
        logs = (await self.session.execute(select(CrawlLog).order_by(desc(CrawlLog.id)).limit(limit))).scalars().all()
        return [
            {
                "id": l.id, "source": l.source, "items_crawled": l.items_crawled,
                "items_saved": l.items_saved, "status": l.status,
                "started_at": iso_utc(l.started_at),
                "completed_at": iso_utc(l.completed_at)
            }
            for l in logs
        ]

    async def delete_all_news_and_logs(self) -> int:
        """기사와 수집 로그를 한 트랜잭션으로 지우고 지운 기사 수를 돌려준다.

        뒤이어 백그라운드 재수집이 바로 시작되므로 여기서 커밋해 경계를 닫는다.
        """
        res = await self.session.execute(delete(NewsItem))
        await self.session.execute(delete(CrawlLog))
        await self.session.commit()
        return res.rowcount if res.rowcount and res.rowcount > 0 else 0
