import re
import math
import logging
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, or_

from app.models.news import NewsItem
from app.schemas.chat import ChatSearchChunk, ChatFocusFilter

logger = logging.getLogger("agentlens.retriever")

TAU_MAP = {
    "24h": 86400,        # 1 day
    "7d": 259200,        # 3 days
    "30d": 604800,       # 7 days
    "all": 1209600,      # 14 days
}

class BaseKnowledgeRetriever(ABC):
    """Abstract base class for knowledge retrieval backends."""

    @abstractmethod
    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        min_quality: float = 5.0,
        category: Optional[str] = None,
        source: Optional[str] = None,
        filters: Optional[ChatFocusFilter] = None,
    ) -> List[ChatSearchChunk]:
        """Retrieve top-k knowledge chunks matching query and filters."""
        pass

    @abstractmethod
    async def retrieve_with_meta(
        self,
        query: str,
        top_k: int = 5,
        min_quality: float = 5.0,
        category: Optional[str] = None,
        source: Optional[str] = None,
        filters: Optional[ChatFocusFilter] = None,
    ) -> Tuple[List[ChatSearchChunk], bool, ChatFocusFilter]:
        """Retrieve knowledge chunks with auto-relaxation status and applied filter."""
        pass


class SqliteFtsRetriever(BaseKnowledgeRetriever):
    """
    High-performance, zero-config SQLite FTS5 retriever with BM25 + Quality + Recency hybrid ranking.
    Includes automated fallback to SQL LIKE if FTS5 encounters table or syntax issues.
    """
    _fts_initialized: bool = False

    def __init__(self, session: AsyncSession):
        self.session = session

    async def _ensure_fts_table(self):
        """Ensure FTS5 virtual table and synchronization triggers exist."""
        if SqliteFtsRetriever._fts_initialized:
            return

        try:
            # Create FTS5 virtual table if it doesn't exist
            await self.session.execute(text("""
                CREATE VIRTUAL TABLE IF NOT EXISTS news_fts USING fts5(
                    title,
                    summary,
                    why_it_matters,
                    tech_stack,
                    tags,
                    content='news_items',
                    content_rowid='id'
                );
            """))

            # Create sync triggers for INSERT, DELETE, UPDATE
            await self.session.execute(text("""
                CREATE TRIGGER IF NOT EXISTS news_items_ai AFTER INSERT ON news_items BEGIN
                    INSERT INTO news_fts(rowid, title, summary, why_it_matters, tech_stack, tags)
                    VALUES (new.id, new.title, new.summary, new.why_it_matters, new.tech_stack, new.tags);
                END;
            """))
            await self.session.execute(text("""
                CREATE TRIGGER IF NOT EXISTS news_items_ad AFTER DELETE ON news_items BEGIN
                    INSERT INTO news_fts(news_fts, rowid, title, summary, why_it_matters, tech_stack, tags)
                    VALUES ('delete', old.id, old.title, old.summary, old.why_it_matters, old.tech_stack, old.tags);
                END;
            """))
            await self.session.execute(text("""
                CREATE TRIGGER IF NOT EXISTS news_items_au AFTER UPDATE ON news_items BEGIN
                    INSERT INTO news_fts(news_fts, rowid, title, summary, why_it_matters, tech_stack, tags)
                    VALUES ('delete', old.id, old.title, old.summary, old.why_it_matters, old.tech_stack, old.tags);
                    INSERT INTO news_fts(rowid, title, summary, why_it_matters, tech_stack, tags)
                    VALUES (new.id, new.title, new.summary, new.why_it_matters, new.tech_stack, new.tags);
                END;
            """))

            # Rebuild index to guarantee consistency with existing news items
            await self.session.execute(text("INSERT INTO news_fts(news_fts) VALUES('rebuild');"))
            await self.session.commit()
            SqliteFtsRetriever._fts_initialized = True
        except Exception as e:
            logger.warning(f"FTS5 table initialization notice: {e}")
            await self.session.rollback()

    def _sanitize_fts_query(self, query: str) -> str:
        """Sanitize query string to avoid FTS5 syntax errors, remove stop words, and split Latin/Korean words."""
        korean_stopwords = {
            "와", "과", "의", "을", "를", "은", "는", "이", "가", "에", "에서",
            "으로", "로", "및", "등", "에대해", "대해", "대하여", "알려줘", "알려주세요",
            "비교해줘", "비교해주세요", "설명해줘", "설명해주세요", "무엇인가요", "무엇인지"
        }
        raw_tokens = re.findall(r'[A-Za-z0-9_]+|[가-힣]+', query)
        tokens = []
        for t in raw_tokens:
            if t in korean_stopwords:
                continue
            clean_t = t
            if re.match(r'^[가-힣]+$', t) and len(t) > 2:
                for suffix in ["에서", "으로", "까지", "에게", "의", "를", "을", "가", "이", "는", "은", "와", "과", "로"]:
                    if clean_t.endswith(suffix) and len(clean_t) - len(suffix) >= 2:
                        clean_t = clean_t[:-len(suffix)]
                        break
            if len(clean_t) >= 2 and clean_t not in korean_stopwords:
                tokens.append(clean_t)
            elif len(t) >= 2:
                tokens.append(t)

        if not tokens:
            tokens = [t for t in raw_tokens if len(t) >= 1]
        if not tokens:
            return '""'
        return " OR ".join(f'"{t}"' for t in tokens)

    @classmethod
    def get_tau_seconds(cls, time_range: str) -> int:
        return TAU_MAP.get(time_range, 1209600)

    def _compute_hybrid_score(
        self,
        bm25_score: float,
        norm_bm25: float,
        quality_score: float,
        published_at: Optional[Any],
        now_utc: datetime,
        tau_seconds: float = 1209600
    ) -> float:
        """
        Calculate unified hybrid RAG score with adaptive tau:
        S_rag = 0.50 * Norm(BM25) + 0.30 * (Quality / 10.0) + 0.20 * exp(-delta_t / tau)
        """
        qual_norm = max(0.0, min(1.0, quality_score / 10.0))

        if published_at:
            if isinstance(published_at, str):
                try:
                    pub_utc = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
                except Exception:
                    try:
                        pub_utc = datetime.strptime(published_at.split(".")[0], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
                    except Exception:
                        pub_utc = now_utc
            elif isinstance(published_at, datetime):
                pub_utc = published_at
            else:
                pub_utc = now_utc

            if pub_utc.tzinfo is None:
                pub_utc = pub_utc.replace(tzinfo=timezone.utc)
            delta_t = max(0.0, (now_utc - pub_utc).total_seconds())
        else:
            delta_t = 0.0

        half_life_seconds = max(1.0, float(tau_seconds))
        recency = math.exp(-delta_t / half_life_seconds)

        rag_score = 0.50 * norm_bm25 + 0.30 * qual_norm + 0.20 * recency
        return round(max(0.0, min(1.0, rag_score)), 4)

    async def _fetch_candidates(
        self,
        query: str,
        min_quality: float,
        filters: ChatFocusFilter,
        source: Optional[str],
        now_utc: datetime
    ) -> List[Dict[str, Any]]:
        sanitized = self._sanitize_fts_query(query)
        candidates: List[Dict[str, Any]] = []

        # Time range cutoff
        cutoff_dt = None
        if filters.time_range == "24h":
            cutoff_dt = now_utc - timedelta(hours=24)
        elif filters.time_range == "7d":
            cutoff_dt = now_utc - timedelta(days=7)
        elif filters.time_range == "30d":
            cutoff_dt = now_utc - timedelta(days=30)

        # 1. Attempt FTS5 bm25 query
        try:
            sql = """
                SELECT 
                    n.id,
                    n.title,
                    n.url,
                    n.source,
                    n.category,
                    n.summary,
                    n.why_it_matters,
                    n.tech_stack,
                    n.quality_score,
                    n.published_at,
                    bm25(news_fts, 5.0, 3.0, 2.0, 2.0, 1.0) AS bm25_rank
                FROM news_fts f
                JOIN news_items n ON f.rowid = n.id
                WHERE news_fts MATCH :match_q
                  AND n.quality_score >= :min_qual
            """
            params: Dict[str, Any] = {"match_q": sanitized, "min_qual": min_quality}

            if filters.category and filters.category.lower() != "all":
                sql += " AND n.category = :cat"
                params["cat"] = filters.category.lower()
            if source and source.lower() != "all":
                sql += " AND n.source = :src"
                params["src"] = source.lower()
            if cutoff_dt is not None:
                sql += " AND n.published_at >= :cutoff"
                params["cutoff"] = cutoff_dt
            if filters.high_signal_only:
                sql += " AND n.is_high_signal = 1"

            sql += " ORDER BY bm25_rank ASC LIMIT 30;"

            result = await self.session.execute(text(sql), params)
            rows = result.fetchall()

            for r in rows:
                candidates.append({
                    "id": r[0],
                    "title": r[1],
                    "url": r[2],
                    "source": r[3],
                    "category": r[4],
                    "summary": r[5] or "",
                    "why_it_matters": r[6] or "",
                    "tech_stack": r[7] or "",
                    "quality_score": float(r[8]) if r[8] is not None else 6.0,
                    "published_at": r[9],
                    "bm25_score": float(r[10]) if r[10] is not None else 0.0,
                })
        except Exception as fts_err:
            logger.warning(f"FTS5 search failed, falling back to SQL LIKE: {fts_err}")
            candidates = []

        # 2. Fallback to SQL LIKE if FTS5 returned no matches or errored
        if not candidates:
            tokens = re.findall(r'[\w가-힣]+', query)
            if tokens:
                stmt = select(NewsItem).where(NewsItem.quality_score >= min_quality)
                if filters.category and filters.category.lower() != "all":
                    stmt = stmt.where(NewsItem.category == filters.category.lower())
                if source and source.lower() != "all":
                    stmt = stmt.where(NewsItem.source == source.lower())
                if cutoff_dt is not None:
                    stmt = stmt.where(NewsItem.published_at >= cutoff_dt)
                if filters.high_signal_only:
                    stmt = stmt.where(NewsItem.is_high_signal == True)

                conditions = []
                for t in tokens:
                    like_term = f"%{t}%"
                    conditions.append(NewsItem.title.ilike(like_term))
                    conditions.append(NewsItem.summary.ilike(like_term))
                    conditions.append(NewsItem.tech_stack.ilike(like_term))
                    conditions.append(NewsItem.tags.ilike(like_term))
                stmt = stmt.where(or_(*conditions)).limit(30)

                like_rows = (await self.session.execute(stmt)).scalars().all()
                for item in like_rows:
                    candidates.append({
                        "id": item.id,
                        "title": item.title,
                        "url": item.url,
                        "source": item.source,
                        "category": item.category,
                        "summary": item.summary or "",
                        "why_it_matters": item.why_it_matters or "",
                        "tech_stack": item.tech_stack or "",
                        "quality_score": float(item.quality_score or 6.0),
                        "published_at": item.published_at,
                        "bm25_score": -1.0,
                    })

        return candidates

    async def retrieve_with_meta(
        self,
        query: str,
        top_k: int = 5,
        min_quality: float = 5.0,
        category: Optional[str] = None,
        source: Optional[str] = None,
        filters: Optional[ChatFocusFilter] = None,
    ) -> Tuple[List[ChatSearchChunk], bool, ChatFocusFilter]:
        """Perform hybrid retrieval with focus filters, adaptive tau, and 0-match auto-relaxation."""
        await self._ensure_fts_table()
        now_utc = datetime.now(timezone.utc)

        # Merge category / filters
        active_filters = filters or ChatFocusFilter(
            category=category or "all",
            time_range="all",
            sort="hot",
            high_signal_only=False
        )
        if category and category.lower() != "all" and active_filters.category == "all":
            active_filters = active_filters.model_copy(update={"category": category.lower()})

        # 1st attempt: with active_filters
        candidates = await self._fetch_candidates(query, min_quality, active_filters, source, now_utc)
        is_relaxed = False

        # Auto-relaxation policy: if 0 matches and time_range != 'all', relax to 'all'
        if not candidates and active_filters.time_range != "all":
            relaxed_filter = active_filters.model_copy(update={"time_range": "all"})
            relaxed_candidates = await self._fetch_candidates(query, min_quality, relaxed_filter, source, now_utc)
            if relaxed_candidates:
                candidates = relaxed_candidates
                active_filters = relaxed_filter
                is_relaxed = True

        if not candidates:
            return [], is_relaxed, active_filters

        # Compute dynamic tau based on applied time_range
        tau = self.get_tau_seconds(active_filters.time_range)

        # In SQLite FTS5 bm25, lower (more negative) is better.
        bm25_scores = [c["bm25_score"] for c in candidates]
        min_bm = min(bm25_scores)
        max_bm = max(bm25_scores)

        scored_chunks: List[ChatSearchChunk] = []
        for c in candidates:
            score = c["bm25_score"]
            if max_bm == min_bm:
                norm_bm = 1.0
            else:
                norm_bm = (max_bm - score) / (max_bm - min_bm)

            rag_score = self._compute_hybrid_score(
                bm25_score=score,
                norm_bm25=norm_bm,
                quality_score=c["quality_score"],
                published_at=c["published_at"],
                now_utc=now_utc,
                tau_seconds=tau
            )

            pub_str = c["published_at"].isoformat() if hasattr(c["published_at"], "isoformat") else str(c["published_at"])

            scored_chunks.append(
                ChatSearchChunk(
                    index=0,
                    id=c["id"],
                    title=c["title"],
                    url=c["url"],
                    source=c["source"],
                    category=c["category"],
                    snippet=c["summary"] or c["why_it_matters"] or c["title"],
                    quality_score=c["quality_score"],
                    published_at=pub_str,
                    bm25_score=round(score, 4),
                    rag_score=rag_score
                )
            )

        # Sort according to active_filters.sort:
        if active_filters.sort == "latest":
            scored_chunks.sort(key=lambda x: x.published_at or "", reverse=True)
        elif active_filters.sort == "quality":
            scored_chunks.sort(key=lambda x: x.quality_score, reverse=True)
        else: # "hot"
            scored_chunks.sort(key=lambda x: x.rag_score, reverse=True)

        result_chunks: List[ChatSearchChunk] = []
        for idx, chunk in enumerate(scored_chunks[:top_k], start=1):
            chunk.index = idx
            result_chunks.append(chunk)

        return result_chunks, is_relaxed, active_filters

    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        min_quality: float = 5.0,
        category: Optional[str] = None,
        source: Optional[str] = None,
        filters: Optional[ChatFocusFilter] = None,
    ) -> List[ChatSearchChunk]:
        """Perform FTS5 hybrid retrieval with pruning, scoring, and SQL LIKE fallback."""
        chunks, _, _ = await self.retrieve_with_meta(
            query=query,
            top_k=top_k,
            min_quality=min_quality,
            category=category,
            source=source,
            filters=filters
        )
        return chunks


class KnowledgeRetrieverFacade:
    """
    Facade pattern decoupling high-level chat services from specific search backends.
    Allows hot-swapping between SQLite FTS5, Pgvector, Chroma, etc.
    """

    def __init__(self, session: AsyncSession, engine: Optional[BaseKnowledgeRetriever] = None):
        self.session = session
        self._active_retriever: BaseKnowledgeRetriever = engine or SqliteFtsRetriever(session)

    def switch_engine(self, engine: BaseKnowledgeRetriever) -> None:
        """Dynamically switch underlying search engine implementation."""
        self._active_retriever = engine

    async def search_knowledge(
        self,
        query: str,
        top_k: int = 5,
        min_quality: float = 5.0,
        category: Optional[str] = None,
        source: Optional[str] = None,
        filters: Optional[ChatFocusFilter] = None,
    ) -> List[ChatSearchChunk]:
        """Query active retriever engine."""
        return await self._active_retriever.retrieve(
            query=query,
            top_k=top_k,
            min_quality=min_quality,
            category=category,
            source=source,
            filters=filters
        )

    async def search_knowledge_with_meta(
        self,
        query: str,
        top_k: int = 5,
        min_quality: float = 5.0,
        category: Optional[str] = None,
        source: Optional[str] = None,
        filters: Optional[ChatFocusFilter] = None,
    ) -> Tuple[List[ChatSearchChunk], bool, ChatFocusFilter]:
        """Query active retriever engine and return chunks, is_relaxed, and applied_filter."""
        return await self._active_retriever.retrieve_with_meta(
            query=query,
            top_k=top_k,
            min_quality=min_quality,
            category=category,
            source=source,
            filters=filters
        )
