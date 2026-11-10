import asyncio
import logging
import weakref
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Optional, Dict
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.news import NewsItem

logger = logging.getLogger("agentlens.scraper")

class ScrapeBlockedException(Exception):
    """Raised when external website blocks scraping (HTTP 401, 403, 429, Cloudflare)."""
    pass

class ScrapeTimeoutException(Exception):
    """Raised when external website request exceeds 5.0 seconds."""
    pass

class ScrapeEmptyContentException(Exception):
    """Raised when extracted content is under minimum validity threshold (< 500 chars)."""
    pass


def _extract_text(html: str, url: str) -> Optional[str]:
    """HTML 에서 본문을 뽑는다. 500자 미만이면 None. 동기 함수라 asyncio.to_thread 로 부른다."""
    # 1. Trafilatura primary extraction
    content: Optional[str] = None
    try:
        import trafilatura
        content = trafilatura.extract(
            html,
            url=url,
            include_links=True,
            include_formatting=True,
            favor_precision=True,
        )
    except Exception as e:
        logger.debug(f"Trafilatura extraction exception for {url}: {e}")

    # 2. Readability-lxml + BeautifulSoup secondary fallback
    if not content or len(content.strip()) < 500:
        try:
            from readability import Document
            from bs4 import BeautifulSoup
            doc = Document(html)
            clean_html = doc.summary()
            soup = BeautifulSoup(clean_html, "html.parser")
            for s in soup(["script", "style", "nav", "footer", "iframe"]):
                s.decompose()
            fallback_text = soup.get_text("\n", strip=True)
            if fallback_text and len(fallback_text.strip()) >= 500:
                content = fallback_text.strip()
        except Exception as e:
            logger.debug(f"Readability fallback exception for {url}: {e}")

    if not content or len(content.strip()) < 500:
        return None
    return content.strip()


class ArticleScraperService:
    """
    On-Demand Deep Article Scraper Service:
    - L1 In-Memory LRU Cache (Capacity: 500 items)
    - L2 SQLite DB Persistence (news_items.full_content & scraped_at)
    - Single-Flight Concurrency Control (asyncio.Lock per URL)
    - High-precision extraction: trafilatura -> readability-lxml fallback
    - settings.SCRAPER_TIMEOUT_SECONDS timeout (기본 5초) & graceful degradation
    """
    _l1_cache: OrderedDict[str, str] = OrderedDict()
    _l1_capacity: int = 500
    # 쓰는 동안만 남는 URL 별 잠금 (끝나면 사라져 쌓이지 않는다, PERF-05)
    _url_locks: "weakref.WeakValueDictionary[str, asyncio.Lock]" = weakref.WeakValueDictionary()
    _global_lock: asyncio.Lock = asyncio.Lock()

    def __init__(self, session: Optional[AsyncSession] = None):
        self.session = session

    @classmethod
    async def _get_url_lock(cls, url: str) -> asyncio.Lock:
        async with cls._global_lock:
            lock = cls._url_locks.get(url)
            if lock is None:
                lock = asyncio.Lock()
                cls._url_locks[url] = lock
            return lock

    @classmethod
    def _put_l1(cls, url: str, content: str):
        if url in cls._l1_cache:
            cls._l1_cache.move_to_end(url)
        cls._l1_cache[url] = content
        if len(cls._l1_cache) > cls._l1_capacity:
            cls._l1_cache.popitem(last=False)

    @classmethod
    def _get_l1(cls, url: str) -> Optional[str]:
        if url in cls._l1_cache:
            cls._l1_cache.move_to_end(url)
            return cls._l1_cache[url]
        return None

    async def fetch_and_parse(self, url: str) -> str:
        """Fetch external webpage and extract pure text/markdown content."""
        headers = {
            "User-Agent": "AgentLens/2.4 (+https://agentlens.dev; AI Research Bot)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ko,en-US,en;q=0.9",
        }

        try:
            async with httpx.AsyncClient(timeout=settings.SCRAPER_TIMEOUT_SECONDS, follow_redirects=True, headers=headers) as client:
                response = await client.get(url)
        except httpx.TimeoutException as te:
            logger.warning(f"Scrape timeout for {url}: {te}")
            raise ScrapeTimeoutException(f"Connection timed out after {settings.SCRAPER_TIMEOUT_SECONDS}s for {url}") from te
        except Exception as e:
            logger.warning(f"Scrape network error for {url}: {e}")
            raise ScrapeBlockedException(f"Network error fetching {url}: {e}") from e

        if response.status_code in (401, 403, 429, 503):
            raise ScrapeBlockedException(f"Access denied with HTTP {response.status_code} for {url}")

        if response.status_code != 200:
            raise ScrapeBlockedException(f"Unexpected HTTP {response.status_code} for {url}")

        html = response.text

        # 본문 추출(trafilatura·readability·BeautifulSoup)은 CPU 작업이라 이벤트 루프 밖 스레드에서 한다 (PERF-03)
        content = await asyncio.to_thread(_extract_text, html, url)
        if not content:
            raise ScrapeEmptyContentException(f"Extracted content is under 500 characters for {url}")

        return content.strip()

    async def get_article_content(self, article: NewsItem) -> str:
        """
        Get full content using 2-tier caching (L1 In-Memory -> L2 SQLite DB)
        with single-flight lock per URL.
        """
        url = str(article.url)
        article_id = article.id
        content_val = getattr(article, "full_content", None)

        # 1. Check L1 In-Memory LRU Cache
        l1_hit = self._get_l1(url)
        if l1_hit:
            return l1_hit

        # 2. Check L2 SQLite DB Persistence
        if content_val and len(content_val.strip()) >= 100:
            self._put_l1(url, content_val)
            return content_val

        # 3. Single-flight Lock to prevent duplicate concurrent network scrapes
        url_lock = await self._get_url_lock(url)
        async with url_lock:
            # Re-check L1 after acquiring lock
            l1_hit_again = self._get_l1(url)
            if l1_hit_again:
                return l1_hit_again

            # Scrape content via HTTP
            content = await self.fetch_and_parse(url)

            # Update L2 SQLite DB Persistence
            # 요청 세션을 중간에 커밋하지 않도록 본문 캐시는 자기 세션·트랜잭션으로 저장한다 (ARCH-03)
            if self.session:
                from sqlalchemy import update
                from app.database import AsyncSessionLocal
                try:
                    async with AsyncSessionLocal() as cache_session:
                        await cache_session.execute(
                            update(NewsItem)
                            .where(NewsItem.id == article_id)
                            .values(full_content=content, scraped_at=datetime.now(timezone.utc))
                        )
                        await cache_session.commit()
                except Exception as e:
                    logger.debug(f"DB update exception in scraper: {e}")

            article.full_content = content
            article.scraped_at = datetime.now(timezone.utc)

            # Update L1 In-Memory LRU Cache
            self._put_l1(url, content)
            return content
