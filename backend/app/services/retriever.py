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
        """Ensure FTS5 virtual table and synchronization triggers exist and are fully populated."""
        try:
            res = await self.session.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='news_fts';"))
            table_exists = res.scalar() is not None

            if not table_exists:
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
            else:
                # Table exists: check if row counts match or if fts index is empty
                fts_cnt_res = await self.session.execute(text("SELECT count(*) FROM news_fts;"))
                fts_count = fts_cnt_res.scalar() or 0
                items_cnt_res = await self.session.execute(text("SELECT count(*) FROM news_items;"))
                items_count = items_cnt_res.scalar() or 0

                if fts_count < items_count:
                    await self.session.execute(text("INSERT INTO news_fts(news_fts) VALUES('rebuild');"))
                    await self.session.commit()
            SqliteFtsRetriever._fts_initialized = True
        except Exception as e:
            logger.warning(f"FTS5 table initialization notice: {e}")
            await self.session.rollback()

    @staticmethod
    def extract_keywords(query: str) -> List[str]:
        """Extract clean, meaningful domain keywords from user query by stripping particles, question suffixes, and stopwords."""
        korean_stopwords = {
            # 조사 및 접속사
            "와", "과", "의", "을", "를", "은", "는", "이", "가", "에", "에서",
            "으로", "로", "및", "등", "도", "만", "이나", "나", "란", "이란", "부터", "까지", "에게", "보다",
            # 대화형 종결어미 및 질문 표현
            "알려줘", "알려주세요", "알려줘요", "알려줄래", "말해줘", "말해주세요",
            "설명해줘", "설명해주세요", "비교해줘", "비교해주세요", "추천해줘", "추천해주세요",
            "요약해줘", "요약해주세요", "정리해줘", "정리해주세요", "보여줘", "보여주세요",
            "무엇인가요", "무엇인지", "무엇이야", "어떤가요", "어떤지", "어떻게", "어때",
            "대해", "대하여", "에대해", "관해", "관하여", "에관해", "관련된", "관련한",
            # 검색 노이즈성 일반 단어
            "최신", "관련", "소식", "뉴스", "정보", "동향", "기사", "내용", "자료",
            "트렌드", "업데이트", "최근", "오늘", "요즘", "이번", "전체", "모든", "해당", "질문", "답변",
            "전혀", "무관", "무관한", "정말", "매우", "너무", "진짜", "있는", "하는", "되는", "대한", "통해", "위한",
            "서버", "클라이언트", "특징", "기능", "방법", "사용", "적용", "구현"
        }
        english_stopwords = {
            "what", "is", "are", "was", "were", "the", "a", "an", "in", "on", "at", "to",
            "for", "of", "with", "about", "tell", "me", "how", "why", "who", "which",
            "and", "or", "not", "latest", "news", "trend", "trends", "recent", "info",
            "information", "article", "articles", "explain", "describe", "compare",
            "summary", "summarize", "show"
        }
        particles_to_strip = [
            "에서", "으로", "까지", "에게", "부터", "보다", "이나", "이란",
            "의", "를", "을", "가", "이", "는", "은", "와", "과", "로", "도", "만", "나", "란", "에"
        ]

        raw_tokens = re.findall(r'[A-Za-z0-9_\-\.]+|[가-힣]+', query)
        keywords = []
        for raw in raw_tokens:
            token = raw.strip()
            if not token:
                continue
            lower_token = token.lower()
            if lower_token in english_stopwords or token in korean_stopwords:
                continue

            clean_t = token
            if re.match(r'^[가-힣]+$', clean_t) and len(clean_t) >= 2:
                for suffix in particles_to_strip:
                    if clean_t.endswith(suffix) and len(clean_t) - len(suffix) >= 2:
                        stem = clean_t[:-len(suffix)]
                        if stem in korean_stopwords:
                            clean_t = ""
                            break
                        clean_t = stem
                        break

            if not clean_t or clean_t in korean_stopwords or clean_t.lower() in english_stopwords:
                continue

            if len(clean_t) >= 2:
                keywords.append(clean_t)
            elif len(token) >= 2:
                keywords.append(token)

        # Fallback if all tokens were removed (e.g. query was just "최신 소식")
        if not keywords:
            for raw in raw_tokens:
                if raw not in {"에", "의", "을", "를", "은", "는", "이", "가", "과", "와"}:
                    keywords.append(raw)

        return keywords

    def _sanitize_fts_query(self, query: str) -> str:
        """Sanitize query string into safe and high-precision FTS5 syntax."""
        keywords = self.extract_keywords(query)
        if not keywords:
            return '""'
        safe_kw = [re.sub(r'["\']', '', k) for k in keywords if len(k) > 0]
        if not safe_kw:
            return '""'
        return " OR ".join(f'"{k}"' for k in safe_kw)

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
            keywords = self.extract_keywords(query)
            if keywords:
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
                for kw in keywords:
                    like_term = f"%{kw}%"
                    conditions.append(NewsItem.title.ilike(like_term))
                    conditions.append(NewsItem.tech_stack.ilike(like_term))
                    conditions.append(NewsItem.summary.ilike(like_term))
                    conditions.append(NewsItem.tags.ilike(like_term))
                stmt = stmt.where(or_(*conditions))

                like_rows = (await self.session.execute(stmt)).scalars().all()

                # Score candidates based on keyword occurrence relevance
                scored_like_candidates = []
                for item in like_rows:
                    t_str = (item.title or "").lower()
                    tech_str = (item.tech_stack or "").lower()
                    sum_str = (item.summary or "").lower()
                    tag_str = (item.tags or "").lower()

                    match_score = 0.0
                    for kw in keywords:
                        kw_l = kw.lower()
                        if kw_l in t_str:
                            match_score += 5.0
                        if kw_l in tech_str:
                            match_score += 3.0
                        if kw_l in sum_str:
                            match_score += 2.0
                        if kw_l in tag_str:
                            match_score += 1.0

                    pseudo_bm25 = -1.0 - match_score
                    scored_like_candidates.append((pseudo_bm25, item))

                scored_like_candidates.sort(key=lambda x: x[0])

                for pseudo_bm, item in scored_like_candidates[:30]:
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
                        "bm25_score": pseudo_bm,
                    })

        return candidates

    def _filter_and_score_candidates(
        self,
        candidates: List[Dict[str, Any]],
        query: str,
        keywords: List[str],
        now_utc: datetime,
        tau_seconds: float,
        sort_mode: str = "hot",
    ) -> List[ChatSearchChunk]:
        """Score candidates on semantic keyword relevance and prune non-matching or low-relevance noise."""
        if not candidates or not keywords:
            return []

        # Find best (most negative) BM25 score among candidates
        bm25_scores = [c["bm25_score"] for c in candidates]
        best_bm = min(bm25_scores)
        worst_bm = max(bm25_scores)

        # Inspect candidate keyword matches
        candidate_evals = []
        for c in candidates:
            t_lower = (c["title"] or "").lower()
            tech_lower = (c["tech_stack"] or "").lower()
            sum_lower = (c["summary"] or "").lower()
            why_lower = (c["why_it_matters"] or "").lower()
            doc_full = f"{t_lower} {tech_lower} {sum_lower} {why_lower}"

            matched_kw = [k for k in keywords if k.lower() in doc_full]
            matched_title = [k for k in keywords if k.lower() in t_lower]
            matched_core = [k for k in keywords if (k.lower() in t_lower or k.lower() in tech_lower)]

            cov = len(matched_kw) / len(keywords) if keywords else 0.0
            core_cov = len(matched_core) / max(1, min(len(keywords), 2))

            score = c["bm25_score"]
            if best_bm < 0:
                bm_rel = abs(score) / abs(best_bm)
            else:
                bm_rel = 1.0 if best_bm == worst_bm else max(0.0, (worst_bm - score) / (worst_bm - best_bm))
            bm_rel = max(0.0, min(1.0, bm_rel))

            s_rel = 0.45 * bm_rel + 0.35 * cov + 0.20 * min(1.0, core_cov)

            candidate_evals.append({
                "candidate": c,
                "matched_kw": matched_kw,
                "matched_title": matched_title,
                "matched_core": matched_core,
                "cov": cov,
                "bm_rel": bm_rel,
                "s_rel": s_rel,
            })

        # Top candidate by relevance
        candidate_evals.sort(key=lambda x: x["s_rel"], reverse=True)
        top_eval = candidate_evals[0]

        valid_chunks: List[ChatSearchChunk] = []
        for eval_info in candidate_evals:
            c = eval_info["candidate"]
            cov = eval_info["cov"]
            bm_rel = eval_info["bm_rel"]
            s_rel = eval_info["s_rel"]
            matched_kw = eval_info["matched_kw"]
            matched_core = eval_info["matched_core"]

            # Filter Rule 1: Keyword Coverage Gate
            if len(keywords) == 1:
                if cov < 1.0:
                    continue
            elif len(keywords) == 2:
                if cov < 0.5:
                    continue
                if cov == 0.5 and len(matched_core) == 0 and bm_rel < 0.70:
                    continue
            else: # len(keywords) >= 3
                # Must match at least 2 keywords
                if len(matched_kw) < 2:
                    continue
                # Must match at least 35% of keywords
                min_req = max(2, math.ceil(len(keywords) * 0.35))
                if len(matched_kw) < min_req:
                    continue

            # Filter Rule 2: Title Distinctiveness Gate
            # If top candidate has full/high coverage (>= 0.8), prune candidates with strictly lower coverage
            # that miss distinctive title keywords of the top candidate
            if top_eval["cov"] >= 0.8 and cov < top_eval["cov"]:
                missing_from_top_title = [k for k in top_eval["matched_title"] if k not in matched_kw]
                if missing_from_top_title:
                    continue

            # Filter Rule 3: Anti-Noise Drop-Off Gate
            # If top candidate matched distinctive query terms and this candidate lacks them,
            # and its BM25 drops below 55% of the top match, prune it.
            if len(keywords) >= 2 and bm_rel < 0.55 and len(matched_kw) < len(top_eval["matched_kw"]):
                continue

            # Filter Rule 4: Minimum Relevance Floor
            if s_rel < 0.48:
                continue

            # Compute final hybrid RAG score incorporating relevance
            norm_bm = bm_rel
            base_rag = self._compute_hybrid_score(
                bm25_score=c["bm25_score"],
                norm_bm25=norm_bm,
                quality_score=c["quality_score"],
                published_at=c["published_at"],
                now_utc=now_utc,
                tau_seconds=tau_seconds,
            )
            rag_score = round(max(0.0, min(1.0, 0.60 * s_rel + 0.40 * base_rag)), 4)

            pub_str = c["published_at"].isoformat() if hasattr(c["published_at"], "isoformat") else str(c["published_at"])

            valid_chunks.append(
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
                    bm25_score=round(c["bm25_score"], 4),
                    rag_score=rag_score,
                )
            )

        # Sort according to sort_mode
        if sort_mode == "latest":
            valid_chunks.sort(key=lambda x: x.published_at or "", reverse=True)
        elif sort_mode == "quality":
            valid_chunks.sort(key=lambda x: x.quality_score, reverse=True)
        else: # "hot"
            valid_chunks.sort(key=lambda x: x.rag_score, reverse=True)

        return valid_chunks

    async def retrieve_with_meta(
        self,
        query: str,
        top_k: int = 5,
        min_quality: float = 5.0,
        category: Optional[str] = None,
        source: Optional[str] = None,
        filters: Optional[ChatFocusFilter] = None,
    ) -> Tuple[List[ChatSearchChunk], bool, ChatFocusFilter]:
        """Perform dynamic hybrid retrieval with focus filters, adaptive tau, and 0-match auto-relaxation."""
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

        keywords = self.extract_keywords(query)
        tau = self.get_tau_seconds(active_filters.time_range)

        # 1st attempt: with active_filters
        candidates = await self._fetch_candidates(query, min_quality, active_filters, source, now_utc)
        scored_chunks = self._filter_and_score_candidates(
            candidates=candidates,
            query=query,
            keywords=keywords,
            now_utc=now_utc,
            tau_seconds=tau,
            sort_mode=active_filters.sort,
        )
        is_relaxed = False

        # Auto-relaxation policy: if 0 matches and time_range != 'all', relax to 'all'
        if not scored_chunks and active_filters.time_range != "all":
            relaxed_filter = active_filters.model_copy(update={"time_range": "all"})
            relaxed_candidates = await self._fetch_candidates(query, min_quality, relaxed_filter, source, now_utc)
            if relaxed_candidates:
                relaxed_tau = self.get_tau_seconds("all")
                relaxed_chunks = self._filter_and_score_candidates(
                    candidates=relaxed_candidates,
                    query=query,
                    keywords=keywords,
                    now_utc=now_utc,
                    tau_seconds=relaxed_tau,
                    sort_mode=relaxed_filter.sort,
                )
                if relaxed_chunks:
                    scored_chunks = relaxed_chunks
                    active_filters = relaxed_filter
                    is_relaxed = True

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
