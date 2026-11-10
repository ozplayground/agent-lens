import asyncio
import json
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import BACKEND_DIR, settings
from app.database import AsyncSessionLocal
from app.models.news import NewsItem, CrawlLog
from app.services.categorizer import classify_and_tag, compute_dedup_hash, calculate_hotness
from app.services.llm_processor import llm_processor
from app.collectors.sources.hackernews import fetch_hackernews
from app.collectors.sources.github import fetch_github
from app.collectors.sources.arxiv import fetch_arxiv
from app.collectors.sources.huggingface import fetch_huggingface
from app.collectors.sources.reddit import fetch_reddit
from app.collectors.sources.rss import fetch_rss

try:  # Unix: 프로세스 사이 파일 잠금
    import fcntl
except ImportError:  # Windows 등: 프로세스 안 잠금으로 대체한다 (ADR Q12). 다른 프로세스와는 공유되지 않는다
    fcntl = None

logger = logging.getLogger("agentlens.collector")

SEED_ITEMS = [
    {
        "title": "SWE-bench 2.0: Next-Gen Evaluation Harness for Autonomous Coding Agents",
        "url": "https://github.com/princeton-nlp/SWE-bench/releases/tag/v2.0",
        "source": "github",
        "summary": "Standardized evaluation harness and dockerized benchmark for testing autonomous coding agents on real-world repositories with regression suites.",
        "author": "princeton-nlp",
        "published_at": datetime.now(timezone.utc),
        "raw_score": 0,
        "comments_count": 0
    },
    {
        "title": "Anthropic Model Context Protocol (MCP) Server Specifications",
        "url": "https://www.anthropic.com/news/model-context-protocol",
        "source": "rss",
        "summary": "An open standard connecting AI agents to internal data, APIs, tools, and custom skill plugins securely with JSON-RPC.",
        "author": "Anthropic",
        "published_at": datetime.now(timezone.utc),
        "raw_score": 0,
        "comments_count": 0
    }
]


def crawl_lock_path() -> Path:
    """프로세스 사이 수집 잠금 파일. SQLite DB 파일 옆에 둬서 같은 DB 를 쓰는 backend·MCP 서버·make collect 가 함께 본다."""
    url = settings.DATABASE_URL
    if url.startswith("sqlite") and "///" in url:
        db_file = Path(url.split("///", 1)[1])
        return db_file.with_name(db_file.name + ".crawl.lock")
    return BACKEND_DIR / "agentlens.crawl.lock"


_in_process_lock = threading.Lock()
_IN_PROCESS = object()  # fcntl 이 없을 때 acquire_crawl_lock 이 돌려주는 표지


def acquire_crawl_lock() -> Optional[Any]:
    """비차단 배타 잠금(flock). 다른 프로세스가 쥐고 있으면 None. 프로세스가 죽으면 OS 가 잠금을 푼다.

    fcntl 이 없으면 이 프로세스 안에서만 막는 잠금을 쓴다.
    """
    if fcntl is None:
        return _IN_PROCESS if _in_process_lock.acquire(blocking=False) else None
    path = crawl_lock_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = open(path, "a+")
    try:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        handle.close()
        return None
    return handle


def release_crawl_lock(handle: Any) -> None:
    if handle is _IN_PROCESS:
        _in_process_lock.release()
        return
    try:
        fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
    finally:
        handle.close()

class CollectorManager:
    def __init__(self):
        self.is_running = False
        self.current_source = ""
        self.step_message = "대기 중"
        self.items_collected = 0
        self.items_saved = 0
        self.items_filtered = 0
        self.total_sources = 6
        self.completed_sources = 0
        self.last_crawl_time = None
        self.last_crawl_stats = {}
        self._db_lock = asyncio.Lock()

    def reset_progress(self, message: str) -> None:
        """수집 진행 카운터를 0 으로 되돌리고 안내 문구를 둔다 (라우터가 내부 상태를 직접 고치지 않게, ARCH-01)."""
        self.items_collected = 0
        self.items_saved = 0
        self.items_filtered = 0
        self.current_source = ""
        self.step_message = message

    def is_busy(self) -> bool:
        """이 프로세스가 수집 중이거나, 같은 DB 를 쓰는 다른 프로세스가 수집 잠금을 쥐고 있으면 True (D-40)."""
        if self.is_running:
            return True
        handle = acquire_crawl_lock()
        if handle is None:
            return True
        release_crawl_lock(handle)
        return False

    def get_progress(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "current_source": self.current_source,
            "step_message": self.step_message,
            "items_collected": self.items_collected,
            "items_saved": self.items_saved,
            "items_filtered": self.items_filtered,
            "total_sources": self.total_sources,
            "completed_sources": self.completed_sources,
            "last_crawl_time": self.last_crawl_time.isoformat() if self.last_crawl_time else None
        }

    async def _prepare_row(self, raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """평가·분류·요약까지 마친 저장용 값. 걸러지면 None. DB 잠금 밖에서 부른다 (PERF-02)."""
        title = raw.get("title", "").strip()
        url = raw.get("url", "").strip()
        summary = raw.get("summary", "") or ""
        source = raw.get("source", "web")
        if not title or not url:
            return None

        self.items_collected += 1

        # 1. Strict Relevance & Quality Gate (LLM + Domain Pre-filter)
        eval_result = await llm_processor.evaluate_content_with_llm(title=title, summary=summary, source=source)
        if not eval_result["is_worthwhile"]:
            logger.info(f"Filtering out non-AI or low-quality article [{source}]: {title[:60]} (Reason: {eval_result.get('rejection_reason')})")
            self.items_filtered += 1
            return None

        # 2. Categorization
        cat, tags, _ = classify_and_tag(title, summary)
        # If LLM classified a valid category, use it if heuristic was general
        if eval_result.get("category") in ["harness", "mcp_plugins_skills", "agent_tech", "ai_news"]:
            if cat in ["unrelated", "ai_news"]:
                cat = eval_result["category"]
        # 분류기·평가 모두 판단하지 못하면 피드의 기본 카테고리(sources.json category_hint)를 쓴다
        if cat == "unrelated" and raw.get("category_hint") in ["harness", "mcp_plugins_skills", "agent_tech", "ai_news"]:
            cat = raw["category_hint"]
        if cat == "unrelated":
            logger.info(f"Filtering out article with no AI category [{source}]: {title[:60]}")
            self.items_filtered += 1
            return None

        # 시각은 UTC 로 저장한다. 오프셋이 있는 값(+09:00 등)을 벽시계 그대로 저장하면 미래 시각이 된다 (BUG-18)
        pub_at = raw.get("published_at") or datetime.now(timezone.utc)
        if pub_at.tzinfo is None:
            pub_at = pub_at.replace(tzinfo=timezone.utc)
        pub_at = pub_at.astimezone(timezone.utc)
        raw_score = raw.get("raw_score") or 0
        comments_count = raw.get("comments_count") or 0

        # 3. Synthesis (reusing why_it_matters from LLM eval if present)
        synth = llm_processor.generate_synthesis(
            title=title,
            summary=summary,
            category=cat,
            why_it_matters_override=eval_result.get("why_it_matters")
        )
        return {
            "title": title,
            "url": url,
            "source": source,
            "category": cat,
            "summary": summary,
            "author": raw.get("author"),
            "tags": ",".join(tags),
            "tldr_bullets": json.dumps(synth["tldr_bullets"], ensure_ascii=False),
            "why_it_matters": synth["why_it_matters"],
            "tech_stack": ",".join(synth["tech_stack"]),
            "quality_score": eval_result["quality_score"],
            "is_high_signal": eval_result["is_high_signal"],
            "raw_score": raw_score,
            "comments_count": comments_count,
            "hotness_score": calculate_hotness(raw_score, comments_count, pub_at),
            "published_at": pub_at,
            "dedup_hash": compute_dedup_hash(title, url),
        }

    async def _process_and_save_batch(self, raw_items: List[Dict[str, Any]], source_name: str) -> int:
        """한 소스의 항목을 평가한 뒤 한 트랜잭션으로 저장한다. 실패하면 롤백하고 예외를 올린다 (BUG-11)."""
        rows = []
        for raw in raw_items or []:
            row = await self._prepare_row(raw)
            if row is not None:
                rows.append(row)
        if not rows:
            return 0

        saved_count = 0
        async with self._db_lock:
            async with AsyncSessionLocal() as session:
                try:
                    for row in rows:
                        existing = (await session.execute(
                            select(NewsItem).where(NewsItem.dedup_hash == row["dedup_hash"])
                        )).scalar_one_or_none()
                        if existing:
                            existing.raw_score = max(existing.raw_score or 0, row["raw_score"])
                            existing.comments_count = max(existing.comments_count or 0, row["comments_count"])
                            existing.hotness_score = row["hotness_score"]
                            existing.quality_score = row["quality_score"]
                            existing.is_high_signal = row["is_high_signal"]
                            if not existing.why_it_matters:
                                existing.why_it_matters = row["why_it_matters"]
                                existing.tldr_bullets = row["tldr_bullets"]
                                existing.tech_stack = row["tech_stack"]
                        else:
                            session.add(NewsItem(**row))
                            saved_count += 1
                    await session.commit()
                except Exception:
                    await session.rollback()
                    logger.exception(f"Error saving batch for {source_name}")
                    raise
        self.items_saved += saved_count
        return saved_count

    async def collect_all(self, session: AsyncSession = None) -> Dict[str, Any]:
        if self.is_running:
            return {"status": "already_running", "message": "Collector is currently running"}
        lock = acquire_crawl_lock()
        if lock is None:
            # 같은 DB 를 쓰는 다른 프로세스(MCP 서버, make collect 직접 모드)가 수집 중이다 (ARCH-04, D-40)
            return {"status": "already_running", "message": "다른 프로세스가 같은 DB 에 수집 중입니다."}

        self.is_running = True
        self.current_source = "시작 중"
        self.step_message = "전세계 소스 실시간 수집을 시작합니다..."
        self.items_collected = 0
        self.items_saved = 0
        self.items_filtered = 0
        self.completed_sources = 0
        started_at = datetime.now(timezone.utc)

        source_results: Dict[str, Dict[str, Any]] = {}

        source_tasks = [
            ("국내 & 글로벌 RSS 피드", fetch_rss()),
            ("HackerNews", fetch_hackernews()),
            ("GitHub Releases", fetch_github()),
            ("arXiv Papers", fetch_arxiv()),
            ("Hugging Face", fetch_huggingface()),
            ("Reddit", fetch_reddit())
        ]
        self.total_sources = len(source_tasks)

        async def run_source_worker(name: str, coro):
            try:
                self.current_source = name
                self.step_message = f"{name} 수집 중..."
                raw_items = await coro
                source_results[name] = {"count": len(raw_items)}
                saved = await self._process_and_save_batch(raw_items, name)
                self.step_message = f"{name} 완료 (+{saved}건 선별 저장)"
            except Exception as e:
                logger.error(f"Failed to crawl {name}: {e}")
                source_results[name] = {"error": str(e) or type(e).__name__, "count": 0}
            finally:
                self.completed_sources += 1

        try:
            # Run all sources concurrently with progressive saving
            await asyncio.gather(*(run_source_worker(n, c) for n, c in source_tasks), return_exceptions=True)

            # If completely empty, insert seeds
            if self.items_collected == 0:
                try:
                    await self._process_and_save_batch(SEED_ITEMS, "Seeds")
                except Exception as e:
                    source_results["Seeds"] = {"error": str(e) or type(e).__name__, "count": 0}

            # Final log entry: 소스별 실패를 status·error_message 에 남긴다 (BUG-11)
            failed = {n: r["error"] for n, r in source_results.items() if r.get("error")}
            if not failed:
                status = "success"
            elif len(failed) >= len(source_tasks):
                status = "failed"
            else:
                status = "partial_failure"
            async with AsyncSessionLocal() as final_session:
                final_session.add(CrawlLog(
                    source="all_sources_stream_ingestion",
                    items_crawled=self.items_collected,
                    items_saved=self.items_saved,
                    status=status,
                    error_message=json.dumps(failed, ensure_ascii=False) if failed else None,
                    started_at=started_at,
                    completed_at=datetime.now(timezone.utc)
                ))
                await final_session.commit()

            self.last_crawl_time = datetime.now(timezone.utc)
            self.last_crawl_stats = {
                "total_collected": self.items_collected,
                "total_saved": self.items_saved,
                "total_filtered_low_quality": self.items_filtered,
                "source_results": source_results
            }
            self.step_message = f"수집 완료. 총 {self.items_saved}건 신규 선별 저장"

            return {
                "status": "success",
                "total_collected": self.items_collected,
                "total_saved": self.items_saved,
                "total_filtered_low_quality": self.items_filtered,
                "source_results": source_results
            }
        except Exception as e:
            logger.error(f"Global collection error: {e}")
            self.step_message = f"수집 오류: {e}"
            return {"status": "error", "error": str(e)}
        finally:
            self.is_running = False
            release_crawl_lock(lock)

collector_manager = CollectorManager()
